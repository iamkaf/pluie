import { Command } from 'commander';

export function setupListCommand(program: Command): void {
    program
        .command('list')
        .description('List available versions and their status')
        .option('--deployed', 'Only show deployed versions')
        .action(async (options) => {
            try {
                const fs = await import('fs');
                const path = await import('path');

                const versionsDir = path.join(process.cwd(), 'versions');
                const versions = fs.readdirSync(versionsDir)
                    .filter(name => {
                        const versionPath = path.join(versionsDir, name);
                        return fs.statSync(versionPath).isDirectory() && name !== 'shared';
                    })
                    .sort();

                if (versions.length === 0) {
                    console.log('❌ No version directories found');
                    return;
                }

                console.log('📋 Available versions:');
                console.log('');

                for (const version of versions) {
                    const versionDir = path.join(versionsDir, version);
                    const packFile = path.join(versionDir, 'pack.txt');
                    const packPng = path.join(versionDir, 'pack.png');

                    let description = 'No description';
                    let hasPackTxt = false;
                    let hasPackPng = false;

                    if (fs.existsSync(packFile)) {
                        hasPackTxt = true;
                        try {
                            const content = fs.readFileSync(packFile, 'utf8');
                            const lines = content.split('\n');
                            for (const line of lines) {
                                if (line.startsWith('description=')) {
                                    description = line.substring(12).trim();
                                    break;
                                }
                            }
                        } catch (error) {
                            // Use default description
                        }
                    }

                    hasPackPng = fs.existsSync(packPng);

                    const status = [];
                    if (hasPackTxt) status.push('✅ pack.txt');
                    if (hasPackPng) status.push('✅ pack.png');

                    console.log(`📦 ${version}`);
                    console.log(`   ${description}`);
                    console.log(`   ${status.join(', ')}`);
                    console.log('');
                }
            } catch (error) {
                console.error('❌ Failed to list versions:', error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
}