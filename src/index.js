// @ts-check
/**
 * @fob/snap — the importable Snapshots client.
 *
 *   import { fobSnap } from '@finopsbricks/fob-snap';
 *   const snap = fobSnap({ api_key, api_secret });   // api_url optional (hosted origin)
 *   await snap.snapshots.push(widgetId, { data, as_of });
 *   const { data } = await snap.widgets.list();
 *
 * The `fob-snap` CLI builds the same client (see src/cli/_helpers.js `clientFor`) and
 * calls these same namespaces, so the CLI and library can never drift: every endpoint
 * is defined once, in src/resources/.
 */

import { createTransport } from './http.js';
import { buildSnapshots } from './resources/snapshots.js';
import { buildWidgets } from './resources/widgets.js';
import { buildDashboards } from './resources/dashboards.js';

/**
 * @param {import('./http.js').Credentials} credentials Required `{ api_key, api_secret }`;
 *   optional `api_url` (origin-only) overrides the hosted endpoint. Never read from env.
 */
export function fobSnap(credentials) {
  const ctx = createTransport(credentials);
  return {
    snapshots: buildSnapshots(ctx),
    widgets: buildWidgets(ctx),
    dashboards: buildDashboards(ctx),
  };
}

export { ApiError, createTransport, DEFAULT_API_URL } from './http.js';
