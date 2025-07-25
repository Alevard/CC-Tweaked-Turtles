const roleTransporter = {
    run: function(creep) {
        // Always prioritize delivering to spawn/extensions first
        const allContainers = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        });
        const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
        const spawnOrExtensions = creep.room.find(FIND_STRUCTURES, {
            filter: s => (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        // If empty, pick up dropped energy first, then fallback to container withdrawal
        if (creep.store[RESOURCE_ENERGY] === 0) {
            // Look for dropped energy in the room
            const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 0
            });
            if (dropped.length > 0) {
                const nearest = creep.pos.findClosestByRange(dropped);
                if (nearest) {
                    if (creep.pickup(nearest) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(nearest, {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                    } else if (creep.pickup(nearest) === OK) {
                        creep.say('🚚', 5);
                    }
                    return;
                }
            }
            // If no dropped energy, fallback to nearest container withdrawal
            const containers = allContainers.filter(s => s.store[RESOURCE_ENERGY] > 0);
            if (containers.length > 0) {
                const nearest = creep.pos.findClosestByRange(containers);
                if (nearest) {
                    if (creep.withdraw(nearest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(nearest, {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                    } else if (creep.withdraw(nearest, RESOURCE_ENERGY) === OK) {
                        creep.say('🚚', 5);
                    }
                }
            }
        } else {
            // Always deliver to spawn/extensions first if not full
            if (spawnOrExtensions.length > 0) {
                const nearest = creep.pos.findClosestByRange(spawnOrExtensions);
                if (nearest) {
                    if (creep.transfer(nearest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(nearest, {visualizePathStyle: {stroke: '#ffffff'}, maxRooms: 1});
                    } else if (creep.transfer(nearest, RESOURCE_ENERGY) === OK) {
                        creep.say('📦', 5);
                    }
                    return;
                }
            }
            // Otherwise deliver to nearest container with space
            const containers = allContainers.filter(c => c.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            if (containers.length > 0) {
                const nearest = creep.pos.findClosestByRange(containers);
                if (nearest) {
                    if (creep.transfer(nearest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(nearest, {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                    } else if (creep.transfer(nearest, RESOURCE_ENERGY) === OK) {
                        creep.say('📦', 5);
                    }
                }
            }
        }
    }
};

module.exports = roleTransporter;
