// ============================================================
// MOBS/SPAWNING.JS - Mob spawning logic
// ============================================================

import { state } from '../state.js';
import { BLOCKS, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, NIGHT_THRESHOLD, TORCH_SPAWN_RADIUS, MOB_DEFS, BIOMES, NETHER_BIOMES, TRADE_SETS, PROFESSION_LIST } from '../constants.js';
import { findSurfaceY, isBlockSolid } from '../world.js';
import { createMob } from './entities.js';

// --- LOCAL MODULE CONSTANTS ---
const MAX_HOSTILE_MOBS = 8;
const MAX_PASSIVE_MOBS = 4;
const MOB_SPAWN_INTERVAL = 3000;

function findSpawnPosition() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const dist = 20 + Math.random() * 20;
    const sx = Math.floor(state.player.x / BLOCK_SIZE + dir * dist);

    if (sx < 2 || sx >= WORLD_WIDTH - 2) return null;

    const surfY = findSurfaceY(sx);
    if (surfY <= 1) return null;

    if (isBlockSolid(sx, surfY - 1) || isBlockSolid(sx, surfY - 2)) return null;

    // Don't spawn near torches (skip in Nether)
    if (!state.inNether) {
        for (let tx = sx - TORCH_SPAWN_RADIUS; tx <= sx + TORCH_SPAWN_RADIUS; tx++) {
            for (let ty = surfY - TORCH_SPAWN_RADIUS; ty <= surfY + TORCH_SPAWN_RADIUS; ty++) {
                if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                    if (state.activeWorld[tx][ty] === BLOCKS.TORCH) {
                        const dx = tx - sx, dy = ty - surfY;
                        if (dx * dx + dy * dy <= TORCH_SPAWN_RADIUS * TORCH_SPAWN_RADIUS) {
                            return null;
                        }
                    }
                }
            }
        }
    }

    return { x: sx * BLOCK_SIZE, y: (surfY - 2) * BLOCK_SIZE };
}

