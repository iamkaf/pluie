import { Command } from 'commander';

export function setupStatusCommand(program: Command): void {
    program
        .command('status')
        .description('Show system status and configuration')
        .action(async () => {
            try {
                const fs = await import('fs');
                const path = await import('path');

                console.log('🔍 Pluie Texture Pack Status');
                console.log('');

                // Check directories
                const dirs = ['versions', 'output', 'backups'];
                for (const dir of dirs) {
                    const dirPath = path.join(process.cwd(), dir);
                    const exists = fs.existsSync(dirPath);
                    console.log(`${exists ? '✅' : '❌'} ${dir}/ ${exists ? 'exists' : 'missing'}`);
                }

                // Check config files
                const configs = ['.deployrc'];
                for (const config of configs) {
                    const configPath = path.join(process.cwd(), config);
                    const exists = fs.existsSync(configPath);
                    console.log(`${exists ? '✅' : '❌'} ${config} ${exists ? 'exists' : 'missing'}`);
                }

                // Check Aseprite
                const asepritePath = process.env['ASEPRITE_PATH'];
                if (asepritePath) {
                    const exists = fs.existsSync(asepritePath);
                    console.log(`${exists ? '✅' : '❌'} ASEPRITE_PATH ${exists ? 'valid' : 'invalid'}`);
                    if (!exists) {
                        console.log(`   Path: ${asepritePath}`);
                    }
                } else {
                    console.log('⚠️  ASEPRITE_PATH not set');
                }

            } catch (error) {
                console.error('❌ Failed to get status:', error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
}