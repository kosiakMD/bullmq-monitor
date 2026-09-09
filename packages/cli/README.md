# @bullmq-monitor/cli

Run [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor) against existing
queues without writing any code.

```bash
npx @bullmq-monitor/cli -q emails -q reports
```

## Install

```bash
npm i -g @bullmq-monitor/cli
```

## Usage

```
Usage: bullmq-monitor -q queue1 queue2

Options:
  --redis-uri <uri>            redis connection uri (default: "redis://localhost:6379")
  -q, --queue <queues...>      queue names to monitor
  --bull                       use bull instead of bullmq (bullmq is the default)
  -p, --port <number>          server's port (default: "3000")
  --host <string>              server's host (default: "localhost")
  --prefix <string>            redis key prefix
  --readonly                   disable every mutating action in the dashboard
  -m, --metrics                enable the metrics collector
  --max-metrics <number>       max metrics points kept per queue (default: "100")
  --metrics-interval <number>  metrics collection interval in seconds (default: "3600")
  -V, --version                print the version
  -h, --help                   display help for command
```

## Examples

Watch two queues on a remote redis, read-only:

```bash
bullmq-monitor -q emails -q reports --redis-uri redis://cache:6379 --readonly
```

Watch legacy Bull queues with a custom key prefix:

```bash
bullmq-monitor -q emails --bull --prefix myapp
```

## License

MIT
