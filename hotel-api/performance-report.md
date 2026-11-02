# Caching and Rate Limiting Performance Report
## 1. Performance Before and After Caching

| Metric | Without Cache | With Redis Cache |
|---|---:|---:|
| Average Latency | 145.66 ms | 102.79 ms |
| Average Requests/sec | 682.65 | 968.05 |
| Total Requests | ~14,000 | ~19,000 |

### Results

The average latency decreased from 145.66 ms to 102.79 ms,
which is approximately a 29.4% improvement.

The throughput increased from 682.65 requests/sec to 968.05 requests/sec,
which is approximately a 41.8% improvement.

Redis caching improved the Room API performance because repeated GET requests
could retrieve cached data instead of repeatedly querying the database.

---

## 2. Rate Limiting Test

The global API rate limit was configured to:

30 requests per minute.

The Room API was configured to:

10 requests per minute.

Autocannon was used to send a large number of requests to the Room API.

### Results

- Successful 2xx responses: 10
- Non-2xx responses: 116,220
- Requests that hit the rate limit: 116,220
- Expected response after exceeding the limit: 429 Too Many Requests

The result shows that the Room API successfully restricted requests after
the configured limit of 10 requests per minute was reached.

---

## 3. Endpoint That Benefited Most From Caching

The GET /rooms endpoint benefited significantly from caching because the same
room list can be requested repeatedly while the underlying room data does not
change frequently.

The GET /rooms/:id endpoint can also benefit from caching when the same room
is requested multiple times.

Caching reduces repeated database queries and improves response time.

---

## 4. Conclusion

Redis caching improved the performance of the Room API.

Average latency decreased by approximately 29.4%, while throughput increased
by approximately 41.8%.

Rate limiting also worked successfully. Only 10 requests were accepted during
the rate-limit test, while 116,220 requests were rejected after the limit was
exceeded.