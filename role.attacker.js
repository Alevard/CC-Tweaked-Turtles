const roleAttacker = {
    run: function(creep) {
        // Move to target room if specified
        if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {visualizePathStyle: {stroke: '#ff0000'}});
            creep.say('➡️', true);
            return;
        }
        // Attack nearest hostile structure (prefer tower)
        let target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        });
        if (!target) {
            target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
        }
        if (target) {
            if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
            } else {
                creep.say('⚔️', true);
            }
        } else {
            creep.say('No tgt', true);
        }
    }
};

module.exports = roleAttacker;
