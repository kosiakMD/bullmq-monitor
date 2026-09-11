import jsonata from 'jsonata';
import {
  compileCondition,
  compileConditions,
  fieldsForQueue,
  BUILT_IN_FIELDS,
} from '../filter-builder';
import type { TCondition, TFilterField } from '../filter-builder';

const NOW = Date.parse('2026-03-10T12:00:00.000Z');

/** every generated expression must be valid jsonata, not just a plausible string */
const evaluate = async (expression: string, job: any): Promise<boolean> => {
  const result = await jsonata(expression).evaluate(job);
  return Boolean(result);
};

const condition = (over: Partial<TCondition>): TCondition => ({
  path: 'data.value',
  type: 'string',
  operator: 'is',
  ...over,
});

describe('compileCondition', () => {
  it('skips a row that has no value yet', () => {
    expect(compileCondition(condition({ value: '' }))).toBeNull();
    expect(compileCondition(condition({ value: '   ' }))).toBeNull();
  });

  it('matches a string exactly', async () => {
    const e = compileCondition(condition({ value: 'abc' }))!;
    expect(e).toBe('data.value = "abc"');
    await expect(evaluate(e, { data: { value: 'abc' } })).resolves.toBe(true);
    await expect(evaluate(e, { data: { value: 'abd' } })).resolves.toBe(false);
  });

  it('escapes quotes and backslashes in a value', async () => {
    const e = compileCondition(condition({ value: 'a"b\\c' }))!;
    await expect(evaluate(e, { data: { value: 'a"b\\c' } })).resolves.toBe(
      true
    );
  });

  it('matches a substring', async () => {
    const e = compileCondition(
      condition({ operator: 'contains', value: 'mid' })
    )!;
    await expect(evaluate(e, { data: { value: 'a-mid-z' } })).resolves.toBe(
      true
    );
    await expect(evaluate(e, { data: { value: 'a-x-z' } })).resolves.toBe(
      false
    );
  });

  it('matches a prefix and a suffix without regex', async () => {
    const starts = compileCondition(
      condition({ operator: 'startsWith', value: 'send' })
    )!;
    await expect(
      evaluate(starts, { data: { value: 'send-email' } })
    ).resolves.toBe(true);
    await expect(evaluate(starts, { data: { value: 'resend' } })).resolves.toBe(
      false
    );

    const ends = compileCondition(
      condition({ operator: 'endsWith', value: 'email' })
    )!;
    await expect(
      evaluate(ends, { data: { value: 'send-email' } })
    ).resolves.toBe(true);
    await expect(
      evaluate(ends, { data: { value: 'email-send' } })
    ).resolves.toBe(false);
  });

  it('treats a missing field and an empty string as empty', async () => {
    const e = compileCondition(condition({ operator: 'isEmpty' }))!;
    await expect(evaluate(e, { data: {} })).resolves.toBe(true);
    await expect(evaluate(e, { data: { value: '' } })).resolves.toBe(true);
    await expect(evaluate(e, { data: { value: 'x' } })).resolves.toBe(false);
  });

  it('compares numbers without quoting them', async () => {
    const e = compileCondition(
      condition({
        type: 'number',
        path: 'data.amount',
        operator: 'gte',
        value: '10',
      })
    )!;
    expect(e).toBe('data.amount >= 10');
    await expect(evaluate(e, { data: { amount: 10 } })).resolves.toBe(true);
    await expect(evaluate(e, { data: { amount: 9 } })).resolves.toBe(false);
  });

  it('builds an inclusive numeric range', async () => {
    const e = compileCondition(
      condition({
        type: 'number',
        path: 'data.amount',
        operator: 'between',
        value: '5',
        value2: '10',
      })
    )!;
    for (const [amount, expected] of [
      [5, true],
      [7, true],
      [10, true],
      [11, false],
    ] as const) {
      await expect(evaluate(e, { data: { amount } })).resolves.toBe(expected);
    }
  });

  it('waits for the upper bound before compiling a range', () => {
    expect(
      compileCondition(
        condition({
          type: 'number',
          operator: 'between',
          value: '5',
          value2: '',
        })
      )
    ).toBeNull();
  });

  it('compares an epoch date as a plain number', async () => {
    const e = compileCondition(
      condition({
        type: 'date',
        path: 'timestamp',
        dateFormat: 'epoch',
        operator: 'after',
        value: '2026-03-01T00:00:00.000Z',
      })
    )!;
    await expect(
      evaluate(e, { timestamp: Date.parse('2026-03-05T00:00:00Z') })
    ).resolves.toBe(true);
    await expect(
      evaluate(e, { timestamp: Date.parse('2026-02-01T00:00:00Z') })
    ).resolves.toBe(false);
  });

  it('converts an ISO date before comparing it', async () => {
    const e = compileCondition(
      condition({
        type: 'date',
        path: 'data.createdAt',
        dateFormat: 'iso',
        operator: 'before',
        value: '2026-03-01',
      })
    )!;
    expect(e).toContain('$toMillis(data.createdAt)');
    await expect(
      evaluate(e, { data: { createdAt: '2026-02-01T10:00:00.000Z' } })
    ).resolves.toBe(true);
    await expect(
      evaluate(e, { data: { createdAt: '2026-04-01T10:00:00.000Z' } })
    ).resolves.toBe(false);
  });

  it('resolves a relative window against the moment it is applied', async () => {
    const e = compileCondition(
      condition({
        type: 'date',
        path: 'timestamp',
        dateFormat: 'epoch',
        operator: 'lastDays',
        value: '7',
      }),
      NOW
    )!;
    await expect(evaluate(e, { timestamp: NOW - 86_400_000 })).resolves.toBe(
      true
    );
    await expect(
      evaluate(e, { timestamp: NOW - 8 * 86_400_000 })
    ).resolves.toBe(false);
  });

  it('rejects a nonsense relative window', () => {
    for (const value of ['0', '-3', 'abc']) {
      expect(
        compileCondition(
          condition({ type: 'date', operator: 'lastHours', value })
        )
      ).toBeNull();
    }
  });

  it('matches any of several values', async () => {
    const e = compileCondition(
      condition({ type: 'enum', operator: 'isOneOf', values: ['new', 'paid'] })
    )!;
    await expect(evaluate(e, { data: { value: 'paid' } })).resolves.toBe(true);
    await expect(evaluate(e, { data: { value: 'void' } })).resolves.toBe(false);
  });

  it('needs no value for a boolean', async () => {
    const e = compileCondition(
      condition({ type: 'boolean', path: 'data.isTest', operator: 'isTrue' })
    )!;
    await expect(evaluate(e, { data: { isTest: true } })).resolves.toBe(true);
    await expect(evaluate(e, { data: { isTest: false } })).resolves.toBe(false);
  });
});

