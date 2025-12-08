#!/usr/bin/env node

/**
 * Pluie Texture Pack CLI
 *
 * Main entry point for the Pluie texture pack management CLI.
 */

import { setupCli } from './cli.js';

// Setup and run the CLI
const program = setupCli();
program.parse();