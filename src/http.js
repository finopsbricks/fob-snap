// @ts-check
/**
 * Snapshots API transport.
 *
 * PURE: credentials come from the `credentials` argument only — this module never
 * reads `process.env` or the CLI config file. The CLI resolves creds from its config
 * profiles and injects them; workers inject their own. (engineering-standards
 * `no-ambient-configuration`.)
 *
 * Base URL is origin-only (e.g. https://snapshots.finopsbricks.com); the `/api/v1`
 * prefix is carried in the paths passed by the resource layer.
 */

/**
 * @typedef {Object} Credentials
 * @property {string} api_key
 * @property {string} api_secret
 * @property {string} [api_url] - origin only; defaults to the hosted endpoint
 */

/** Origin the client talks to when the caller doesn't supply `api_url`. */
export const DEFAULT_API_URL = 'https://snapshots.finopsbricks.com';

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, status?: number, details?: string[]|null }} [opts]
   */
  constructor(message, { code, status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details || null;
  }
}

/**
 * @param {Credentials} credentials
 * @returns {{ api_url: string, api_key: string, api_secret: string }}
 */
function resolveCreds(credentials) {
  const api_url = credentials?.api_url ?? DEFAULT_API_URL;
  const api_key = credentials?.api_key;
  const api_secret = credentials?.api_secret;
  if (!api_key || !api_secret) {
    throw new ApiError(
      `Missing Snapshots credentials: pass { api_key, api_secret } (api_url optional, defaults to ${DEFAULT_API_URL}).`,
      { code: 'NO_CREDENTIALS' },
    );
  }
  return { api_url, api_key, api_secret };
}

function buildUrl(baseUrl, path, searchParams) {
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const url = new URL(path.replace(/^\//, ''), base);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url;
}

/**
 * @param {string} method
 * @param {string} path
 * @param {any} [body]
 * @param {{ credentials: Credentials, searchParams?: Object }} options
 */
async function apiRequest(method, path, body, { credentials, searchParams } = /** @type {any} */ ({})) {
  const creds = resolveCreds(credentials);
  const url = buildUrl(creds.api_url, path, searchParams);

  const headers = {
    'api-key': creds.api_key,
    'api-secret': creds.api_secret,
    accept: 'application/json',
  };
  const init = { method, headers };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    throw new ApiError(`Network error reaching ${url.origin}: ${err.message}`, { code: 'NETWORK_ERROR' });
  }

  const text = await response.text();
  let respBody = null;
  if (text) {
    try {
      respBody = JSON.parse(text);
    } catch {
      throw new ApiError(
        `Invalid JSON response (status ${response.status}): ${text.slice(0, 200)}`,
        { code: 'INVALID_RESPONSE', status: response.status },
      );
    }
  }

  if (!response.ok) {
    const code = respBody?.error?.code || 'HTTP_ERROR';
    const message = respBody?.error?.message || `${response.status} ${response.statusText}`;
    throw new ApiError(message, { code, status: response.status, details: respBody?.error?.details || null });
  }

  return respBody;
}

/**
 * Bind credentials once and expose verb helpers. The resource layer builds on this,
 * so every endpoint is defined once and the CLI and importable client can't drift.
 * @param {Credentials} credentials
 */
export function createTransport(credentials) {
  return {
    get: (path, opts = {}) => apiRequest('GET', path, undefined, { credentials, ...opts }),
    post: (path, body, opts = {}) => apiRequest('POST', path, body ?? {}, { credentials, ...opts }),
    patch: (path, body, opts = {}) => apiRequest('PATCH', path, body ?? {}, { credentials, ...opts }),
    delete: (path, opts = {}) => apiRequest('DELETE', path, undefined, { credentials, ...opts }),
  };
}
