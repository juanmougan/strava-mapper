☑ To Do

- Security concerns: how can I share the token securely between FE and BE ☑

- Add a circuit breaker – if we hit Strava's quota, return an error, leave the breaker open till we renew the quota ☑

- API limits: use the DB as a cache to access the API less frequently. If I hit the quota for a day, circuit-break this, and only display cached data (let the user know about this) ☑

- Discuss deployability. Consider places with a free tier, preferably with no credit cards ☑

- Add a "share with friends" option, either via Strava messages, WhatsApp, etc ☑

- Add a filter per activity type (e.g. cycling, running, etc) ☑

- Add a date range filter ☑

- Add a filter per country ☑

- Add CSS (e.g. Tailwind or similar) ☑

- Add storage. Can be a NoSQL DB. I only want to persist the user's activities. Consider GDPR issues here ☑

- Add a delete user functionality, so the users can delete themselves ☑

- Multi-user support: how can I handle multiple users using their credentials concurrently ☑

- Export a polyline to a GPX file ☑

- Add a circuit breaker - if we hit Strava's quota, return an error, leave the breaker open till we renew the quota (research how long it takes for this to happen) ☑
