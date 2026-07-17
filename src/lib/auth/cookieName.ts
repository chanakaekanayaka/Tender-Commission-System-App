// Split out from cookies.ts on purpose: this file must stay free of any import that reads
// process.env at module-evaluation time (jwt.ts does). proxy.ts runs on AWS Amplify Hosting's
// Edge/Middleware compute, which does not receive the app's environment variables — importing
// jwt.ts (even transitively, even for an unused export) crashes it at load time. Keeping this
// constant here lets proxy.ts depend on it without pulling jwt.ts into its bundle.
export const AUTH_COOKIE_NAME = "auth_token";
