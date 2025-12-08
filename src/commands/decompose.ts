import { Command } from 'commander';
import path from 'path';
import { TerrainDecomposer } from '../pipeline/terrain-decomposer.js';

export function setupDecomposeCommand(program: Command): void {
    program
        .command('decompose')
        .description('Decompose terrain.png into individual block textures')
        .argument('[terrain-file]', 'Path to terrain.png file to decompose')
        .option('--detect-only', 'Only detect non-empty regions without extracting')
        .option('--force', 'Extract even if files already exist (overwrite)')
        .action(async (terrainFile, options) => {
            try {
                console.log('🎨 Pluie Terrain Decomposer');
                console.log('');

                // Default terrain file if not specified
                const terrainPath = terrainFile || path.join('versions/b1.7.3/terrain_backup_dec_08_2025.png');
                const outputDir = path.join('versions/shared/assets/blocks');

                if (!await require('fs-extra').pathExists(terrainPath)) {
                    console.error(`❌ Error: Terrain file not found: ${terrainPath}`);
                    console.error('');
                    console.error('Usage:');
                    console.error('  npm run decompose [terrain-file]');
                    console.error('  npm run decompose versions/b1.7.3/terrain.png');
                    console.error('  npm run decompose --help');
                    process.exit(1);
                }

                console.log(`📁 Source: ${terrainPath}`);
                console.log(`📁 Target: ${outputDir}`);
                console.log('');

                if (options.detectOnly) {
                    await TerrainDecomposer.extractNonEmptyRegions(terrainPath, outputDir);
                } else {
                    // If --force is specified, temporarily rename existing files
                    if (options.force) {
                        const fs = require('fs-extra');
                        if (await fs.pathExists(outputDir)) {
                            console.log('💾 Backing up existing files...');
                            const backupDir = `${outputDir}.backup.${Date.now()}`;
                            await fs.move(outputDir, backupDir);
                            console.log(`📦 Backup created: ${backupDir}`);
                        }
                    }

                    await TerrainDecomposer.decomposeTerrain(terrainPath, outputDir);
                }

            } catch (error) {
                console.error('❌ Failed to decompose terrain:', error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
}