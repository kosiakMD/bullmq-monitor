import type {
  BullDataSource,
  MetricsDataSource,
  PoliciesDataSource,
} from '../data-sources';

export type TContext = {
  dataSources: {
    bull: BullDataSource;
    metrics: MetricsDataSource;
    policies: PoliciesDataSource;
  };
};
type TResolverFn = (
  parent: any,
  args: any,
  context: TContext,
  info?: any
) => any;
export type TResolvers = Record<
  string,
  Record<string, TResolverFn | any> | any
>;
