export const metricsTypeDef = /* GraphQL */ `
  type QueueMetrics {
    timestamp: Float!
    counts: QueueJobsCounts!
    processingTime: Float
    processingTimeMin: Float
    processingTimeMax: Float
  }
`;
