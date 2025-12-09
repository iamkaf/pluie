#!/usr/bin/env node

/**
 * Extract ONLY terrain textures from terrain.png using the provided coordinate file
 * Items should NOT be extracted from terrain.png - they come from items.png
 */

import path from 'path';
import sharp from 'sharp';
import fs from 'fs-extra';

interface TerrainCoordinateData {
  rows: number;
  cols: number;
  tile_size: number;
  coordinates: {
    [key: string]: string; // "x,y": "texture_name"
  };
}

async function extractTerrainOnly(): Promise<void> {
  const terrainPath = 'versions/b1.7.3/terrain_new.png';
  const baseDir = 'versions/shared/assets';

  console.log('🔧 Extracting TERRAIN textures only from terrain.png...');
  console.log(`📁 Source: ${terrainPath}`);

  if (!await fs.pathExists(terrainPath)) {
    console.error('❌ Source file not found');
    process.exit(1);
  }

  // Load terrain coordinate file ONLY
  const terrainCoords = await fs.readJson('atlas_coordinates_terrain.json');

  console.log(`📊 Image: ${terrainCoords.rows}x${terrainCoords.cols} grid, ${terrainCoords.tile_size}px tiles`);
  console.log(`🔍 Terrain coordinates: ${Object.keys(terrainCoords.coordinates).length} mappings`);

  // Load the full image as raw pixels
  const image = sharp(terrainPath);
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const blocksDir = path.join(baseDir, 'blocks');
  await fs.ensureDir(blocksDir);

  let successCount = 0;
  let failCount = 0;

  // Extract ONLY terrain textures
  console.log('\n🔷 Extracting terrain textures...');
  for (const [coordKey, textureName] of Object.entries(terrainCoords.coordinates)) {
    // Skip unused entries
    if (textureName === 'unused' || coordKey === 'remaining_tiles') continue;

    try {
      const [xStr, yStr] = coordKey.split(',');
      const x = parseInt(xStr) * terrainCoords.tile_size;
      const y = parseInt(yStr) * terrainCoords.tile_size;

      // Validate coordinates are within bounds
      if (x + terrainCoords.tile_size > info.width || y + terrainCoords.tile_size > info.height) {
        console.warn(`⚠️  Skipping ${textureName}: coordinates (${x},${y}) exceed image bounds`);
        failCount++;
        continue;
      }

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

      const outputPath = path.join(blocksDir, `${textureName}.png`);
      await fs.writeFile(outputPath, buffer);

      console.log(`✅ ${textureName}.png`);
      successCount++;

    } catch (error) {
      console.warn(`⚠️  Failed to extract ${textureName} from ${coordKey}:`, error instanceof Error ? error.message : error);
      failCount++;
    }
  }

  console.log(`\n🎉 Terrain extraction complete!`);
  console.log(`✅ Successfully extracted: ${successCount} terrain textures`);
  console.log(`⚠️  Failed to extract: ${failCount} textures`);
  console.log(`\n📂 All terrain textures saved to: blocks/`);
}

extractTerrainOnly().catch(error => {
  console.error('❌ Extraction failed:', error);
  process.exit(1);
});