import isempty from 'lodash/isEmpty';
import { Readable } from 'stream';
import jsonata from 'jsonata';
import { DEFAULT_DATA_SEARCH_SCAN_COUNT } from './constants';
import type { Queue, JobStatus, Job } from './queue';
import type { Maybe } from './typings/utils';

export type TSearchArgs = {
  status: JobStatus;
  limit: number;
  offset: number;
  /** jsonata expression evaluated against the raw job */
  search?: string;
  /** case-insensitive job name filter. Supports "*" wildcards, e.g. "send-*" */
  name?: string;
  scanCount?: number;
};

type TJobsList = Job[];
type TMatcher = (job: Job) => Promise<boolean> | boolean;

/**
 * Job status as reported by the API mapped to the redis key that actually holds
 * those job ids. Both Bull and BullMQ store waiting jobs under "wait", so
 * scanning "waiting" directly would always come back empty.
 */
const STATUS_REDIS_KEY: Partial<Record<string, string>> = {
  waiting: 'wait',
};

/**
 * Builds a predicate for the job `name` filter.
 * - plain text: case-insensitive substring match
 * - text with "*": glob match ("email-*", "*-retry")
 */
export function buildNameMatcher(
  name?: string
): Maybe<(jobName: string) => boolean> {
  const needle = name?.trim();
  if (!needle) return undefined;
  if (needle.includes('*')) {
    const pattern = needle
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    const re = new RegExp(`^${pattern}$`, 'i');
    return (jobName) => re.test(jobName ?? '');
  }
  const lower = needle.toLowerCase();
  return (jobName) => (jobName ?? '').toLowerCase().includes(lower);
}

export function buildJsonataMatcher(
  search?: string
): Maybe<(job: Job) => Promise<boolean>> {
  if (!search?.trim()) return undefined;
  let expr: jsonata.Expression;
  try {
    expr = jsonata(search);
  } catch (_e) {
    return () => Promise.resolve(false);
  }
  return async (job) => {
    try {
      const result = await expr.evaluate(job.rawJob);
      if (!result) return false;
      return typeof result === 'object' ? !isempty(result) : !!result;
    } catch (_e) {
      return false;
    }
  };
}

/**
 * Scans jobs of a given status directly in redis and keeps the ones matching
 * all the provided filters (name, jsonata search).
 */
export class PowerSearch {
  constructor(private _queue: Queue) {}
  async search(args: TSearchArgs): Promise<TJobsList> {
    const matcher = this._buildMatcher(args);
    if (!matcher) return [];
    const it = this._getIterator(args);
    if (!it) return [];
    const start = args.offset;
    const end = args.limit + start;
    const acc: TJobsList = [];
    try {
      mainLoop: for await (const jobs of it.generator()) {
        for (const job of jobs) {
          if (await matcher(job)) {
            acc.push(job);
          }
          if (acc.length >= end) {
            break mainLoop;
          }
        }
      }
    } finally {
      it.destroy();
    }
    return acc.slice(start, end);
  }
  private _buildMatcher(args: TSearchArgs): Maybe<TMatcher> {
    const nameMatcher = buildNameMatcher(args.name);
    const dataMatcher = buildJsonataMatcher(args.search);
    if (!nameMatcher && !dataMatcher) return undefined;
    return async (job) => {
      if (nameMatcher && !nameMatcher(job.name)) return false;
      if (dataMatcher && !(await dataMatcher(job))) return false;
      return true;
    };
  }
  private _getIterator(args: TSearchArgs): Maybe<AbstractIterator> {
    const redisKey = this._queue.toKey(
      STATUS_REDIS_KEY[args.status] ?? args.status
    );
    const config: TIteratorConfig = {
      scanCount: args.scanCount,
      status: args.status,
    };
    switch (args.status) {
      case 'completed':
      case 'failed':
      case 'delayed':
      case 'prioritized':
        return new SetIterator(this._queue, redisKey, config);
      case 'active':
      case 'waiting':
      case 'paused':
        return new ListIterator(this._queue, redisKey, config);
      default:
        return undefined;
    }
  }
}

type TIteratorConfig = {
  scanCount?: number;
  /** status list being scanned; jobs are tagged with it to avoid extra lookups */
  status: JobStatus;
};

abstract class AbstractIterator {
  protected _scanCount: number;
  protected _status: JobStatus;
  constructor(
    protected _queue: Queue,
    config: TIteratorConfig
  ) {
    this._scanCount = config.scanCount || DEFAULT_DATA_SEARCH_SCAN_COUNT;
    this._status = config.status;
  }
  protected async _extractJobs(ids: string[]): Promise<TJobsList> {
    if (!ids.length) return [];
    const client = await this._queue.client;
    const pipeline = client.pipeline();
    ids.forEach((id) => pipeline.hgetall(this._queue.toKey(id)));
    const jobs = await pipeline.exec();
    if (!jobs) return [];
    return jobs.reduce((acc, [error, job], idx) => {
      if (!error && job && !isempty(job)) {
        try {
          acc.push(this._queue.jobFromJSON(job, ids[idx], this._status));
        } catch (_e) {
          // skip malformed jobs
        }
      }
      return acc;
    }, [] as TJobsList);
  }
  abstract generator(): AsyncGenerator<TJobsList>;
  abstract destroy(): void;
}
class SetIterator extends AbstractIterator {
  private _stream?: Readable;
  constructor(
    queue: Queue,
    private _key: string,
    config: TIteratorConfig
  ) {
    super(queue, config);
  }
  async *generator() {
    const client = await this._queue.client;
    this._stream = (client as any).zscanStream(this._key, {
      count: this._scanCount,
    }) as Readable;
    for await (const ids of this._stream) {
      this._stream.pause();
      // zscan returns [member, score, member, score, ...]
      const filteredIds = (ids as string[]).filter(
        (_k: string, idx) => !(idx % 2)
      );
      const jobs = await this._extractJobs(filteredIds);
      yield jobs;
      this._stream.resume();
    }
  }
  destroy() {
    this._stream?.destroy();
  }
}
class ListIterator extends AbstractIterator {
  private _ids: string[] = [];
  private _cursor = 0;
  constructor(
    queue: Queue,
    private _key: string,
    config: TIteratorConfig
  ) {
    super(queue, config);
  }
  async *generator() {
    const client = await this._queue.client;
    this._ids = await client.lrange(this._key, 0, -1);
    while (true) {
      const ids = this._nextChunk;
      if (isempty(ids)) {
        return;
      }
      const jobs = await this._extractJobs(ids);
      this._incCursor(ids.length);
      yield jobs;
    }
  }
  destroy() {
    // noop
  }
  private _incCursor(n: number) {
    this._cursor += n;
  }
  private get _nextChunk() {
    return this._ids.slice(this._cursor, this._cursor + this._scanCount);
  }
}