describe('compileConditions', () => {
  it('returns nothing when no row is filled in', () => {
    expect(compileConditions([condition({ value: '' })])).toBe('');
  });

  it('leaves a single condition unwrapped', () => {
    expect(compileConditions([condition({ value: 'a' })])).toBe(
      'data.value = "a"'
    );
  });

  it('joins with and, and every part stays valid', async () => {
    const e = compileConditions([
      condition({ path: 'data.org', value: 'o1' }),
      condition({ path: 'data.kind', value: 'k1' }),
    ]);
    expect(e).toBe('(data.org = "o1") and (data.kind = "k1")');
    await expect(
      evaluate(e, { data: { org: 'o1', kind: 'k1' } })
    ).resolves.toBe(true);
    await expect(
      evaluate(e, { data: { org: 'o1', kind: 'k2' } })
    ).resolves.toBe(false);
  });

  it('joins with or', async () => {
    const e = compileConditions(
      [
        condition({ path: 'data.org', value: 'o1' }),
        condition({ path: 'data.org', value: 'o2' }),
      ],
      'or'
    );
    await expect(evaluate(e, { data: { org: 'o2' } })).resolves.toBe(true);
    await expect(evaluate(e, { data: { org: 'o3' } })).resolves.toBe(false);
  });

  it('ignores the rows that are still empty', () => {
    expect(
      compileConditions([condition({ value: 'a' }), condition({ value: '' })])
    ).toBe('data.value = "a"');
  });
});

describe('fieldsForQueue', () => {
  const configured: TFilterField[] = [
    { path: 'data.a', label: 'Everywhere' },
    { path: 'data.b', label: 'Emails only', queues: ['Email Send Queue'] },
  ];

  it("always offers the job's own fields", () => {
    const labels = fieldsForQueue([], undefined).map((f) => f.label);
    expect(labels).toEqual(BUILT_IN_FIELDS.map((f) => f.label));
  });

  it('keeps a field with no queue restriction', () => {
    const paths = fieldsForQueue(configured, 'Other').map((f) => f.path);
    expect(paths).toContain('data.a');
    expect(paths).not.toContain('data.b');
  });

  it('adds a restricted field only to its own queue', () => {
    const paths = fieldsForQueue(configured, 'Email Send Queue').map(
      (f) => f.path
    );
    expect(paths).toContain('data.b');
  });
});
