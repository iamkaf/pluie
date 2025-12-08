#!/usr/bin/env node

/**
 * Extract textures from terrain.png using the provided coordinate files
 */

import path from 'path';
import sharp from 'sharp';
import fs from 'fs-extra';

interface CoordinateData {
  rows: number;
  cols: number;
  tile_size: number;
  coordinates: {
    [key: string]: string; // For terrain: "x,y": "texture_name"
  } | {
    [key: string]: [number, number]; // For items: "texture_name": [x, y]
  };
}

async function extractUsingCoordinateFiles(): Promise<void> {
  const terrainPath = 'versions/b1.7.3/terrain_backup_dec_08_2025.png';
  const baseDir = 'versions/shared/assets';

  console.log('🔧 Extracting textures using coordinate files...');
  console.log(`📁 Source: ${terrainPath}`);

  if (!await fs.pathExists(terrainPath)) {
    console.error('❌ Source file not found');
    process.exit(1);
  }

  // Load coordinate files
  const terrainCoords = await fs.readJson('atlas_coordinates_terrain.json');
  const itemsCoords = await fs.readJson('atlas_coordinates_items.json');

  console.log(`📊 Image: 16x16 grid, ${terrainCoords.tile_size}px tiles`);
  console.log(`🔍 Terrain coordinates: ${Object.keys(terrainCoords.coordinates).length} mappings`);
  console.log(`🔍 Items coordinates: ${Object.keys(itemsCoords.coordinates).length} mappings`);

  // Load the full image as raw pixels
  const image = sharp(terrainPath);
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const blocksDir = path.join(baseDir, 'blocks');
  await fs.ensureDir(blocksDir);

  let successCount = 0;
  let failCount = 0;

  // Extract terrain textures
  console.log('\n🔷 Extracting terrain textures...');
  for (const [coordKey, textureName] of Object.entries(terrainCoords.coordinates)) {
    if (coordKey === 'remaining_tiles') continue; // Skip this entry

    try {
      const [xStr, yStr] = coordKey.split(',');
      const x = parseInt(xStr) * terrainCoords.tile_size;
      const y = parseInt(yStr) * terrainCoords.tile_size;

      // Create a new sharp instance for the extracted region
      const extractedImage = sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        }
      }).extract({
        left: x,
        top: y,
        width: terrainCoords.tile_size,
        height: terrainCoords.tile_size,
      });

      const buffer = await extractedImage.png().toBuffer();

      // Clean up texture name - remove suffixes like _top, _side, etc. for basic blocks
      let cleanName = textureName;
      if (cleanName.includes('_top') || cleanName.includes('_side') || cleanName.includes('_front') || cleanName.includes('_off') || cleanName.includes('_on')) {
        // For complex textures, we'll keep the full name for now
        // But you might want to map these to simpler names later
      }

      const outputPath = path.join(blocksDir, `${cleanName}.png`);
      await fs.writeFile(outputPath, buffer);

      console.log(`✅ ${cleanName}.png`);
      successCount++;

    } catch (error) {
      console.warn(`⚠️  Failed to extract ${textureName} from ${coordKey}:`, error instanceof Error ? error.message : error);
      failCount++;
    }
  }

  // Extract items textures (these would typically go in an items.png file, but we'll put them in blocks for now)
  console.log('\n⚔️ Extracting item textures...');
  for (const [textureName, [x, y]] of Object.entries(itemsCoords.coordinates)) {
    try {
      const pixelX = x * terrainCoords.tile_size;
      const pixelY = y * terrainCoords.tile_size;

      // Create a new sharp instance for the extracted region
      const extractedImage = sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        }
      }).extract({
        left: pixelX,
        top: pixelY,
        width: terrainCoords.tile_size,
        height: terrainCoords.tile_size,
      });

      const buffer = await extractedImage.png().toBuffer();

      const outputPath = path.join(blocksDir, `${textureName}.png`);
      await fs.writeFile(outputPath, buffer);

      console.log(`✅ ${textureName}.png (item)`);
      successCount++;

    } catch (error) {
      console.warn(`⚠️  Failed to extract item ${textureName}:`, error instanceof Error ? error.message : error);
      failCount++;
    }
  }

  console.log(`\n🎉 Extraction complete!`);
  console.log(`✅ Successfully extracted: ${successCount} textures`);
  console.log(`⚠️  Failed to extract: ${failCount} textures`);
  console.log(`\n📂 All textures saved to: blocks/`);
}

extractUsingCoordinateFiles().catch(error => {
  console.error('❌ Extraction failed:', error);
  process.exit(1);
});