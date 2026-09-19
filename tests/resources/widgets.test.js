import { buildWidgets } from '../../src/resources/widgets.js';
import { buildSnapshots } from '../../src/resources/snapshots.js';

function fakeCtx() {
  const calls = [];
  const record = (method) => (path, bodyOrOpts, maybeOpts) => {
    calls.push({ method, path, bodyOrOpts, maybeOpts });
    return Promise.resolve({ data: {} });
  };
  return {
    calls,
    get: (path, opts) => { calls.push({ method: 'GET', path, opts }); return Promise.resolve({ data: [] }); },
    post: record('POST'),
    patch: record('PATCH'),
    delete: (path, opts) => { calls.push({ method: 'DELETE', path, opts }); return Promise.resolve({ data: {} }); },
  };
}

describe('widgets resource', () => {
  it('maps CRUD to the right paths', async () => {
    const ctx = fakeCtx();
    const widgets = buildWidgets(ctx);

    await widgets.list({ page: 2, limit: 50 });
    await widgets.get('w1');
    await widgets.create({ title: 'MRR', type: 'kpi' });
    await widgets.update('w1', { title: 'ARR' });
    await widgets.delete('w1');

    expect(ctx.calls[0]).toMatchObject({ method: 'GET', path: '/api/v1/widgets', opts: { searchParams: { page: 2, limit: 50 } } });
    expect(ctx.calls[1]).toMatchObject({ method: 'GET', path: '/api/v1/widgets/w1' });
    expect(ctx.calls[2]).toMatchObject({ method: 'POST', path: '/api/v1/widgets', bodyOrOpts: { title: 'MRR', type: 'kpi' } });
    expect(ctx.calls[3]).toMatchObject({ method: 'PATCH', path: '/api/v1/widgets/w1', bodyOrOpts: { title: 'ARR' } });
    expect(ctx.calls[4]).toMatchObject({ method: 'DELETE', path: '/api/v1/widgets/w1' });
  });
});

describe('snapshots resource', () => {
  it('pushes to the widget ingest path', async () => {
    const ctx = fakeCtx();
    const snapshots = buildSnapshots(ctx);
    await snapshots.push('w1', { data: { value: 1 }, as_of: '2026-01-31T00:00:00Z' });
    expect(ctx.calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/widgets/w1/snapshots',
      bodyOrOpts: { data: { value: 1 }, as_of: '2026-01-31T00:00:00Z' },
    });
  });
});
