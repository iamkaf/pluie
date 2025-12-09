import { Command } from 'commander';
import path from 'path';
import { TextureDecomposer } from '../pipeline/terrain-decomposer.js';

export function setupDecomposeCommand(program: Command): void {
    program
        .command('decompose')
        .description('Decompose terrain.png or items.png into individual textures')
        .argument('[texture-file]', 'Path to terrain.png or items.png file to decompose')
        .option('--detect-only', 'Only detect non-empty regions without extracting')
        .option('--force', 'Extract even if files already exist (overwrite)')
        .option('--output-dir <dir>', 'Output directory (auto-detected by default)')
        .action(async (textureFile, options) => {
            try {
                console.log('🎨 Pluie Texture Decomposer');
                console.log('');

                // Determine file type and set defaults
                const filePath = textureFile || path.join('versions/b1.7.3/terrain_backup_dec_08_2025.png');
                const fileName = path.basename(filePath).toLowerCase();

                let fileType = 'terrain';
                let defaultOutputDir = 'versions/shared/assets/blocks';

                if (fileName.includes('items')) {
                    fileType = 'items';
                    defaultOutputDir = 'versions/shared/assets/items';
                }

                const outputDir = options.outputDir || defaultOutputDir;

                if (!await require('fs-extra').pathExists(filePath)) {
                    console.error(`❌ Error: ${fileType} file not found: ${filePath}`);
                    console.error('');
                    console.error('Usage:');
                    console.error('  npm run decompose [texture-file]');
                    console.error('  npm run decompose versions/b1.7.3/terrain.png');
                    console.error('  npm run decompose versions/b1.7.3/gui/items.png');
                    console.error('  npm run decompose --help');
                    process.exit(1);
                }

                console.log(`📁 Source: ${filePath}`);
                console.log(`📁 Target: ${outputDir}`);
                console.log('');

                if (options.detectOnly) {
                    await TextureDecomposer.extractNonEmptyRegions(filePath, outputDir);
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

                    await TextureDecomposer.decomposeTextures(filePath, outputDir);
                }

            } catch (error) {
                console.error('❌ Failed to decompose textures:', error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
}