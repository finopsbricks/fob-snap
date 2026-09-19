/**
 * `fob-snap config profiles <action>` — manage credential profiles.
 *
 * A profile is a named `{ api_url, api_key, api_secret }` set stored in
 * ~/.fob/fob-snap/config.yml. `add` takes flags, or prompts interactively for any
 * missing credential (secret via a hidden prompt) — the `login` flow.
 */

import { Command } from 'commander';
import { input, password } from '@inquirer/prompts';

import { safe, jsonOption } from '../_helpers.js';
import { printJson, printTable } from '../_output.js';
import { DEFAULT_API_URL } from '../../http.js';
import {
  addProfile, removeProfile, useProfile, listProfiles, describeCurrent,
} from '../config-store.js';

async function addHandler(argv) {
  const api_url = argv.apiUrl || DEFAULT_API_URL;
  const api_key = argv.apiKey || (await input({ message: 'API key:' }));
  const api_secret = argv.apiSecret || (await password({ message: 'API secret:', mask: '*' }));
  if (!api_key || !api_secret) throw new Error('Both an API key and secret are required.');

  addProfile(argv.name, { api_url, api_key, api_secret });
  console.log(`Saved Snapshots credentials for profile '${argv.name}' (${api_url}).`);
}

function listHandler(argv) {
  const { current, path, profiles } = listProfiles();
  if (argv.json) return printJson({ current, profiles });
  printTable(
    [
      { header: '', get: (p) => (p.current ? '*' : ' ') },
      { header: 'PROFILE', get: (p) => p.name },
      { header: 'API URL', get: (p) => p.api_url },
    ],
    profiles,
  );
  console.log(`\nConfig: ${path}`);
}

function useHandler(argv) {
  useProfile(argv.name);
  console.log(`Now using profile '${argv.name}'.`);
}

function removeHandler(argv) {
  removeProfile(argv.name);
  console.log(`Removed profile '${argv.name}'.`);
}

function currentHandler(argv) {
  const cur = describeCurrent();
  if (!cur) throw new Error('No profile selected. Run `fob-snap config profiles add <name>`.');
  if (argv.json) return printJson(cur);
  console.log(`Profile '${cur.name}' → ${cur.api_url}`);
}

function buildProfilesCommand() {
  const profiles = new Command('profiles').alias('login').description('Manage credential profiles');

  profiles
    .command('add')
    .description("Add or update a profile's credentials (prompts for any omitted secret)")
    .argument('<name>', 'Profile name')
    .option('--api-url <url>', `API base URL (origin only). Defaults to ${DEFAULT_API_URL}`, DEFAULT_API_URL)
    .option('--api-key <key>', 'API key')
    .option('--api-secret <secret>', 'API secret')
    .action(safe(addHandler));

  jsonOption(profiles.command('list').description('List profiles (current marked *)')).action(safe(listHandler));
  jsonOption(profiles.command('current').alias('whoami').description('Show the active profile')).action(safe(currentHandler));

  profiles.command('use').description('Set the current profile').argument('<name>', 'Profile name').action(safe(useHandler));
  profiles.command('remove').alias('rm').description('Remove a profile').argument('<name>', 'Profile name').action(safe(removeHandler));

  return profiles;
}

export function buildConfigCommand() {
  return new Command('config').description('Manage credential profiles').addCommand(buildProfilesCommand());
}
