export const APP_NAME = 'EERS';
// Non-httpOnly, same-site cookie the web app sets on its own domain after
// login so middleware (running on the web app's domain, not the API's) has
// something to read. The real refreshToken cookie is scoped to the API's
// domain and is never sent to requests targeting the web app.
export const AUTH_HINT_COOKIE = 'eers_auth_hint';
export const AUTH_ROUTES = ['/login', '/register'] as const;
export const PROTECTED_ROUTES = ['/profile', '/businesses', '/reviews', '/notifications', '/admin'] as const;
