import { Command } from 'commander';
import { deploy } from '../deploy.js';

export function setupDeployCommand(program: Command): void {
    program
        .command('deploy')
        .description('Deploy texture pack(s) to Minecraft')
        .argument('[version]', 'Version to deploy (default: configured versions, use "all" for all versions)')
        .option('--no-backup', 'Skip creating backups before deployment')
        .action(async (version, options) => {
            try {
                console.log('🚀 Pluie Texture Pack Deployer');
                console.log('');
                await deploy(version);
            } catch (error) {
                console.error('❌ Deployment failed:', error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
}