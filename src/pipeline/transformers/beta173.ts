import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import { AssetFile, BuildContext, ProcessResult, VersionTransformer, AssetType } from '../types.js';

interface TerrainCoordinateData {
  rows: number;
  cols: number;
  tile_size: number;
  coordinates: {
    [key: string]: string; // "x,y": "texture_name"
  };
}

export class Beta173Transformer implements VersionTransformer {
  public version = 'b1.7.3';
  public name = 'Beta 1.7.3 Legacy Format Transformer';
  private coordinateCache: TerrainCoordinateData | null = null;

  getRequiredAssetTypes(): AssetType[] {
    return [AssetType.TEXTURE_BLOCKS, AssetType.METADATA_PACK];
  }

  isApplicable(version: string): boolean {
    return version === 'b1.7.3' || version === 'beta1.7.3';
  }

  private async loadCoordinates(): Promise<TerrainCoordinateData> {
    if (this.coordinateCache) {
      return this.coordinateCache;
    }

    const coordPath = path.join(process.cwd(), 'atlas_coordinates_terrain.json');
    if (!await fs.pathExists(coordPath)) {
      throw new Error(`Coordinate file not found: ${coordPath}`);
    }

    const data = await fs.readJson(coordPath);
    this.coordinateCache = data;
    return data;
  }

  async transform(assets: AssetFile[], context: BuildContext): Promise<ProcessResult> {
    console.log(`[Beta173] Starting transformation with ${assets.length} assets`);

    const processedFiles: string[] = [];
    const skippedFiles: string[] = [];

    try {
      // Process terrain textures into terrain.png grid
      await this.processTerrainGrid(assets, context, processedFiles, skippedFiles);

      // Copy other files directly
      await this.copyOtherFiles(assets, context, processedFiles, skippedFiles);

      return {
        success: true,
        processedFiles,
        skippedFiles,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        processedFiles,
        skippedFiles,
      };
    }
  }

  private async processTerrainGrid(
    assets: AssetFile[],
    context: BuildContext,
    processedFiles: string[],
    skippedFiles: string[]
  ): Promise<void> {
    const blockAssets = assets.filter(asset => asset.type === AssetType.TEXTURE_BLOCKS);
    console.log(`[Beta173] Processing ${blockAssets.length} block textures`);

    if (blockAssets.length === 0) {
      console.log(`[Beta173] No block textures found, skipping terrain.png generation`);
      skippedFiles.push('terrain.png');
      return;
    }

    // Load coordinate mappings
    const coordinates = await this.loadCoordinates();
    console.log(`[Beta173] Loaded ${Object.keys(coordinates.coordinates).length} coordinate mappings`);

    // Create a 256x256 canvas
    const canvas = sharp({
      create: {
        width: 256,
        height: 256,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    const compositeLayers: { input: Buffer; left: number; top: number }[] = [];

    // Load unused texture once
    const unusedPath = path.join(process.cwd(), 'versions/shared/assets/blocks/unused.png');
    const unusedBuffer = await fs.pathExists(unusedPath)
      ? await sharp(unusedPath).resize(16, 16).png().toBuffer()
      : null;

    // Process all coordinates, filling unused slots with magenta texture
    for (const [coordKey, textureName] of Object.entries(coordinates.coordinates)) {
      if (coordKey === 'remaining_tiles') continue; // Skip metadata

      const [xStr, yStr] = coordKey.split(',');
      const gridX = parseInt(xStr);
      const gridY = parseInt(yStr);

      // Skip if coordinates are out of bounds
      if (gridX >= coordinates.cols || gridY >= coordinates.rows) {
        console.warn(`[Beta173] Skipping out-of-bounds coordinate: ${coordKey}`);
        continue;
      }

      let imageBuffer: Buffer | null = null;
      let isUnused = false;

      if (textureName === 'unused') {
        // Use magenta texture for unused slots
        if (unusedBuffer) {
          imageBuffer = unusedBuffer;
          isUnused = true;
        } else {
          // Fallback: create magenta texture on the fly
          imageBuffer = await sharp({
            create: {
              width: 16,
              height: 16,
              channels: 4,
              background: { r: 255, g: 0, b: 255, alpha: 1 }
            }
          }).png().toBuffer();
          isUnused = true;
        }
      } else {
        // Find matching asset
        const matchingAsset = blockAssets.find(asset =>
          this.getTextureNameFromPath(asset.relativePath) === textureName
        );

        if (matchingAsset) {
          try {
            imageBuffer = await sharp(matchingAsset.sourcePath)
              .resize(16, 16)
              .png()
              .toBuffer();
          } catch (error) {
            console.warn(`[Beta173] Warning: Could not process texture ${matchingAsset.relativePath}:`, error);
            skippedFiles.push(matchingAsset.relativePath);
            continue;
          }
        } else {
          console.log(`[Beta173] No asset found for texture: ${textureName} at ${coordKey}`);
          skippedFiles.push(textureName);
          continue;
        }
      }

      if (imageBuffer) {
        const label = isUnused ? 'unused (magenta)' : textureName;
        console.log(`[Beta173] Placing ${label} at grid position (${gridX}, ${gridY})`);

        compositeLayers.push({
          input: imageBuffer,
          left: gridX * coordinates.tile_size,
          top: gridY * coordinates.tile_size,
        });
      }
    }

    if (compositeLayers.length > 0) {
      const terrainPath = path.join(context.outputDir, 'terrain.png');
      await canvas
        .composite(compositeLayers)
        .png()
        .toFile(terrainPath);

      console.log(`[Beta173] Generated terrain.png with ${compositeLayers.length} textures`);
      processedFiles.push('terrain.png');
    } else {
      skippedFiles.push('terrain.png');
    }
  }

  private async copyOtherFiles(
    assets: AssetFile[],
    context: BuildContext,
    processedFiles: string[],
    skippedFiles: string[]
  ): Promise<void> {
    const otherAssets = assets.filter(asset => asset.type !== AssetType.TEXTURE_TERRAIN);

    for (const asset of otherAssets) {
      try {
        const outputPath = path.join(context.outputDir, asset.relativePath);
        await fs.ensureDir(path.dirname(outputPath));
        await fs.copy(asset.sourcePath, outputPath);
        processedFiles.push(asset.relativePath);
        console.log(`[Beta173] Copied ${asset.relativePath}`);
      } catch (error) {
        console.warn(`[Beta173] Warning: Could not copy ${asset.relativePath}:`, error);
        skippedFiles.push(asset.relativePath);
      }
    }
  }

  private getTextureNameFromPath(relativePath: string): string {
    // Extract texture name from relative path
    // Examples: "terrain/dirt.png" -> "dirt", "terrain/oak_log.png" -> "oak_log"
    const filename = path.basename(relativePath, path.extname(relativePath));
    return filename.toLowerCase().replace(/\s+/g, '_');
  }
}