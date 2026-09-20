# Google sign-in setup

1. In Google Cloud Console, configure the OAuth consent screen and create an OAuth client of type **Web application**.
2. Add the frontend origin under **Authorized JavaScript origins**, for example `http://localhost:3001`, plus the production HTTPS origin. Use the actual port your frontend runs on.
3. Set `GOOGLE_CLIENT_ID` in `apps/api/.env` and the same value as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `apps/web/.env.local`.
4. Restart the API and rebuild/restart the frontend. Public Next.js environment variables are embedded at build time. Without the frontend client ID, the Google button is hidden.
5. If the consent screen is in testing mode, add the accounts used for testing as test users.

The login and registration pages both offer **Continue with Google**. Google returns an ID token to the browser, which sends it to `POST /api/v1/auth/google`. No client secret or redirect URI is needed for this popup flow. The API validates the token, creates a USER account if needed, and returns the existing application's session format with an HttpOnly refresh cookie.

The current email-based account matching supports verified Gmail and Google Workspace emails, where Google is authoritative. Other Google accounts using third-party email addresses must use password registration/login. Existing accounts retain their role and password; banned accounts cannot sign in. Ensure the USER role has been seeded.

Manual check: test a new Google account, an existing account, logout and login again, page refresh, a banned account, popup cancellation, and a blocked Google script. A new Google user should land on the home page already signed in.

References: [Google button setup](https://developers.google.com/identity/gsi/web/guides/display-button), [server-side ID token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
