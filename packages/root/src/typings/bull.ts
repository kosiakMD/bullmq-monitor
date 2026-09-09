/**
 * Structural types for Bull v4 queues and jobs.
 *
 * `bull` is an optional peer dependency, so the public declarations must not
 * import from it: a consumer that only uses BullMQ has no `bull` types
 * installed, and `tsc` would fail on our own `.d.ts` files. Only what the
 * adapter actually touches is described here.
 */

export type BullJobLike = {
  id: string | number;
  name: string;
  data: any;
  opts: any;
  returnvalue?: any;
  attemptsMade: number;
  failedReason?: string;
  stacktrace: string[];
  processedOn?: number | null;
  finishedOn?: number | null;
  timestamp?: number | null;

  progress(): any;
  getState(): Promise<any>;
  moveToCompleted(returnValue?: any): any;
  moveToFailed(reason: any): any;
  promote(): any;
  discard(): any;
  update(data: any): any;
  retry(): any;
  remove(): any;
  log(row: string): any;
};

export type BullQueueLike = {
  name: string;
  client: any;
  keyPrefix?: string;

  clientName(): string;
  toKey(type: string): string;
  count(): Promise<number>;
  add(name: string, data: any, opts?: any): Promise<any>;
  pause(isLocal?: boolean, doNotWaitActive?: boolean): Promise<void>;
  resume(isLocal?: boolean): Promise<void>;
  clean(grace: number, status?: any, limit?: number): Promise<any[]>;
  empty(): Promise<void>;
  isPaused(): Promise<boolean>;

  getJob(id: any): Promise<any>;
  getJobs(types: any[], start?: number, end?: number, asc?: boolean): Promise<any[]>;
  getJobCounts(): Promise<Record<string, number>>;
  getActiveCount(): Promise<number>;
  getCompletedCount(): Promise<number>;
  getFailedCount(): Promise<number>;
  getDelayedCount(): Promise<number>;
  getWaitingCount(): Promise<number>;
  getPausedCount(): Promise<number>;
  getJobLogs(jobId: any): Promise<{ logs: string[]; count: number }>;
  removeJobs(pattern: string): Promise<void>;
  close(doNotWaitJobs?: boolean): Promise<void>;

  on(event: string, cb: (...args: any[]) => void): any;
  off(event: string, cb: (...args: any[]) => void): any;
};
