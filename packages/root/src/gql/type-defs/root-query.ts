export const rootQueryTypeDef = /* GraphQL */ `
  type Query {
    queues: [Queue!]
    queue(id: ID!): Queue
    metrics(queue: ID!, start: Int = 0, end: Int = -1): [QueueMetrics!]
    jobs(
      queue: ID!
      offset: Int
      limit: Int
      status: JobStatus
      order: OrderEnum
      id: ID
      ids: [ID]
      dataSearch: String
      """
      case-insensitive job name filter. Supports * wildcards, e.g. "send-*"
      """
      name: String
    ): [Job!]!
    job(queue: ID!, id: ID!): Job
    redisInfo: RedisInfo
  }
`;
