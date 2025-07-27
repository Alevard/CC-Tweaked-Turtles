const roleBuilder = {
    run: function(creep) {
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
            creep.say('🔄', true);
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
            creep.say('🚧', true);
        }

        if (creep.memory.building) {
            const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                // Prioritize construction site with the most progress done
                const sortedSites = _.sortBy(targets, s => -s.progress);
                const site = sortedSites[0];
                const containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) =>
                        structure.structureType === STRUCTURE_CONTAINER &&
                        structure.store[RESOURCE_ENERGY] > 0
                });
                if (containers.length > 0 && creep.store[RESOURCE_ENERGY] === 0) {
                    // Find the nearest container to the builder
                    const nearest = creep.pos.findClosestByRange(containers);
                    if (nearest) {
                        if (creep.withdraw(nearest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(nearest, {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                        }
                        return;
                    }
                }
                // Build if we have energy
                if (creep.build(site) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(site, {visualizePathStyle: {stroke: '#ffffff'}, maxRooms: 1});
                }
                return;
            }
            // If no construction sites, repair nearest damaged road
            const damagedRoads = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax
            });
            if (damagedRoads.length > 0) {
                const nearest = creep.pos.findClosestByRange(damagedRoads);
                if (nearest) {
                    if (creep.repair(nearest) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(nearest, {visualizePathStyle: {stroke: '#8888ff'}, maxRooms: 1});
                    }
                    return;
                }
            }
            // If nothing to do, move to Idle flag if it exists
            const idleFlag = Game.flags['Idle'];
            if (idleFlag) {
                creep.moveTo(idleFlag, {visualizePathStyle: {stroke: '#00ff00'}, maxRooms: 1});
                creep.say('🪧', 5);
            }
        } else {
            // Try to withdraw from the nearest container first
            const containers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) =>
                    structure.structureType === STRUCTURE_CONTAINER &&
                    structure.store[RESOURCE_ENERGY] > 0
            });
            if (containers.length > 0) {
                // Find the nearest container to the builder
                const nearest = creep.pos.findClosestByRange(containers);
                if (nearest) {
                    if (creep.withdraw(nearest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(nearest, {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                    }
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
    }
};

module.exports = roleBuilder;
