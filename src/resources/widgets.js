// @ts-check
/** Widgets resource — CRUD over /api/v1/widgets. */

export function buildWidgets(ctx) {
  return {
    /** @param {{ page?: number, limit?: number }} [params] */
    list: ({ page, limit } = {}) => ctx.get('/api/v1/widgets', { searchParams: { page, limit } }),

    /** @param {string} id */
    get: (id) => ctx.get(`/api/v1/widgets/${id}`),

    /** @param {{ title: string, type: string, retention_days?: number|null, config?: Object }} body */
    create: (body) => ctx.post('/api/v1/widgets', body),

    /** @param {string} id @param {{ title?: string, retention_days?: number|null, config?: Object }} patch */
    update: (id, patch) => ctx.patch(`/api/v1/widgets/${id}`, patch),

    /** @param {string} id */
    delete: (id) => ctx.delete(`/api/v1/widgets/${id}`),
  };
}
