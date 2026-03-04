// ============================================================
// MULTIPLAYER.JS - WebSocket client for shared-world play
// ============================================================
// Connects to a relay WebSocket server.
// Set VITE_WS_URL env variable to your deployed server URL.
// For local dev, run: node server/index.js  (ws://localhost:8080)
// ============================================================

import { state } from './state.js';

export const WS_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL)
    ? import.meta.env.VITE_WS_URL
    : 'ws://localhost:8080';

let ws = null;
let posInterval = null;
let mobInterval = null;

// Seeded PRNG — mulberry32. Used so all multiplayer players generate
// the same world from the same fixed seed.
export function mulberry32(seed) {
    return function() {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

export const MULTIPLAYER_SEED = 0xC0FFEE42; // fixed seed for shared world

export function connectMultiplayer() {
    if (ws) ws.close();
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        state.multiplayerConnected = true;
        state.isMobHost = false; // server will promote us if we're first
        ws.send(JSON.stringify({ type: 'join', name: state.multiplayerName, token: state.supabaseSession?.access_token || null }));
        pushChat('Connected to server!', '#4ade80');
        // Send position every 100ms
        posInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'player_update',
                    x: state.player.x,
                    y: state.player.y,
                    facing: state.player.facing,
                    health: state.player.health,
                    name: state.multiplayerName,
                }));
            }
        }, 100);
        // Send mob states every 500ms (host only)
        mobInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN && state.isMobHost) {
                ws.send(JSON.stringify({
                    type: 'mob_sync',
                    mobs: state.mobs.map(m => ({
                        id: m.id, type: m.type,
                        x: m.x, y: m.y,
                        health: m.health,
                        facing: m.facing,
                        aggroed: m.aggroed,
                    })),
                }));
            }
        }, 500);
    };

    ws.onerror = () => pushChat('Cannot reach server — playing solo.', '#f87171');

    ws.onclose = () => {
        state.multiplayerConnected = false;
        state.otherPlayers = {};
        state.isMobHost = true;
        if (posInterval) { clearInterval(posInterval); posInterval = null; }
        if (mobInterval) { clearInterval(mobInterval); mobInterval = null; }
        pushChat('Disconnected.', '#9ca3af');
    };

    ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        switch (msg.type) {
            case 'init':
                state.myPlayerId = msg.id;
                if (msg.isMobHost) state.isMobHost = true;
                // Apply server-side block changes on top of local world
                for (const b of (msg.blockChanges || [])) {
                    if (state.activeWorld[b.x]) state.activeWorld[b.x][b.y] = b.blockId;
                }
                break;
            case 'become_mob_host':
                state.isMobHost = true;
                pushChat('You are now the mob host.', '#9ca3af');
                break;
            case 'mob_sync': {
                const hostIds = new Set(msg.mobs.map(m => m.id));
                // Remove mobs that no longer exist on host
                state.mobs = state.mobs.filter(m => hostIds.has(m.id));
                for (const rm of msg.mobs) {
                    const local = state.mobs.find(m => m.id === rm.id);
                    if (local) {
                        local.x = rm.x; local.y = rm.y;
                        local.health = rm.health;
                        local.facing = rm.facing;
                        local.aggroed = rm.aggroed;
                    } else {
                        // New mob from host — create it locally
                        import('./mobs.js').then(m => {
                            const newMob = m.createMob(rm.type, rm.x, rm.y);
                            newMob.id = rm.id;
                            newMob.health = rm.health;
                            newMob.facing = rm.facing;
                            newMob.aggroed = rm.aggroed;
                            state.mobs.push(newMob);
                        });
                    }
                }
                break;
            }
            case 'player_update':
                if (msg.id === state.myPlayerId) break;
                state.otherPlayers[msg.id] = {
                    x: msg.x, y: msg.y,
                    facing: msg.facing,
                    health: msg.health,
                    name: msg.name || 'Player',
                };
                break;
            case 'block_update':
                if (state.activeWorld[msg.x]) state.activeWorld[msg.x][msg.y] = msg.blockId;
                break;
            case 'chat':
                pushChat(`${msg.name}: ${msg.text}`, '#ffffff');
                break;
            case 'player_join':
                pushChat(`${msg.name || 'A player'} joined!`, '#facc15');
                break;
            case 'player_leave':
                delete state.otherPlayers[msg.id];
                pushChat(`${msg.name || 'A player'} left.`, '#9ca3af');
                break;
        }
    };
}

export function disconnectMultiplayer() {
    if (posInterval) { clearInterval(posInterval); posInterval = null; }
    if (mobInterval) { clearInterval(mobInterval); mobInterval = null; }
    if (ws) { ws.close(); ws = null; }
    state.multiplayerConnected = false;
    state.otherPlayers = {};
    state.isMobHost = true;
}

export function sendBlockUpdate(x, y, blockId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'block_update', x, y, blockId }));
}

export function sendChat(text) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        // Still show locally even if offline
        pushChat(`${state.multiplayerName}: ${text}`, '#ffff88');
        return;
    }
    ws.send(JSON.stringify({ type: 'chat', text }));
}

export function sendLocalChat(text) {
    pushChat(`You: ${text}`, '#ffff88');
}

function pushChat(text, color) {
    state.chatMessages.push({ text, color, timer: 600 });
    if (state.chatMessages.length > 30) state.chatMessages.shift();
}
