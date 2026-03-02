// ============================================================
// RENDERING/ENTITIES.JS - Player and mob rendering
// ============================================================

import { state } from '../state.js';
import { ITEMS, MOB_DEFS } from '../constants.js';
import { getArmorColor } from '../inventory.js';
import { drawItemIcon } from './items.js';

// --- PLAYER ---
export function drawPlayer() {
    const sx = state.player.x - state.camera.x + state.screenShake.x;
    const sy = state.player.y - state.camera.y + state.screenShake.y;

    if (state.player.invincibleTimer > 0 && Math.floor(state.player.invincibleTimer / 80) % 2 === 0) {
        state.ctx.globalAlpha = 0.4;
    }

    // Crouch: squish player vertically from the bottom
    const isCrouching = state.player.crouching;
    const playerBottomY = sy + state.player.height;
    if (isCrouching) {
        state.ctx.save();
        const pcx = sx + state.player.width / 2;
        state.ctx.translate(pcx, playerBottomY);
        state.ctx.scale(1, 0.55);
        state.ctx.translate(-pcx, -playerBottomY);
    }

    // Body
    state.ctx.fillStyle = "#00a8a8";
    state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
    // Head
    state.ctx.fillStyle = "#c69c6d";
    state.ctx.fillRect(sx + 4, sy, 16, 14);
    // Eyes
    state.ctx.fillStyle = "#ffffff";
    if (state.player.facing === 1) {
        state.ctx.fillRect(sx + 12, sy + 4, 6, 4);
        state.ctx.fillStyle = "#4a3728"; state.ctx.fillRect(sx + 15, sy + 4, 3, 4);
    } else {
        state.ctx.fillRect(sx + 6, sy + 4, 6, 4);
        state.ctx.fillStyle = "#4a3728"; state.ctx.fillRect(sx + 6, sy + 4, 3, 4);
    }
    // Hair
    state.ctx.fillStyle = "#4a3728";
    state.ctx.fillRect(sx + 4, sy, 16, 3);
    state.ctx.fillRect(state.player.facing === 1 ? sx + 4 : sx + 16, sy, 4, 8);
    // Legs
    state.ctx.fillStyle = "#3b3b8f";
    state.ctx.fillRect(sx + 4, sy + 30, 7, 16); state.ctx.fillRect(sx + 13, sy + 30, 7, 16);
    // Shoes
    state.ctx.fillStyle = "#5a5a5a";
    state.ctx.fillRect(sx + 4, sy + 42, 7, 4); state.ctx.fillRect(sx + 13, sy + 42, 7, 4);
    // Arms
    state.ctx.fillStyle = "#00a8a8";
    state.ctx.fillRect(sx - 2, sy + 14, 6, 14); state.ctx.fillRect(sx + 20, sy + 14, 6, 14);
    // Hands
    state.ctx.fillStyle = "#c69c6d";
    state.ctx.fillRect(sx - 2, sy + 26, 6, 4); state.ctx.fillRect(sx + 20, sy + 26, 6, 4);

    // Armor overlay
    const helmetColor = getArmorColor("helmet");
    if (helmetColor) {
        state.ctx.fillStyle = helmetColor;
        state.ctx.globalAlpha = Math.max(state.ctx.globalAlpha, 0.4);
        state.ctx.fillRect(sx + 3, sy - 1, 18, 4);
        state.ctx.fillRect(sx + 3, sy + 3, 3, 8);
        state.ctx.fillRect(sx + 18, sy + 3, 3, 8);
        if (state.player.invincibleTimer > 0 && Math.floor(state.player.invincibleTimer / 80) % 2 === 0) state.ctx.globalAlpha = 0.4;
    }
    const chestColor = getArmorColor("chestplate");
    if (chestColor) {
        state.ctx.fillStyle = chestColor;
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        state.ctx.fillRect(sx - 2, sy + 14, 6, 12);
        state.ctx.fillRect(sx + 20, sy + 14, 6, 12);
    }
    const legColor = getArmorColor("leggings");
    if (legColor) {
        state.ctx.fillStyle = legColor;
        state.ctx.fillRect(sx + 4, sy + 30, 7, 12);
        state.ctx.fillRect(sx + 13, sy + 30, 7, 12);
    }
    const bootColor = getArmorColor("boots");
    if (bootColor) {
        state.ctx.fillStyle = bootColor;
        state.ctx.fillRect(sx + 3, sy + 40, 8, 6);
        state.ctx.fillRect(sx + 13, sy + 40, 8, 6);
    }

    // Held item
    const held = state.inventory.slots[state.inventory.selectedSlot];
    if (held.count > 0 && held.itemId !== 0) {
        const hx = state.player.facing === 1 ? sx + 22 : sx - 8;
        drawItemIcon(held.itemId, hx, sy + 16, 14);
    }

    // Restore crouch transform before drawing shield (shield stays at normal scale)
    if (isCrouching) state.ctx.restore();

    // Shield in offhand — drawn on the off-hand side of the player
    const offhand = state.offhand;
    if (offhand && offhand.itemId === ITEMS.SHIELD) {
        const shx = state.player.facing === 1 ? sx - 10 : sx + state.player.width + 2;
        const shBaseY = isCrouching ? playerBottomY - 24 : sy + 16;
        const shH = isCrouching ? 22 : 18;
        // Shield body
        state.ctx.fillStyle = "#7a6040";
        state.ctx.fillRect(shx, shBaseY, 8, shH);
        // Shield rim
        state.ctx.fillStyle = "#5a4020";
        state.ctx.fillRect(shx, shBaseY, 8, 4);
        state.ctx.fillRect(shx, shBaseY + shH - 3, 8, 3);
        // Cross emblem
        state.ctx.fillStyle = "#9a8060";
        state.ctx.fillRect(shx + 3, shBaseY + 2, 2, shH - 4);
        state.ctx.fillRect(shx + 1, shBaseY + shH / 2 - 1, 6, 2);
        // Blocking glow when crouching
        if (isCrouching) {
            state.ctx.fillStyle = "rgba(74, 222, 128, 0.35)";
            state.ctx.fillRect(shx - 2, shBaseY - 2, 12, shH + 4);
        }
    }

    // Burn effect
    if (state.player.burnTimer > 0) {
        state.ctx.fillStyle = "rgba(255, 100, 0, 0.55)";
        state.ctx.fillRect(sx, sy - 6, state.player.width, state.player.height + 6);
        state.ctx.fillStyle = "rgba(255, 220, 0, 0.4)";
        state.ctx.fillRect(sx + 2, sy - 10, state.player.width - 4, 8);
    }

    state.ctx.globalAlpha = 1;
}

