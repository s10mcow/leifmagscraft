// ============================================================
// MOBS/ENTITIES.JS - Mob creation and initialization data
// ============================================================

import { MOB_DEFS, ITEMS } from '../constants.js';

let _nextMobId = 1;

export function createMob(type, x, y) {
    const def = MOB_DEFS[type];
    const mob = {
        id: _nextMobId++,
        type, x, y,
        velX: 0, velY: 0,
        health: def.maxHealth, maxHealth: def.maxHealth,
        onGround: false, facing: Math.random() < 0.5 ? -1 : 1,
        hurtTimer: 0,
        aiTimer: 0,
        attackCooldown: 0,
        fuseTimer: 0,
        fusing: false,
        shootCooldown: 0,
        wanderDir: Math.random() < 0.5 ? -1 : 1,
        wanderTimer: 0,
        burnTimer: 0,
        onFire: 0,
        fireDamageCooldown: 0,
        dead: false,
        spawnX: x,
        equipment: null,
        aggroed: false,
        provoked: false,
        teleportTimer: 9999,
        tamed: false,
        sitting: false,
        flowerTimer: 0
    };
    // Random equipment for zombies, skeletons, husks, pigmen
    if (type === "zombie" || type === "skeleton" || type === "husk") {
        const hasArmor = Math.random() < 0.15;
        const hasWeapon = (type !== "skeleton") && Math.random() < 0.10;
        if (hasArmor || hasWeapon) {
            mob.equipment = { armor: hasArmor, weapon: hasWeapon };
            if (hasArmor) mob.health += 4;
        }
    }
    if (type === "pigman") {
        const hasArmor = Math.random() < 0.3;
        mob.equipment = { armor: hasArmor, weapon: true, gold: true };
        if (hasArmor) mob.health += 5;
    }
    if (type === "raider") {
        mob.shootCooldown = Math.random() * MOB_DEFS.raider.shootInterval;
        mob.magAmmo = 24;
        mob.reloadTimer = 0;
        if (Math.random() < 0.25) { mob.equipment = { armor: true }; mob.health += 5; }
    }
    if (type === "companion") {
        mob.hungerTimer = 0;
        mob.askingForFood = false;
        mob.foodAskTimer = 0;
    }
    return mob;
}
