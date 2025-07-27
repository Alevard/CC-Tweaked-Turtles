const roleClaimer = {
    run: function(creep) {
        // Set target room
        if (typeof creep.memory.targetRoom !== 'string' || !/^[WE]\d{2}[NS]\d{2}$/.test(creep.memory.targetRoom)) {
            creep.memory.targetRoom = 'E22N28';
        }
        // Move to target room if not there
        if (creep.room.name !== creep.memory.targetRoom) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {visualizePathStyle: {stroke: '#ffff00'}});
            creep.say('🏳️', 5);
            return;
        }
        // Try to claim the controller
        if (creep.room.controller) {
            if (creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffff00'}});
            } else {
                creep.say('👑', 5);
            }
        }
    }
};

module.exports = roleClaimer;
