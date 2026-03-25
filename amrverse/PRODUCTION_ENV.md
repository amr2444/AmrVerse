# Production environment

Use your hosting dashboard as the source of truth for secrets. Keep `.env.production` as a placeholder only.

## Required

- `DATABASE_URL`: production Postgres connection string
- `NEXT_PUBLIC_APP_URL`: public frontend URL
- `NEXTAUTH_URL`: same as public URL
- `NEXTAUTH_SECRET`: long random secret for auth sessions
- `JWT_SECRET`: long random secret for access tokens
- `JWT_REFRESH_SECRET`: different long random secret for refresh tokens
- `ADMIN_EMAIL`: admin inbox for creator requests, default `akef.minato@gmail.com`
- `RESEND_API_KEY`: Resend API key for transactional emails
- `RESEND_FROM_EMAIL`: sender identity used by the app
- `BLOB_READ_WRITE_TOKEN`: write token for Vercel Blob uploads

## Optional

- `AUTH_COOKIE_DOMAIN`: set this when serving the app from a custom root domain
- `MONITORING_WEBHOOK_URL`: external monitoring sink for server and client errors

## Release checklist

1. Set every required variable in production.
2. Confirm `ADMIN_EMAIL` points to the inbox that approves creator requests.
3. Verify Blob and Resend credentials from a staging deploy first.
4. Run `npm test` and `npm run build` before every release.
