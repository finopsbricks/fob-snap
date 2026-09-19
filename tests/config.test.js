import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// config-store reads FOB_SNAP_CONFIG_DIR at import time — set it first, then dynamic-import.
let store;
beforeAll(async () => {
  process.env.FOB_SNAP_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'fob-snap-'));
  store = await import('../src/cli/config-store.js');
});

const CREDS = { api_url: 'https://snapshots.finopsbricks.com', api_key: 'k1', api_secret: 's1' };

describe('config store', () => {
  it('adds the first profile and makes it current', () => {
    store.addProfile('default', CREDS);
    const listed = store.listProfiles();
    expect(listed.current).toBe('default');
    expect(listed.profiles).toEqual([{ name: 'default', current: true, api_url: CREDS.api_url }]);
  });

  it('resolves credentials for the current profile', () => {
    const creds = store.resolveCredentials();
    expect(creds).toMatchObject({ ...CREDS, name: 'default' });
  });

  it('never leaks secrets in listProfiles', () => {
    const json = JSON.stringify(store.listProfiles());
    expect(json).not.toContain('s1');
  });

  it('switches the current profile with use()', () => {
    store.addProfile('staging', { ...CREDS, api_url: 'https://staging.example.com', api_key: 'k2', api_secret: 's2' });
    store.useProfile('staging');
    expect(store.resolveCredentials().name).toBe('staging');
  });

  it('honors a --profile override', () => {
    store.setProfileOverride('default');
    expect(store.resolveCredentials().name).toBe('default');
    store.setProfileOverride(null);
  });

  it('throws for an unknown override profile', () => {
    store.setProfileOverride('ghost');
    expect(() => store.resolveCredentials()).toThrow(/not configured/);
    store.setProfileOverride(null);
  });

  it('remove() falls back to another profile when removing the current', () => {
    store.useProfile('staging');
    store.removeProfile('staging');
    expect(store.resolveCredentials().name).toBe('default');
  });
});
