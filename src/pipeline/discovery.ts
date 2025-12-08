import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { AssetFile, AssetType, AssetDiscoveryResult } from './types.js';

export class AssetDiscovery {
  private sourceDir: string;

  constructor(sourceDir: string) {
    this.sourceDir = sourceDir;
  }

  async discoverAssets(): Promise<AssetDiscoveryResult> {
    console.log(`[Pipeline] Discovering assets in: ${this.sourceDir}`);

    if (!await fs.pathExists(this.sourceDir)) {
      console.log(`[Pipeline] Source directory does not exist: ${this.sourceDir}`);
      return {
        assets: [],
        totalFiles: 0,
        discoveredTypes: new Set(),
      };
    }

    const files = await glob('**/*', {
      cwd: this.sourceDir,
      nodir: true,
      absolute: false
    });

    console.log(`[Pipeline] Found ${files.length} files in source directory`);

    const assets: AssetFile[] = [];
    const discoveredTypes = new Set<AssetType>();

    for (const file of files) {
      const asset = await this.createAssetFile(file);
      if (asset) {
        assets.push(asset);
        discoveredTypes.add(asset.type);
      }
    }

    console.log(`[Pipeline] Discovered ${assets.length} assets across ${discoveredTypes.size} types`);

    return {
      assets,
      totalFiles: files.length,
      discoveredTypes,
    };
  }

  private async createAssetFile(relativePath: string): Promise<AssetFile | null> {
    const sourcePath = path.join(this.sourceDir, relativePath);

    try {
      const stats = await fs.stat(sourcePath);
      const assetType = this.determineAssetType(relativePath);

      const metadata = {
        lastModified: stats.mtime,
        ...(await this.extractImageMetadata(sourcePath, assetType)),
      };

      return {
        sourcePath,
        relativePath,
        type: assetType,
        metadata,
      };
    } catch (error) {
      console.warn(`[Pipeline] Warning: Could not read file ${sourcePath}:`, error);
      return null;
    }
  }

  private determineAssetType(relativePath: string): AssetType {
    const ext = path.extname(relativePath).toLowerCase();
    const dir = path.dirname(relativePath).toLowerCase();
    const filename = path.basename(relativePath).toLowerCase();

    // Skip non-image files that aren't metadata
    if (!['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.txt', '.json', '.mcmeta'].includes(ext)) {
      return AssetType.UNKNOWN;
    }

    // Metadata files
    if (filename === 'pack.txt') {
      return AssetType.METADATA_PACK;
    }

    if (filename.includes('config') || filename.includes('settings')) {
      return AssetType.METADATA_CONFIG;
    }

    // Texture types based on directory structure
    if (dir.includes('blocks')) {
      return AssetType.TEXTURE_BLOCKS;
    }
    if (dir.includes('terrain')) {
      return AssetType.TEXTURE_TERRAIN; // Legacy support
    }

    if (dir.includes('items')) {
      return AssetType.TEXTURE_ITEMS;
    }

    if (dir.includes('gui')) {
      return AssetType.TEXTURE_GUI;
    }

    if (dir.includes('environment')) {
      return AssetType.TEXTURE_ENVIRONMENT;
    }

    if (dir.includes('particles') || dir.includes('particle')) {
      return AssetType.TEXTURE_PARTICLES;
    }

    if (dir.includes('misc')) {
      return AssetType.TEXTURE_MISC;
    }

    // Image files in unknown directories are treated as block textures by default
    if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'].includes(ext)) {
      return AssetType.TEXTURE_BLOCKS;
    }

    return AssetType.UNKNOWN;
  }

  private async extractImageMetadata(filePath: string, assetType: AssetType): Promise<Partial<AssetFile['metadata']>> {
    if (!assetType.toString().startsWith('texture_')) {
      return {};
    }

    try {
      // For now, just check if it's a valid image file
      // In the future, we could use sharp or another library to get actual dimensions
      return {
        format: path.extname(filePath).toLowerCase().slice(1),
      };
    } catch (error) {
      return {};
    }
  }
}