// @ts-check
/** Dashboards resource — CRUD + placements + share over /api/v1/dashboards. */

export function buildDashboards(ctx) {
  return {
    /** @param {{ page?: number, limit?: number }} [params] */
    list: ({ page, limit } = {}) => ctx.get('/api/v1/dashboards', { searchParams: { page, limit } }),

    /** @param {string} id */
    get: (id) => ctx.get(`/api/v1/dashboards/${id}`),

    /** @param {{ title: string }} body */
    create: (body) => ctx.post('/api/v1/dashboards', body),

    /** @param {string} id @param {{ title?: string, layout?: Object }} patch */
    update: (id, patch) => ctx.patch(`/api/v1/dashboards/${id}`, patch),

    /** @param {string} id */
    delete: (id) => ctx.delete(`/api/v1/dashboards/${id}`),

    /** List placements on a dashboard. @param {string} id */
    listWidgets: (id) => ctx.get(`/api/v1/dashboards/${id}/widgets`),

    /** Place a widget. @param {string} id @param {{ widget_id: string, position?: Object }} body */
    addWidget: (id, body) => ctx.post(`/api/v1/dashboards/${id}/widgets`, body),

    /** Remove a placement. @param {string} id @param {string} placementId */
    removeWidget: (id, placementId) => ctx.delete(`/api/v1/dashboards/${id}/widgets/${placementId}`),

    /** Create/return the public share link. @param {string} id */
    share: (id) => ctx.post(`/api/v1/dashboards/${id}/share`, {}),

    /** Revoke the public share link. @param {string} id */
    unshare: (id) => ctx.delete(`/api/v1/dashboards/${id}/share`),
  };
}
