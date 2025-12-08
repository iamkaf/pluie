#!/usr/bin/env node

/**
 * Extract all textures from terrain.png using a more robust approach
 */

import path from 'path';
import sharp from 'sharp';
import fs from 'fs-extra';

// All standard Beta 1.7.3 textures with their positions
const TEXTURES = [
  // Row 0
  { name: 'grass', x: 0, y: 0 },
  { name: 'stone', x: 16, y: 0 },
  { name: 'dirt', x: 32, y: 0 },
  { name: 'cobblestone', x: 48, y: 0 },
  { name: 'planks', x: 64, y: 0 },
  { name: 'sapling', x: 80, y: 0 },
  { name: 'bedrock', x: 96, y: 0 },
  { name: 'water', x: 112, y: 0 },
  { name: 'waterflowing', x: 128, y: 0 },
  { name: 'lava', x: 144, y: 0 },
  { name: 'lavaflowing', x: 160, y: 0 },
  { name: 'sand', x: 176, y: 0 },
  { name: 'gravel', x: 192, y: 0 },
  { name: 'goldore', x: 208, y: 0 },
  { name: 'ironore', x: 224, y: 0 },
  { name: 'coalore', x: 240, y: 0 },

  // Row 1
  { name: 'log', x: 0, y: 16 },
  { name: 'leaves', x: 16, y: 16 },
  { name: 'grass_carried', x: 32, y: 16 },
  { name: 'grass_top', x: 48, y: 16 },
  { name: 'flowers', x: 64, y: 16 },
  { name: 'roses', x: 80, y: 16 },
  { name: 'mushroom_red', x: 96, y: 16 },
  { name: 'mushroom_brown', x: 112, y: 16 },
  { name: 'goldblock', x: 128, y: 16 },
  { name: 'ironblock', x: 144, y: 16 },
  { name: 'double_slab', x: 160, y: 16 },
  { name: 'slab', x: 176, y: 16 },
  { name: 'brick', x: 192, y: 16 },
  { name: 'tnt', x: 208, y: 16 },
  { name: 'bookshelf', x: 224, y: 16 },
  { name: 'mossy_cobblestone', x: 240, y: 16 },

  // Row 2
  { name: 'obsidian', x: 0, y: 32 },
  { name: 'torch', x: 16, y: 32 },
  { name: 'fire', x: 32, y: 32 },
  { name: 'mob_spawner', x: 48, y: 32 },
  { name: 'oak_stairs', x: 64, y: 32 },
  { name: 'chest', x: 80, y: 32 },
  { name: 'redstone_wire', x: 96, y: 32 },
  { name: 'diamondore', x: 112, y: 32 },
  { name: 'diamondblock', x: 128, y: 32 },
  { name: 'crafting_table', x: 144, y: 32 },
  { name: 'crops', x: 160, y: 32 },
  { name: 'soil', x: 176, y: 32 },
  { name: 'furnace', x: 192, y: 32 },
  { name: 'furnace_lit', x: 208, y: 32 },
  { name: 'sign_post', x: 224, y: 32 },
  { name: 'door_wood_upper', x: 240, y: 32 },

  // Row 3
  { name: 'ladder', x: 0, y: 48 },
  { name: 'rails', x: 16, y: 48 },
  { name: 'cobblestone_stairs', x: 32, y: 48 },
  { name: 'door_wood_lower', x: 48, y: 48 },
  { name: 'iron_door_upper', x: 64, y: 48 },
  { name: 'iron_door_lower', x: 80, y: 48 },
  { name: 'redstone_ore', x: 96, y: 48 },
  { name: 'redstone_ore_lit', x: 112, y: 48 },
  { name: 'stone_stairs', x: 128, y: 48 },
  { name: 'button_stone', x: 144, y: 48 },
  { name: 'snow', x: 160, y: 48 },
  { name: 'ice', x: 176, y: 48 },
  { name: 'snow_block', x: 192, y: 48 },
  { name: 'cactus', x: 208, y: 48 },
  { name: 'clay', x: 224, y: 48 },
  { name: 'reeds', x: 240, y: 48 },

  // Row 4
  { name: 'jukebox', x: 0, y: 64 },
  { name: 'fence', x: 16, y: 64 },
  { name: 'pumpkin', x: 32, y: 64 },
  { name: 'bloodstone', x: 48, y: 64 },
  { name: 'slow_sand', x: 64, y: 64 },
  { name: 'lightstone', x: 80, y: 64 },
  { name: 'portal', x: 96, y: 64 },
  { name: 'jack_o_lantern', x: 112, y: 64 },
  { name: 'cake', x: 128, y: 64 },
];

function getTextureDirectory(textureName: string): string {
  return 'blocks'; // All textures go to blocks
}

async function extractAllTextures(): Promise<void> {
  const terrainPath = 'versions/b1.7.3/terrain_backup_dec_08_2025.png';
  const baseDir = 'versions/shared/assets';

  console.log('🔧 Extracting all textures from terrain.png...');
  console.log(`📁 Source: ${terrainPath}`);

  if (!await fs.pathExists(terrainPath)) {
    console.error('❌ Source file not found');
    process.exit(1);
  }

  // Load the full image as raw pixels
  const image = sharp(terrainPath);
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`📊 Image: ${info.width}x${info.height}px, ${info.channels} channels`);
  console.log(`🔍 Extracting ${TEXTURES.length} textures...`);

  let successCount = 0;
  let failCount = 0;

  for (const texture of TEXTURES) {
    try {
      // Create a new sharp instance for the extracted region
      const extractedImage = sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        }
      }).extract({
        left: texture.x,
        top: texture.y,
        width: 16,
        height: 16,
      });

      const buffer = await extractedImage.png().toBuffer();

      const dir = path.join(baseDir, 'blocks');
      await fs.ensureDir(dir);

      const outputPath = path.join(dir, `${texture.name}.png`);
      await fs.writeFile(outputPath, buffer);

      console.log(`✅ ${texture.name}.png`);
      successCount++;

    } catch (error) {
      console.warn(`⚠️  Failed to extract ${texture.name}:`, error instanceof Error ? error.message : error);
      failCount++;
    }
  }

  console.log(`\n🎉 Extraction complete!`);
  console.log(`✅ Successfully extracted: ${successCount} textures`);
  console.log(`⚠️  Failed to extract: ${failCount} textures`);
  console.log(`\n📂 All textures organized into: blocks/`);
}

extractAllTextures().catch(error => {
  console.error('❌ Extraction failed:', error);
  process.exit(1);
});