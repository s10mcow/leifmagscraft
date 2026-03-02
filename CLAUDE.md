# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Vite, localhost:5173)
npm run build    # Build to dist/
npm run preview  # Preview production build
```

No test suite exists. Verify changes manually in the browser.

## Architecture

A 2D Minecraft clone built with vanilla JS (ES modules) and HTML5 Canvas. No frameworks — rendering, physics, audio, and UI are all custom.

**Entry point:** `index.html` → `src/main.js` → wires up all modules

**Module layout:**

| File | Responsibility |
|---|---|
| `src/constants.js` | All block/item definitions, crafting recipes, game constants |
| `src/state.js` | Single shared state object — avoids circular imports |
| `src/game.js` | Main game loop, mining, placing, interactions, save/load |
| `src/player.js` | Physics, movement, collision, combat |
| `src/world.js` | Procedural world generation, biomes, terrain |
| `src/mobs.js` | Mob AI, spawning, projectiles, particles |
| `src/inventory.js` | Inventory management, crafting logic |
| `src/rendering.js` | Canvas drawing for blocks and entities |
| `src/ui.js` | HUD, menus, overlays |
| `src/input.js` | Keyboard and mouse handling |
| `src/audio.js` | Procedurally generated sounds via Web Audio API |

**State management:** `state.js` exports a single `state` object imported by all modules. This is the intentional solution to circular dependency issues — always use it for shared game data rather than module-level variables.

**Circular dependency injection:** Some cross-module function calls that would create import cycles are injected at startup in `main.js` via setter functions (e.g., `setToggleDoor`, `setTeleportToOtherDimension`).

**Rendering:** 60 FPS game loop via `requestAnimationFrame`. Canvas is 1280×800px with 32×32px blocks. No WebGL — pure 2D Canvas API with pixelated rendering.

**Save system:** RLE-compressed world data stored in `localStorage`. Supports multiple save slots.

**Audio:** Entirely procedural — Web Audio API oscillators only, no audio files loaded.

**Deployment:** Vercel. Config in `vercel.json` (build: `npm run build`, output: `dist/`).
