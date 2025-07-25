const roleUpgrader = {
    run: function(creep) {
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.upgrading = false;
            creep.say('🐎', true); // collecting energy (horse), public, 5 ticks
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
            creep.memory.upgrading = true;
            creep.say('🏰', true); // upgrading controller (castle), public, 5 ticks
        }

        if (creep.memory.upgrading) {
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}, maxRooms: 1});
            }
        } else {
            // Prefer the container nearest to the room controller, not the creep
            const containers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) =>
                    structure.structureType === STRUCTURE_CONTAINER &&
                    structure.store[RESOURCE_ENERGY] > 0
            });
            if (containers.length > 0) {
                const controller = creep.room.controller;
                const nearest = controller.pos.findClosestByRange(containers);
                if (nearest) {
                    if (creep.withdraw(nearest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(nearest, {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                    }
                }
            } else {
                // Withdraw from spawn if no containers nearby and spawn has more than 449 energy
                const spawns = creep.room.find(FIND_MY_SPAWNS, {
                    filter: (spawn) => spawn.store[RESOURCE_ENERGY] > 449
                });
                if (spawns.length > 0) {
                    if (creep.withdraw(spawns[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(spawns[0], {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                    }
                } else {
                    // As a last resort, pick up dropped energy
                    const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
                        filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 0
                    });
                    if (dropped.length > 0) {
                        const nearest = creep.pos.findClosestByRange(dropped);
                        if (nearest) {
                            if (creep.pickup(nearest) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(nearest, {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                            }
                        }
                    }
                }
            }
        } // closes else branch for energy collection
    }
};

module.exports = roleUpgrader;
