import { Command } from 'commander';
import { TextureWatcher } from '../watch.js';

export function setupWatchCommand(program: Command): void {
    program
        .command('watch')
        .description('Watch for file changes and auto-build/deploy (Hot Reload)')
        .argument('[version]', 'Version to watch (default: b1.7.3, use "all" for all versions)')
        .option('--no-deploy', 'Disable automatic deployment on file changes')
        .option('--debounce <ms>', 'Debounce time in milliseconds', '500')
        .option('--no-notifications', 'Disable change notifications')
        .action(async (version, options) => {
            try {
                console.log('🔍 Pluie Texture Pack Hot Reload');
                console.log('');

                // Import and parse config
                const { parseConfig } = await import('../watch.js');
                const config = parseConfig();

                // Override config with command line options
                if (options.deploy === false) config.deploy_on_change = false;
                if (options.debounce) config.debounce_ms = parseInt(options.debounce) || 500;
                if (options.notifications === false) config.notifications = false;

                const watcher = new TextureWatcher(config);

                // Setup graceful shutdown
                const shutdown = async (signal: string) => {
                    try {
                        console.log(`\n📡 Received ${signal}, stopping gracefully...`);
                        await watcher.stop();
                        process.exit(0);
                    } catch (error) {
                        console.error('❌ Error during shutdown:', error instanceof Error ? error.message : error);
                        process.exit(1);
                    }
                };

                process.on('SIGINT', () => shutdown('SIGINT'));
                process.on('SIGTERM', () => shutdown('SIGTERM'));

                await watcher.start(version);
            } catch (error) {
                console.error('❌ Watch failed:', error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
}