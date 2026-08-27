---
"@pixeleye/api": minor
---

Add Bitbucket Cloud and Bitbucket Server support to the shared API types: new `bitbucket`/`bitbucket_server` enum values on `Team`, `Project`, and `Installation`, a paginated `GET /v1/teams/{teamID}/repos` response shape (`{ repos, next }` with `q`/`project`/`next` query filters), and the new `POST /v1/git/bitbucket-server` route.
