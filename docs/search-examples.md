# Job search examples

BullMQ Monitor has two independent job filters. Both apply to the job status
selected in the dashboard, and both can be combined.

## Job name filter

Matches the job's name. Plain text is a case-insensitive substring match:

```
email
```

matches `send-email`, `EMAIL-retry` and `resend-email-now`.

Add `*` to switch to wildcard matching, where the pattern must match the whole name:

```
send-*
```

matches `send-email` and `send-sms` but not `resend-email`.

```
*-retry
```

matches `email-retry` but not `retry-email`.

## Data search

Data search is powered by [jsonata](https://docs.jsonata.org/overview.html) and is
evaluated against the raw job stored in redis.

Let's take this job as an example:

```json
{
  "name": "my-job",
  "data": {
    "hello": {
      "to": "world"
    }
  },
  "opts": {
    "attempts": 2,
    "delay": 1000
  }
}
```

To find a job by data:

```
data.*.hello.to="world"
```

By name:

```
name="my-job"
```

One or more attempts:

```
opts.attempts >= 1
```

Put it all together:

```
data.*.hello.to="world" and name="my-job" or opts.attempts >= 1
```

## Performance note

Both filters scan the redis keys of the selected status, so they are slower than
plain pagination. Tune the scan batch size with the `textSearchScanCount` option
if your queues are very large.
