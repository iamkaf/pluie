import { Command } from 'commander';
import { build } from '../build.js';
import { getAvailableVersions } from '../build.js';

export function setupBuildCommand(program: Command): void {
    program
        .command('build')
        .description('Build texture pack(s)')
        .argument('[version]', 'Version to build (default: b1.7.3, use "all" for all versions)')
        .option('-o, --output <dir>', 'Output directory', 'output')
        .action(async (version, options) => {
            try {
                const targetVersion = version || 'b1.7.3';
                console.log('🔨 Pluie Texture Pack Builder');
                console.log('');

                if (targetVersion === 'all') {
                    const versions = getAvailableVersions();

                    if (versions.length === 0) {
                        console.error('❌ No version directories found in versions/');
                        process.exit(1);
                    }

                    console.log(`📦 Building all versions: ${versions.join(', ')}`);

                    let successCount = 0;
                    for (const v of versions) {
                        try {
                            console.log(`\n🔨 Building ${v}...`);
                            await build(v);
                            console.log(`✅ ${v} built successfully`);
                            successCount++;
                        } catch (error) {
                            console.error(`❌ Failed to build ${v}:`, error instanceof Error ? error.message : error);
                        }
                    }

                    console.log(`\n🎉 Build complete! ${successCount}/${versions.length} versions built.`);
                } else {
                    await build(targetVersion);
                }
            } catch (error) {
                console.error('❌ Build failed:', error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
}