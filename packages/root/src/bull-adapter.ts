import { Queue, Job, QueueProvider } from './queue';
import type {
  JobId,
  JobStatusClean,
  JobCounts,
  JobLogs,
  QueueConfig,
  GlobalJobCompletionCb,
} from './queue';
import { JobStatus } from './queue';
import type { BullQueueLike, BullJobLike } from './typings/bull';
import type { Maybe } from './typings/utils';

/**
 * bull is an optional peer dependency: an app that only uses BullMQ has no
 * reason to install it. Requiring it at module load would crash such an app the
 * moment it imports anything from this package, so it is resolved lazily, and
 * only on the one code path that needs the runtime class.
 */
const loadBull = (): any => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('bull');
  } catch (_e) {
    throw new Error(
      'BullAdapter needs the "bull" package. Install it, or use BullMQAdapter instead.'
    );
  }
};

export class BullJobAdapter extends Job {
  constructor(
    private _job: BullJobLike,
    private _queue: Queue,
    private _knownStatus?: JobStatus
  ) {
    super();
  }

  // getters
  public get rawJob(): BullJobLike {
    return this._job;
  }

  public get queue(): Queue {
    return this._queue;
  }

  public get id(): JobId {
    return String(this._job.id);
  }

  public get name(): string {
    return this._job.name;
  }

  public get data() {
    return this._job.data;
  }

  public get returnvalue(): unknown {
    return this._job.returnvalue;
  }

  public get progress(): string {
    return String(this._job.progress()) || '0';
  }

  public get attemptsMade(): number {
    return this._job.attemptsMade;
  }

  public get failedReason(): Maybe<string> {
    return this._job.failedReason;
  }

  public get stacktrace(): string[] {
    return this._job.stacktrace;
  }

  public get opts(): any {
    return this._job.opts;
  }

  public get processedOn(): Maybe<number> {
    return this._job.processedOn || undefined;
  }

  public get finishedOn(): Maybe<number> {
    return this._job.finishedOn || undefined;
  }

  public get timestamp(): Maybe<number> {
    return this._job.timestamp || undefined;
  }

  // public methods
  public async getState(): Promise<JobStatus> {
    // jobs hydrated from a status scan already know their state
    if (this._knownStatus) {
      return this._knownStatus;
    }
    return this._job.getState() as any;
  }

  public async moveToCompleted(returnValue?: string): Promise<any> {
    return this._job.moveToCompleted(returnValue);
  }

  public async moveToFailed(reason: Error): Promise<any> {
    return this._job.moveToFailed(reason);
  }

  public async promote(): Promise<void> {
    return this._job.promote();
  }
  public async discard(): Promise<void> {
    return this._job.discard();
  }
  public async update(data: any): Promise<void> {
    return this._job.update(data);
  }
  public async retry(): Promise<void> {
    return this._job.retry();
  }
  public async remove(): Promise<void> {
    return this._job.remove();
  }
  public async log(row: string): Promise<void> {
    return this._job.log(row);
  }
}

export class BullAdapter extends Queue {
  private _id: string;
  private _globalJobCompletionCb?: GlobalJobCompletionCb;

  constructor(
    private _queue: BullQueueLike,
    config?: QueueConfig
  ) {
    super(_queue, config);
    this._id = Buffer.from(this._queue.clientName()).toString('base64');
  }

  // getters
  public get provider(): QueueProvider {
    return QueueProvider.Bull;
  }
  public get client() {
    return Promise.resolve(this._queue.client);
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._queue.name;
  }

  public get keyPrefix(): string {
    return (this._queue as any).keyPrefix || 'bull';
  }

  public get token(): string {
    return '';
  }

  // setters
  public set onGlobalJobCompletion(callback: GlobalJobCompletionCb | null) {
    const oldCb = this._globalJobCompletionCb;
    if (oldCb) {
      this._queue.off('global:completed', oldCb);
    }
    this._globalJobCompletionCb = callback || undefined;
    if (callback) {
      this._queue.on('global:completed', callback);
    }
  }

  // public methods
  public toKey(queueType: string): string {
    return this._queue.toKey(queueType);
  }

  public async count(): Promise<number> {
    return this._queue.count();
  }

  public async add(name: string, data: any, opts?: any): Promise<Job> {
    const job = await this._queue.add(name, data, opts);
    return this.normalizeJob(job);
  }

  public async pause(
    isLocal?: boolean,
    doNotWaitActive?: boolean
  ): Promise<void> {
    return this._queue.pause(isLocal, doNotWaitActive);
  }

  public async resume(isLocal?: boolean): Promise<void> {
    return this._queue.resume(isLocal);
  }

  public async clean(
    grace: number,
    status?: JobStatusClean,
    limit?: number
  ): Promise<JobId[]> {
    const jobs = await this._queue.clean(grace, status, limit);
    return jobs.map((job) => String(job.id));
  }

  public async empty(): Promise<void> {
    return this._queue.empty();
  }

  public async isPaused(): Promise<boolean> {
    return this._queue.isPaused();
  }

  public async getJob(id: JobId): Promise<Maybe<Job>> {
    const job = await this._queue.getJob(id);
    if (job) {
      return this.normalizeJob(job);
    }
  }
  public jobFromJSON(json: any, jobId: JobId, knownStatus?: JobStatus): Job {
    // Job.fromJSON exists at runtime but is missing from the bull typings
    return this.normalizeJob(
      loadBull().Job.fromJSON(this._queue, json, jobId),
      knownStatus
    );
  }

  public async getJobs(
    types: JobStatus | JobStatus[],
    start?: number,
    end?: number,
    asc?: boolean
  ): Promise<Job[]> {
    const statuses = (Array.isArray(types) ? types : [types]) as any[];
    const jobs = await this._queue.getJobs(statuses, start, end, asc);
    return jobs.map((job) => this.normalizeJob(job));
  }

  public async getJobCounts(): Promise<JobCounts> {
    const counts = (await this._queue.getJobCounts()) as unknown as Record<
      string,
      number
    >;
    return {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      paused: counts.paused ?? 0,
      prioritized: 0,
    };
  }

  public async getActiveCount(): Promise<number> {
    return this._queue.getActiveCount();
  }

  public async getCompletedCount(): Promise<number> {
    return this._queue.getCompletedCount();
  }

  public async getFailedCount(): Promise<number> {
    return this._queue.getFailedCount();
  }

  public async getDelayedCount(): Promise<number> {
    return this._queue.getDelayedCount();
  }

  public async getWaitingCount(): Promise<number> {
    return this._queue.getWaitingCount();
  }

  public async getPausedCount(): Promise<number> {
    return this._queue.getPausedCount();
  }

  public async removeJobs(pattern: string): Promise<void> {
    return this._queue.removeJobs(pattern);
  }
  public async getJobLogs(jobId: JobId): Promise<JobLogs> {
    return this._queue.getJobLogs(jobId);
  }

  public async close(doNotWaitJobs?: boolean): Promise<void> {
    return this._queue.close(doNotWaitJobs);
  }

  // private methods
  private normalizeJob(job: BullJobLike, knownStatus?: JobStatus): Job {
    return new BullJobAdapter(job, this, knownStatus);
  }
}
