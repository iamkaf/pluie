import { Command } from 'commander';

export function setupEditCommand(program: Command): void {
    program
        .command('edit')
        .description('Launch Aseprite to edit texture files')
        .argument('[files...]', 'Texture files to edit (e.g., b1.7.3/terrain.png)')
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

                // Update file paths to include versions/ directory if they're version-specific
                const updatedFiles = files.map((file: string) => {
                    // If the file looks like it's pointing to a version file
                    if (/^b\d+\.\d+\.\d+\//.test(file)) {
                        return `versions/${file}`;
                    }
                    return file;
                });

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