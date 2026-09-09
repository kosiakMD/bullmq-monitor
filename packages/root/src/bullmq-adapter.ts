import { Job, Queue, QueueProvider, JobStatus } from './queue';
import type {
  BullMQJobConstructorLike,
  BullMQJobLike,
  BullMQQueueLike,
} from './typings/bullmq';
import { JsonService } from './services/json';
import type { Maybe } from './typings/utils';
import type {
  JobId,
  JobStatusClean,
  JobCounts,
  JobLogs,
  GlobalJobCompletionCb,
  QueueConfig,
  RedisClient,
} from './queue';

/**
 * Adapter for BullMQ queues. Supports BullMQ v5 and v6:
 *  - v6 removed `Queue#client` (redis is reached through `getBackend().client`)
 *  - v6 removed `Job#discard` and the `paused` job type
 */
export class BullMQJobAdapter extends Job {
  constructor(
    private _job: BullMQJobLike,
    private _queue: Queue,
    private _knownStatus?: JobStatus
  ) {
    super();
  }

  // getters
  public get rawJob(): BullMQJobLike {
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
    return JsonService.maybeStringify(this._job.progress || '0', 0);
  }
  public get attemptsMade(): number {
    return this._job.attemptsMade;
  }
  public get failedReason(): Maybe<string> {
    return this._job.failedReason || undefined;
  }
  public get stacktrace(): string[] {
    return this._job.stacktrace || [];
  }
  public get opts() {
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
    const state = await this._job.getState();
    // "waiting-children" is a BullMQ-only state, the dashboard treats it as waiting
    return (state === 'waiting-children' ? 'waiting' : state) as JobStatus;
  }
  public async moveToCompleted(returnValue: any): Promise<any> {
    return this._job.moveToCompleted(returnValue, this._queue.token);
  }
  public async moveToFailed(reason: Error): Promise<void> {
    await this._job.moveToFailed(reason, this._queue.token);
  }
  public async promote(): Promise<void> {
    return this._job.promote();
  }
  public async discard(): Promise<void> {
    if (typeof this._job.discard === 'function') {
      return this._job.discard();
    }
    // removed in BullMQ v6
    throw new Error(
      'Job#discard is not available in this BullMQ version. Throw UnrecoverableError from the worker instead.'
    );
  }
  public async update(data: any): Promise<void> {
    // v5 exposes `update`, v6 renamed it to `updateData`
    if (typeof this._job.updateData === 'function') {
      return this._job.updateData(data);
    }
    if (typeof this._job.update === 'function') {
      return this._job.update(data);
    }
    throw new Error('This BullMQ version cannot update job data');
  }
  public async retry(): Promise<void> {
    return this._job.retry();
  }
  public async remove(): Promise<void> {
    return this._job.remove();
  }
  public async log(row: string): Promise<void> {
    await this._job.log(row);
  }
}

type InternalGlobalJobCompletionCb = (value: any) => void;

export class BullMQAdapter extends Queue {
  private _queueEvents?: any;
  private _globalJobCompletionCb?: InternalGlobalJobCompletionCb;
  private _id: string;

  constructor(
    private _queue: BullMQQueueLike,
    config?: QueueConfig
  ) {
    super(_queue, config);
    this._id = Buffer.from(`${this.keyPrefix}:${this.name}`).toString(
      'base64url'
    );
  }

  // getters
  public get provider(): QueueProvider {
    return QueueProvider.Bullmq;
  }
  /**
   * Lazily created, and only needed by the metrics collector. bullmq is a peer
   * dependency, so it is required at call time from the host application's copy.
   */
  private get queueEvents(): any {
    if (!this._queueEvents) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { QueueEvents } = require('bullmq');
      this._queueEvents = new QueueEvents(this._queue.name, this._queue.opts);
    }
    return this._queueEvents;
  }
  public get client(): Promise<RedisClient> {
    if (typeof this._queue.getBackend === 'function') {
      // BullMQ >= 6 hides the redis client behind the queue backend
      return Promise.resolve(this._queue.getBackend()).then(
        (backend: any) => backend.client
      );
    }
    return this._queue.client as Promise<RedisClient>;
  }
  public get id(): string {
    return this._id;
  }
  public get name(): string {
    return this._queue.name;
  }
  public get keyPrefix(): string {
    return this._queue.opts?.prefix || 'bull';
  }
  public get token(): string {
    return this._queue.token;
  }

  // setters
  public set onGlobalJobCompletion(callback: GlobalJobCompletionCb | null) {
    const oldCb = this._globalJobCompletionCb;
    if (oldCb) {
      this.queueEvents.off('completed', oldCb);
    }
    if (callback) {
      const normalizedCallback = (value: any) => {
        callback(value.jobId);
      };
      this._globalJobCompletionCb = normalizedCallback;
      this.queueEvents.on('completed', normalizedCallback);
    } else {
      this._globalJobCompletionCb = undefined;
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
  public async pause(): Promise<void> {
    return this._queue.pause();
  }
  public async resume(): Promise<void> {
    return this._queue.resume();
  }
  public async clean(
    grace: number,
    status?: JobStatusClean,
    limit: number = Number.MAX_SAFE_INTEGER
  ): Promise<JobId[]> {
    return await this._queue.clean(grace, limit, status as any);
  }
  public async empty(): Promise<void> {
    await this._queue.drain();
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
    /**
     * Use the Job class the queue itself exposes. Resolving `bullmq` from this
     * package could load a different copy (or the ESM build next to the app's
     * CJS one), and a Job built by a foreign class cannot reach the queue's
     * redis backend.
     */
    // `Queue#Job` is protected in the bullmq typings but present at runtime
    const JobClass: BullMQJobConstructorLike =
      (this._queue as any).Job ?? require('bullmq').Job;
    return this.normalizeJob(
      JobClass.fromJSON(this._queue, json, jobId),
      knownStatus
    );
  }
  public async getJobs(
    types: JobStatus | JobStatus[],
    start?: number,
    end?: number,
    asc?: boolean
  ): Promise<Job[]> {
    const jobs = await this._queue.getJobs(types as any, start, end, asc);
    return jobs.map((job) => this.normalizeJob(job));
  }
  public async getJobCounts(): Promise<JobCounts> {
    const counts = await this._queue.getJobCounts();
    return {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      paused: counts.paused ?? 0,
      prioritized: counts.prioritized ?? 0,
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
    try {
      return await this._queue.getJobCountByTypes('paused' as any);
    } catch (_e) {
      // BullMQ v6 has no paused job type
      return 0;
    }
  }
  public async removeJobs(): Promise<void> {
    throw new Error(
      'removeJobs by pattern is not supported by BullMQ. Use "clean" or select jobs and remove them.'
    );
  }
  public async getJobLogs(jobId: JobId): Promise<JobLogs> {
    const { logs, count } = await this._queue.getJobLogs(jobId);
    return { logs, count };
  }
  public async close(): Promise<void> {
    await this._queue.close();
    if (this._queueEvents) {
      await this._queueEvents.close();
    }
  }

  private normalizeJob(job: BullMQJobLike, knownStatus?: JobStatus): Job {
    return new BullMQJobAdapter(job, this, knownStatus);
  }
}
