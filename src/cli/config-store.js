/**
 * CLI credential store — reads/writes ~/.fob/fob-snap/config.yml (mode 0600) and
 * resolves which credentials the current command uses.
 *
 * Config lives under the shared family root ~/.fob/ so every fob-<tool> keeps its
 * config in one place. Override the whole dir with FOB_SNAP_CONFIG_DIR.
 *
 * CLI-only: the importable client (src/index.js) never imports this. Handlers call
 * resolveCredentials() and pass the result to client functions.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';

const CONFIG_DIR = process.env.FOB_SNAP_CONFIG_DIR || join(homedir(), '.fob', 'fob-snap');
const CONFIG_PATH = join(CONFIG_DIR, 'config.yml');

let profileOverride = null;

/** Set by the `--profile <name>` global flag (root preAction hook). Beats current_profile. */
export function setProfileOverride(name) {
  profileOverride = name;
}

export function loadConfig() {
  if (existsSync(CONFIG_PATH)) {
    const cfg = yaml.load(readFileSync(CONFIG_PATH, 'utf8')) || {};
    return { current_profile: cfg.current_profile ?? null, profiles: cfg.profiles ?? {} };
  }
  return { current_profile: null, profiles: {} };
}

export function saveConfig(cfg) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, yaml.dump(cfg), { mode: 0o600 });
}

export function addProfile(name, { api_url, api_key, api_secret }) {
  const cfg = loadConfig();
  cfg.profiles[name] = { api_url, api_key, api_secret };
  if (!cfg.current_profile) cfg.current_profile = name;
  saveConfig(cfg);
  return cfg;
}

export function removeProfile(name) {
  const cfg = loadConfig();
  if (!cfg.profiles[name]) throw new Error(`No profile named '${name}'.`);
  delete cfg.profiles[name];
  if (cfg.current_profile === name) cfg.current_profile = Object.keys(cfg.profiles)[0] ?? null;
  saveConfig(cfg);
  return cfg;
}

export function useProfile(name) {
  const cfg = loadConfig();
  if (!cfg.profiles[name]) throw new Error(`No profile named '${name}'. Run \`fob-snap config profiles add ${name}\`.`);
  cfg.current_profile = name;
  saveConfig(cfg);
  return cfg;
}

export function configPath() {
  return CONFIG_PATH;
}

/** Profiles for display — non-secret metadata only (name, current, api_url). */
export function listProfiles() {
  const cfg = loadConfig();
  const profiles = Object.entries(cfg.profiles).map(([name, p]) => ({
    name,
    current: name === cfg.current_profile,
    api_url: p.api_url,
  }));
  return { current: cfg.current_profile, path: CONFIG_PATH, profiles };
}

/**
 * Resolve credentials for the current command.
 * Precedence: `--profile` override > config `current_profile`. Does not read env —
 * an env var that silently overrode the active profile would be a footgun.
 * @returns {{ api_url: string, api_key: string, api_secret: string, name: string }}
 */
export function resolveCredentials() {
  const cfg = loadConfig();
  const name = profileOverride || cfg.current_profile;

  if (profileOverride && !cfg.profiles[profileOverride]) {
    throw new Error(`Profile '${profileOverride}' is not configured. Run \`fob-snap config profiles add ${profileOverride}\`.`);
  }
  if (name && cfg.profiles[name]) {
    return { ...cfg.profiles[name], name };
  }
  throw new Error(
    'No Snapshots profile selected. Run `fob-snap config profiles add <name>`, then `use <name>` (or pass --profile <name>).',
  );
}

/** Non-secret description of the identity the CLI would use right now, or null. */
export function describeCurrent() {
  try {
    const { api_key, api_secret, ...rest } = resolveCredentials();
    return rest;
  } catch {
    return null;
  }
}
