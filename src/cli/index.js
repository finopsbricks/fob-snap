/**
 * CLI entry point — a three-level command tree:
 *
 *   fob-snap <resource> <action> [target] [options]
 *
 * Credentials come from ~/.fob/fob-snap/config.yml; `config` manages profiles.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { Command } from 'commander';

import { setProfileOverride } from './config-store.js';
import { safe, configureTreeHelp } from './_helpers.js';
import { gettingStartedHandler } from './getting-started.js';
import { buildConfigCommand } from './config/index.js';
import { buildSnapshotsCommand } from './snapshots/index.js';
import { buildWidgetsCommand } from './widgets/index.js';
import { buildDashboardsCommand } from './dashboards/index.js';

function packageVersion() {
  const here = dirname(fileURLToPath(import.meta.url));
  return JSON.parse(readFileSync(join(here, '..', '..', 'package.json'), 'utf8')).version;
}

export function run(argv) {
  const program = new Command();

  program
    .name('fob-snap')
    .usage('<resource> <action> [target] [options]')
    .version(packageVersion(), '-v, --version', 'Show version number')
    .option('--profile <name>', 'Use credentials from a specific configured profile (overrides current)')
    // Runs before any action handler, at any depth.
    .hook('preAction', (thisCommand) => {
      const { profile } = thisCommand.opts();
      if (profile) setProfileOverride(profile);
    });

  program
    .command('getting-started')
    .description('Print setup instructions')
    .action(safe(gettingStartedHandler));

  program
    .addCommand(buildConfigCommand())
    .addCommand(buildSnapshotsCommand())
    .addCommand(buildWidgetsCommand())
    .addCommand(buildDashboardsCommand())
    .allowUnknownOption(false)
    .showHelpAfterError();

  // Applied tree-wide because configureHelp() is not inherited through addCommand().
  configureTreeHelp(program);

  program.parse(argv, { from: 'user' });
}
