/**
 * Shared CLI helpers: the `safe` handler adapter, `clientFor` (builds the authed
 * client from the resolved profile), and small option builders.
 */

import { resolveCredentials } from './config-store.js';
import { fobSnap } from '../index.js';

/**
 * Adapt a handler taking one merged `argv` to commander's `(…positionals, opts, cmd)`
 * signature, with clean-exit behaviour on an unexpected throw (`FOB_DEBUG=1` for the stack).
 * Positional names come from the command's declaration, camelised like option names.
 */
export function safe(handler) {
  return async (...args) => {
    const cmd = args[args.length - 1];
    const opts = args[args.length - 2];
    const positionals = args.slice(0, -2);

    const argv = { ...opts };
    const declared = cmd.registeredArguments ?? [];
    declared.forEach((arg, i) => {
      argv[toCamel(arg.name())] = positionals[i];
    });
    // Global options live on the root command — merge them down (leaf wins).
    let parent = cmd.parent;
    while (parent) {
      Object.assign(argv, parent.opts(), argv);
      parent = parent.parent;
    }

    try {
      await handler(argv);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      if (err.details?.length) for (const d of err.details) console.error(`  - ${d}`);
      if (process.env.FOB_DEBUG) console.error(err.stack);
      process.exit(1);
    }
  };
}

function toCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** Build the authed Snapshots client from the current profile. */
export function clientFor() {
  return fobSnap(resolveCredentials());
}

/** Standard `--json` output flag. */
export function jsonOption(cmd) {
  return cmd.option('--json', 'Output raw JSON');
}

/** Pagination + `--json` for list commands. */
export function listOptions(cmd) {
  return jsonOption(cmd)
    .option('--page <n>', 'Page number', Number, 1)
    .option('--limit <n>', 'Page size (max 500)', Number, 100);
}