// --- MOBS ---
function drawMob(mob) {
    const def = MOB_DEFS[mob.type];
    const sx = mob.x - state.camera.x + state.screenShake.x;
    const sy = mob.y - state.camera.y + state.screenShake.y;
    const isHurt = mob.hurtTimer > 0;

    if (mob.type === "zombie") {
        state.ctx.fillStyle = isHurt ? "#ff6666" : "#5a8a4a";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#6a9a5a";
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        state.ctx.fillStyle = "#ff0000";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 12, sy + 4, 4, 4); state.ctx.fillRect(sx + 18, sy + 4, 0, 0);
        } else {
            state.ctx.fillRect(sx + 8, sy + 4, 4, 4);
        }
        state.ctx.fillStyle = isHurt ? "#cc8866" : "#4a6a3a";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        state.ctx.fillStyle = "#3b3b6f";
        state.ctx.fillRect(sx + 4, sy + 30, 7, 16); state.ctx.fillRect(sx + 13, sy + 30, 7, 16);
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#6a9a5a";
        const armDir = mob.facing === 1 ? 1 : -1;
        state.ctx.fillRect(sx + (armDir === 1 ? 18 : -10), sy + 14, 16, 5);
    }

    else if (mob.type === "skeleton") {
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#d4d4d4";
        state.ctx.fillRect(sx + 6, sy + 14, 10, 16);
        state.ctx.fillRect(sx + 4, sy, 14, 14);
        state.ctx.fillStyle = "#222222";
        state.ctx.fillRect(sx + 6, sy + 4, 4, 4);
        state.ctx.fillRect(sx + 12, sy + 4, 4, 4);
        state.ctx.fillRect(sx + 8, sy + 10, 6, 2);
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#bbbbbb";
        state.ctx.fillRect(sx + 6, sy + 30, 4, 16); state.ctx.fillRect(sx + 12, sy + 30, 4, 16);
        state.ctx.fillStyle = "#8b6c42";
        const bx = mob.facing === 1 ? sx + 18 : sx - 6;
        state.ctx.fillRect(bx, sy + 8, 3, 20);
        state.ctx.fillStyle = "#cccccc";
        state.ctx.fillRect(bx + 1, sy + 8, 1, 20);
    }

    else if (mob.type === "creeper") {
        const fuseFlash = mob.fusing && Math.floor(mob.fuseTimer / 100) % 2 === 0;
        state.ctx.fillStyle = fuseFlash ? "#ffffff" : (isHurt ? "#ff8888" : "#4a8a4a");
        state.ctx.fillRect(sx + 4, sy, 12, 28);
        state.ctx.fillRect(sx + 2, sy + 28, 6, 14);
        state.ctx.fillRect(sx + 12, sy + 28, 6, 14);
        state.ctx.fillStyle = fuseFlash ? "#888888" : "#1a3a1a";
        state.ctx.fillRect(sx + 5, sy + 6, 4, 4);
        state.ctx.fillRect(sx + 11, sy + 6, 4, 4);
        state.ctx.fillRect(sx + 8, sy + 12, 4, 2);
        state.ctx.fillRect(sx + 6, sy + 14, 8, 4);
        state.ctx.fillRect(sx + 8, sy + 18, 4, 2);
    }

    else if (mob.type === "pig") {
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#e8a0a0";
        state.ctx.fillRect(sx + 2, sy, 26, 14);
        const hx = mob.facing === 1 ? sx + 22 : sx - 6;
        state.ctx.fillRect(hx, sy - 2, 12, 12);
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#f0c0c0";
        state.ctx.fillRect(hx + 3, sy + 2, 6, 5);
        state.ctx.fillStyle = "#c08080";
        state.ctx.fillRect(hx + 4, sy + 4, 2, 2);
        state.ctx.fillRect(hx + 6, sy + 4, 2, 2);
        state.ctx.fillStyle = "#333333";
        state.ctx.fillRect(hx + 2, sy, 2, 2);
        state.ctx.fillRect(hx + 8, sy, 2, 2);
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#d08080";
        state.ctx.fillRect(sx + 4, sy + 14, 5, 8);
        state.ctx.fillRect(sx + 21, sy + 14, 5, 8);
    }

    else if (mob.type === "cow") {
        // Body
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#8B6538";
        state.ctx.fillRect(sx + 2, sy, 26, 14);
        // Head
        const hx = mob.facing === 1 ? sx + 22 : sx - 6;
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#6a4a28";
        state.ctx.fillRect(hx, sy - 2, 12, 12);
        // Horns
        state.ctx.fillStyle = "#e8e0d0";
        state.ctx.fillRect(hx + 1, sy - 5, 3, 4);
        state.ctx.fillRect(hx + 8, sy - 5, 3, 4);
        // Eyes
        state.ctx.fillStyle = "#333333";
        state.ctx.fillRect(hx + 2, sy, 2, 2);
        state.ctx.fillRect(hx + 8, sy, 2, 2);
        // Snout
        state.ctx.fillStyle = isHurt ? "#ffcccc" : "#c0a080";
        state.ctx.fillRect(hx + 3, sy + 4, 6, 4);
        // White spots
        state.ctx.fillStyle = "#e8e0d0";
        state.ctx.fillRect(sx + 8, sy + 2, 6, 5);
        state.ctx.fillRect(sx + 18, sy + 6, 5, 4);
        // Legs
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#6a4a28";
        state.ctx.fillRect(sx + 4, sy + 14, 5, 8);
        state.ctx.fillRect(sx + 21, sy + 14, 5, 8);
    }

    else if (mob.type === "sheep") {
        // Fluffy body
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#e8e8e8";
        state.ctx.fillRect(sx + 2, sy, 24, 12);
        // Puff top
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#f4f4f4";
        state.ctx.fillRect(sx + 1, sy - 2, 26, 3);
        state.ctx.fillRect(sx, sy + 1, 28, 4);
        // Head
        const hx = mob.facing === 1 ? sx + 20 : sx - 4;
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#888888";
        state.ctx.fillRect(hx, sy - 1, 10, 10);
        // Eyes
        state.ctx.fillStyle = "#333333";
        state.ctx.fillRect(hx + 2, sy + 1, 2, 2);
        state.ctx.fillRect(hx + 6, sy + 1, 2, 2);
        // Legs
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#777777";
        state.ctx.fillRect(sx + 4, sy + 12, 4, 8);
        state.ctx.fillRect(sx + 20, sy + 12, 4, 8);
    }

    else if (mob.type === "villager") {
        // Robe/body
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#8b5a2b";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 20);
        // Head
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#c69c6d";
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        // Eyes
        state.ctx.fillStyle = "#333333";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 12, sy + 4, 3, 3);
            state.ctx.fillRect(sx + 17, sy + 4, 3, 3);
        } else {
            state.ctx.fillRect(sx + 4, sy + 4, 3, 3);
            state.ctx.fillRect(sx + 9, sy + 4, 3, 3);
        }
        // Nose
        state.ctx.fillStyle = "#b08060";
        state.ctx.fillRect(sx + 10, sy + 7, 4, 4);
        // Hood
        state.ctx.fillStyle = "#6a3a1b";
        state.ctx.fillRect(sx + 4, sy, 16, 3);
        state.ctx.fillRect(sx + 4, sy, 3, 10);
        state.ctx.fillRect(sx + 17, sy, 3, 10);
        // Legs
        state.ctx.fillStyle = "#6a3a1b";
        state.ctx.fillRect(sx + 6, sy + 34, 5, 12);
        state.ctx.fillRect(sx + 13, sy + 34, 5, 12);
        // Shoes
        state.ctx.fillStyle = "#444444";
        state.ctx.fillRect(sx + 6, sy + 42, 5, 4);
        state.ctx.fillRect(sx + 13, sy + 42, 5, 4);
    }

    else if (mob.type === "husk") {
        // Sandy-colored zombie variant
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#c4a060";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#d4b070";
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        state.ctx.fillStyle = "#444444";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 12, sy + 4, 4, 4);
        } else {
            state.ctx.fillRect(sx + 8, sy + 4, 4, 4);
        }
        state.ctx.fillStyle = isHurt ? "#cc8866" : "#b09050";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        state.ctx.fillStyle = "#8a7a5a";
        state.ctx.fillRect(sx + 4, sy + 30, 7, 16); state.ctx.fillRect(sx + 13, sy + 30, 7, 16);
        // Arms reaching out
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#d4b070";
        const armDir = mob.facing === 1 ? 1 : -1;
        state.ctx.fillRect(sx + (armDir === 1 ? 18 : -10), sy + 14, 16, 5);
        // Tattered cloth band
        state.ctx.fillStyle = "#8a7040";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 3);
    }

    else if (mob.type === "enderman") {
        // Tall, thin, black figure
        state.ctx.fillStyle = isHurt ? "#ff6666" : "#0a0a0a";
        // Head
        state.ctx.fillRect(sx + 4, sy, 12, 10);
        // Body (thin)
        state.ctx.fillRect(sx + 6, sy + 10, 8, 22);
        // Long legs
        state.ctx.fillRect(sx + 5, sy + 32, 4, 24);
        state.ctx.fillRect(sx + 11, sy + 32, 4, 24);
        // Long arms
        state.ctx.fillStyle = isHurt ? "#ff4444" : "#1a1a1a";
        state.ctx.fillRect(sx + (mob.facing === 1 ? 14 : -4), sy + 12, 4, 20);
        state.ctx.fillRect(sx + (mob.facing === 1 ? -4 : 14), sy + 14, 4, 18);
        // Purple eyes
        state.ctx.fillStyle = mob.aggroed ? "#ff00ff" : "#aa44ff";
        state.ctx.fillRect(sx + 5, sy + 3, 3, 3);
        state.ctx.fillRect(sx + 12, sy + 3, 3, 3);
        // Particles when teleporting
        if (mob.teleportTimer !== undefined && mob.teleportTimer < 200) {
            state.ctx.fillStyle = "rgba(170, 68, 255, 0.5)";
            for (let p = 0; p < 4; p++) {
                state.ctx.fillRect(sx + Math.random() * 20, sy + Math.random() * 56, 3, 3);
            }
        }
    }

    else if (mob.type === "spider") {
        // Low, wide body - dark brown/black
        state.ctx.fillStyle = isHurt ? "#ff6666" : "#3a2a1a";
        // Body (wide and flat)
        state.ctx.fillRect(sx + 4, sy + 2, 24, 12);
        // Head
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#2a1a0a";
        const hx = mob.facing === 1 ? sx + 24 : sx - 6;
        state.ctx.fillRect(hx, sy + 2, 10, 10);
        // Eyes (red, multiple)
        state.ctx.fillStyle = "#ff0000";
        state.ctx.fillRect(hx + 2, sy + 3, 2, 2);
        state.ctx.fillRect(hx + 6, sy + 3, 2, 2);
        state.ctx.fillRect(hx + 2, sy + 7, 2, 2);
        state.ctx.fillRect(hx + 6, sy + 7, 2, 2);
        // Legs (4 per side)
        state.ctx.fillStyle = isHurt ? "#ff4444" : "#2a1a0a";
        for (let l = 0; l < 4; l++) {
            const lx = sx + 6 + l * 5;
            state.ctx.fillRect(lx, sy + 14, 2, 4);
            state.ctx.fillRect(lx - 2, sy + 16, 2, 2);
        }
    }

    else if (mob.type === "chicken") {
        // Small white body
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#f0f0f0";
        state.ctx.fillRect(sx + 3, sy + 4, 10, 8);
        // Head
        const hx = mob.facing === 1 ? sx + 11 : sx - 3;
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#f5f5f5";
        state.ctx.fillRect(hx, sy + 1, 6, 6);
        // Beak (orange)
        state.ctx.fillStyle = "#e08020";
        state.ctx.fillRect(mob.facing === 1 ? hx + 5 : hx - 2, sy + 3, 3, 2);
        // Eye
        state.ctx.fillStyle = "#000";
        state.ctx.fillRect(mob.facing === 1 ? hx + 3 : hx + 1, sy + 2, 2, 2);
        // Comb (red)
        state.ctx.fillStyle = "#cc2222";
        state.ctx.fillRect(hx + 1, sy - 1, 3, 3);
        // Legs (thin orange)
        state.ctx.fillStyle = "#e08020";
        state.ctx.fillRect(sx + 5, sy + 12, 2, 4);
        state.ctx.fillRect(sx + 9, sy + 12, 2, 4);
        // Tail feathers
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#ddd";
        const tx = mob.facing === 1 ? sx : sx + 12;
        state.ctx.fillRect(tx, sy + 3, 3, 4);
    }

    else if (mob.type === "wolf") {
        const healthPct = mob.health / def.maxHealth;
        const bodyColor = mob.tamed ? "#9a8070" : "#888888";
        const darkColor = mob.tamed ? "#7a6050" : "#606060";
        const bellyColor = mob.tamed ? "#c0b0a8" : "#aaaaaa";

        // Body
        state.ctx.fillStyle = isHurt ? "#ff8888" : bodyColor;
        state.ctx.fillRect(sx + 2, sy + 4, 22, 10);

        // Underbelly (lighter strip)
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : bellyColor;
        state.ctx.fillRect(sx + 6, sy + 7, 12, 7);

        // Head (extends in facing direction)
        const hx = mob.facing === 1 ? sx + 18 : sx - 2;
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : darkColor;
        state.ctx.fillRect(hx, sy, 12, 10);

        // Snout (muzzle - lighter)
        state.ctx.fillStyle = isHurt ? "#ffcccc" : bellyColor;
        state.ctx.fillRect(mob.facing === 1 ? hx + 6 : hx + 1, sy + 5, 5, 4);

        // Nose (black tip)
        state.ctx.fillStyle = "#111111";
        state.ctx.fillRect(mob.facing === 1 ? hx + 10 : hx + 0, sy + 5, 2, 2);

        // Eye
        state.ctx.fillStyle = mob.tamed ? "#d4a800" : "#222222";
        state.ctx.fillRect(mob.facing === 1 ? hx + 2 : hx + 7, sy + 2, 3, 3);

        // Pointy ears on top of head
        state.ctx.fillStyle = isHurt ? "#ff7777" : darkColor;
        state.ctx.fillRect(hx + 1, sy - 4, 3, 5);
        state.ctx.fillRect(hx + 7, sy - 4, 3, 5);

        // 4 legs
        state.ctx.fillStyle = isHurt ? "#ff8888" : darkColor;
        state.ctx.fillRect(sx + 4, sy + 14, 4, 8);
        state.ctx.fillRect(sx + 10, sy + 14, 4, 8);
        state.ctx.fillRect(sx + 16, sy + 14, 4, 8);
        state.ctx.fillRect(sx + 20, sy + 14, 4, 8);

        // Tail (at rear of body)
        const tailX = mob.facing === 1 ? sx + 0 : sx + 24;
        state.ctx.fillStyle = isHurt ? "#ff8888" : bodyColor;
        if (mob.tamed) {
            if (healthPct > 0.5) {
                // Tail up — happy/healthy
                state.ctx.fillRect(tailX, sy + 2, 3, 7);
                state.ctx.fillRect(tailX - 1, sy - 2, 4, 5);
            } else {
                // Tail down — hurt/sad
                state.ctx.fillRect(tailX, sy + 4, 3, 10);
            }
        } else {
            // Wild wolf: neutral tail (slightly raised)
            state.ctx.fillRect(tailX, sy + 2, 3, 7);
        }

        // Red collar for tamed wolf
        if (mob.tamed) {
            state.ctx.fillStyle = "#cc2222";
            state.ctx.fillRect(hx + 1, sy + 7, 9, 3);
        }

        // "z" indicator when sitting
        if (mob.sitting) {
            state.ctx.save();
            state.ctx.fillStyle = "#ffffff";
            state.ctx.font = "bold 9px monospace";
            state.ctx.fillText("z", sx + 13, sy - 6);
            state.ctx.restore();
        }
    }

    else if (mob.type === "pigman") {
        // Humanoid pig — pink skin, pig snout
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#e8a0a0";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16); // body
        state.ctx.fillStyle = isHurt ? "#ffbbbb" : "#f0b8b8";
        state.ctx.fillRect(sx + 4, sy, 16, 14); // head
        // Pig snout
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#d88888";
        state.ctx.fillRect(sx + 7, sy + 7, 10, 6);
        state.ctx.fillStyle = "#9a5555";
        state.ctx.fillRect(sx + 9, sy + 9, 2, 2);
        state.ctx.fillRect(sx + 13, sy + 9, 2, 2);
        // Eyes
        state.ctx.fillStyle = "#333333";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 14, sy + 3, 3, 3);
        } else {
            state.ctx.fillRect(sx + 7, sy + 3, 3, 3);
        }
        // Brown robe (body + lower)
        state.ctx.fillStyle = isHurt ? "#cc9966" : "#7a4a20";
        state.ctx.fillRect(sx + 3, sy + 14, 18, 18); // robe body
        state.ctx.fillRect(sx + 2, sy + 30, 20, 6);  // robe skirt flare
        // Robe trim
        state.ctx.fillStyle = isHurt ? "#bb8855" : "#5a3010";
        state.ctx.fillRect(sx + 3, sy + 14, 18, 3);
        state.ctx.fillRect(sx + 3, sy + 35, 18, 2);
        // Legs peeking below robe
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#c87878";
        state.ctx.fillRect(sx + 5, sy + 37, 5, 9);
        state.ctx.fillRect(sx + 14, sy + 37, 5, 9);
        // Arm with gold sword
        state.ctx.fillStyle = isHurt ? "#cc9966" : "#7a4a20";
        const armDir = mob.facing === 1 ? 1 : -1;
        state.ctx.fillRect(sx + (armDir === 1 ? 18 : -10), sy + 14, 16, 5);
        // Gold sword
        state.ctx.fillStyle = "#ffd700";
        const swx = mob.facing === 1 ? sx + 22 : sx - 8;
        state.ctx.fillRect(swx, sy + 8, 3, 16);
        state.ctx.fillRect(swx - 3, sy + 10, 9, 3);
        // Gold armor overlay if equipped
        if (mob.equipment && mob.equipment.armor) {
            state.ctx.fillStyle = "rgba(255, 215, 0, 0.35)";
            state.ctx.fillRect(sx + 2, sy + 12, def.width - 4, 20);
        }
    }

    else if (mob.type === "iron_golem") {
        // Body — big grey iron block
        state.ctx.fillStyle = isHurt ? "#ff9999" : "#888888";
        state.ctx.fillRect(sx + 4, sy + 16, 24, 26);
        // Head — square, slightly lighter
        state.ctx.fillStyle = isHurt ? "#ffbbbb" : "#aaaaaa";
        state.ctx.fillRect(sx + 6, sy, 20, 16);
        // Eyes
        state.ctx.fillStyle = "#333333";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 18, sy + 4, 4, 4);
            state.ctx.fillRect(sx + 24, sy + 4, 2, 4);
        } else {
            state.ctx.fillRect(sx + 6, sy + 4, 4, 4);
            state.ctx.fillRect(sx + 12, sy + 4, 2, 4);
        }
        // Nose
        state.ctx.fillStyle = "#777777";
        state.ctx.fillRect(sx + 13, sy + 8, 6, 5);
        // Arms — bulky
        state.ctx.fillStyle = isHurt ? "#ff9999" : "#888888";
        state.ctx.fillRect(sx - 2, sy + 14, 8, 20);
        state.ctx.fillRect(sx + 26, sy + 14, 8, 20);
        // Iron knuckles highlight
        state.ctx.fillStyle = "#bbbbbb";
        state.ctx.fillRect(sx - 2, sy + 30, 8, 4);
        state.ctx.fillRect(sx + 26, sy + 30, 8, 4);
        // Legs
        state.ctx.fillStyle = isHurt ? "#ff9999" : "#777777";
        state.ctx.fillRect(sx + 5, sy + 42, 9, 12);
        state.ctx.fillRect(sx + 18, sy + 42, 9, 12);
        // Iron plate lines
        state.ctx.fillStyle = "rgba(50,50,50,0.3)";
        state.ctx.fillRect(sx + 4, sy + 24, 24, 2);
        state.ctx.fillRect(sx + 4, sy + 34, 24, 2);
    }

    else if (mob.type === "ghast") {
        // Big white square body with sad face
        state.ctx.fillStyle = isHurt ? "#ff9999" : "#f0f0f0";
        state.ctx.fillRect(sx, sy, def.width, def.height);
        state.ctx.fillStyle = isHurt ? "#ffbbbb" : "#ffffff";
        state.ctx.fillRect(sx + 2, sy + 2, def.width - 4, def.height - 4);
        // Eyes (sad/closed)
        state.ctx.fillStyle = "#333333";
        state.ctx.fillRect(sx + 12, sy + 16, 8, 6);
        state.ctx.fillRect(sx + 36, sy + 16, 8, 6);
        // Sad mouth
        state.ctx.fillStyle = "#333333";
        state.ctx.fillRect(sx + 18, sy + 30, 20, 3);
        state.ctx.fillRect(sx + 15, sy + 27, 3, 6);
        state.ctx.fillRect(sx + 38, sy + 27, 3, 6);
        // Tentacles hanging below
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#e0e0e0";
        const tentacleOffsets = [4, 10, 18, 26, 34, 42, 50];
        for (let t = 0; t < tentacleOffsets.length; t++) {
            const tx = sx + tentacleOffsets[t];
            const tentH = 12 + (t % 3) * 6;
            state.ctx.fillRect(tx, sy + def.height, 4, tentH);
        }
        // Glow effect
        state.ctx.fillStyle = "rgba(255, 100, 100, 0.15)";
        state.ctx.fillRect(sx - 4, sy - 4, def.width + 8, def.height + 8);
    }

    else if (mob.type === "grunture") {
        const fur      = isHurt ? "#ff7755" : "#5a2510";
        const belly    = isHurt ? "#ff9977" : "#8a4525";
        const darkFur  = isHurt ? "#dd5533" : "#3a1508";
        const hornCol  = "#c8b070";
        const eyeCol   = "#ff5500";

        // Main body (massive torso)
        state.ctx.fillStyle = fur;
        state.ctx.fillRect(sx + 4, sy + 18, 40, 30);

        // Lighter belly stripe
        state.ctx.fillStyle = belly;
        state.ctx.fillRect(sx + 12, sy + 22, 24, 22);

        // Fur texture — dark horizontal stripe lines
        state.ctx.fillStyle = "rgba(0,0,0,0.18)";
        state.ctx.fillRect(sx + 4, sy + 24, 40, 3);
        state.ctx.fillRect(sx + 4, sy + 32, 40, 3);
        state.ctx.fillRect(sx + 4, sy + 40, 40, 3);

        // Head (large, boxy)
        state.ctx.fillStyle = fur;
        state.ctx.fillRect(sx + 6, sy + 2, 36, 20);

        // Brow ridge (darker)
        state.ctx.fillStyle = darkFur;
        state.ctx.fillRect(sx + 6, sy + 2, 36, 5);

        // Horns — large curved pair (bone/ivory)
        state.ctx.fillStyle = hornCol;
        // Left horn: base rises then curves outward
        state.ctx.fillRect(sx + 9,  sy - 8,  7, 12);
        state.ctx.fillRect(sx + 3,  sy - 14, 7, 8);
        state.ctx.fillRect(sx + 1,  sy - 18, 5, 6);
        // Right horn
        state.ctx.fillRect(sx + 32, sy - 8,  7, 12);
        state.ctx.fillRect(sx + 38, sy - 14, 7, 8);
        state.ctx.fillRect(sx + 42, sy - 18, 5, 6);
        // Horn tips (darker)
        state.ctx.fillStyle = "#a09050";
        state.ctx.fillRect(sx + 1,  sy - 22, 4, 5);
        state.ctx.fillRect(sx + 43, sy - 22, 4, 5);

        // Muzzle / snout (wide jaw, faces direction player is)
        const muzzX = mob.facing === 1 ? sx + 32 : sx + 2;
        state.ctx.fillStyle = belly;
        state.ctx.fillRect(muzzX, sy + 10, 16, 13);
        // Nostrils
        state.ctx.fillStyle = darkFur;
        state.ctx.fillRect(muzzX + 2,  sy + 15, 4, 4);
        state.ctx.fillRect(muzzX + 10, sy + 15, 4, 4);

        // Eyes — glowing orange-red
        state.ctx.fillStyle = eyeCol;
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 28, sy + 6, 9, 7);
            state.ctx.fillRect(sx + 18, sy + 6, 7, 7);
        } else {
            state.ctx.fillRect(sx + 11, sy + 6, 9, 7);
            state.ctx.fillRect(sx + 23, sy + 6, 7, 7);
        }
        // Eye glow halo
        state.ctx.fillStyle = "rgba(255,100,0,0.35)";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 26, sy + 4, 13, 11);
        } else {
            state.ctx.fillRect(sx + 9,  sy + 4, 13, 11);
        }

        // Thick arms with claws
        state.ctx.fillStyle = fur;
        state.ctx.fillRect(sx - 6, sy + 18, 14, 22);   // left arm
        state.ctx.fillRect(sx + 40, sy + 18, 14, 22);  // right arm
        // Claws — 3 per hand (dark)
        state.ctx.fillStyle = darkFur;
        state.ctx.fillRect(sx - 7,  sy + 38, 5, 6);
        state.ctx.fillRect(sx - 2,  sy + 40, 5, 6);
        state.ctx.fillRect(sx + 3,  sy + 38, 5, 6);
        state.ctx.fillRect(sx + 40, sy + 38, 5, 6);
        state.ctx.fillRect(sx + 45, sy + 40, 5, 6);
        state.ctx.fillRect(sx + 50, sy + 38, 5, 6);

        // Thick legs
        state.ctx.fillStyle = fur;
        state.ctx.fillRect(sx + 6,  sy + 46, 14, 10);
        state.ctx.fillRect(sx + 28, sy + 46, 14, 10);
        // Feet (dark hooves)
        state.ctx.fillStyle = darkFur;
        state.ctx.fillRect(sx + 4,  sy + 52, 18, 4);
        state.ctx.fillRect(sx + 26, sy + 52, 18, 4);

        // Fire glow around mouth when shoot is ready
        if (mob.shootCooldown <= 0) {
            state.ctx.fillStyle = "rgba(255,80,0,0.25)";
            state.ctx.fillRect(muzzX - 2, sy + 8, 20, 17);
        }
    }

    // Mob equipment overlay (non-pigman)
    if (mob.equipment && mob.type !== "pigman") {
        if (mob.equipment.armor) {
            state.ctx.fillStyle = "rgba(180, 180, 200, 0.3)";
            state.ctx.fillRect(sx + 2, sy + 12, def.width - 4, 20);
        }
        if (mob.equipment.weapon) {
            state.ctx.fillStyle = "#d4d4d4";
            const wx = mob.facing === 1 ? sx + def.width : sx - 6;
            state.ctx.fillRect(wx, sy + 10, 4, 14);
        }
    }

    // Fire effect when burning
    if (mob.burnTimer > 0 && def.hostile && mob.type !== "creeper") {
        state.ctx.fillStyle = "rgba(255, 136, 0, 0.6)";
        state.ctx.fillRect(sx + 2, sy - 4, def.width - 4, 8);
        state.ctx.fillStyle = "rgba(255, 204, 0, 0.5)";
        state.ctx.fillRect(sx + 4, sy - 8, def.width - 8, 6);
        state.ctx.fillStyle = "rgba(255, 68, 0, 0.4)";
        state.ctx.fillRect(sx, sy + 2, def.width, 6);
    }

    // Health bar above mob (only when damaged)
    if (mob.health < def.maxHealth) {
        const barW = def.width + 8;
        const bx = sx - 4;
        const by = sy - 10;
        state.ctx.fillStyle = "rgba(0,0,0,0.6)";
        state.ctx.fillRect(bx, by, barW, 5);
        const pct = mob.health / def.maxHealth;
        state.ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#ef4444";
        state.ctx.fillRect(bx, by, barW * pct, 5);
    }
}

export function drawAllMobs() {
    for (const mob of state.mobs) drawMob(mob);
}
