const roleScout = {
    run: function(creep) {
        // Get my username for ownership checks
        let myUsername = undefined;
        if (Game.spawns && Object.values(Game.spawns)[0] && Object.values(Game.spawns)[0].owner) {
            myUsername = Object.values(Game.spawns)[0].owner.username;
        }
        // Helper: is room at map edge?
        const isMapEdge = roomName => {
            const match = roomName.match(/([WE])([0-9]+)([NS])([0-9]+)/);
            if (!match) return true;
            const x = parseInt(match[2], 10);
            const y = parseInt(match[4], 10);
            return x === 0 || x === 59 || y === 0 || y === 59;
        };

        // Track a history of visited rooms
        if (!creep.memory.roomHistory) creep.memory.roomHistory = [];
        if (creep.memory.roomHistory[creep.memory.roomHistory.length - 1] !== creep.room.name) {
            creep.memory.roomHistory.push(creep.room.name);
            if (creep.memory.roomHistory.length > 10) creep.memory.roomHistory.shift();
        }

        // Pick a new room to explore if not already moving to one
        if (!creep.memory.targetRoom || creep.room.name === creep.memory.targetRoom) {
            const exits = Game.map.describeExits(creep.room.name);
            let candidates = Object.values(exits).filter(roomName =>
                roomName !== creep.room.name &&
                !creep.memory.roomHistory.includes(roomName) &&
                !isMapEdge(roomName) &&
                !roomName.includes('31') &&
                !roomName.includes('30')
            );
            // If all exits are in history, pick any non-edge room not containing '30' or '31'
            if (candidates.length === 0) {
                candidates = Object.values(exits).filter(roomName => !isMapEdge(roomName) && !roomName.includes('31') && !roomName.includes('30'));
            }
            // If still none, pick any exit not containing '30' or '31'
            if (candidates.length === 0) {
                candidates = Object.values(exits).filter(roomName => !roomName.includes('31') && !roomName.includes('30'));
            }
            // If still none, pick any exit
            if (candidates.length === 0) {
                candidates = Object.values(exits);
            }
            if (candidates.length > 0) {
                creep.memory.targetRoom = candidates[Math.floor(Math.random() * candidates.length)];
            } else {
                creep.memory.targetRoom = creep.room.name;
            }
        }

        // If hit, show crying emoji first, then running away emoji and move to nearest exit
        if (creep.hits < creep.hitsMax) {
            if (!creep.memory.hasBeenHit) {
                creep.say('😭', true);
                creep.memory.hasBeenHit = true;
            } else {
                creep.say('🏃', true);
            }
            // Move to nearest exit
            const exits = Game.map.describeExits(creep.room.name);
            const exitPositions = [];
            for (const dir in exits) {
                const positions = creep.room.find(parseInt(dir));
                if (positions.length > 0) exitPositions.push(...positions);
            }
            if (exitPositions.length > 0) {
                const nearestExit = creep.pos.findClosestByRange(exitPositions);
                if (nearestExit) {
                    creep.moveTo(nearestExit, {visualizePathStyle: {stroke: '#ff0000'}});
                }
            }
            return;
        }

        // Wave at nearby creeps (once per creep)
        if (!creep.memory.greetedCreeps) creep.memory.greetedCreeps = {};
        const nearbyCreeps = creep.pos.findInRange(FIND_CREEPS, 2);
        for (const other of nearbyCreeps) {
            if (other.id !== creep.id && !creep.memory.greetedCreeps[other.id]) {
                creep.say('👋', true);
                creep.memory.greetedCreeps[other.id] = true;
                // Announce in console if the other creep is owned by another player
                if (other.owner && other.owner.username !== myUsername) {
                    console.log(`👋 Scout waved at ${other.name} owned by ${other.owner.username} in room ${creep.room.name}`);
                }
                break; // Only greet one per tick
            }
        }

        // Notify when discovering a room owned by another player
        const controller = creep.room.controller;
        if (controller && controller.owner && controller.owner.username !== myUsername) {
            const notifyKey = `scout_notified_${creep.room.name}_${controller.owner.username}`;
            if (!Memory[notifyKey]) {
                const message = `📧 Scout discovered room ${creep.room.name} owned by ${controller.owner.username}`;
                Game.notify(message, 0);
                console.log(message);
                creep.say('📧', true);
                Memory[notifyKey] = true;
            }
        }

        // Move to the center of the target room
        if (creep.room.name !== creep.memory.targetRoom) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {visualizePathStyle: {stroke: '#00ff00'}});
        }
    }
};
module.exports = roleScout;