export function spawnMobs(dt, dayBrightness) {
    state.mobSpawnTimer -= dt;
    if (state.mobSpawnTimer > 0) return;
    state.mobSpawnTimer = MOB_SPAWN_INTERVAL;

    let hostileCount = 0, passiveCount = 0;
    for (const m of state.mobs) {
        if (MOB_DEFS[m.type].hostile) hostileCount++;
        else if (m.type !== "villager" && m.type !== "iron_golem" && m.type !== "companion") passiveCount++;
    }

    if (state.inPossum) {
        // Possum realm: only friendly possums spawn, no hostiles
        if (passiveCount < MAX_PASSIVE_MOBS + 4) {
            const pos = findSpawnPosition();
            if (pos) {
                state.mobs.push(createMob("possum", pos.x, pos.y));
                // Possums often spawn in little groups
                if (Math.random() < 0.6 && passiveCount + 1 < MAX_PASSIVE_MOBS + 4) {
                    const offset = (Math.random() - 0.5) * 4 * BLOCK_SIZE;
                    state.mobs.push(createMob("possum", pos.x + offset, pos.y));
                }
            }
        }
        return;
    }

    if (state.inWasteland) {
        if (hostileCount < MAX_HOSTILE_MOBS) {
            const pos = findSpawnPosition();
            if (pos) {
                // Wasteland hostile mobs: mostly raiders with some husks/skeletons
                const types = ["husk", "skeleton", "raider", "raider", "raider", "raider"];
                const type = types[Math.floor(Math.random() * types.length)];
                state.mobs.push(createMob(type, pos.x, pos.y));
                // Husks sometimes spawn in groups of 2
                if (type === "husk" && Math.random() < 0.4 && hostileCount + 1 < MAX_HOSTILE_MOBS) {
                    const offset = (Math.random() - 0.5) * 4 * BLOCK_SIZE;
                    state.mobs.push(createMob("husk", pos.x + offset, pos.y));
                }
                // Raiders spawn in groups of 2-3
                if (type === "raider" && hostileCount + 1 < MAX_HOSTILE_MOBS) {
                    const offset = (Math.random() - 0.5) * 4 * BLOCK_SIZE;
                    state.mobs.push(createMob("raider", pos.x + offset, pos.y));
                    if (Math.random() < 0.4 && hostileCount + 2 < MAX_HOSTILE_MOBS) {
                        const offset2 = (Math.random() - 0.5) * 6 * BLOCK_SIZE;
                        state.mobs.push(createMob("raider", pos.x + offset2, pos.y));
                    }
                }
            }
        }
        return;
    }

    if (state.inNether) {
        if (hostileCount < MAX_HOSTILE_MOBS) {
            const pos = findSpawnPosition();
            if (pos) {
                const spawnBx = Math.floor(pos.x / BLOCK_SIZE);
                const netherBiome = state.netherBiomeMap[spawnBx];
                let type;
                if (netherBiome === NETHER_BIOMES.WARPED) {
                    // Warped biome: mostly endermen with occasional skeletons
                    const types = ["enderman", "enderman", "enderman", "enderman", "skeleton"];
                    type = types[Math.floor(Math.random() * types.length)];
                } else {
                    // Crimson biome: skeletons, pigmen, ghasts — grunture is rare (8% chance)
                    if (Math.random() < 0.04) {
                        type = "grunture";
                    } else {
                        const types = ["skeleton", "pigman", "pigman", "pigman", "ghast", "ghast"];
                        type = types[Math.floor(Math.random() * types.length)];
                    }
                }
                state.mobs.push(createMob(type, pos.x, pos.y));
                // Pigmen spawn in groups of 2-3
                if (type === "pigman") {
                    const groupSize = 1 + Math.floor(Math.random() * 2);
                    for (let g = 0; g < groupSize && hostileCount + g + 1 < MAX_HOSTILE_MOBS; g++) {
                        const offset = (Math.random() - 0.5) * 4 * BLOCK_SIZE;
                        state.mobs.push(createMob("pigman", pos.x + offset, pos.y));
                    }
                }
            }
        }
    } else {
        if (dayBrightness < NIGHT_THRESHOLD && hostileCount < MAX_HOSTILE_MOBS) {
            const pos = findSpawnPosition();
            if (pos) {
                const spawnBx = Math.floor(pos.x / BLOCK_SIZE);
                const isDesert = state.biomeMap[spawnBx] === BIOMES.DESERT;
                let type;
                if (isDesert) {
                    // Desert: husks replace zombies
                    const types = ["husk", "husk", "skeleton", "creeper"];
                    type = types[Math.floor(Math.random() * types.length)];
                } else {
                    const types = ["zombie", "zombie", "skeleton", "creeper", "enderman", "spider"];
                    type = types[Math.floor(Math.random() * types.length)];
                }
                state.mobs.push(createMob(type, pos.x, pos.y));
            }
        }

        if (dayBrightness > 0.5 && passiveCount < MAX_PASSIVE_MOBS) {
            const passiveTypes = ["pig", "pig", "cow", "sheep", "chicken", "chicken", "wolf"];
            const type = passiveTypes[Math.floor(Math.random() * passiveTypes.length)];
            const pos = findSpawnPosition();
            if (pos) {
                state.mobs.push(createMob(type, pos.x, pos.y));
                // Wolves spawn in packs of 2-3
                if (type === "wolf") {
                    const packSize = 1 + Math.floor(Math.random() * 2);
                    for (let g = 0; g < packSize && passiveCount + g + 1 < MAX_PASSIVE_MOBS; g++) {
                        const offset = (Math.random() - 0.5) * 5 * BLOCK_SIZE;
                        state.mobs.push(createMob("wolf", pos.x + offset, pos.y));
                    }
                }
            }
        }
    }
}

export function spawnVillagers() {
    for (const loc of state.villageLocations) {
        const mob = createMob("villager", loc.x, loc.y);
        mob.spawnX = loc.x;
        const profession = PROFESSION_LIST[Math.floor(Math.random() * PROFESSION_LIST.length)];
        mob.profession = profession;
        mob.tradeList = TRADE_SETS[profession];
        state.mobs.push(mob);
    }
    // Spawn one Iron Golem per village to protect villagers
    const seen = new Set();
    for (const loc of state.villageLocations) {
        const key = `${Math.round(loc.x / BLOCK_SIZE / 10)}`;
        if (seen.has(key)) continue; // one golem per village cluster
        seen.add(key);
        const golem = createMob("iron_golem", loc.x, loc.y);
        golem.spawnX = loc.x;
        state.mobs.push(golem);
    }
}
