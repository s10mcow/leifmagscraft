// ============================================================
// RENDERING/ENTITIES.JS - Player and mob rendering
// ============================================================

import { state } from '../state.js';
import { ITEMS, ITEM_INFO, MOB_DEFS } from '../constants.js';
import { getArmorColor } from '../inventory.js';
import { drawItemIcon } from './items.js';

function isWearingFullPosseArmor() {
    const a = state.inventory.armor;
    return a.helmet.itemId && ITEM_INFO[a.helmet.itemId]?.posseArmor &&
           a.chestplate.itemId && ITEM_INFO[a.chestplate.itemId]?.posseArmor &&
           a.leggings.itemId && ITEM_INFO[a.leggings.itemId]?.posseArmor;
}

// --- PLAYER ---
export function drawPlayer() {
    const sx = state.player.x - state.camera.x + state.screenShake.x;
    // Always anchor art to feet so crouch hitbox change doesn't shift the sprite
    const DRAW_HEIGHT = 46;
    const feetScreenY = state.player.y + state.player.height - state.camera.y + state.screenShake.y;
    const sy = feetScreenY - DRAW_HEIGHT;
    const playerBottomY = feetScreenY;

    if (state.player.invincibleTimer > 0 && Math.floor(state.player.invincibleTimer / 80) % 2 === 0) {
        state.ctx.globalAlpha = 0.4;
    }

    // Squished by Blocky — super flat and tiny
    if (state.player.squishTimer > 0) {
        state.ctx.save();
        const pcx = sx + state.player.width / 2;
        state.ctx.translate(pcx, playerBottomY);
        state.ctx.scale(1.8, 0.15);
        state.ctx.translate(-pcx, -playerBottomY);
    }

    // Full Posse armor — draw player as Possum King (player-sized)
    if (isWearingFullPosseArmor()) {
        drawPosseSkin(sx, sy);
        if (state.player.squishTimer > 0) state.ctx.restore();
        state.ctx.globalAlpha = 1;
        return;
    }

    // Crouch: squish player vertically from the bottom
    const isCrouching = state.player.crouching;
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

    // Shield in offhand or hotbar — drawn on the off-hand side of the player
    const offhand = state.offhand;
    const hasHotbarShield = !offhand?.itemId && state.inventory.slots.some(s => s.itemId === ITEMS.SHIELD);
    if ((offhand && offhand.itemId === ITEMS.SHIELD) || hasHotbarShield) {
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
    // Stun effect — stars around head
    if (state.player.stunTimer > 0) {
        const t = performance.now() * 0.004;
        for (let i = 0; i < 4; i++) {
            const angle = t + i * Math.PI / 2;
            const starX = sx + state.player.width / 2 + Math.cos(angle) * 14;
            const starY = sy - 6 + Math.sin(angle) * 6;
            state.ctx.fillStyle = "#ffff00";
            state.ctx.fillRect(starX - 2, starY - 2, 4, 4);
        }
    }

    if (state.player.burnTimer > 0) {
        state.ctx.fillStyle = "rgba(255, 100, 0, 0.55)";
        state.ctx.fillRect(sx, sy - 6, state.player.width, state.player.height + 6);
        state.ctx.fillStyle = "rgba(255, 220, 0, 0.4)";
        state.ctx.fillRect(sx + 2, sy - 10, state.player.width - 4, 8);
    }

    if (state.player.squishTimer > 0) state.ctx.restore();
    state.ctx.globalAlpha = 1;
}

function drawPosseSkin(sx, sy) {
    const f = state.player.facing;
    const t = performance.now() * 0.002;
    const pw = state.player.width; // 24
    const ph = 46; // draw height

    // Scale possum king art (60x72) to fit player size (24x46)
    const scaleX = pw / 60;
    const scaleY = ph / 72;

    state.ctx.save();
    state.ctx.translate(sx, sy);
    state.ctx.scale(scaleX, scaleY);

    // Cape
    const capeWave = Math.sin(t * 2) * 4;
    state.ctx.fillStyle = "#cc2266";
    const capeX = f === 1 ? -6 : 60 - 10;
    state.ctx.fillRect(capeX, 14, 16, 40 + capeWave);
    state.ctx.fillStyle = "#dd4488";
    state.ctx.fillRect(capeX + 2, 16, 12, 36 + capeWave);
    state.ctx.fillStyle = "#ffd700";
    state.ctx.fillRect(capeX, 14, 16, 3);

    // Legs
    state.ctx.fillStyle = "#c8b8a8";
    state.ctx.fillRect(12, 52, 14, 20);
    state.ctx.fillRect(34, 52, 14, 20);
    state.ctx.fillStyle = "#b0a090";
    state.ctx.fillRect(10, 68, 18, 4);
    state.ctx.fillRect(32, 68, 18, 4);

    // Body
    state.ctx.fillStyle = "#d0c8c0";
    state.ctx.fillRect(6, 18, 48, 36);
    state.ctx.fillStyle = "#f0ece8";
    state.ctx.fillRect(14, 24, 32, 26);
    state.ctx.fillStyle = "rgba(255, 150, 180, 0.3)";
    state.ctx.fillRect(16, 38, 8, 6);
    state.ctx.fillRect(36, 38, 8, 6);

    // Arms
    state.ctx.fillStyle = "#d0c8c0";
    state.ctx.fillRect(0, 22, 10, 18);
    state.ctx.fillRect(50, 22, 10, 18);
    state.ctx.fillStyle = "#b0a090";
    state.ctx.fillRect(-2, 36, 10, 6);
    state.ctx.fillRect(52, 36, 10, 6);

    // Head
    state.ctx.fillStyle = "#d0c8c0";
    state.ctx.fillRect(8, 2, 44, 22);
    // Ears
    state.ctx.fillRect(8, -8, 12, 14);
    state.ctx.fillRect(40, -8, 12, 14);
    state.ctx.fillStyle = "#ff99bb";
    state.ctx.fillRect(10, -5, 8, 10);
    state.ctx.fillRect(42, -5, 8, 10);

    // Crown
    state.ctx.fillStyle = "#ffd700";
    state.ctx.fillRect(14, -6, 32, 8);
    state.ctx.fillRect(16, -12, 8, 8);
    state.ctx.fillRect(26, -14, 8, 10);
    state.ctx.fillRect(36, -12, 8, 8);
    state.ctx.fillStyle = "#ff44aa";
    state.ctx.fillRect(28, -10, 4, 4);

    // Eyes
    state.ctx.fillStyle = "#222222";
    if (f === 1) {
        state.ctx.fillRect(28, 6, 8, 8);
        state.ctx.fillRect(40, 6, 8, 8);
        state.ctx.fillStyle = "#ffffff";
        state.ctx.fillRect(30, 7, 3, 3);
        state.ctx.fillRect(42, 7, 3, 3);
    } else {
        state.ctx.fillRect(12, 6, 8, 8);
        state.ctx.fillRect(24, 6, 8, 8);
        state.ctx.fillStyle = "#ffffff";
        state.ctx.fillRect(14, 7, 3, 3);
        state.ctx.fillRect(26, 7, 3, 3);
    }

    // Nose
    state.ctx.fillStyle = "#ff88aa";
    const noseX = f === 1 ? 44 : 10;
    state.ctx.fillRect(noseX, 14, 6, 4);

    // Blush
    state.ctx.fillStyle = "rgba(255, 130, 170, 0.4)";
    if (f === 1) {
        state.ctx.fillRect(24, 14, 8, 5);
        state.ctx.fillRect(44, 14, 8, 5);
    } else {
        state.ctx.fillRect(8, 14, 8, 5);
        state.ctx.fillRect(28, 14, 8, 5);
    }

    // Tail
    const tailX = f === 1 ? -8 : 62;
    state.ctx.fillStyle = "#d0c8c0";
    const tailCurl = Math.sin(t * 1.5) * 3;
    state.ctx.fillRect(tailX, 40, 12, 5);
    state.ctx.fillRect(tailX + (f === 1 ? -6 : 10), 38 + tailCurl, 8, 5);

    state.ctx.restore();

    // Held item (drawn at normal scale)
    const held = state.inventory.slots[state.inventory.selectedSlot];
    if (held.count > 0 && held.itemId !== 0) {
        const hx = f === 1 ? sx + 22 : sx - 8;
        drawItemIcon(held.itemId, hx, sy + 16, 14);
    }
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
        // THE POSSUM GOD — bipedal angelic possum, wings, golden aura, laser mouth
        const f = mob.facing;
        const t = performance.now() * 0.003;
        const bodyCol  = isHurt ? "#ffeeaa" : "#d4af37";
        const bellyCol = isHurt ? "#fff5cc" : "#fffff0";
        const cx = sx + def.width / 2;
        const cy = sy + def.height / 2;

        // ── GOLDEN AURA: rotating rings ──────────────────────────────
        state.ctx.save();
        for (let ring = 0; ring < 3; ring++) {
            const angle = t * (1.2 + ring * 0.4) + ring * Math.PI * 0.66;
            const rx = def.width  * (0.55 + ring * 0.12);
            const ry = def.height * (0.35 + ring * 0.08);
            const alpha = 0.12 + Math.sin(t * 2 + ring) * 0.06;
            state.ctx.strokeStyle = `rgba(255, 230, 60, ${alpha + 0.15})`;
            state.ctx.lineWidth = 3 - ring;
            state.ctx.beginPath();
            state.ctx.ellipse(cx, cy - 6, rx, ry, angle, 0, Math.PI * 2);
            state.ctx.stroke();
        }
        // Orbiting golden sparks
        for (let sp = 0; sp < 6; sp++) {
            const ang = t * 1.8 + sp * Math.PI / 3;
            const px2 = cx + Math.cos(ang) * (def.width * 0.62);
            const py2 = cy - 6 + Math.sin(ang) * (def.height * 0.42);
            const sparkA = 0.5 + Math.sin(t * 4 + sp) * 0.3;
            state.ctx.fillStyle = `rgba(255, 240, 100, ${sparkA})`;
            state.ctx.fillRect(px2 - 2, py2 - 2, 4, 4);
        }
        state.ctx.restore();

        // ── ANGELIC WINGS (drawn behind body) ─────────────────────────
        const wingFlap = Math.sin(t * 3) * 12;
        const wingBaseY = sy + 28;
        state.ctx.save();
        // Left wing
        state.ctx.fillStyle = `rgba(255, 255, 255, 0.85)`;
        state.ctx.beginPath();
        state.ctx.moveTo(sx + 22, wingBaseY + 4);
        state.ctx.lineTo(sx - 38, wingBaseY - 18 - wingFlap);
        state.ctx.lineTo(sx - 30, wingBaseY + 10 - wingFlap * 0.4);
        state.ctx.lineTo(sx - 18, wingBaseY + 26);
        state.ctx.lineTo(sx + 16, wingBaseY + 22);
        state.ctx.closePath();
        state.ctx.fill();
        // Left wing feather tips (golden edges)
        state.ctx.strokeStyle = `rgba(255, 215, 0, 0.7)`;
        state.ctx.lineWidth = 2;
        for (let fi = 0; fi < 4; fi++) {
            const fx1 = sx + 18 - fi * 14;
            const fy1 = wingBaseY + 22 - fi * 2;
            const fx2 = sx - 32 + fi * 4;
            const fy2 = wingBaseY - 16 - wingFlap + fi * 6;
            state.ctx.beginPath();
            state.ctx.moveTo(fx1, fy1);
            state.ctx.lineTo(fx2, fy2);
            state.ctx.stroke();
        }
        // Right wing
        state.ctx.fillStyle = `rgba(255, 255, 255, 0.85)`;
        state.ctx.beginPath();
        state.ctx.moveTo(sx + def.width - 22, wingBaseY + 4);
        state.ctx.lineTo(sx + def.width + 38, wingBaseY - 18 - wingFlap);
        state.ctx.lineTo(sx + def.width + 30, wingBaseY + 10 - wingFlap * 0.4);
        state.ctx.lineTo(sx + def.width + 18, wingBaseY + 26);
        state.ctx.lineTo(sx + def.width - 16, wingBaseY + 22);
        state.ctx.closePath();
        state.ctx.fill();
        state.ctx.strokeStyle = `rgba(255, 215, 0, 0.7)`;
        for (let fi = 0; fi < 4; fi++) {
            const fx1 = sx + def.width - 18 + fi * 14;
            const fy1 = wingBaseY + 22 - fi * 2;
            const fx2 = sx + def.width + 32 - fi * 4;
            const fy2 = wingBaseY - 16 - wingFlap + fi * 6;
            state.ctx.beginPath();
            state.ctx.moveTo(fx1, fy1);
            state.ctx.lineTo(fx2, fy2);
            state.ctx.stroke();
        }
        state.ctx.restore();

        // ── TAIL (wrapping when active) ───────────────────────────────
        if (mob.wrapping) {
            const wt = t * 2;
            state.ctx.lineWidth = 9;
            state.ctx.strokeStyle = isHurt ? "#ffeeaa" : "#d4af37";
            state.ctx.beginPath();
            const wpx = state.player.x + state.player.width / 2 - state.camera.x + state.screenShake.x;
            const wpy = state.player.y + state.player.height / 2 - state.camera.y + state.screenShake.y;
            for (let seg = 0; seg < 4; seg++) {
                const angle = wt + seg * Math.PI * 0.65;
                const rad = 20 + seg * 5;
                const wx2 = wpx + Math.cos(angle) * rad;
                const wy2 = wpy + Math.sin(angle) * rad * 0.5;
                if (seg === 0) state.ctx.moveTo(wx2, wy2); else state.ctx.lineTo(wx2, wy2);
            }
            state.ctx.stroke();
            state.ctx.lineWidth = 1;
            state.ctx.fillStyle = "rgba(212, 175, 55, 0.3)";
            state.ctx.fillRect(
                state.player.x - state.camera.x + state.screenShake.x - 5,
                state.player.y - state.camera.y + state.screenShake.y - 5,
                state.player.width + 10, state.player.height + 10
            );
        } else {
            // Resting tail behind body
            const tailX = f === 1 ? sx - 2 : sx + def.width;
            state.ctx.fillStyle = bodyCol;
            state.ctx.fillRect(tailX + (f === 1 ? -2 : -6), sy + 58, 8, 4);
            state.ctx.fillRect(tailX + (f === 1 ? -6 : -8), sy + 62, 6, 5);
            state.ctx.fillRect(tailX + (f === 1 ? -10 : -8), sy + 67, 5, 6);
            state.ctx.fillStyle = `rgba(255,230,80,${0.6 + Math.sin(t * 3) * 0.3})`;
            state.ctx.fillRect(tailX + (f === 1 ? -13 : -8), sy + 73, 6, 6);
        }

        // ── ARMS (outstretched to sides) ──────────────────────────────
        state.ctx.fillStyle = bodyCol;
        // Left arm — stretched left
        state.ctx.fillRect(sx - 14, sy + 32, 20, 8);  // upper arm
        state.ctx.fillRect(sx - 22, sy + 34, 10, 6);  // forearm
        state.ctx.fillStyle = "#c8960c";
        state.ctx.fillRect(sx - 26, sy + 32, 6, 10);  // hand/claw
        // Right arm — stretched right
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + def.width - 6, sy + 32, 20, 8);
        state.ctx.fillRect(sx + def.width + 12, sy + 34, 10, 6);
        state.ctx.fillStyle = "#c8960c";
        state.ctx.fillRect(sx + def.width + 20, sy + 32, 6, 10);

        // ── BODY (upright torso) ──────────────────────────────────────
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + 18, sy + 28, 44, 38);
        // Belly
        state.ctx.fillStyle = bellyCol;
        state.ctx.fillRect(sx + 26, sy + 34, 28, 24);
        // Divine stripe markings
        state.ctx.fillStyle = "#c8960c";
        state.ctx.fillRect(sx + 22, sy + 30, 3, 32);
        state.ctx.fillRect(sx + 55, sy + 30, 3, 32);

        // ── TWO LEGS ─────────────────────────────────────────────────
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + 22, sy + 65, 14, 22);  // left leg
        state.ctx.fillRect(sx + 44, sy + 65, 14, 22);  // right leg
        // Feet / claws
        state.ctx.fillStyle = "#c8960c";
        state.ctx.fillRect(sx + 19, sy + 84, 20, 5);
        state.ctx.fillRect(sx + 41, sy + 84, 20, 5);

        // ── HEAD ─────────────────────────────────────────────────────
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + 24, sy + 2, 32, 28);
        // White face
        state.ctx.fillStyle = bellyCol;
        state.ctx.fillRect(sx + 27, sy + 5, 26, 22);
        // Big ears
        state.ctx.fillStyle = bodyCol;
        state.ctx.fillRect(sx + 24, sy - 12, 10, 14);
        state.ctx.fillRect(sx + 46, sy - 12, 10, 14);
        state.ctx.fillStyle = "#ff9944";
        state.ctx.fillRect(sx + 26, sy - 10, 6, 9);
        state.ctx.fillRect(sx + 48, sy - 10, 6, 9);
        // Glowing eyes
        state.ctx.fillStyle = "#ffee00";
        state.ctx.fillRect(sx + 29, sy + 7, 8, 8);
        state.ctx.fillRect(sx + 43, sy + 7, 8, 8);
        state.ctx.fillStyle = "#ffffff";
        state.ctx.fillRect(sx + 31, sy + 9, 4, 4);
        state.ctx.fillRect(sx + 45, sy + 9, 4, 4);
        const pulseEye = Math.sin(t * 4) > 0 ? "#ffdd00" : "#ff8800";
        state.ctx.fillStyle = pulseEye;
        state.ctx.fillRect(sx + 32, sy + 10, 2, 2);
        state.ctx.fillRect(sx + 46, sy + 10, 2, 2);
        // Nose
        state.ctx.fillStyle = "#ff9944";
        state.ctx.fillRect(sx + 36, sy + 19, 8, 5);
        // Mouth — glows when laser charging/firing
        const laserActive = mob.laserCharging || mob.laserFiring;
        const mouthGlow = laserActive ? `rgba(255, 80, 0, ${0.8 + Math.sin(t * 12) * 0.2})` : "#8b6c00";
        state.ctx.fillStyle = mouthGlow;
        state.ctx.fillRect(sx + 33, sy + 23, 14, 4);
        if (laserActive) {
            // Charging glow around mouth
            const chargeA = mob.laserCharging ? 0.3 + Math.sin(t * 10) * 0.2 : 0.6;
            state.ctx.fillStyle = `rgba(255, 120, 0, ${chargeA})`;
            state.ctx.fillRect(sx + 29, sy + 20, 22, 10);
        }

        // ── LASER BEAM ───────────────────────────────────────────────
        if (mob.laserFiring) {
            const mouthWorldX = mob.x + def.width / 2;
            const mouthWorldY = mob.y + 24;
            const msx = mouthWorldX - state.camera.x + state.screenShake.x;
            const msy = mouthWorldY - state.camera.y + state.screenShake.y;
            const tpx = state.player.x + state.player.width / 2 - state.camera.x + state.screenShake.x;
            const tpy = state.player.y + state.player.height / 2 - state.camera.y + state.screenShake.y;
            // Outer beam glow
            state.ctx.save();
            state.ctx.lineCap = "round";
            state.ctx.strokeStyle = `rgba(255, 200, 0, 0.25)`;
            state.ctx.lineWidth = 20;
            state.ctx.beginPath(); state.ctx.moveTo(msx, msy); state.ctx.lineTo(tpx, tpy); state.ctx.stroke();
            // Mid glow
            state.ctx.strokeStyle = `rgba(255, 120, 0, 0.6)`;
            state.ctx.lineWidth = 8;
            state.ctx.beginPath(); state.ctx.moveTo(msx, msy); state.ctx.lineTo(tpx, tpy); state.ctx.stroke();
            // Core beam
            state.ctx.strokeStyle = "#ffffff";
            state.ctx.lineWidth = 3;
            state.ctx.beginPath(); state.ctx.moveTo(msx, msy); state.ctx.lineTo(tpx, tpy); state.ctx.stroke();
            state.ctx.restore();
        }

        // ── HEALTH BAR ───────────────────────────────────────────────
        const hpFracG = mob.health / def.maxHealth;
        state.ctx.fillStyle = "rgba(0,0,0,0.75)";
        state.ctx.fillRect(sx - 6, sy - 36, def.width + 12, 10);
        state.ctx.fillStyle = hpFracG > 0.5 ? "#ffd700" : hpFracG > 0.25 ? "#ff8800" : "#ee2222";
        state.ctx.fillRect(sx - 4, sy - 34, (def.width + 8) * hpFracG, 6);
        state.ctx.save();
        state.ctx.font = "bold 9px monospace";
        state.ctx.fillStyle = "#ffd700";
        state.ctx.textAlign = "center";
        state.ctx.fillText("THE POSSUM GOD", cx, sy - 38);
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

    else if (mob.type === "sniper") {
        // Body — ghillie-style dark green
        state.ctx.fillStyle = isHurt ? "#667766" : "#2a3a2a";
        state.ctx.fillRect(sx + 4, sy + 14, 16, 16);
        // Head — covered with hood
        state.ctx.fillStyle = isHurt ? "#778877" : "#3a4a3a";
        state.ctx.fillRect(sx + 4, sy, 16, 14);
        // Goggles
        state.ctx.fillStyle = "#ff4400";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 13, sy + 4, 4, 3);
        } else {
            state.ctx.fillRect(sx + 7, sy + 4, 4, 3);
        }
        // Legs
        state.ctx.fillStyle = isHurt ? "#556655" : "#2a3020";
        state.ctx.fillRect(sx + 4, sy + 30, 7, 16);
        state.ctx.fillRect(sx + 13, sy + 30, 7, 16);
        // Arms holding sniper rifle
        state.ctx.fillStyle = isHurt ? "#667766" : "#3a4a3a";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 19, sy + 16, 6, 5);
        } else {
            state.ctx.fillRect(sx - 1, sy + 16, 6, 5);
        }
        // Sniper rifle — long barrel with scope
        state.ctx.fillStyle = "#1a1a1a";
        if (mob.facing === 1) {
            state.ctx.fillRect(sx + 22, sy + 14, 16, 2);  // long barrel
            state.ctx.fillRect(sx + 20, sy + 16, 8, 3);   // stock
            state.ctx.fillStyle = "#444444";
            state.ctx.fillRect(sx + 26, sy + 11, 4, 3);   // scope
        } else {
            state.ctx.fillRect(sx - 14, sy + 14, 16, 2);
            state.ctx.fillRect(sx - 4, sy + 16, 8, 3);
            state.ctx.fillStyle = "#444444";
            state.ctx.fillRect(sx - 6, sy + 11, 4, 3);
        }
    }

    else if (mob.type === "orium") {
        // ORIUM, THE DWARF KING — super big dwarf with gold/emerald/diamond mixed armor
        const f = mob.facing;
        const t = performance.now() * 0.002;

        // Legs (thick, armored)
        state.ctx.fillStyle = isHurt ? "#ffeeaa" : "#8b6914";
        state.ctx.fillRect(sx + 6, sy + 48, 16, 20);
        state.ctx.fillRect(sx + 34, sy + 48, 16, 20);
        // Gold leg armor
        state.ctx.fillStyle = isHurt ? "#ffffcc" : "#d4af37";
        state.ctx.fillRect(sx + 8, sy + 50, 12, 8);
        state.ctx.fillRect(sx + 36, sy + 50, 12, 8);

        // Body (barrel chest)
        state.ctx.fillStyle = isHurt ? "#ffffcc" : "#d4af37";
        state.ctx.fillRect(sx + 4, sy + 20, 48, 30);
        // Diamond chestplate overlay
        state.ctx.fillStyle = isHurt ? "#aaffff" : "#4dfff3";
        state.ctx.fillRect(sx + 10, sy + 22, 36, 10);
        // Emerald belt
        state.ctx.fillStyle = isHurt ? "#aaffaa" : "#50c878";
        state.ctx.fillRect(sx + 6, sy + 42, 44, 6);

        // Arms (thick)
        state.ctx.fillStyle = isHurt ? "#ffffcc" : "#d4af37";
        state.ctx.fillRect(sx - 4, sy + 22, 10, 24);
        state.ctx.fillRect(sx + 50, sy + 22, 10, 24);
        // Emerald shoulder pads
        state.ctx.fillStyle = isHurt ? "#aaffaa" : "#50c878";
        state.ctx.fillRect(sx - 6, sy + 18, 14, 8);
        state.ctx.fillRect(sx + 48, sy + 18, 14, 8);

        // Head (big dwarf head with helmet)
        state.ctx.fillStyle = isHurt ? "#ffddbb" : "#c69c6d";
        state.ctx.fillRect(sx + 10, sy + 2, 36, 20);
        // Diamond crown/helmet
        state.ctx.fillStyle = isHurt ? "#aaffff" : "#4dfff3";
        state.ctx.fillRect(sx + 8, sy - 2, 40, 8);
        // Gold crown points
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(sx + 12, sy - 6, 6, 6);
        state.ctx.fillRect(sx + 24, sy - 8, 8, 8);
        state.ctx.fillRect(sx + 38, sy - 6, 6, 6);

        // Eyes (angry red)
        state.ctx.fillStyle = "#ff2200";
        if (f === 1) {
            state.ctx.fillRect(sx + 30, sy + 8, 5, 4);
            state.ctx.fillRect(sx + 38, sy + 8, 5, 4);
        } else {
            state.ctx.fillRect(sx + 13, sy + 8, 5, 4);
            state.ctx.fillRect(sx + 21, sy + 8, 5, 4);
        }

        // Beard (big golden beard)
        state.ctx.fillStyle = isHurt ? "#ffffaa" : "#b8860b";
        state.ctx.fillRect(sx + 14, sy + 16, 28, 10);
        state.ctx.fillRect(sx + 18, sy + 26, 20, 4);

        // Weapon: big staff with gold, diamond, and emerald
        const staffX = f === 1 ? sx + 52 : sx - 10;
        const isSmashing = mob.isWindingUp || false;
        // Staff angle: normally idle sway, pulled back during windup
        const staffAngle = isSmashing ? -0.6 : Math.sin(t * 1.5) * 0.1;

        state.ctx.save();
        state.ctx.translate(staffX + 4, sy + 16);
        state.ctx.rotate(staffAngle);
        // Staff shaft (dark wood)
        state.ctx.fillStyle = "#5a3a1e";
        state.ctx.fillRect(-3, 0, 6, 52);
        // Gold band at top
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(-5, -4, 10, 8);
        // Diamond gem at top
        state.ctx.fillStyle = "#4dfff3";
        state.ctx.fillRect(-3, -8, 6, 6);
        // Emerald gem below gold band
        state.ctx.fillStyle = "#50c878";
        state.ctx.fillRect(-4, 6, 8, 5);
        // Gold band at middle
        state.ctx.fillStyle = "#d4af37";
        state.ctx.fillRect(-4, 22, 8, 4);
        // Small diamond accent at bottom
        state.ctx.fillStyle = "#4dfff3";
        state.ctx.fillRect(-2, 44, 4, 4);
        state.ctx.restore();

        // Windup glow effect — staff charges up before smash
        if (isSmashing) {
            const pulse = 0.3 + Math.sin(t * 10) * 0.2;
            state.ctx.fillStyle = `rgba(255, 68, 0, ${pulse})`;
            state.ctx.fillRect(staffX - 6, sy + 4, 20, 20);
            state.ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.8})`;
            state.ctx.fillRect(sx - 4, sy - 6, def.width + 8, def.height + 8);
        }

        // Golden aura shimmer
        const shimmer = 0.15 + Math.sin(t * 2) * 0.1;
        state.ctx.fillStyle = `rgba(255, 215, 0, ${shimmer})`;
        state.ctx.fillRect(sx - 8, sy - 10, def.width + 16, def.height + 14);

        // Boss health bar above sprite
        const hpFrac = mob.health / def.maxHealth;
        state.ctx.fillStyle = "rgba(0,0,0,0.7)";
        state.ctx.fillRect(sx - 4, sy - 18, def.width + 8, 8);
        state.ctx.fillStyle = hpFrac > 0.5 ? "#22cc44" : hpFrac > 0.25 ? "#ffaa00" : "#ee2222";
        state.ctx.fillRect(sx - 2, sy - 16, (def.width + 4) * hpFrac, 4);
    }

    else if (mob.type === "possum_king") {
        // POSSE, THE POSSUM KING — cute big possum plush, crown, cape, two legs
        const f = mob.facing;
        const t = performance.now() * 0.002;

        // Cape (behind body, billowing)
        const capeWave = Math.sin(t * 2) * 4;
        state.ctx.fillStyle = isHurt ? "#ffaadd" : "#cc2266";
        const capeX = f === 1 ? sx - 6 : sx + def.width - 10;
        state.ctx.fillRect(capeX, sy + 14, 16, 40 + capeWave);
        state.ctx.fillStyle = isHurt ? "#ffccee" : "#dd4488";
        state.ctx.fillRect(capeX + 2, sy + 16, 12, 36 + capeWave);
        // Cape gold trim
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(capeX, sy + 14, 16, 3);

        // Legs (standing on two legs, stubby cute)
        state.ctx.fillStyle = isHurt ? "#ffcccc" : "#c8b8a8";
        state.ctx.fillRect(sx + 12, sy + 52, 14, 20);
        state.ctx.fillRect(sx + 34, sy + 52, 14, 20);
        // Little feet
        state.ctx.fillStyle = isHurt ? "#ffdddd" : "#b0a090";
        state.ctx.fillRect(sx + 10, sy + 68, 18, 4);
        state.ctx.fillRect(sx + 32, sy + 68, 18, 4);

        // Body (round plush)
        state.ctx.fillStyle = isHurt ? "#ffdddd" : "#d0c8c0";
        state.ctx.fillRect(sx + 6, sy + 18, 48, 36);
        // White belly
        state.ctx.fillStyle = isHurt ? "#ffffff" : "#f0ece8";
        state.ctx.fillRect(sx + 14, sy + 24, 32, 26);
        // Blush marks on belly (cute)
        state.ctx.fillStyle = "rgba(255, 150, 180, 0.3)";
        state.ctx.fillRect(sx + 16, sy + 38, 8, 6);
        state.ctx.fillRect(sx + 36, sy + 38, 8, 6);

        // Arms (little stubby arms)
        state.ctx.fillStyle = isHurt ? "#ffdddd" : "#d0c8c0";
        state.ctx.fillRect(sx, sy + 22, 10, 18);
        state.ctx.fillRect(sx + 50, sy + 22, 10, 18);
        // Little paws
        state.ctx.fillStyle = isHurt ? "#ffcccc" : "#b0a090";
        state.ctx.fillRect(sx - 2, sy + 36, 10, 6);
        state.ctx.fillRect(sx + 52, sy + 36, 10, 6);

        // Head (big round cute head)
        state.ctx.fillStyle = isHurt ? "#ffdddd" : "#d0c8c0";
        state.ctx.fillRect(sx + 8, sy + 2, 44, 22);
        // Ears (big round pink-inside ears)
        state.ctx.fillStyle = isHurt ? "#ffdddd" : "#d0c8c0";
        state.ctx.fillRect(sx + 8, sy - 8, 12, 14);
        state.ctx.fillRect(sx + 40, sy - 8, 12, 14);
        state.ctx.fillStyle = "#ff99bb";
        state.ctx.fillRect(sx + 10, sy - 5, 8, 10);
        state.ctx.fillRect(sx + 42, sy - 5, 8, 10);

        // CROWN
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(sx + 14, sy - 6, 32, 8);
        state.ctx.fillRect(sx + 16, sy - 12, 8, 8);
        state.ctx.fillRect(sx + 26, sy - 14, 8, 10);
        state.ctx.fillRect(sx + 36, sy - 12, 8, 8);
        // Crown gem
        state.ctx.fillStyle = "#ff44aa";
        state.ctx.fillRect(sx + 28, sy - 10, 4, 4);

        // Eyes (big cute sparkly eyes)
        state.ctx.fillStyle = "#222222";
        if (f === 1) {
            state.ctx.fillRect(sx + 28, sy + 6, 8, 8);
            state.ctx.fillRect(sx + 40, sy + 6, 8, 8);
            // Sparkle
            state.ctx.fillStyle = "#ffffff";
            state.ctx.fillRect(sx + 30, sy + 7, 3, 3);
            state.ctx.fillRect(sx + 42, sy + 7, 3, 3);
        } else {
            state.ctx.fillRect(sx + 12, sy + 6, 8, 8);
            state.ctx.fillRect(sx + 24, sy + 6, 8, 8);
            state.ctx.fillStyle = "#ffffff";
            state.ctx.fillRect(sx + 14, sy + 7, 3, 3);
            state.ctx.fillRect(sx + 26, sy + 7, 3, 3);
        }

        // Cute pink nose
        state.ctx.fillStyle = "#ff88aa";
        const noseX = f === 1 ? sx + 44 : sx + 10;
        state.ctx.fillRect(noseX, sy + 14, 6, 4);

        // Blush cheeks
        state.ctx.fillStyle = "rgba(255, 130, 170, 0.4)";
        if (f === 1) {
            state.ctx.fillRect(sx + 24, sy + 14, 8, 5);
            state.ctx.fillRect(sx + 44, sy + 14, 8, 5);
        } else {
            state.ctx.fillRect(sx + 8, sy + 14, 8, 5);
            state.ctx.fillRect(sx + 28, sy + 14, 8, 5);
        }

        // Tail (animated, extends when grabbing)
        const tailX = f === 1 ? sx - 8 : sx + def.width + 2;
        if (mob.tailGrabbing) {
            // Extended tail reaching toward player
            state.ctx.fillStyle = "#d0c8c0";
            const tailLen = 40 + Math.sin(t * 5) * 6;
            const tailDir = f === 1 ? -1 : 1;
            state.ctx.fillRect(tailX, sy + 40, tailLen * tailDir, 6);
            state.ctx.fillStyle = "#ff88cc";
            state.ctx.fillRect(tailX + tailLen * tailDir - (tailDir > 0 ? 8 : 0), sy + 38, 8, 10);
        } else {
            state.ctx.fillStyle = "#d0c8c0";
            const tailCurl = Math.sin(t * 1.5) * 3;
            state.ctx.fillRect(tailX, sy + 40, 12, 5);
            state.ctx.fillRect(tailX + (f === 1 ? -6 : 10), sy + 38 + tailCurl, 8, 5);
        }

        // Boss health bar above sprite
        const hpFrac = mob.health / def.maxHealth;
        state.ctx.fillStyle = "rgba(0,0,0,0.7)";
        state.ctx.fillRect(sx - 4, sy - 20, def.width + 8, 8);
        state.ctx.fillStyle = hpFrac > 0.5 ? "#22cc44" : hpFrac > 0.25 ? "#ffaa00" : "#ee2222";
        state.ctx.fillRect(sx - 2, sy - 18, (def.width + 4) * hpFrac, 4);
    }

    else if (mob.type === "possum_pet") {
        // Mini Posse — same look as possum_king but wolf-sized (~28x22)
        const f = mob.facing;
        const t = performance.now() * 0.002;
        const s = 0.37; // scale factor (28/72 ≈ 0.37)

        state.ctx.save();
        state.ctx.translate(sx, sy);
        state.ctx.scale(s, s);
        // Use 0,0 as origin since we translated

        // Cape
        const capeWave = Math.sin(t * 2) * 4;
        state.ctx.fillStyle = isHurt ? "#ffaadd" : "#cc2266";
        const capeX = f === 1 ? -6 : 60 - 10;
        state.ctx.fillRect(capeX, 14, 16, 40 + capeWave);
        state.ctx.fillStyle = isHurt ? "#ffccee" : "#dd4488";
        state.ctx.fillRect(capeX + 2, 16, 12, 36 + capeWave);
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(capeX, 14, 16, 3);

        // Legs
        state.ctx.fillStyle = isHurt ? "#ffcccc" : "#c8b8a8";
        state.ctx.fillRect(12, 52, 14, 20);
        state.ctx.fillRect(34, 52, 14, 20);
        state.ctx.fillStyle = isHurt ? "#ffdddd" : "#b0a090";
        state.ctx.fillRect(10, 68, 18, 4);
        state.ctx.fillRect(32, 68, 18, 4);

        // Body
        state.ctx.fillStyle = isHurt ? "#ffdddd" : "#d0c8c0";
        state.ctx.fillRect(6, 18, 48, 36);
        state.ctx.fillStyle = isHurt ? "#ffffff" : "#f0ece8";
        state.ctx.fillRect(14, 24, 32, 26);
        state.ctx.fillStyle = "rgba(255, 150, 180, 0.3)";
        state.ctx.fillRect(16, 38, 8, 6);
        state.ctx.fillRect(36, 38, 8, 6);

        // Arms
        state.ctx.fillStyle = isHurt ? "#ffdddd" : "#d0c8c0";
        state.ctx.fillRect(0, 22, 10, 18);
        state.ctx.fillRect(50, 22, 10, 18);
        state.ctx.fillStyle = isHurt ? "#ffcccc" : "#b0a090";
        state.ctx.fillRect(-2, 36, 10, 6);
        state.ctx.fillRect(52, 36, 10, 6);

        // Head
        state.ctx.fillStyle = isHurt ? "#ffdddd" : "#d0c8c0";
        state.ctx.fillRect(8, 2, 44, 22);
        // Ears
        state.ctx.fillRect(8, -8, 12, 14);
        state.ctx.fillRect(40, -8, 12, 14);
        state.ctx.fillStyle = "#ff99bb";
        state.ctx.fillRect(10, -5, 8, 10);
        state.ctx.fillRect(42, -5, 8, 10);

        // Crown
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(14, -6, 32, 8);
        state.ctx.fillRect(16, -12, 8, 8);
        state.ctx.fillRect(26, -14, 8, 10);
        state.ctx.fillRect(36, -12, 8, 8);
        state.ctx.fillStyle = "#ff44aa";
        state.ctx.fillRect(28, -10, 4, 4);

        // Eyes
        state.ctx.fillStyle = "#222222";
        if (f === 1) {
            state.ctx.fillRect(28, 6, 8, 8);
            state.ctx.fillRect(40, 6, 8, 8);
            state.ctx.fillStyle = "#ffffff";
            state.ctx.fillRect(30, 7, 3, 3);
            state.ctx.fillRect(42, 7, 3, 3);
        } else {
            state.ctx.fillRect(12, 6, 8, 8);
            state.ctx.fillRect(24, 6, 8, 8);
            state.ctx.fillStyle = "#ffffff";
            state.ctx.fillRect(14, 7, 3, 3);
            state.ctx.fillRect(26, 7, 3, 3);
        }

        // Nose
        state.ctx.fillStyle = "#ff88aa";
        const noseX2 = f === 1 ? 44 : 10;
        state.ctx.fillRect(noseX2, 14, 6, 4);

        // Blush
        state.ctx.fillStyle = "rgba(255, 130, 170, 0.4)";
        if (f === 1) {
            state.ctx.fillRect(24, 14, 8, 5);
            state.ctx.fillRect(44, 14, 8, 5);
        } else {
            state.ctx.fillRect(8, 14, 8, 5);
            state.ctx.fillRect(28, 14, 8, 5);
        }

        // Tail
        const tailX2 = f === 1 ? -8 : 62;
        if (mob.tailGrabbing) {
            state.ctx.fillStyle = "#d0c8c0";
            const tailLen = 40 + Math.sin(t * 5) * 6;
            const tailDir = f === 1 ? -1 : 1;
            state.ctx.fillRect(tailX2, 40, tailLen * tailDir, 6);
            state.ctx.fillStyle = "#ff88cc";
            state.ctx.fillRect(tailX2 + tailLen * tailDir - (tailDir > 0 ? 8 : 0), 38, 8, 10);
        } else {
            state.ctx.fillStyle = "#d0c8c0";
            const tailCurl = Math.sin(t * 1.5) * 3;
            state.ctx.fillRect(tailX2, 40, 12, 5);
            state.ctx.fillRect(tailX2 + (f === 1 ? -6 : 10), 38 + tailCurl, 8, 5);
        }

        state.ctx.restore();

        // Health bar (not scaled)
        const hpFrac = mob.health / MOB_DEFS.possum_pet.maxHealth;
        state.ctx.fillStyle = "rgba(0,0,0,0.7)";
        state.ctx.fillRect(sx - 2, sy - 10, def.width + 4, 5);
        state.ctx.fillStyle = hpFrac > 0.5 ? "#22cc44" : hpFrac > 0.25 ? "#ffaa00" : "#ee2222";
        state.ctx.fillRect(sx - 1, sy - 9, (def.width + 2) * hpFrac, 3);
    }

    else if (mob.type === "void_god") {
        // BLOCKY, THE VOID GOD — big dark purple blocky figure with rainbow accents
        const f = mob.facing;
        const t = performance.now() * 0.002;

        // Legs (thick blocky)
        state.ctx.fillStyle = isHurt ? "#9988cc" : "#3a3a5a";
        state.ctx.fillRect(sx + 10, sy + 58, 16, 22);
        state.ctx.fillRect(sx + 38, sy + 58, 16, 22);
        // Feet
        state.ctx.fillStyle = isHurt ? "#aaaadd" : "#2a2a4a";
        state.ctx.fillRect(sx + 8, sy + 76, 20, 4);
        state.ctx.fillRect(sx + 36, sy + 76, 20, 4);

        // Body (big blocky torso)
        state.ctx.fillStyle = isHurt ? "#8877bb" : "#2a2a3a";
        state.ctx.fillRect(sx + 4, sy + 20, 56, 40);
        // Rainbow void energy core
        const coreHue = (t * 60) % 360;
        state.ctx.fillStyle = `hsl(${coreHue}, 80%, 50%)`;
        state.ctx.fillRect(sx + 20, sy + 32, 24, 20);
        state.ctx.fillStyle = `hsl(${(coreHue + 120) % 360}, 80%, 60%)`;
        state.ctx.fillRect(sx + 24, sy + 36, 16, 12);

        // Arms (blocky, thick)
        state.ctx.fillStyle = isHurt ? "#8877bb" : "#2a2a3a";
        state.ctx.fillRect(sx - 6, sy + 22, 14, 28);
        state.ctx.fillRect(sx + 56, sy + 22, 14, 28);
        // Fists with rainbow glow
        state.ctx.fillStyle = `hsl(${(coreHue + 60) % 360}, 70%, 45%)`;
        state.ctx.fillRect(sx - 8, sy + 46, 16, 10);
        state.ctx.fillRect(sx + 56, sy + 46, 16, 10);

        // Head (big square)
        state.ctx.fillStyle = isHurt ? "#8877bb" : "#2a2a3a";
        state.ctx.fillRect(sx + 8, sy, 48, 24);
        // Glowing eyes (rainbow shift)
        state.ctx.fillStyle = `hsl(${coreHue}, 100%, 70%)`;
        if (f === 1) {
            state.ctx.fillRect(sx + 28, sy + 6, 10, 8);
            state.ctx.fillRect(sx + 42, sy + 6, 10, 8);
        } else {
            state.ctx.fillRect(sx + 12, sy + 6, 10, 8);
            state.ctx.fillRect(sx + 26, sy + 6, 10, 8);
        }
        // Eye pupils
        state.ctx.fillStyle = "#000000";
        if (f === 1) {
            state.ctx.fillRect(sx + 32, sy + 8, 4, 4);
            state.ctx.fillRect(sx + 46, sy + 8, 4, 4);
        } else {
            state.ctx.fillRect(sx + 14, sy + 8, 4, 4);
            state.ctx.fillRect(sx + 28, sy + 8, 4, 4);
        }

        // Crown/horns (void energy spikes)
        state.ctx.fillStyle = `hsl(${(coreHue + 180) % 360}, 80%, 50%)`;
        state.ctx.fillRect(sx + 10, sy - 10, 8, 12);
        state.ctx.fillRect(sx + 28, sy - 14, 8, 16);
        state.ctx.fillRect(sx + 46, sy - 10, 8, 12);

        // Smash effect — glowing aura when smashing
        if (mob.smashingVG) {
            state.ctx.fillStyle = `rgba(100, 68, 170, ${0.3 + Math.sin(t * 8) * 0.2})`;
            state.ctx.fillRect(sx - 12, sy - 16, def.width + 24, def.height + 20);
        }

        // Laser charge-up glow
        if (mob.laserFiring) {
            const chargeGlow = Math.min(1, mob.laserTimer / 600);
            state.ctx.fillStyle = `rgba(255, 0, 255, ${chargeGlow * 0.5})`;
            state.ctx.fillRect(sx + 20, sy + 20, 24, 24);
        }

        // Boss health bar
        const hpFrac = mob.health / def.maxHealth;
        state.ctx.fillStyle = "rgba(0,0,0,0.7)";
        state.ctx.fillRect(sx - 4, sy - 22, def.width + 8, 8);
        state.ctx.fillStyle = hpFrac > 0.5 ? "#22cc44" : hpFrac > 0.25 ? "#ffaa00" : "#ee2222";
        state.ctx.fillRect(sx - 2, sy - 20, (def.width + 4) * hpFrac, 4);
    }

    else if (mob.type === "gasly") {
        // GASLY, THE GRUNCHER PRINCE — big grunture with crown and fire staff
        const f = mob.facing;
        const t = performance.now() * 0.002;
        const fur     = isHurt ? "#ff7755" : "#5a2510";
        const belly   = isHurt ? "#ff9977" : "#8a4525";
        const darkFur = isHurt ? "#dd5533" : "#3a1508";
        const eyeCol  = "#ff5500";

        // Legs (thick)
        state.ctx.fillStyle = fur;
        state.ctx.fillRect(sx + 10, sy + 60, 18, 24);
        state.ctx.fillRect(sx + 44, sy + 60, 18, 24);
        state.ctx.fillStyle = darkFur;
        state.ctx.fillRect(sx + 8, sy + 78, 22, 6);
        state.ctx.fillRect(sx + 42, sy + 78, 22, 6);

        // Body (massive barrel chest)
        state.ctx.fillStyle = fur;
        state.ctx.fillRect(sx + 6, sy + 24, 60, 38);
        state.ctx.fillStyle = belly;
        state.ctx.fillRect(sx + 16, sy + 28, 40, 30);
        state.ctx.fillStyle = "rgba(0,0,0,0.12)";
        state.ctx.fillRect(sx + 6, sy + 38, 60, 3);
        state.ctx.fillRect(sx + 6, sy + 50, 60, 3);

        // Arms
        state.ctx.fillStyle = fur;
        state.ctx.fillRect(sx - 8, sy + 26, 16, 28);
        state.ctx.fillRect(sx + 64, sy + 26, 16, 28);
        // Claws
        state.ctx.fillStyle = darkFur;
        state.ctx.fillRect(sx - 10, sy + 52, 6, 8);
        state.ctx.fillRect(sx - 4, sy + 54, 6, 8);
        state.ctx.fillRect(sx + 66, sy + 52, 6, 8);
        state.ctx.fillRect(sx + 72, sy + 54, 6, 8);

        // Head (big)
        state.ctx.fillStyle = fur;
        state.ctx.fillRect(sx + 10, sy + 4, 52, 24);
        state.ctx.fillStyle = darkFur;
        state.ctx.fillRect(sx + 10, sy + 4, 52, 7);

        // Horns
        state.ctx.fillStyle = "#c8b070";
        state.ctx.fillRect(sx + 14, sy - 8, 8, 14);
        state.ctx.fillRect(sx + 8, sy - 18, 8, 12);
        state.ctx.fillRect(sx + 50, sy - 8, 8, 14);
        state.ctx.fillRect(sx + 56, sy - 18, 8, 12);
        state.ctx.fillStyle = "#a09050";
        state.ctx.fillRect(sx + 6, sy - 26, 7, 10);
        state.ctx.fillRect(sx + 59, sy - 26, 7, 10);

        // CROWN — golden crown on top of head
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(sx + 16, sy - 4, 40, 8);
        state.ctx.fillRect(sx + 18, sy - 10, 8, 8);
        state.ctx.fillRect(sx + 32, sy - 12, 10, 10);
        state.ctx.fillRect(sx + 46, sy - 10, 8, 8);
        // Crown gems
        state.ctx.fillStyle = "#ff2200";
        state.ctx.fillRect(sx + 35, sy - 8, 4, 4);
        state.ctx.fillStyle = "#4dfff3";
        state.ctx.fillRect(sx + 21, sy - 6, 3, 3);
        state.ctx.fillRect(sx + 49, sy - 6, 3, 3);

        // Muzzle
        const muzzX = f === 1 ? sx + 48 : sx + 2;
        state.ctx.fillStyle = belly;
        state.ctx.fillRect(muzzX, sy + 14, 22, 14);
        state.ctx.fillStyle = darkFur;
        state.ctx.fillRect(muzzX + 4, sy + 20, 4, 4);
        state.ctx.fillRect(muzzX + 14, sy + 20, 4, 4);

        // Eyes — glowing
        state.ctx.fillStyle = eyeCol;
        state.ctx.fillRect(f === 1 ? sx + 38 : sx + 20, sy + 10, 10, 8);
        // Below half health: eyes glow brighter
        const belowHalf = mob.health < def.maxHealth / 2;
        if (belowHalf) {
            const glow = 0.4 + Math.sin(t * 5) * 0.3;
            state.ctx.fillStyle = `rgba(255, 100, 0, ${glow})`;
            state.ctx.fillRect(f === 1 ? sx + 34 : sx + 16, sy + 6, 18, 16);
        }

        // FIRE STAFF — held in one hand
        const staffX = f === 1 ? sx + 74 : sx - 18;
        state.ctx.save();
        state.ctx.translate(staffX + 5, sy + 20);
        const staffSwing = belowHalf ? Math.sin(t * 4) * 0.15 : Math.sin(t * 1.5) * 0.05;
        state.ctx.rotate(staffSwing);
        // Shaft
        state.ctx.fillStyle = "#3a1508";
        state.ctx.fillRect(-4, 0, 8, 60);
        // Fire orb at top
        const fireGlow = belowHalf ? 0.8 + Math.sin(t * 6) * 0.2 : 0.5;
        state.ctx.fillStyle = `rgba(255, 68, 0, ${fireGlow})`;
        state.ctx.fillRect(-8, -12, 16, 14);
        state.ctx.fillStyle = `rgba(255, 200, 0, ${fireGlow * 0.7})`;
        state.ctx.fillRect(-5, -8, 10, 8);
        // Gold rings
        state.ctx.fillStyle = "#ffd700";
        state.ctx.fillRect(-5, 14, 10, 4);
        state.ctx.fillRect(-5, 36, 10, 4);
        state.ctx.restore();

        // Fire aura when below half health
        if (belowHalf) {
            const pulse = 0.12 + Math.sin(t * 3) * 0.08;
            state.ctx.fillStyle = `rgba(255, 68, 0, ${pulse})`;
            state.ctx.fillRect(sx - 10, sy - 8, def.width + 20, def.height + 12);
        }

        // Boss health bar above sprite
        const hpFrac = mob.health / def.maxHealth;
        state.ctx.fillStyle = "rgba(0,0,0,0.7)";
        state.ctx.fillRect(sx - 4, sy - 32, def.width + 8, 8);
        state.ctx.fillStyle = hpFrac > 0.5 ? "#22cc44" : hpFrac > 0.25 ? "#ffaa00" : "#ee2222";
        state.ctx.fillRect(sx - 2, sy - 30, (def.width + 4) * hpFrac, 4);
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
