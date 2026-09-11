/**
 * Turns picked conditions into the jsonata expression the API already
 * understands, so nobody has to type `data.orderId = "..."` by hand.
 *
 * The compiler is pure and has no React in it, which is what makes it testable.
 */

export type TFieldType = 'string' | 'number' | 'boolean' | 'date' | 'enum';

export type TFilterField = {
  path: string;
  label: string;
  type?: TFieldType;
  options?: Array<string | { value: string; label: string }>;
  dateFormat?: 'iso' | 'epoch';
  hint?: string;
  queues?: string[];
};

export type TOperator =
  | 'is'
  | 'isNot'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'isOneOf'
  | 'isTrue'
  | 'isFalse'
  | 'after'
  | 'before'
  | 'lastHours'
  | 'lastDays';

export type TCondition = {
  path: string;
  type: TFieldType;
  operator: TOperator;
  /** the value, or the lower bound for `between` */
  value?: string;
  /** upper bound for `between` */
  value2?: string;
  /** several values, for `isOneOf` */
  values?: string[];
  dateFormat?: 'iso' | 'epoch';
};

export type TJoin = 'and' | 'or';

/** operators offered per type, in the order they appear in the picker */
export const OPERATORS: Record<TFieldType, TOperator[]> = {
  string: [
    'is',
    'isNot',
    'contains',
    'startsWith',
    'endsWith',
    'isEmpty',
    'isNotEmpty',
  ],
  number: ['is', 'isNot', 'gt', 'gte', 'lt', 'lte', 'between'],
  date: ['after', 'before', 'between', 'lastHours', 'lastDays'],
  boolean: ['isTrue', 'isFalse'],
  enum: ['is', 'isNot', 'isOneOf', 'isEmpty', 'isNotEmpty'],
};

export const OPERATOR_LABELS: Record<TOperator, string> = {
  is: 'is',
  isNot: 'is not',
  contains: 'contains',
  startsWith: 'starts with',
  endsWith: 'ends with',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
  gt: 'greater than',
  gte: 'at least',
  lt: 'less than',
  lte: 'at most',
  between: 'between',
  isOneOf: 'is one of',
  isTrue: 'is true',
  isFalse: 'is false',
  after: 'after',
  before: 'before',
  lastHours: 'in the last hours',
  lastDays: 'in the last days',
};

/** operators that need no value at all */
export const VALUELESS: TOperator[] = [
  'isEmpty',
  'isNotEmpty',
  'isTrue',
  'isFalse',
];

const quote = (value: string): string =>
  `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** a date field is compared as a number; an ISO string needs converting first */
const asMillis = (condition: TCondition): string =>
  condition.dateFormat === 'epoch'
    ? condition.path
    : `$toMillis(${condition.path})`;

const toMillis = (value: string): number | null => {
  if (/^\d+$/.test(value)) return Number(value);
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Compiles one condition. Returns null when it is not filled in yet, so a half
 * typed row never breaks the whole expression.
 */
export const compileCondition = (
  condition: TCondition,
  now: number = Date.now()
): string | null => {
  const { path, operator } = condition;
  if (!path) return null;

  const value = condition.value?.trim() ?? '';
  const needsValue = !VALUELESS.includes(operator);
  if (needsValue && operator !== 'isOneOf' && !value) return null;

  switch (operator) {
    case 'is':
      return condition.type === 'number'
        ? `${path} = ${Number(value)}`
        : `${path} = ${quote(value)}`;
    case 'isNot':
      return condition.type === 'number'
        ? `${path} != ${Number(value)}`
        : `${path} != ${quote(value)}`;
    case 'contains':
      return `$contains(${path}, ${quote(value)})`;
    case 'startsWith':
      return `$substring(${path}, 0, ${value.length}) = ${quote(value)}`;
    case 'endsWith':
      return `$substring(${path}, $length(${path}) - ${value.length}) = ${quote(value)}`;
    case 'isEmpty':
      return `($not($exists(${path})) or ${path} = "")`;
    case 'isNotEmpty':
      return `($exists(${path}) and ${path} != "")`;
    case 'gt':
      return `${path} > ${Number(value)}`;
    case 'gte':
      return `${path} >= ${Number(value)}`;
    case 'lt':
      return `${path} < ${Number(value)}`;
    case 'lte':
      return `${path} <= ${Number(value)}`;
    case 'isTrue':
      return `${path} = true`;
    case 'isFalse':
      return `${path} = false`;
    case 'isOneOf': {
      const values = (condition.values ?? []).filter(Boolean);
      if (!values.length) return null;
      return `${path} in [${values.map(quote).join(', ')}]`;
    }
    case 'between': {
      const upper = condition.value2?.trim() ?? '';
      if (!upper) return null;
      if (condition.type === 'date') {
        const from = toMillis(value);
        const to = toMillis(upper);
        if (from === null || to === null) return null;
        const field = asMillis(condition);
        return `(${field} >= ${from} and ${field} <= ${to})`;
      }
      return `(${path} >= ${Number(value)} and ${path} <= ${Number(upper)})`;
    }
    case 'after': {
      const from = toMillis(value);
      return from === null ? null : `${asMillis(condition)} > ${from}`;
    }
    case 'before': {
      const to = toMillis(value);
      return to === null ? null : `${asMillis(condition)} < ${to}`;
    }
    case 'lastHours':
    case 'lastDays': {
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount <= 0) return null;
      const ms = operator === 'lastHours' ? 3_600_000 : 86_400_000;
      // resolved when the filter is applied, not re-evaluated afterwards
      return `${asMillis(condition)} >= ${now - amount * ms}`;
    }
    default:
      return null;
  }
};

/** Compiles the whole set. Rows that are not filled in yet are skipped. */
export const compileConditions = (
  conditions: TCondition[],
  join: TJoin = 'and',
  now: number = Date.now()
): string => {
  const parts = conditions
    .map((condition) => compileCondition(condition, now))
    .filter((part): part is string => Boolean(part));
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0];
  return parts.map((part) => `(${part})`).join(` ${join} `);
};

/** Fields on the job itself, always available whatever the payload looks like. */
export const BUILT_IN_FIELDS: TFilterField[] = [
  { path: 'name', label: 'Job name', type: 'string' },
  { path: 'attemptsMade', label: 'Attempts', type: 'number' },
  {
    path: 'timestamp',
    label: 'Queued at',
    type: 'date',
    dateFormat: 'epoch',
  },
  {
    path: 'processedOn',
    label: 'Started at',
    type: 'date',
    dateFormat: 'epoch',
  },
  {
    path: 'finishedOn',
    label: 'Finished at',
    type: 'date',
    dateFormat: 'epoch',
  },
  { path: 'failedReason', label: 'Failure reason', type: 'string' },
];

/** the fields offered for a queue: the built-in ones plus whatever fits it */
export const fieldsForQueue = (
  configured: TFilterField[],
  queueName?: string
): TFilterField[] => [
  ...BUILT_IN_FIELDS,
  ...configured.filter(
    (field) =>
      !field.queues?.length ||
      (queueName ? field.queues.includes(queueName) : false)
  ),
];

export const optionValue = (
  option: NonNullable<TFilterField['options']>[number]
): string => (typeof option === 'string' ? option : option.value);

export const optionLabel = (
  option: NonNullable<TFilterField['options']>[number]
): string => (typeof option === 'string' ? option : option.label);
