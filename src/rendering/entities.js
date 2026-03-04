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
        const fur     = isHurt ? "#ff7755" : "#5a2510";
        const belly   = isHurt ? "#ff9977" : "#8a4525";
        const darkFur = isHurt ? "#dd5533" : "#3a1508";
        const hornCol = "#c8b070";
        const tipCol  = "#a09050";
        const eyeCol  = "#ff5500";
        const f       = mob.facing;

        if (!mob.detectedPlayer) {
            // ══════ BIPEDAL — calm, upright walk ══════

            // Two thick legs (drawn behind torso)
            state.ctx.fillStyle = fur;
            state.ctx.fillRect(sx + 7,  sy + 42, 13, 14);
            state.ctx.fillRect(sx + 28, sy + 42, 13, 14);
            state.ctx.fillStyle = darkFur;
            state.ctx.fillRect(sx + 5,  sy + 52, 17, 4);
            state.ctx.fillRect(sx + 26, sy + 52, 17, 4);

            // Upright torso
            state.ctx.fillStyle = fur;
            state.ctx.fillRect(sx + 6, sy + 18, 36, 24);
            state.ctx.fillStyle = belly;
            state.ctx.fillRect(sx + 12, sy + 22, 24, 18);
            state.ctx.fillStyle = "rgba(0,0,0,0.14)";
            state.ctx.fillRect(sx + 6, sy + 27, 36, 3);
            state.ctx.fillRect(sx + 6, sy + 35, 36, 3);

            // Head
            state.ctx.fillStyle = fur;
            state.ctx.fillRect(sx + 7, sy + 2, 34, 18);
            state.ctx.fillStyle = darkFur;
            state.ctx.fillRect(sx + 7, sy + 2, 34, 5);

            // Horns pointing upward
            state.ctx.fillStyle = hornCol;
            state.ctx.fillRect(sx + 10, sy - 6,  6, 10);
            state.ctx.fillRect(sx + 5,  sy - 14, 6, 10);
            state.ctx.fillRect(sx + 32, sy - 6,  6, 10);
            state.ctx.fillRect(sx + 37, sy - 14, 6, 10);
            state.ctx.fillStyle = tipCol;
            state.ctx.fillRect(sx + 4,  sy - 21, 5, 8);
            state.ctx.fillRect(sx + 39, sy - 21, 5, 8);

            // Muzzle (relaxed/closed)
            const muzzBi = f === 1 ? sx + 32 : sx + 2;
            state.ctx.fillStyle = belly;
            state.ctx.fillRect(muzzBi, sy + 9, 14, 11);
            state.ctx.fillStyle = darkFur;
            state.ctx.fillRect(muzzBi + 2, sy + 14, 3, 3);
            state.ctx.fillRect(muzzBi + 9, sy + 14, 3, 3);

            // Eyes — calm, dim glow
            state.ctx.fillStyle = eyeCol;
            state.ctx.fillRect(f === 1 ? sx + 26 : sx + 14, sy + 6, 8, 6);
            state.ctx.fillStyle = "rgba(255,100,0,0.18)";
            state.ctx.fillRect(f === 1 ? sx + 24 : sx + 12, sy + 4, 12, 10);

            // Arms hanging at sides
            state.ctx.fillStyle = fur;
            state.ctx.fillRect(sx - 4,  sy + 18, 12, 20);
            state.ctx.fillRect(sx + 40, sy + 18, 12, 20);
            // Claws pointing down (relaxed)
            state.ctx.fillStyle = darkFur;
            state.ctx.fillRect(sx - 5,  sy + 36, 4, 6);
            state.ctx.fillRect(sx - 1,  sy + 38, 4, 6);
            state.ctx.fillRect(sx + 3,  sy + 36, 4, 6);
            state.ctx.fillRect(sx + 40, sy + 36, 4, 6);
            state.ctx.fillRect(sx + 44, sy + 38, 4, 6);
            state.ctx.fillRect(sx + 48, sy + 36, 4, 6);

        } else {
            // ══════ QUADRUPED — aggro, charging on all fours ══════

            // Back legs (at rear)
            const blX = f === 1 ? sx + 4 : sx + 26;
            state.ctx.fillStyle = fur;
            state.ctx.fillRect(blX,      sy + 40, 11, 16);
            state.ctx.fillRect(blX + 12, sy + 40, 11, 16);
            state.ctx.fillStyle = darkFur;
            state.ctx.fillRect(blX - 2,  sy + 52, 15, 4);
            state.ctx.fillRect(blX + 10, sy + 52, 15, 4);

            // Low horizontal body slab
            state.ctx.fillStyle = fur;
            state.ctx.fillRect(sx + 2, sy + 26, 44, 18);
            state.ctx.fillStyle = belly;
            state.ctx.fillRect(sx + 8, sy + 30, 32, 12);
            state.ctx.fillStyle = darkFur;
            state.ctx.fillRect(sx + 10, sy + 21, 28, 7);  // spine hump
            state.ctx.fillStyle = "rgba(0,0,0,0.18)";
            state.ctx.fillRect(sx + 2, sy + 31, 44, 3);
            state.ctx.fillRect(sx + 2, sy + 39, 44, 3);

            // Front legs (near head)
            const flX = f === 1 ? sx + 28 : sx + 10;
            state.ctx.fillStyle = fur;
            state.ctx.fillRect(flX,      sy + 40, 11, 16);
            state.ctx.fillRect(flX + 12, sy + 40, 11, 16);
            state.ctx.fillStyle = darkFur;
            state.ctx.fillRect(flX - 2,  sy + 52, 15, 4);
            state.ctx.fillRect(flX + 10, sy + 52, 15, 4);
            state.ctx.fillRect(f === 1 ? flX + 22 : flX - 5, sy + 52, 5, 7);  // leading claw

            // Head thrust forward (extends past collision box)
            const hx = f === 1 ? sx + 34 : sx - 14;
            state.ctx.fillStyle = fur;
            state.ctx.fillRect(hx, sy + 16, 28, 22);
            state.ctx.fillStyle = darkFur;
            state.ctx.fillRect(hx, sy + 16, 28, 7);  // low aggressive brow

            // Horns angled forward like a charging bull
            state.ctx.fillStyle = hornCol;
            if (f === 1) {
                state.ctx.fillRect(hx + 2,  sy + 8, 6, 10);
                state.ctx.fillRect(hx + 6,  sy + 2, 8,  8);
                state.ctx.fillRect(hx + 16, sy + 8, 6, 10);
                state.ctx.fillRect(hx + 16, sy + 2, 8,  8);
            } else {
                state.ctx.fillRect(hx + 20, sy + 8, 6, 10);
                state.ctx.fillRect(hx + 14, sy + 2, 8,  8);
                state.ctx.fillRect(hx + 6,  sy + 8, 6, 10);
                state.ctx.fillRect(hx + 4,  sy + 2, 8,  8);
            }
            state.ctx.fillStyle = tipCol;
            if (f === 1) {
                state.ctx.fillRect(hx + 8,  sy - 4, 5, 8);
                state.ctx.fillRect(hx + 18, sy - 4, 5, 8);
            } else {
                state.ctx.fillRect(hx + 15, sy - 4, 5, 8);
                state.ctx.fillRect(hx + 5,  sy - 4, 5, 8);
            }

            // Wide open snarling muzzle
            const muzzQ = f === 1 ? hx + 16 : hx + 2;
            state.ctx.fillStyle = belly;
            state.ctx.fillRect(muzzQ, sy + 24, 14, 14);
            state.ctx.fillStyle = darkFur;
            state.ctx.fillRect(muzzQ + 2, sy + 30, 10, 6);  // open mouth
            state.ctx.fillRect(muzzQ + 2, sy + 25, 3,  3);  // nostril
            state.ctx.fillRect(muzzQ + 9, sy + 25, 3,  3);

            // Eyes — wide furious blaze
            state.ctx.fillStyle = eyeCol;
            if (f === 1) {
                state.ctx.fillRect(hx + 4,  sy + 20, 10, 8);
                state.ctx.fillRect(hx + 16, sy + 20, 8,  8);
            } else {
                state.ctx.fillRect(hx + 14, sy + 20, 10, 8);
                state.ctx.fillRect(hx + 4,  sy + 20, 8,  8);
            }
            state.ctx.fillStyle = "rgba(255,80,0,0.45)";
            state.ctx.fillRect(hx + 2, sy + 16, 24, 16);

            // Fire glow at mouth when ready to spit
            if (mob.shootCooldown <= 0) {
                state.ctx.fillStyle = "rgba(255,120,0,0.35)";
                state.ctx.fillRect(muzzQ - 2, sy + 22, 18, 18);
            }
        }
    }
    else if (mob.type === "companion") {
        // Body — green shirt
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#4a8a5a";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        // Head — skin tone
        state.ctx.fillStyle = isHurt ? "#ffaaaa" : "#c69c6d";
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        // Eyes
        state.ctx.fillStyle = "#ffffff";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 12, sy + 4, 6, 4);
            state.ctx.fillStyle = "#4a3728"; state.ctx.fillRect(sx + 15, sy + 4, 3, 4);
        } else {
            state.ctx.fillRect(sx + 6, sy + 4, 6, 4);
            state.ctx.fillStyle = "#4a3728"; state.ctx.fillRect(sx + 6, sy + 4, 3, 4);
        }
        // Dark hair
        state.ctx.fillStyle = "#2a1808";
        state.ctx.fillRect(sx + 4, sy, 16, 3);
        // Brown pants
        state.ctx.fillStyle = isHurt ? "#cc6644" : "#5a3a1a";
        state.ctx.fillRect(sx + 4, sy + 30, 7, 16); state.ctx.fillRect(sx + 13, sy + 30, 7, 16);
        // Boots
        state.ctx.fillStyle = "#4a3a2a";
        state.ctx.fillRect(sx + 4, sy + 42, 7, 4); state.ctx.fillRect(sx + 13, sy + 42, 7, 4);
        // Arms
        state.ctx.fillStyle = isHurt ? "#ff8888" : "#4a8a5a";
        state.ctx.fillRect(sx - 2, sy + 14, 6, 14); state.ctx.fillRect(sx + 20, sy + 14, 6, 14);
        // Hands
        state.ctx.fillStyle = "#c69c6d";
        state.ctx.fillRect(sx - 2, sy + 26, 6, 4); state.ctx.fillRect(sx + 20, sy + 26, 6, 4);
        // Stone sword in weapon hand
        const swx = mob.facing === 1 ? sx + 22 : sx - 8;
        state.ctx.fillStyle = "#888888";
        state.ctx.fillRect(swx + 1, sy + 8, 3, 18);
        state.ctx.fillStyle = "#5a4a38"; // crossguard
        state.ctx.fillRect(swx - 2, sy + 18, 9, 3);

        // Speech bubble when asking for food
        if (mob.askingForFood) {
            const text = "Can I have some food?";
            state.ctx.save();
            state.ctx.font = "bold 8px monospace";
            const tw = state.ctx.measureText(text).width;
            const bx2 = sx + def.width / 2 - tw / 2 - 5;
            const by2 = sy - 34;
            state.ctx.fillStyle = "rgba(255,255,255,0.93)";
            state.ctx.fillRect(bx2, by2, tw + 10, 16);
            state.ctx.strokeStyle = "#444444";
            state.ctx.lineWidth = 1;
            state.ctx.strokeRect(bx2, by2, tw + 10, 16);
            // Bubble tail
            state.ctx.fillStyle = "rgba(255,255,255,0.93)";
            state.ctx.fillRect(sx + def.width / 2 - 3, by2 + 16, 6, 5);
            state.ctx.fillStyle = "#222222";
            state.ctx.fillText(text, bx2 + 5, by2 + 11);
            state.ctx.restore();
        }
    }

    else if (mob.type === "glitched") {
        // Random glitch offset applied to body parts
        const gx = Math.random() < 0.3 ? Math.floor((Math.random() - 0.5) * 8) : 0;
        const gy = Math.random() < 0.3 ? Math.floor((Math.random() - 0.5) * 4) : 0;

        state.ctx.fillStyle = "#000000";
        // Body
        state.ctx.fillRect(sx + 4 + gx, sy + 14 + gy, 16, 16);
        // Head
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        // Legs
        state.ctx.fillRect(sx + 4, sy + 30, 7, 16); state.ctx.fillRect(sx + 13, sy + 30, 7, 16);
        // Arms
        state.ctx.fillStyle = "#0a0a0a";
        state.ctx.fillRect(sx - 2, sy + 14, 6, 14); state.ctx.fillRect(sx + 20, sy + 14, 6, 14);
        // Glowing purple eyes
        state.ctx.fillStyle = isHurt ? "#ff0000" : "#cc00ff";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 13, sy + 4, 5, 3);
        } else {
            state.ctx.fillRect(sx + 6, sy + 4, 5, 3);
        }
        // Glitch noise strips (random colored horizontal bands)
        if (Math.random() < 0.45) {
            state.ctx.fillStyle = `rgba(${Math.floor(Math.random() * 200)},0,${Math.floor(Math.random() * 255)},0.65)`;
            const stripY = sy + Math.floor(Math.random() * def.height);
            state.ctx.fillRect(sx - 2, stripY, def.width + 4, 1 + Math.floor(Math.random() * 3));
        }
    }

    else if (mob.type === "possum") {
        // A small grey-and-white quadruped opossum facing left or right
        const f = mob.facing;
        const bodyCol  = isHurt ? "#ff9999" : "#b0b0b0"; // grey body
        const bellyCol = isHurt ? "#ffcccc" : "#e8e0d8"; // cream belly
        const noseCol  = "#ff9999";                       // pink nose
        const earCol   = "#cc8899";                       // pink-tinged ears

        // Body
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + 4, sy + 2, 18, 10);
        // Belly stripe
        state.ctx.fillStyle = bellyCol;
        state.ctx.fillRect(sx + 7, sy + 5, 12, 5);

        // Head
        const hx = f === 1 ? sx + 20 : sx;
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(hx, sy, 10, 9);
        // White face mask
        state.ctx.fillStyle = bellyCol;
        state.ctx.fillRect(hx + 1, sy + 1, 8, 7);
        // Nose (pointy pink snout tip)
        state.ctx.fillStyle = noseCol;
        if (f === 1) {
            state.ctx.fillRect(hx + 9, sy + 4, 3, 2);
        } else {
            state.ctx.fillRect(hx - 2, sy + 4, 3, 2);
        }
        // Eyes (tiny dark)
        state.ctx.fillStyle = "#222222";
        if (f === 1) {
            state.ctx.fillRect(hx + 5, sy + 2, 2, 2);
        } else {
            state.ctx.fillRect(hx + 3, sy + 2, 2, 2);
        }
        // Ears (two small upright ears)
        state.ctx.fillStyle = earCol;
        state.ctx.fillRect(hx + 1, sy - 3, 3, 4);
        state.ctx.fillRect(hx + 5, sy - 3, 3, 4);
        state.ctx.fillStyle = "#ffbbcc";
        state.ctx.fillRect(hx + 2, sy - 2, 1, 3);
        state.ctx.fillRect(hx + 6, sy - 2, 1, 3);

        // Four stubby legs
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + 5,  sy + 12, 4, 5);
        state.ctx.fillRect(sx + 11, sy + 12, 4, 5);
        // Tiny feet
        state.ctx.fillStyle = "#888888";
        state.ctx.fillRect(sx + 4,  sy + 15, 5, 2);
        state.ctx.fillRect(sx + 10, sy + 15, 5, 2);

        // Thin curling tail
        state.ctx.fillStyle = "#ccbbaa";
        const tx = f === 1 ? sx : sx + 22;
        state.ctx.fillRect(tx, sy + 6, 3, 2);
        state.ctx.fillRect(tx + (f === 1 ? -2 : 3), sy + 8, 2, 2);
        state.ctx.fillRect(tx + (f === 1 ? -3 : 4), sy + 10, 2, 3);
    }

    else if (mob.type === "possum_protector") {
        // Giant enraged possum — same palette but huge and terrifying
        const f = mob.facing;
        const bodyCol  = isHurt ? "#ff9999" : "#888888"; // darker grey than regular possum
        const bellyCol = isHurt ? "#ffcccc" : "#d4ccc4";
        const noseCol  = "#ff5577";
        const earCol   = "#cc4466";
        const t = performance.now() * 0.004;

        // Body (56×66)
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + 6, sy + 10, 44, 36);
        // Belly
        state.ctx.fillStyle = bellyCol;
        state.ctx.fillRect(sx + 14, sy + 16, 28, 22);
        // Rage markings — jagged dark stripes on back
        state.ctx.fillStyle = "#444444";
        state.ctx.fillRect(sx + 10, sy + 12, 6, 30);
        state.ctx.fillRect(sx + 20, sy + 10, 4, 34);
        state.ctx.fillRect(sx + 35, sy + 12, 6, 30);

        // Head
        const hx2 = f === 1 ? sx + 38 : sx + 0;
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(hx2, sy, 22, 20);
        // White face
        state.ctx.fillStyle = bellyCol;
        state.ctx.fillRect(hx2 + 2, sy + 2, 18, 16);
        // Big angry eyes (red glow)
        state.ctx.fillStyle = "#ff0000";
        if (f === 1) {
            state.ctx.fillRect(hx2 + 4, sy + 4, 5, 5);
            state.ctx.fillRect(hx2 + 12, sy + 4, 5, 5);
        } else {
            state.ctx.fillRect(hx2 + 4, sy + 4, 5, 5);
            state.ctx.fillRect(hx2 + 12, sy + 4, 5, 5);
        }
        state.ctx.fillStyle = "#660000";
        if (f === 1) {
            state.ctx.fillRect(hx2 + 5, sy + 5, 3, 3);
            state.ctx.fillRect(hx2 + 13, sy + 5, 3, 3);
        } else {
            state.ctx.fillRect(hx2 + 5, sy + 5, 3, 3);
            state.ctx.fillRect(hx2 + 13, sy + 5, 3, 3);
        }
        // Big pink nose/snout
        state.ctx.fillStyle = noseCol;
        if (f === 1) state.ctx.fillRect(hx2 + 18, sy + 10, 6, 4);
        else         state.ctx.fillRect(hx2 - 2, sy + 10, 6, 4);
        // Big ears
        state.ctx.fillStyle = earCol;
        state.ctx.fillRect(hx2 + 2, sy - 8, 7, 10);
        state.ctx.fillRect(hx2 + 12, sy - 8, 7, 10);
        state.ctx.fillStyle = "#ffbbcc";
        state.ctx.fillRect(hx2 + 4, sy - 6, 3, 7);
        state.ctx.fillRect(hx2 + 14, sy - 6, 3, 7);
        // Mouth (open snarl)
        state.ctx.fillStyle = "#330000";
        const mouthX = f === 1 ? hx2 + 10 : hx2 + 4;
        state.ctx.fillRect(mouthX, sy + 14, 10, 4);
        // Fangs
        state.ctx.fillStyle = "#ffffff";
        state.ctx.fillRect(mouthX + 1, sy + 14, 2, 5);
        state.ctx.fillRect(mouthX + 5, sy + 14, 2, 5);
        state.ctx.fillRect(mouthX + 7, sy + 14, 2, 5);

        // Four big legs
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + 8,  sy + 46, 10, 16);
        state.ctx.fillRect(sx + 22, sy + 46, 10, 16);
        state.ctx.fillRect(sx + 36, sy + 46, 10, 16);
        // Claws
        state.ctx.fillStyle = "#aaaaaa";
        state.ctx.fillRect(sx + 6,  sy + 60, 14, 4);
        state.ctx.fillRect(sx + 20, sy + 60, 14, 4);
        state.ctx.fillRect(sx + 34, sy + 60, 14, 4);

        // THICK wrapping tail — animated curl
        const tailBaseX = f === 1 ? sx - 4 : sx + def.width + 4;
        state.ctx.fillStyle = "#b8a898";
        // Tail segments that curl around player when wrapping
        if (mob.wrapping) {
            // Animated constricting tail spirals around player area
            const wt = performance.now() * 0.006;
            state.ctx.lineWidth = 10;
            state.ctx.strokeStyle = isHurt ? "#ff9999" : "#b8a898";
            state.ctx.beginPath();
            const px2 = state.player.x + state.player.width / 2 - state.camera.x + state.screenShake.x;
            const py2 = state.player.y + state.player.height / 2 - state.camera.y + state.screenShake.y;
            // Spiral wrap around player
            for (let seg = 0; seg < 3; seg++) {
                const angle = wt + seg * Math.PI * 0.7;
                const radius = 18 + seg * 6;
                const wx = px2 + Math.cos(angle) * radius;
                const wy = py2 + Math.sin(angle) * radius * 0.5;
                if (seg === 0) state.ctx.moveTo(wx, wy);
                else state.ctx.lineTo(wx, wy);
            }
            state.ctx.stroke();
            // Squeeze visual effect on player
            const psx = state.player.x - state.camera.x + state.screenShake.x;
            const psy = state.player.y - state.camera.y + state.screenShake.y;
            state.ctx.fillStyle = "rgba(180, 100, 130, 0.35)";
            state.ctx.fillRect(psx - 4, psy - 4, state.player.width + 8, state.player.height + 8);
            // "SQUEEZED" text pulse
            if (Math.sin(wt * 3) > 0) {
                state.ctx.save();
                state.ctx.font = "bold 10px monospace";
                state.ctx.fillStyle = "#ff44aa";
                state.ctx.fillText("SQUEEZED!", psx - 10, psy - 10);
                state.ctx.restore();
            }
        } else {
            // Resting tail — thick curling shape behind body
            const tx2 = f === 1 ? sx - 2 : sx + 52;
            state.ctx.fillRect(tx2 + (f === 1 ? 0 : -6), sy + 20, 8, 4);
            state.ctx.fillRect(tx2 + (f === 1 ? -4 : -8), sy + 24, 6, 4);
            state.ctx.fillRect(tx2 + (f === 1 ? -8 : -10), sy + 28, 5, 6);
            state.ctx.fillRect(tx2 + (f === 1 ? -10 : -8), sy + 34, 4, 8);
        }

        // Health bar above (because it's a boss-tier mob)
        const hpFrac = mob.health / def.maxHealth;
        state.ctx.fillStyle = "rgba(0,0,0,0.7)";
        state.ctx.fillRect(sx - 4, sy - 14, def.width + 8, 8);
        state.ctx.fillStyle = hpFrac > 0.5 ? "#22cc44" : hpFrac > 0.25 ? "#ffaa00" : "#ee2222";
        state.ctx.fillRect(sx - 2, sy - 12, (def.width + 4) * hpFrac, 4);
    }

    else if (mob.type === "possum_god") {
        // The Possum God — divine massive possum, golden aura, crown, glowing eyes
        const f = mob.facing;
        const t = performance.now() * 0.003;
        const bodyCol = isHurt ? "#ffeeaa" : "#d4af37"; // golden

        // Divine aura (pulsing glow behind body)
        const aura = 0.18 + Math.sin(t * 2) * 0.08;
        state.ctx.fillStyle = `rgba(255, 220, 60, ${aura})`;
        state.ctx.beginPath();
        state.ctx.ellipse(sx + def.width / 2, sy + def.height / 2, def.width * 0.75, def.height * 0.65, 0, 0, Math.PI * 2);
        state.ctx.fill();

        // Body (80×90)
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + 8, sy + 14, 64, 50);
        // Belly — cream/ivory
        state.ctx.fillStyle = isHurt ? "#fff5cc" : "#fffff0";
        state.ctx.fillRect(sx + 20, sy + 20, 40, 34);
        // Divine markings — golden glyphs on body
        state.ctx.fillStyle = "#c8960c";
        state.ctx.fillRect(sx + 14, sy + 16, 4, 44);
        state.ctx.fillRect(sx + 62, sy + 16, 4, 44);
        state.ctx.fillRect(sx + 34, sy + 14, 12, 6);
        state.ctx.fillRect(sx + 34, sy + 52, 12, 6);

        // Head (80×24 wide, 28 tall)
        const hxG = f === 1 ? sx + 52 : sx + 0;
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(hxG, sy - 4, 32, 28);
        // White face
        state.ctx.fillStyle = isHurt ? "#fff5cc" : "#fffff0";
        state.ctx.fillRect(hxG + 3, sy - 1, 26, 22);
        // Glowing divine eyes (bright gold with inner light)
        state.ctx.fillStyle = "#ffee00";
        state.ctx.fillRect(hxG + 5, sy + 3, 8, 8);
        state.ctx.fillRect(hxG + 18, sy + 3, 8, 8);
        state.ctx.fillStyle = "#ffffff";
        state.ctx.fillRect(hxG + 7, sy + 5, 4, 4);
        state.ctx.fillRect(hxG + 20, sy + 5, 4, 4);
        // Glowing pupils
        const pulseEye = Math.sin(t * 4) > 0 ? "#ffdd00" : "#ff8800";
        state.ctx.fillStyle = pulseEye;
        state.ctx.fillRect(hxG + 8, sy + 6, 2, 2);
        state.ctx.fillRect(hxG + 21, sy + 6, 2, 2);
        // Nose
        state.ctx.fillStyle = "#ff9944";
        if (f === 1) state.ctx.fillRect(hxG + 26, sy + 13, 8, 5);
        else         state.ctx.fillRect(hxG - 2, sy + 13, 8, 5);
        // Mouth (serene / divine)
        state.ctx.fillStyle = "#8b6c00";
        const mxG = f === 1 ? hxG + 14 : hxG + 8;
        state.ctx.fillRect(mxG, sy + 19, 10, 3);
        // Big divine ears
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(hxG + 3, sy - 16, 10, 14);
        state.ctx.fillRect(hxG + 18, sy - 16, 10, 14);
        state.ctx.fillStyle = "#ff9944";
        state.ctx.fillRect(hxG + 5, sy - 13, 6, 9);
        state.ctx.fillRect(hxG + 20, sy - 13, 6, 9);

        // CROWN — three golden spikes
        state.ctx.fillStyle = "#ffd700";
        const crownX = hxG + 2;
        const crownY = sy - 18;
        state.ctx.fillRect(crownX, crownY + 6, 28, 6);       // crown band
        state.ctx.fillRect(crownX + 2,  crownY, 6, 10);      // left spike
        state.ctx.fillRect(crownX + 11, crownY - 4, 6, 14);  // center tall spike
        state.ctx.fillRect(crownX + 20, crownY, 6, 10);      // right spike
        // Jewels on crown
        state.ctx.fillStyle = "#ff2244";
        state.ctx.fillRect(crownX + 4,  crownY + 7, 2, 2);
        state.ctx.fillStyle = "#00aaff";
        state.ctx.fillRect(crownX + 13, crownY + 7, 2, 2);
        state.ctx.fillStyle = "#44ff44";
        state.ctx.fillRect(crownX + 22, crownY + 7, 2, 2);

        // Four massive legs
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + 10,  sy + 64, 14, 22);
        state.ctx.fillRect(sx + 30,  sy + 64, 14, 22);
        state.ctx.fillRect(sx + 50,  sy + 64, 14, 22);
        // Claws
        state.ctx.fillStyle = "#c8960c";
        state.ctx.fillRect(sx + 8,   sy + 84, 18, 5);
        state.ctx.fillRect(sx + 28,  sy + 84, 18, 5);
        state.ctx.fillRect(sx + 48,  sy + 84, 18, 5);

        // Long elegant tail — golden with glowing tip
        const tGodBase = f === 1 ? sx - 6 : sx + def.width + 6;
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(tGodBase + (f === 1 ? 0 : -10), sy + 26, 12, 5);
        state.ctx.fillRect(tGodBase + (f === 1 ? -6 : -12), sy + 31, 10, 5);
        state.ctx.fillRect(tGodBase + (f === 1 ? -12 : -14), sy + 36, 8, 6);
        state.ctx.fillRect(tGodBase + (f === 1 ? -16 : -12), sy + 42, 6, 8);
        // Glowing tail tip
        state.ctx.fillStyle = `rgba(255, 230, 80, ${0.7 + Math.sin(t * 3) * 0.3})`;
        state.ctx.fillRect(tGodBase + (f === 1 ? -18 : -10), sy + 46, 8, 8);

        // Health bar (boss-tier)
        const hpFracG = mob.health / def.maxHealth;
        state.ctx.fillStyle = "rgba(0,0,0,0.75)";
        state.ctx.fillRect(sx - 6, sy - 32, def.width + 12, 10);
        state.ctx.fillStyle = hpFracG > 0.5 ? "#ffd700" : hpFracG > 0.25 ? "#ff8800" : "#ee2222";
        state.ctx.fillRect(sx - 4, sy - 30, (def.width + 8) * hpFracG, 6);
        // Name label
        state.ctx.save();
        state.ctx.font = "bold 9px monospace";
        state.ctx.fillStyle = "#ffd700";
        state.ctx.textAlign = "center";
        state.ctx.fillText("THE POSSUM GOD", sx + def.width / 2, sy - 34);
        state.ctx.restore();
    }

    else if (mob.type === "raider") {
        // Body — dark kevlar vest
        state.ctx.fillStyle = isHurt ? "#8899aa" : "#2d3a4a";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        // Head — tanned skin
        state.ctx.fillStyle = isHurt ? "#ffccaa" : "#b8916a";
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        // Balaclava band across mid-face
        state.ctx.fillStyle = isHurt ? "#888888" : "#333333";
        state.ctx.fillRect(sx + 4, sy + 6, 16, 4);
        // Eyes (narrow, menacing)
        state.ctx.fillStyle = "#cc4400";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 14, sy + 4, 3, 2);
        } else {
            state.ctx.fillRect(sx + 7, sy + 4, 3, 2);
        }
        // Legs — dark tactical pants
        state.ctx.fillStyle = isHurt ? "#889977" : "#3a4030";
        state.ctx.fillRect(sx + 4,  sy + 30, 7, 16);
        state.ctx.fillRect(sx + 13, sy + 30, 7, 16);
        // Arms — skin-colored, extended in gun stance
        state.ctx.fillStyle = isHurt ? "#ffccaa" : "#b8916a";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 19, sy + 16, 8, 5);
        } else {
            state.ctx.fillRect(sx - 3, sy + 16, 8, 5);
        }
        // AK-47 barrel
        state.ctx.fillStyle = "#222222";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 22, sy + 14, 10, 3);
            state.ctx.fillRect(sx + 20, sy + 17, 6, 3);
        } else {
            state.ctx.fillRect(sx - 8, sy + 14, 10, 3);
            state.ctx.fillRect(sx - 2, sy + 17, 6, 3);
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
