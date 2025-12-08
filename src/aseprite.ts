#!/usr/bin/env node

/**
 * Aseprite launcher script for Pluie Texture Pack
 *
 * This script launches Aseprite (pixel art editor) in a detached background process,
 * allowing you to continue using your terminal while Aseprite runs separately.
 * It automatically handles the Steam/Path configuration for Aseprite.
 *
 * Usage: tsx scripts/aseprite.ts [file...]
 * Examples:
 *   tsx scripts/aseprite.ts b1.7.3/terrain.png
 *   tsx scripts/aseprite.ts b1.7.3/items.png b1.7.3/gui/gui.png
 */

import { spawn } from 'child_process';
import * as fs from 'fs';

const asepritePath = process.env['ASEPRITE_PATH'];
const args = process.argv.slice(2);

// Check if Aseprite path is configured
if (!asepritePath) {
    console.error('❌ Error: ASEPRITE_PATH environment variable not set');
    console.error('');
    console.error('Please set the ASEPRITE_PATH environment variable to your Aseprite executable.');
    console.error('');
    console.error('Create a .env file with:');
    console.error('ASEPRITE_PATH=/path/to/your/aseprite');
    console.error('');
    console.error('Or set it in your shell:');
    console.error('export ASEPRITE_PATH=/path/to/your/aseprite');
    process.exit(1);
}

// Check if Aseprite executable exists
if (!fs.existsSync(asepritePath)) {
    console.error('❌ Error: Aseprite executable not found at:', asepritePath);
    console.error('');
    console.error('Please check that ASEPRITE_PATH points to a valid Aseprite executable.');
    console.error('Current value:', asepritePath);
    process.exit(1);
}

// Update file paths to include versions/ directory if they're version-specific
const updatedArgs = args.map(arg => {
    // If the arg looks like it's pointing to a version file (e.g., b1.7.3/terrain.png)
    if (arg.match(/^b\d+\.\d+\.\d+\//)) {
        return `versions/${arg}`;
    }
    return arg;
});

// Launch Aseprite detached
const child = spawn(asepritePath, updatedArgs, {
    detached: true,
    stdio: 'ignore'
});

child.unref();

console.log('Aseprite launched in background');
if (updatedArgs.length > 0) {
    console.log(`Opened: ${updatedArgs.join(' ')}`);
}