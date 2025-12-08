![Pluie Texture Pack](versions/shared/pack.png)

# Pluie Texture Pack

A gentle, rain-inspired texture pack for Minecraft with a modern CLI toolchain for efficient development.

## Current Version

**Beta 1.7.3** - Complete texture pack with soft, clean aesthetics.

## Quick Start

```bash
# Install dependencies
npm install

# Build texture pack
npm run build
```

Outputs to `output/Pluie-b1.7.3.zip`

## CLI Commands

Pluie includes a comprehensive CLI for texture pack management:

```bash
# Build texture packs
npm run build                        # Build default version (b1.7.3)
npm run build all                   # Build all versions
npm run build --help                # See all build options

# Hot reload development
npm run watch                       # Start hot reload for default version
npm run watch b1.7.3               # Watch specific version
npm run watch all                  # Watch all versions

# Texture editing
npm run edit b1.7.3/terrain.png    # Edit terrain.png in Aseprite
npm run aseprite b1.7.3/items.png  # Alternative command name

# Deployment
npm run deploy                      # Deploy to Minecraft
npm run deploy all                 # Deploy all versions

# Management
npm run list                        # List available versions
npm run status                      # Show system status
npm run typecheck                   # Run TypeScript type checking
```

### Hot Reload Development

The watch command provides instant feedback during texture editing:

```bash
npm run watch
```

- Automatically builds and deploys when texture files change
- Works with shared assets (affects all versions)
- 500ms debouncing to prevent excessive builds
- Supports F3+T texture reloading in Minecraft

## Project Structure

- `versions/` - Multi-version texture pack structure
  - `b1.7.3/` - Beta 1.7.3 textures
  - `shared/` - Shared assets used across versions
- `src/` - CLI toolchain and core functionality
  - `commands/` - Individual CLI command implementations
  - `build.ts` - Core build logic
  - `watch.ts` - Hot reload system
  - `deploy.ts` - Deployment functionality
- `output/` - Generated texture pack ZIP files
- `backups/` - Automatic deployment backups

## Requirements

- **Node.js** - For CLI tools and build system
- **Aseprite** - For texture editing (with ASEPRITE_PATH environment variable)
- **TypeScript** - Development (included in dev dependencies)

## Configuration

- `.deployrc` - Deployment configuration
- `.hotreloadrc` - Hot reload settings
- `.env` - Environment variables (ASEPRITE_PATH)

## Environment Setup

Create a `.env` file with your Aseprite path:

```
ASEPRITE_PATH=/path/to/your/aseprite
```

Or set it in your shell:

```bash
export ASEPRITE_PATH=/path/to/your/aseprite
```