import { createTransport, ApiError, DEFAULT_API_URL } from '../src/http.js';

describe('http transport', () => {
  afterEach(() => { delete global.fetch; });

  it('sends api-key/api-secret headers and returns the parsed body', async () => {
    let seen;
    global.fetch = async (url, init) => {
      seen = { url: url.toString(), headers: init.headers };
      return { ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify({ data: { ok: true } }) };
    };
    const ctx = createTransport({ api_key: 'k', api_secret: 's' });
    const res = await ctx.get('/api/v1/widgets');
    expect(res).toEqual({ data: { ok: true } });
    expect(seen.url).toBe(`${DEFAULT_API_URL}/api/v1/widgets`);
    expect(seen.headers['api-key']).toBe('k');
    expect(seen.headers['api-secret']).toBe('s');
  });

  it('throws NO_CREDENTIALS without a key/secret', async () => {
    const ctx = createTransport({});
    await expect(ctx.get('/api/v1/widgets')).rejects.toMatchObject({ code: 'NO_CREDENTIALS' });
  });

  it('maps a non-2xx error envelope to ApiError with code + status', async () => {
    global.fetch = async () => ({
      ok: false, status: 422, statusText: 'Unprocessable',
      text: async () => JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'bad payload', details: ['x'] } }),
    });
    const ctx = createTransport({ api_key: 'k', api_secret: 's' });
    await expect(ctx.post('/api/v1/widgets', {})).rejects.toMatchObject({
      name: 'ApiError', code: 'VALIDATION_ERROR', status: 422,
    });
  });

  it('applies searchParams and omits empty values', async () => {
    let seen;
    global.fetch = async (url) => { seen = url.toString(); return { ok: true, status: 200, statusText: 'OK', text: async () => '' }; };
    const ctx = createTransport({ api_key: 'k', api_secret: 's' });
    await ctx.get('/api/v1/widgets', { searchParams: { page: 2, limit: undefined, q: '' } });
    expect(seen).toBe(`${DEFAULT_API_URL}/api/v1/widgets?page=2`);
  });

  it('ApiError is an Error subclass', () => {
    expect(new ApiError('x')).toBeInstanceOf(Error);
  });
});
