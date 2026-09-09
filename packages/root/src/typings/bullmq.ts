/**
 * Structural types for BullMQ queues and jobs.
 *
 * The adapters deliberately do NOT import `Queue`/`Job` from bullmq for their
 * public signatures. BullMQ v6 reshaped those classes (pluggable backends), so
 * a v5 queue is not assignable to a v6 class type and vice versa. Describing
 * only what the adapter actually uses keeps a single build of this package
 * usable from both, and avoids nominal type clashes when more than one copy of
 * bullmq ends up in a workspace.
 */

export type BullMQJobLike = {
  id?: string | number | null;
  name: string;
  data: any;
  opts: any;
  returnvalue?: any;
  progress?: any;
  attemptsMade: number;
  failedReason?: string | null;
  stacktrace?: string[] | null;
  processedOn?: number | null;
  finishedOn?: number | null;
  timestamp?: number | null;

  /**
   * Return types are intentionally `any`: they differ between BullMQ majors
   * (v5's `discard()` is sync, v6 removed it; `moveToFailed` changed its
   * resolved value), and every call site here awaits the result anyway.
   */
  getState(): Promise<any>;
  moveToCompleted(returnValue: any, token: string, fetchNext?: boolean): any;
  moveToFailed(err: any, token: string, fetchNext?: boolean): any;
  promote(): any;
  retry(state?: any): any;
  remove(opts?: any): any;
  log(row: string): any;
  /** removed in BullMQ v6 */
  discard?: (...args: any[]) => any;
  /** v5 named it `update`, v6 only has `updateData` */
  update?: (data: any) => any;
  updateData?: (data: any) => any;
};

export type BullMQJobConstructorLike = {
  fromJSON(queue: any, json: any, jobId?: string): BullMQJobLike;
};

export type BullMQQueueLike = {
  name: string;
  opts: any;
  token: string;

  toKey(type: string): string;
  count(): Promise<number>;
  add(name: any, data: any, opts?: any): Promise<any>;
  pause(): Promise<void>;
  resume(): any;
  drain(delayed?: boolean): Promise<void>;
  clean(grace: number, limit: number, type?: any): Promise<any[]>;
  isPaused(): Promise<boolean>;
  close(): Promise<void>;

  getJob(id: string): Promise<any>;
  getJobs(
    types?: any,
    start?: number,
    end?: number,
    asc?: boolean
  ): Promise<any[]>;
  getJobCounts(...types: any[]): Promise<Record<string, number>>;
  getJobCountByTypes(...types: any[]): Promise<number>;
  getActiveCount(): Promise<number>;
  getCompletedCount(): Promise<number>;
  getFailedCount(): Promise<number>;
  getDelayedCount(): Promise<number>;
  getWaitingCount(): Promise<number>;
  getJobLogs(
    jobId: string,
    start?: number,
    end?: number,
    asc?: boolean
  ): Promise<{ logs: string[]; count: number }>;

  /** BullMQ v5 exposes the redis client directly */
  client?: Promise<any>;
  /** BullMQ v6 moved it behind the queue backend */
  getBackend?: () => any;
};
