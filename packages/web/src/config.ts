// Central API endpoint configuration.
//
// In production the API base URL is injected at build time via the
// `VITE_API_URL` environment variable (set by the Azure deployment to the
// App Service origin, e.g. https://iptscreening-api.azurewebsites.net).
// Locally it falls back to the dev API server.
//
// The value is normalized so it works whether or not a trailing slash or
// `/api` suffix is supplied.
const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

/** API server origin, with no trailing slash and no `/api` suffix. */
export const API_ORIGIN = raw.replace(/\/+$/, '').replace(/\/api$/, '');

/** API base URL including the `/api` prefix. */
export const API_BASE = `${API_ORIGIN}/api`;
