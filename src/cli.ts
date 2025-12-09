import { Command } from 'commander';
import { setupBuildCommand } from './commands/build.js';
import { setupDeployCommand } from './commands/deploy.js';
import { setupWatchCommand } from './commands/watch.js';
import { setupEditCommand } from './commands/edit.js';
import { setupListCommand } from './commands/list.js';
import { setupStatusCommand } from './commands/status.js';
import { setupDecomposeCommand } from './commands/decompose.js';

export function setupCli(): Command {
    const program = new Command();

    program
        .name('pluie')
        .description('Pluie Texture Pack CLI - A gentle, rain-inspired texture pack manager')
        .version(process.env.npm_package_version || '1.0.0')
        .option('-v, --verbose', 'Enable verbose output');

    // Setup all commands
    setupBuildCommand(program);
    setupDeployCommand(program);
    setupWatchCommand(program);
    setupEditCommand(program);
    setupListCommand(program);
    setupStatusCommand(program);
    setupDecomposeCommand(program);

    return program;
}