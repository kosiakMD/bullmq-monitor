import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Res,
  Inject,
  Type,
} from '@nestjs/common';
import { BullMonitorNestService } from './monitor.service';
import { BULL_MONITOR_SERVICE } from './typings';
import {
  hasParsedBody,
  rawRequest,
  requestHeaders,
  requestSearch,
  sendAsset,
  sendGraphQL,
  sendHtml,
  sendNotFound,
} from './http-adapter';

/**
 * Builds a controller bound to the configured path. Routes are declared
 * explicitly (no wildcards) so the module works on Nest 10 (path-to-regexp 6)
 * and Nest 11+ (path-to-regexp 8) without changes.
 */
export function createMonitorController(path: string): Type<any> {
  const normalized = path.replace(/^\/+|\/+$/g, '');

  @Controller(normalized)
  class BullMonitorController {
    constructor(
      @Inject(BULL_MONITOR_SERVICE)
      private readonly monitor: BullMonitorNestService
    ) {}

    @Get()
    dashboard(@Req() req: any, @Res() res: any) {
      sendHtml(res, this.monitor.renderDashboard(`/${normalized}`));
    }

    @Get('ui/:file')
    uiAsset(@Param('file') file: string, @Res() res: any) {
      const asset = this.monitor.asset(file);
      if (!asset) {
        sendNotFound(res);
        return;
      }
      sendAsset(res, asset);
    }

    @Get('graphql')
    async graphqlGet(@Req() req: any, @Res() res: any) {
      await this.handleGraphQL(req, res, 'GET');
    }

    @Post('graphql')
    async graphqlPost(@Req() req: any, @Res() res: any) {
      await this.handleGraphQL(req, res, 'POST');
    }

    private async handleGraphQL(req: any, res: any, method: string) {
      let body = req.body;
      if (method === 'POST' && !hasParsedBody(req)) {
        body = await this.monitor.readBody(rawRequest(req));
      }
      const result = await this.monitor.graphql({
        method,
        headers: requestHeaders(req),
        search: requestSearch(req),
        body,
      });
      sendGraphQL(res, result);
    }
  }

  return BullMonitorController;
}
