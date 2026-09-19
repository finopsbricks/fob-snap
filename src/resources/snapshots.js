// @ts-check
/**
 * Snapshots resource — the product's defining endpoint (push, not pull).
 * A push submits a FULL typed payload; it's stored as a new immutable version.
 */

/** @typedef {import('../http.js').createTransport} Transport */

export function buildSnapshots(ctx) {
  return {
    /**
     * Push a snapshot to a widget.
     * @param {string} widgetId
     * @param {{ data: Object, as_of?: string }} body
     */
    push: (widgetId, { data, as_of } = /** @type {any} */ ({})) =>
      ctx.post(`/api/v1/widgets/${widgetId}/snapshots`, { data, as_of }),

    /**
     * List a widget's snapshot versions, newest first.
     * @param {string} widgetId
     * @param {{ page?: number, limit?: number }} [params]
     */
    list: (widgetId, { page, limit } = {}) =>
      ctx.get(`/api/v1/widgets/${widgetId}/snapshots`, { searchParams: { page, limit } }),
  };
}
