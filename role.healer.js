const roleHealer = {
    run: function(creep) {
        // ...
        // If targetRoom is not a valid Screeps room name, forcibly reset to E22N28
        if (typeof creep.memory.targetRoom !== 'string' || !/^[WE]\d{2}[NS]\d{2}$/.test(creep.memory.targetRoom)) {
            creep.memory.targetRoom = 'E22N28';
        }
        // Move to target room if specified and valid
        if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
            try {
                creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {visualizePathStyle: {stroke: '#00ff00'}});
            } catch (e) {
            creep.say('ERR', 5);
            }
            creep.say('➡️', 5);
            return;
        }
        // Heal the nearest injured friendly creep
        const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: c => c.hits < c.hitsMax
        });
        if (target) {
            if (creep.heal(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
            } else {
                creep.say('💉', 5);
            }
        } else {
            // If no one to heal, follow the nearest attacker
            const attacker = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: c => c.memory.role === 'attacker'
            });
            if (attacker) {
                creep.moveTo(attacker, {visualizePathStyle: {stroke: '#00ff00'}});
                creep.say('👣', 5);
            } else {
                creep.say('Idle', 5);
            }
        }
    }
};

module.exports = roleHealer;
