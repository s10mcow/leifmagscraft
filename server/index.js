// ============================================================
// MULTIPLAYER SERVER - Simple WebSocket relay
// ============================================================
// Deploy to Render.com, Railway.app, or any Node.js host.
// Set the deployed URL as VITE_WS_URL in your Vercel env vars.
//
// Local dev:
//   npm install ws
//   node server/index.js
// ============================================================

import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const wss = new WebSocketServer({ port: PORT, host: HOST });

// Persistent state (lives until server restarts)
const clients = new Map();   // id -> { ws, name, x, y }
let worldSeed = null;        // seed of the current active world
let blockChanges = [];       // all block edits for the current seed

let nextId = 1;
let mobHostId = null;

function decodeJWT(token) {
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch { return null; }
}

wss.on('connection', (ws) => {
    const id = String(nextId++);
    const client = { ws, name: 'Player' + id, x: 0, y: 0 };
    clients.set(id, client);

    // First client becomes mob host
    if (mobHostId === null) mobHostId = id;
    // Send current world state to the new player
    ws.send(JSON.stringify({ type: 'init', id, blockChanges, isMobHost: mobHostId === id }));

    ws.on('message', (raw) => {
        let msg;
        try { msg = JSON.parse(raw); } catch { return; }
        msg.id = id;

        if (msg.type === 'join') {
            const payload = decodeJWT(msg.token);
            const verifiedName = payload?.user_metadata?.username;
            client.name = verifiedName || msg.name || client.name;
            // If this client's seed differs from the active world seed, wipe block history
            if (msg.seed && msg.seed !== worldSeed) {
                worldSeed = msg.seed;
                blockChanges = [];
                console.log(`New world seed ${worldSeed} — block history cleared.`);
            }
            broadcast({ type: 'player_join', id, name: client.name }, ws);

        } else if (msg.type === 'player_update') {
            client.x = msg.x; client.y = msg.y;
            if (msg.name) client.name = msg.name;
            broadcast(msg, ws);   // relay to everyone else

        } else if (msg.type === 'block_update') {
            // Ignore changes from a stale seed
            if (msg.seed && msg.seed !== worldSeed) return;
            // Overwrite existing entry for same position, or push new one
            const idx = blockChanges.findIndex(b => b.x === msg.x && b.y === msg.y);
            if (idx >= 0) blockChanges[idx] = msg;
            else blockChanges.push(msg);
            broadcast(msg, ws);

        } else if (msg.type === 'mob_sync') {
            if (id === mobHostId) broadcast(msg, ws);

        } else if (msg.type === 'chat') {
            msg.name = client.name;
            broadcastAll(msg);    // include sender so they see their own message
        }
    });

    ws.on('close', () => {
        broadcast({ type: 'player_leave', id, name: client.name });
        clients.delete(id);
        // Reassign mob host if the host left
        if (id === mobHostId) {
            mobHostId = null;
            for (const [cid, c] of clients) {
                mobHostId = cid;
                c.ws.send(JSON.stringify({ type: 'become_mob_host' }));
                break;
            }
        }
    });
});

function broadcast(msg, exclude) {
    const data = JSON.stringify(msg);
    for (const [, c] of clients) {
        if (c.ws !== exclude && c.ws.readyState === 1) c.ws.send(data);
    }
}

function broadcastAll(msg) {
    const data = JSON.stringify(msg);
    for (const [, c] of clients) {
        if (c.ws.readyState === 1) c.ws.send(data);
    }
}

console.log(`Multiplayer server running on ws://${HOST}:${PORT}`);
console.log(`PORT env: ${process.env.PORT}`);
console.log(`Node version: ${process.version}`);
