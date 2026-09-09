import { MetricsCollector } from '../../../metrics-collector';
import { BullMonitorError } from '../../../errors';
import { MetricsErrorEnum as ErrorEnum } from './errors-enum';

export class MetricsDataSource {
  constructor(private _internalCollector?: MetricsCollector) {}
  public async getMetrics(queue: string, start?: number, end?: number) {
    return await this._collector.extract(queue, start, end);
  }
  public async clearAllMetrics() {
    await this._collector.clearAll();
    return true;
  }
  public async clearMetrics(queue: string) {
    await this._collector.clear(queue);
    return true;
  }

  private get _collector(): MetricsCollector {
    if (!this._internalCollector) {
      throw new BullMonitorError(ErrorEnum.NO_COLLECTOR);
    }
    return this._internalCollector;
  }
}
