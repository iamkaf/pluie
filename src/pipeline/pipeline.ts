import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { AssetFile, BuildContext, ProcessResult, VersionTransformer, AssetType } from './types.js';
import { AssetDiscovery } from './discovery.js';
import { DefaultTransformerRegistry } from './registry.js';

export class AssetPipeline {
  private registry: DefaultTransformerRegistry;
  private discovery: AssetDiscovery;

  constructor(private sourceDir: string = 'versions/shared/assets') {
    this.registry = new DefaultTransformerRegistry();
    this.discovery = new AssetDiscovery(sourceDir);
  }

  registerTransformer(transformer: VersionTransformer): void {
    this.registry.register(transformer);
  }

  async processVersion(version: string, outputDir: string): Promise<ProcessResult> {
    console.log(`[Pipeline] Processing version: ${version}`);

    const transformer = this.registry.get(version);
    if (!transformer) {
      return {
        success: false,
        error: new Error(`No transformer registered for version: ${version}`),
        processedFiles: [],
        skippedFiles: [],
      };
    }

    try {
      // Ensure output directory exists
      await fs.ensureDir(outputDir);

      // Discover assets from multiple sources
      const sharedAssetsDir = path.dirname(this.sourceDir); // This gets us to versions/shared
      const discoveryResult = await this.discoverAllAssets(sharedAssetsDir);
      if (discoveryResult.assets.length === 0) {
        console.log(`[Pipeline] No assets found for processing`);
        return {
          success: true,
          processedFiles: [],
          skippedFiles: [],
        };
      }

      // Filter assets based on transformer requirements
      let assetsToProcess = discoveryResult.assets;
      if (transformer.getRequiredAssetTypes) {
        const requiredTypes = transformer.getRequiredAssetTypes();
        assetsToProcess = discoveryResult.assets.filter(asset =>
          requiredTypes.includes(asset.type) || asset.type.toString().startsWith('metadata_')
        );
      }

      // Create build context
      const context: BuildContext = {
        version,
        sourceDir: this.sourceDir,
        outputDir,
        buildDir: path.join(outputDir, '.build'),
        timestamp: new Date(),
      };

      // Ensure build directory exists
      await fs.ensureDir(context.buildDir);

      console.log(`[Pipeline] Processing ${assetsToProcess.length} assets with transformer: ${transformer.name}`);

      // Run transformation
      const result = await transformer.transform(assetsToProcess, context);

      console.log(`[Pipeline] Transformation complete. Processed: ${result.processedFiles.length}, Skipped: ${result.skippedFiles.length}`);

      // Clean up build directory
      await fs.remove(context.buildDir);

      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        processedFiles: [],
        skippedFiles: [],
      };
    }
  }

  private async discoverAllAssets(baseDir: string): Promise<{ assets: AssetFile[] }> {
    const allAssets: AssetFile[] = [];

    // Discover assets from versions/shared/assets/
    const assetsDiscovery = new AssetDiscovery(this.sourceDir);
    const assetsResult = await assetsDiscovery.discoverAssets();
    allAssets.push(...assetsResult.assets);

    // Discover assets from versions/shared/ directly (for pack.txt, pack.png, etc.)
    if (await fs.pathExists(baseDir)) {
      const files = await glob('**/*', {
        cwd: baseDir,
        nodir: true,
        absolute: false,
        ignore: ['assets/**/*'] // Ignore the assets directory we already processed
      });

      for (const file of files) {
        const sourcePath = path.join(baseDir, file);
        try {
          const stats = await fs.stat(sourcePath);
          const asset: AssetFile = {
            sourcePath,
            relativePath: file,
            type: this.determineAssetType(file),
            metadata: {
              lastModified: stats.mtime,
            },
          };
          allAssets.push(asset);
        } catch (error) {
          console.warn(`[Pipeline] Warning: Could not read file ${sourcePath}:`, error);
        }
      }
    }

    return { assets: allAssets };
  }

  private determineAssetType(relativePath: string): AssetType {
    const filename = path.basename(relativePath).toLowerCase();

    if (filename === 'pack.txt') {
      return AssetType.METADATA_PACK;
    }
    if (filename === 'pack.png') {
      return AssetType.TEXTURE_GUI; // Pack icon is GUI-related
    }

    return AssetType.UNKNOWN;
  }

  getAvailableVersions(): string[] {
    return this.registry.getVersions();
  }

  async getAssetSummary(): Promise<{ totalAssets: number; assetTypes: string[] }> {
    const discoveryResult = await this.discovery.discoverAssets();
    return {
      totalAssets: discoveryResult.assets.length,
      assetTypes: Array.from(discoveryResult.discoveredTypes),
    };
  }
}