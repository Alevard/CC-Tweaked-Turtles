const roleHarvester = {
    run: function(creep) {
        // State machine: harvesting or delivering
        if (creep.memory.harvesting && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.harvesting = false;
            creep.say('⛏️', true); // start harvesting
        }
        if (!creep.memory.harvesting && creep.store.getFreeCapacity() === 0) {
            creep.memory.harvesting = true;
            creep.say('📦', true); // start delivering
        }

        // Always drop energy if carrying any
        if (creep.store[RESOURCE_ENERGY] > 0) {
            creep.drop(RESOURCE_ENERGY);
        }
        // Always harvest if not full
        if (creep.store.getFreeCapacity() > 0) {
            // Only target sources not at or adjacent to the room edge (avoid pathing bugs)
            const sources = creep.room.find(FIND_SOURCES, {
                filter: s => s.pos.x > 1 && s.pos.x < 48 && s.pos.y > 1 && s.pos.y < 48
            });
            // Find all sources with energy
            const sourcesWithEnergy = sources.filter(source => source.energy > 0);
            // Sort sources by proximity
            const sortedSources = sourcesWithEnergy.sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b));
            let harvested = false;
            for (const source of sortedSources) {
                // Check if adjacent tile is free or creep is already adjacent
                const isAdjacent = creep.pos.isNearTo(source);
                const creepsNear = source.pos.findInRange(FIND_MY_CREEPS, 1, {
                    filter: c => c.memory.role === 'harvester' && c.id !== creep.id
                });
                if (isAdjacent || creepsNear.length < 1) {
                    const result = creep.harvest(source);
                    if (result === OK) {
                        harvested = true;
                        break;
                    } else if (result === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                        harvested = true;
                        break;
                    }
                }
            }
            // If not harvested, idle near the closest source (even if blocked or empty)
            if (!harvested && sources.length > 0) {
                const nearestSource = creep.pos.findClosestByRange(sources);
                if (nearestSource) {
                    creep.moveTo(nearestSource, {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                }
            }
        }
    }
};

module.exports = roleHarvester;