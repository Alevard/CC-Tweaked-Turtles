const roleMedic = {
    run: function(creep) {
        // If empty, get energy from nearest container or dropped energy
        if (creep.store[RESOURCE_ENERGY] === 0) {
            // Resting emoji when refueling
            creep.say('😴', 5);
            const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 0
            });
            if (dropped.length > 0) {
                const nearest = creep.pos.findClosestByRange(dropped);
                if (nearest) {
                    if (creep.pickup(nearest) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(nearest, {visualizePathStyle: {stroke: '#00ff00'}, maxRooms: 1});
                    }
                    return;
                }
            }
            const containers = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
            });
            if (containers.length > 0) {
                const nearest = creep.pos.findClosestByRange(containers);
                if (nearest) {
                    if (creep.withdraw(nearest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(nearest, {visualizePathStyle: {stroke: '#00ff00'}, maxRooms: 1});
                    }
                }
            }
        } else {
            // Find nearest damaged structure (not walls/ramparts unless below 1000 hits)
            let targets = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.hits < s.hitsMax && (
                    s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART || s.hits < 1000)
            });
            if (targets.length > 0) {
                targets.sort((a, b) => a.hits - b.hits);
                const target = creep.pos.findClosestByRange(targets);
                if (target) {
                    // Wrench emoji when moving to repair
                    if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}, maxRooms: 1});
                        creep.say('🔧', 5);
                    }
                }
            }
        }
    }
};

module.exports = roleMedic;
