# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pluie is a Minecraft texture pack project focused on creating gentle, rain-inspired textures. The current target is Minecraft Beta 1.7.3, with a modular structure designed to support multiple Minecraft versions in the future.

## Essential Commands

### Build Texture Pack
```bash
npm run build:b1.7.3    # Build Beta 1.7.3 texture pack
npm run build          # Build default version (currently b1.7.3)
```

### Texture Editing
```bash
npm run aseprite b1.7.3/terrain.png          # Edit terrain.png in Aseprite
npm run aseprite b1.7.3/items.png            # Edit items.png
npm run aseprite b1.7.3/gui/gui.png          # Edit GUI elements
```

### Setup
```bash
npm install            # Install dependencies
```

## Architecture

### Version-Based Structure
- `b1.7.3/` - Contains all textures for Minecraft Beta 1.7.3
- `scripts/` - Build and development tools
- `output/` - Generated ZIP files (gitignored)

### Texture Pack Organization
Each version directory follows the classic Minecraft texture pack structure:
- `terrain.png` - All block textures (256x256 single file for Beta 1.7.3)
- `items.png` - Item and GUI textures
- `environment/` - Sun, moon, clouds
- `gui/` - Interface elements (inventory, crafting, furnace)
- `misc/` - Particles, color maps
- `pack.txt` - Pack metadata

### Build System
- `scripts/build.js` - Creates distributable ZIP files with maximum compression
- `scripts/aseprite.js` - Launches Aseprite in detached background process
- Uses `archiver` library for ZIP creation
- Outputs to `output/` directory with naming pattern: `Pluie-Texture-Pack-{version}.zip`

### Environment Configuration
- `ASEPRITE_PATH` environment variable required for texture editing
- `.env` file supported via dotenvx
- Aseprite launcher validates executable exists before launching

### Key Technical Details
- Beta 1.7.3 uses legacy texture format with single `terrain.png` containing all blocks
- Scripts are self-contained with comprehensive error handling
- Build system designed for multiple version support (future feature)