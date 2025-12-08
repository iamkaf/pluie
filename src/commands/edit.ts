import { Command } from 'commander';
import path from 'path';
import sharp from 'sharp';

export function setupEditCommand(program: Command): void {
    program
        .command('edit')
        .description('Launch Aseprite to edit texture files')
        .argument('[files...]', 'Texture files to edit (e.g., b1.7.3/terrain.png, blocks/grass.png, items/diamond_sword.png)')
        .option('-b, --batch <script>', 'Run Aseprite in batch mode with script')
        .option('--shell', 'Launch Aseprite without detaching from terminal')
        .action(async (files, options) => {
            try {
                console.log('🎨 Pluie Texture Pack Editor');
                console.log('');

                // Dynamic import to avoid bundling issues
                const { spawn } = await import('child_process');
                const fs = await import('fs');

                const asepritePath = process.env['ASEPRITE_PATH'];
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

                if (!fs.existsSync(asepritePath)) {
                    console.error('❌ Error: Aseprite executable not found at:', asepritePath);
                    console.error('');
                    console.error('Please check that ASEPRITE_PATH points to a valid Aseprite executable.');
                    console.error('Current value:', asepritePath);
                    process.exit(1);
                }

                // Validate and update file paths
                const updatedFiles = [];
                for (const file of files) {
                    // Validate that file has a path
                    if (!file.includes('/')) {
                        console.error('❌ Error: Please provide a full path for texture files.');
                        console.error('');
                        console.error('Examples:');
                        console.error('  npm run edit blocks/grass.png');
                        console.error('  npm run edit items/diamond_sword.png');
                        console.error('  npm run edit gui/crafting.png');
                        console.error('  npm run edit environment/sun.png');
                        console.error('  npm run edit b1.7.3/terrain.png');
                        console.error('');
                        console.error('Available asset types: blocks, items, gui, environment, misc, particles');
                        process.exit(1);
                    }

                    let fullPath = file;

                    // If the file looks like it's pointing to a version file
                    if (/^b\d+\.\d+\.\d+\//.test(file)) {
                        fullPath = `versions/${file}`;
                    }
                    // If it starts with versions/shared or versions/b1.7.3, keep as is
                    else if (!file.startsWith('versions/')) {
                        fullPath = `versions/shared/assets/${file}`;
                    }

                    // Check if file exists, create it if it doesn't
                    if (!fs.existsSync(fullPath)) {
                        console.log(`📝 File not found: ${fullPath}`);
                        console.log(`✨ Creating 16x16 transparent PNG: ${fullPath}`);

                        // Ensure directory exists
                        const dir = path.dirname(fullPath);
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }

                        // Create 16x16 transparent PNG using sharp
                        try {
                            await sharp({
                                create: {
                                    width: 16,
                                    height: 16,
                                    channels: 4,
                                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                                }
                            })
                            .png()
                            .toFile(fullPath);
                            console.log(`✅ Created: ${fullPath}`);
                        } catch (error) {
                            console.error(`❌ Failed to create ${fullPath}:`, error);
                            process.exit(1);
                        }
                    } else {
                        console.log(`📁 Found: ${fullPath}`);
                    }

                    updatedFiles.push(fullPath);
                }

                const asepriteArgs = updatedFiles;
                if (options.batch) {
                    asepriteArgs.unshift('--batch', options.batch);
                }

                console.log(`🚀 Launching Aseprite...`);
                if (updatedFiles.length > 0) {
                    console.log(`📁 Files: ${updatedFiles.join(', ')}`);
                }
                console.log('');

                const child = spawn(asepritePath, asepriteArgs, {
                    detached: !options.shell,
                    stdio: options.shell ? 'inherit' : 'ignore'
                });

                if (!options.shell) {
                    child.unref();
                } else {
                    child.on('exit', (code) => {
                        if (code !== 0) {
                            console.error(`❌ Aseprite exited with code ${code}`);
                            process.exit(code || 1);
                        }
                    });
                }

            } catch (error) {
                console.error('❌ Failed to launch Aseprite:', error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
}