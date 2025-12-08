import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import { AssetFile, BuildContext, ProcessResult, VersionTransformer, AssetType } from '../types.js';

interface TerrainGridPosition {
  textureName: string;
  gridX: number;
  gridY: number;
}

// Beta 1.7.3 terrain.png grid positions (16x16 grid = 256x256 pixels)
const TERRAIN_GRID_POSITIONS: TerrainGridPosition[] = [
  // Row 0
  { textureName: 'grass', gridX: 0, gridY: 0 },
  { textureName: 'stone', gridX: 1, gridY: 0 },
  { textureName: 'dirt', gridX: 2, gridY: 0 },
  { textureName: 'cobblestone', gridX: 3, gridY: 0 },
  { textureName: 'planks', gridX: 4, gridY: 0 },
  { textureName: 'sapling', gridX: 5, gridY: 0 },
  { textureName: 'bedrock', gridX: 6, gridY: 0 },
  { textureName: 'water', gridX: 7, gridY: 0 },
  { textureName: 'waterflowing', gridX: 8, gridY: 0 },
  { textureName: 'lava', gridX: 9, gridY: 0 },
  { textureName: 'lavaflowing', gridX: 10, gridY: 0 },
  { textureName: 'sand', gridX: 11, gridY: 0 },
  { textureName: 'gravel', gridX: 12, gridY: 0 },
  { textureName: 'goldore', gridX: 13, gridY: 0 },
  { textureName: 'ironore', gridX: 14, gridY: 0 },
  { textureName: 'coalore', gridX: 15, gridY: 0 },

  // Row 1
  { textureName: 'log', gridX: 0, gridY: 1 },
  { textureName: 'leaves', gridX: 1, gridY: 1 },
  { textureName: 'grass_carried', gridX: 2, gridY: 1 },
  { textureName: 'grass_top', gridX: 3, gridY: 1 },
  { textureName: 'flowers', gridX: 4, gridY: 1 },
  { textureName: 'roses', gridX: 5, gridY: 1 },
  { textureName: 'mushroom_red', gridX: 6, gridY: 1 },
  { textureName: 'mushroom_brown', gridX: 7, gridY: 1 },
  { textureName: 'goldblock', gridX: 8, gridY: 1 },
  { textureName: 'ironblock', gridX: 9, gridY: 1 },
  { textureName: 'double_slab', gridX: 10, gridY: 1 },
  { textureName: 'slab', gridX: 11, gridY: 1 },
  { textureName: 'brick', gridX: 12, gridY: 1 },
  { textureName: 'tnt', gridX: 13, gridY: 1 },
  { textureName: 'bookshelf', gridX: 14, gridY: 1 },
  { textureName: 'mossy_cobblestone', gridX: 15, gridY: 1 },

  // Row 2
  { textureName: 'obsidian', gridX: 0, gridY: 2 },
  { textureName: 'torch', gridX: 1, gridY: 2 },
  { textureName: 'fire', gridX: 2, gridY: 2 },
  { textureName: 'mob_spawner', gridX: 3, gridY: 2 },
  { textureName: 'oak_stairs', gridX: 4, gridY: 2 },
  { textureName: 'chest', gridX: 5, gridY: 2 },
  { textureName: 'redstone_wire', gridX: 6, gridY: 2 },
  { textureName: 'diamondore', gridX: 7, gridY: 2 },
  { textureName: 'diamondblock', gridX: 8, gridY: 2 },
  { textureName: 'crafting_table', gridX: 9, gridY: 2 },
  { textureName: 'crops', gridX: 10, gridY: 2 },
  { textureName: 'soil', gridX: 11, gridY: 2 },
  { textureName: 'furnace', gridX: 12, gridY: 2 },
  { textureName: 'furnace_lit', gridX: 13, gridY: 2 },
  { textureName: 'sign_post', gridX: 14, gridY: 2 },
  { textureName: 'door_wood_upper', gridX: 15, gridY: 2 },

  // Row 3
  { textureName: 'ladder', gridX: 0, gridY: 3 },
  { textureName: 'rails', gridX: 1, gridY: 3 },
  { textureName: 'cobblestone_stairs', gridX: 2, gridY: 3 },
  { textureName: 'door_wood_lower', gridX: 3, gridY: 3 },
  { textureName: 'iron_door_upper', gridX: 4, gridY: 3 },
  { textureName: 'iron_door_lower', gridX: 5, gridY: 3 },
  { textureName: 'redstone_ore', gridX: 6, gridY: 3 },
  { textureName: 'redstone_ore_lit', gridX: 7, gridY: 3 },
  { textureName: 'stone_stairs', gridX: 8, gridY: 3 },
  { textureName: 'button_stone', gridX: 9, gridY: 3 },
  { textureName: 'snow', gridX: 10, gridY: 3 },
  { textureName: 'ice', gridX: 11, gridY: 3 },
  { textureName: 'snow_block', gridX: 12, gridY: 3 },
  { textureName: 'cactus', gridX: 13, gridY: 3 },
  { textureName: 'clay', gridX: 14, gridY: 3 },
  { textureName: 'reeds', gridX: 15, gridY: 3 },

  // Row 4
  { textureName: 'jukebox', gridX: 0, gridY: 4 },
  { textureName: 'fence', gridX: 1, gridY: 4 },
  { textureName: 'pumpkin', gridX: 2, gridY: 4 },
  { textureName: 'bloodstone', gridX: 3, gridY: 4 },
  { textureName: 'slow_sand', gridX: 4, gridY: 4 },
  { textureName: 'lightstone', gridX: 5, gridY: 4 },
  { textureName: 'portal', gridX: 6, gridY: 4 },
  { textureName: 'jack_o_lantern', gridX: 7, gridY: 4 },
  { textureName: 'cake', gridX: 8, gridY: 4 },
];

export class Beta173Transformer implements VersionTransformer {
  public version = 'b1.7.3';
  public name = 'Beta 1.7.3 Legacy Format Transformer';

  getRequiredAssetTypes(): AssetType[] {
    return [AssetType.TEXTURE_BLOCKS, AssetType.METADATA_PACK];
  }

  isApplicable(version: string): boolean {
    return version === 'b1.7.3' || version === 'beta1.7.3';
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

    for (const blockAsset of blockAssets) {
      const textureName = this.getTextureNameFromPath(blockAsset.relativePath);
      const position = TERRAIN_GRID_POSITIONS.find(pos =>
        pos.textureName === textureName ||
        blockAsset.relativePath.includes(pos.textureName)
      );

      if (position) {
        console.log(`[Beta173] Placing ${textureName} at grid position (${position.gridX}, ${position.gridY})`);

        try {
          // Load and resize texture to 16x16 if needed
          const imageBuffer = await fs.readFile(blockAsset.sourcePath);
          const resizedImage = await sharp(imageBuffer)
            .resize(16, 16)
            .png()
            .toBuffer();

          compositeLayers.push({
            input: resizedImage,
            left: position.gridX * 16,
            top: position.gridY * 16,
          });
        } catch (error) {
          console.warn(`[Beta173] Warning: Could not process texture ${blockAsset.relativePath}:`, error);
          skippedFiles.push(blockAsset.relativePath);
        }
      } else {
        console.log(`[Beta173] No grid position found for texture: ${textureName}`);
        skippedFiles.push(blockAsset.relativePath);
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