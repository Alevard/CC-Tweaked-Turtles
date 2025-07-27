// ...Top of Script...
const roleHarvester = require('role.harvester');
const roleBuilder = require('role.builder');
const roleUpgrader = require('role.upgrader');
const roleTransporter = require('role.transporter');
const roleMedic = require('role.medic');
const roleAttacker = require('role.attacker');
const roleHealer = require('role.healer');
// ...existing code...

const MAX_HARVESTERS = 5;
const MAX_BUILDERS = 3;
const MAX_UPGRADERS = 4;
const MAX_TRANSPORTERS = 5;
const MAX_MEDICS = 1;
const MAX_ATTACKERS = 0; // Prevent auto-spawning
const MAX_HEALERS = 0;   // Prevent auto-spawning
// ...existing code...
const SPAWN_NAME = 'Camelot';

module.exports.loop = function () {
    // Set default targetRoom for attackers and healers if not set
    for (let name in Game.creeps) {
        const creep = Game.creeps[name];
        if ((creep.memory.role === 'attacker' || creep.memory.role === 'healer') && !creep.memory.targetRoom) {
            creep.memory.targetRoom = 'E22N28';
        }
    }
    // Auto Safe Mode: If hostile creeps are present, have an upgrader activate Safe Mode
    const room = Game.spawns[SPAWN_NAME].room;
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length > 0 && room.controller && room.controller.safeModeAvailable > 0 && !room.controller.safeMode) {
        // Find an upgrader in range to activate Safe Mode
        const upgrader = _.find(Game.creeps, c => c.memory.role === 'upgrader' && c.pos.inRangeTo(room.controller, 1));
        if (upgrader) {
            const result = room.controller.activateSafeMode();
            if (result === OK) {
                Game.notify('Safe Mode activated by upgrader due to hostile presence!');
            }
        }
    }
    // ...existing code...
    const spawn = Game.spawns[SPAWN_NAME];
    // Initialize obituaries if not present
    if (!Memory.obituaries) {
        Memory.obituaries = [];
    }
    // Initialize role counters if not present, and ensure all roles are numbers
    if (!Memory.creepCounters) {
        Memory.creepCounters = { harvester: 1, builder: 1, upgrader: 1, transporter: 1, medic: 1, attacker: 1, healer: 1, claimer: 1 };
    } else {
        if (typeof Memory.creepCounters.harvester !== 'number') Memory.creepCounters.harvester = 1;
        if (typeof Memory.creepCounters.builder !== 'number') Memory.creepCounters.builder = 1;
        if (typeof Memory.creepCounters.upgrader !== 'number') Memory.creepCounters.upgrader = 1;
        if (typeof Memory.creepCounters.transporter !== 'number') Memory.creepCounters.transporter = 1;
        if (typeof Memory.creepCounters.medic !== 'number') Memory.creepCounters.medic = 1;
        if (typeof Memory.creepCounters.attacker !== 'number') Memory.creepCounters.attacker = 1;
        if (typeof Memory.creepCounters.healer !== 'number') Memory.creepCounters.healer = 1;
        if (typeof Memory.creepCounters.claimer !== 'number') Memory.creepCounters.claimer = 1;
    // Always check for claimer spawn request
    if (Game.spawns[SPAWN_NAME].spawning == null && Memory.spawnClaimer) {
        let name = 'Claimer' + Memory.creepCounters.claimer;
        while (Game.creeps[name]) {
            Memory.creepCounters.claimer++;
            name = 'Claimer' + Memory.creepCounters.claimer;
        }
        const result = Game.spawns[SPAWN_NAME].spawnCreep([CLAIM, MOVE], name, { memory: { role: 'claimer' } });
        if (result === OK) {
            Memory.creepCounters.claimer++;
            delete Memory.spawnClaimer;
        }
    }
        // ...existing code...
    // Spawn initial attackers and healers (manual, not automated)
    if (!Memory.initialAttackersSpawned) {
        let attackerCount = 0;
        let healerCount = 0;
        // Try to spawn up to 4 attackers
        for (let i = 0; i < 4; i++) {
            let name = 'Attacker' + Memory.creepCounters.attacker;
            if (!Game.creeps[name]) {
                const result = spawn.spawnCreep([ATTACK, MOVE], name, {
                    memory: { role: 'attacker', targetRoom: 'TARGET_ROOM_NAME' }
                });
                if (result === OK) {
                    attackerCount++;
                    Memory.creepCounters.attacker++;
                }
            } else {
                Memory.creepCounters.attacker++;
            }
        }
        // Try to spawn 1 healer
        let healerName = 'Healer' + Memory.creepCounters.healer;
        if (!Game.creeps[healerName]) {
            const result = spawn.spawnCreep([HEAL, MOVE], healerName, {
                memory: { role: 'healer', targetRoom: 'TARGET_ROOM_NAME' }
            });
            if (result === OK) {
                healerCount++;
                Memory.creepCounters.healer++;
            }
        } else {
            Memory.creepCounters.healer++;
        }
        if (attackerCount > 0 || healerCount > 0) {
            Memory.initialAttackersSpawned = true;
        }
    }
    }
    // Track creeps from previous tick
    if (!Memory.lastCreeps) {
        Memory.lastCreeps = Object.keys(Game.creeps);
    }
    // Detect actual deaths (creeps that existed last tick but not now)
    for (let name of Memory.lastCreeps) {
        if (!Game.creeps[name] && Memory.creeps[name]) {
            console.log('💀 Creep died:', name);
            Memory.obituaries.push({
                name: name,
                tick: Game.time
            });
            delete Memory.creeps[name];
        }
    }
    // Update lastCreeps for next tick
    Memory.lastCreeps = Object.keys(Game.creeps);

    // Count current harvesters, builders, upgraders, and transporters
    const harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester');
    const builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder');
    const upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader');
    const transporters = _.filter(Game.creeps, (creep) => creep.memory.role === 'transporter');
    const medics = _.filter(Game.creeps, (creep) => creep.memory.role === 'medic');
        // ...existing code...
        // Only attempt to spawn if spawn is not busy
        if (spawn.spawning == null) {
            // Always ensure at least one harvester exists
            if (harvesters.length < 1) {
                let name = 'Farmer' + Memory.creepCounters.harvester;
                while (Game.creeps[name]) {
                    Memory.creepCounters.harvester++;
                    name = 'Farmer' + Memory.creepCounters.harvester;
                }
                const result = spawn.spawnCreep([WORK, CARRY, MOVE], name, { memory: { role: 'harvester' } });
                if (result === OK) {
                    console.log('🚜 New harvester created:', name);
                    Memory.creepCounters.harvester++;
                } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
                    console.log('⚠️ Failed to spawn harvester:', name, 'Error:', result);
                }
            } else if (transporters.length < MAX_TRANSPORTERS) {
                let name = 'Courier' + Memory.creepCounters.transporter;
                while (Game.creeps[name]) {
                    Memory.creepCounters.transporter++;
                    name = 'Courier' + Memory.creepCounters.transporter;
                }
                const result = spawn.spawnCreep([CARRY, CARRY, MOVE, MOVE], name, { memory: { role: 'transporter' } });
                if (result === OK) {
                    console.log('🚚 New courier created:', name);
                    Memory.creepCounters.transporter++;
                } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
                    console.log('⚠️ Failed to spawn courier:', name, 'Error:', result);
                }
            } else if (harvesters.length < MAX_HARVESTERS) {
                let name = 'Farmer' + Memory.creepCounters.harvester;
                while (Game.creeps[name]) {
                    Memory.creepCounters.harvester++;
                    name = 'Farmer' + Memory.creepCounters.harvester;
                }
                const result = spawn.spawnCreep([WORK, CARRY, MOVE], name, { memory: { role: 'harvester' } });
                if (result === OK) {
                    console.log('🚜 New harvester created:', name);
                    Memory.creepCounters.harvester++;
                } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
                    console.log('⚠️ Failed to spawn harvester:', name, 'Error:', result);
                }
            } else if (builders.length < MAX_BUILDERS) {
                let name = 'Builder' + Memory.creepCounters.builder;
                while (Game.creeps[name]) {
                    Memory.creepCounters.builder++;
                    name = 'Builder' + Memory.creepCounters.builder;
                }
                const result = spawn.spawnCreep([WORK, WORK, CARRY, CARRY, MOVE], name, { memory: { role: 'builder' } });
                if (result === OK) {
                    console.log('🧱 New builder created:', name);
                    Memory.creepCounters.builder++;
                } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
                    console.log('⚠️ Failed to spawn builder:', name, 'Error:', result);
                }
            } else if (upgraders.length < MAX_UPGRADERS) {
                let name = 'Upgrader' + Memory.creepCounters.upgrader;
                while (Game.creeps[name]) {
                    Memory.creepCounters.upgrader++;
                    name = 'Upgrader' + Memory.creepCounters.upgrader;
                }
                const result = spawn.spawnCreep([WORK, WORK, CARRY, CARRY, MOVE], name, { memory: { role: 'upgrader' } });
                if (result === OK) {
                    console.log('🚀 New upgrader created:', name);
                    Memory.creepCounters.upgrader++;
                } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
                    console.log('⚠️ Failed to spawn upgrader:', name, 'Error:', result);
                }
            } else if (medics.length < MAX_MEDICS) {
                let name = 'Medic' + Memory.creepCounters.medic;
                while (Game.creeps[name]) {
                    Memory.creepCounters.medic++;
                    name = 'Medic' + Memory.creepCounters.medic;
                }
                const result = spawn.spawnCreep([WORK, WORK, CARRY, MOVE], name, { memory: { role: 'medic' } });
                if (result === OK) {
                    console.log('🩺 New medic created:', name);
                    Memory.creepCounters.medic++;
                } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
                    console.log('⚠️ Failed to spawn medic:', name, 'Error:', result);
                }
            }
        // ...existing code...
    }
    // Run creep logic
    for (let name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === 'harvester') {
            roleHarvester.run(creep);
        } else if (creep.memory.role === 'builder') {
            roleBuilder.run(creep);
        } else if (creep.memory.role === 'upgrader') {
            roleUpgrader.run(creep);
        } else if (creep.memory.role === 'transporter') {
            roleTransporter.run(creep);
        } else if (creep.memory.role === 'medic') {
            roleMedic.run(creep);
        } else if (creep.memory.role === 'attacker') {
            roleAttacker.run(creep);
        } else if (creep.memory.role === 'healer') {
            roleHealer.run(creep);
        } else if (creep.memory.role === 'claimer') {
            require('role.claimer').run(creep);
        }
        // ...existing code...
    }
}
