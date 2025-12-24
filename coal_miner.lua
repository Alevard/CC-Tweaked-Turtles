-- Coal Mining Turtle - Straight Line Mining
-- Maintains 50% fuel reserve, returns to deposit when inventory full
-- Simplified for parallel branch mining operation

local CONFIG = {
    TURTLE_ID = os.getComputerLabel() or "Turtle" .. os.getComputerID(),  -- Uses label if set, otherwise computer ID
    CHEST_SIDE = "back",
    MIN_FUEL_PERCENT = 2,  -- Return home if fuel drops below 2%
    MAX_FUEL = 100000,  -- Maximum fuel capacity (turtles can hold ~100k fuel)
    FUEL_RESERVE = 2000,  -- Keep 2% fuel (2,000) in reserve
    MIN_FUEL_TO_MINE = 200,  -- Minimum fuel needed to continue mining
    INVENTORY_FULL_PERCENT = 90,  -- Return when inventory is 90% full
    TUNNEL_LENGTH = 250,  -- Length of each horizontal tunnel
    MAX_DEPTH = 500,  -- Maximum depth to mine (500 blocks down from start)
}

-- Position tracking
local position = {x = 0, y = 0, z = 0, facing = 0}
local startY = 0  -- Track starting Y level
local currentDepth = 0  -- Current depth from start
local NORTH, EAST, SOUTH, WEST = 0, 1, 2, 3

-- Remote control state
local paused = false

-- Initialize modem for remote control
local function initModem()
    for _, side in ipairs({"top", "bottom", "left", "right", "front", "back"}) do
        if peripheral.getType(side) == "modem" then
            rednet.open(side)
            print("Modem found on " .. side)
            return true
        end
    end
    print("Warning: No modem found, remote control disabled")
    return false
end

-- Broadcast status
local function broadcastStatus(status)
    local coal = getCoalCount()
    local fuel = turtle.getFuelLevel()
    local fuelPercent = math.floor((fuel / CONFIG.MAX_FUEL) * 100)
    
    rednet.broadcast({
        name = CONFIG.TURTLE_ID,
        fuel = fuel,
        fuelPercent = fuelPercent,
        coal = coal,
        status = status,
        position = {x = position.x, y = position.y, z = position.z}
    }, "turtle_status")
end

-- Check for remote commands
local function checkForCommands()
    local senderId, message, protocol = rednet.receive("turtle_command", 0)
    if message then
        if message.command == "return" and (message.target == CONFIG.TURTLE_ID or message.target == "all") then
            print("Received return command")
            paused = true
            return true
        elseif message.command == "resume" and (message.target == CONFIG.TURTLE_ID or message.target == "all") then
            print("Received resume command")
            paused = false
            return true
        elseif message.command == "status" then
            broadcastStatus(paused and "paused" or "mining")
        end
    end
    return false
end

-- Get coal count in inventory
function getCoalCount()
    local total = 0
    for slot = 1, 16 do
        local item = turtle.getItemDetail(slot)
        if item and (item.name == "minecraft:coal" or item.name == "minecraft:charcoal") then
            total = total + item.count
        end
    end
    return total
end

-- Check if inventory is full
local function isInventoryFull()
    local coal = getCoalCount()
    local maxCapacity = 16 * 64  -- 16 slots × 64 items
    local usedPercent = (coal / maxCapacity) * 100
    return usedPercent >= CONFIG.INVENTORY_FULL_PERCENT
end

-- Refuel from inventory if needed
local function refuel()
    local currentFuel = turtle.getFuelLevel()
    
    if currentFuel < CONFIG.MIN_FUEL_TO_MINE then
        print("Low fuel, refueling...")
        
        for slot = 1, 16 do
            local item = turtle.getItemDetail(slot)
            if item and (item.name == "minecraft:coal" or item.name == "minecraft:charcoal") then
                turtle.select(slot)
                turtle.refuel(1)  -- Just refuel 1 coal at a time as needed
                currentFuel = turtle.getFuelLevel()
                
                if currentFuel >= CONFIG.MIN_FUEL_TO_MINE then
                    break
                end
            end
        end
        turtle.select(1)
    end
end

-- Check if block is coal
local function isCoal(name)
    return name == "minecraft:coal_ore" or name == "minecraft:deepslate_coal_ore"
end

-- Update position based on movement
local function updatePosition(direction)
    if direction == "forward" then
        if position.facing == NORTH then position.z = position.z - 1
        elseif position.facing == EAST then position.x = position.x + 1
        elseif position.facing == SOUTH then position.z = position.z + 1
        elseif position.facing == WEST then position.x = position.x - 1 end
    elseif direction == "up" then
        position.y = position.y + 1
    elseif direction == "down" then
        position.y = position.y - 1
    end
end

-- Movement with position tracking
local function forward()
    while not turtle.forward() do
        if turtle.detect() then
            turtle.dig()
        else
            turtle.attack()
        end
        sleep(0.5)
    end
    updatePosition("forward")
    return true
end

local function up()
    while not turtle.up() do
        if turtle.detectUp() then
            turtle.digUp()
        else
            turtle.attackUp()
        end
        sleep(0.5)
    end
    updatePosition("up")
    return true
end

local function down()
    while not turtle.down() do
        if turtle.detectDown() then
            turtle.digDown()
        else
            turtle.attackDown()
        end
        sleep(0.5)
    end
    updatePosition("down")
    return true
end

local function turnRight()
    turtle.turnRight()
    position.facing = (position.facing + 1) % 4
end

local function turnLeft()
    turtle.turnLeft()
    position.facing = (position.facing - 1) % 4
end

local function turnAround()
    turnRight()
    turnRight()
end

-- Navigate to target coordinates
local function navigateTo(targetX, targetY, targetZ)
    -- Move vertically first
    while position.y < targetY do
        up()
    end
    while position.y > targetY do
        down()
    end
    
    -- Move horizontally
    while position.x ~= targetX or position.z ~= targetZ do
        local dx = targetX - position.x
        local dz = targetZ - position.z
        
        if dx ~= 0 then
            local targetFacing = dx > 0 and EAST or WEST
            while position.facing ~= targetFacing do
                turnRight()
            end
            forward()
        elseif dz ~= 0 then
            local targetFacing = dz > 0 and SOUTH or NORTH
            while position.facing ~= targetFacing do
                turnRight()
            end
            forward()
        end
    end
    
    -- Face north at end
    while position.facing ~= NORTH do
        turnRight()
    end
end

-- Return to base
local function returnToBase()
    print("Returning to base...")
    broadcastStatus("returning")
    navigateTo(0, 0, 0)
end

-- Deposit coal in chest
local function depositCoal()
    print("Depositing coal...")
    turnAround()
    
    local coalDeposited = 0
    
    for slot = 1, 16 do
        local item = turtle.getItemDetail(slot)
        if item and (item.name == "minecraft:coal" or item.name == "minecraft:charcoal") then
            turtle.select(slot)
            -- Keep 5 coal for fuel, deposit the rest
            if item.count > 5 then
                turtle.drop(item.count - 5)
                coalDeposited = coalDeposited + (item.count - 5)
            end
        end
    end
    
    turtle.select(1)
    turnAround()
    print("Deposited " .. coalDeposited .. " coal")
    
    refuel()
    broadcastStatus("deposited")
end

-- Mine if block is coal
local function mineIfCoal(direction)
    local detect, inspect
    if direction == "forward" then
        detect, inspect = turtle.detect, turtle.inspect
    elseif direction == "up" then
        detect, inspect = turtle.detectUp, turtle.inspectUp
    elseif direction == "down" then
        detect, inspect = turtle.detectDown, turtle.inspectDown
    end
    
    if detect() then
        local success, data = inspect()
        if success and isCoal(data.name) then
            if direction == "forward" then
                turtle.dig()
            elseif direction == "up" then
                turtle.digUp()
            elseif direction == "down" then
                turtle.digDown()
            end
            return true
        end
    end
    return false
end

-- Check fuel level and return if below 50%
local function checkFuelLevel()
    local fuel = turtle.getFuelLevel()
    local fuelPercent = (fuel / CONFIG.MAX_FUEL) * 100
    
    if fuelPercent < CONFIG.MIN_FUEL_PERCENT then
        print(string.format("Fuel at %d%%, returning to base", math.floor(fuelPercent)))
        return true
    end
    return false
end

-- Wait while paused
local function waitWhilePaused()
    while paused do
        broadcastStatus("paused")
        sleep(2)
        checkForCommands()
    end
end

-- Main mining function - layered horizontal mining
local function mineForward()
    print("Starting layered mining operation")
    print("Tunnel length: " .. CONFIG.TUNNEL_LENGTH .. " blocks")
    print("Max depth: " .. CONFIG.MAX_DEPTH .. " blocks")
    print("Press Ctrl+T to stop")
    
    local blocksMined = 0
    local tunnelStartX = position.x
    local tunnelStartZ = position.z
    
    while true do
        -- Check if we've reached maximum depth
        if currentDepth >= CONFIG.MAX_DEPTH then
            print("Reached maximum depth of " .. CONFIG.MAX_DEPTH .. " blocks")
            print("Returning to base and parking permanently")
            returnToBase()
            broadcastStatus("completed")
            print("Mining operation complete. Turtle parked.")
            return  -- Exit the program
        end
        
        -- Check for remote commands
        checkForCommands()
        waitWhilePaused()
        
        -- Check if inventory full
        if isInventoryFull() then
            print("Inventory full, returning to base")
            local currentX, currentY, currentZ = position.x, position.y, position.z
            returnToBase()
            depositCoal()
            
            -- Return to where we left off
            print("Returning to mining position...")
            navigateTo(currentX, currentY, currentZ)
        end
        
        -- Refuel if needed
        refuel()
        
        -- Mine coal around current position
        mineIfCoal("up")
        mineIfCoal("down")
        
        -- Mine forward and move
        if turtle.detect() then
            local success, data = turtle.inspect()
            if success and isCoal(data.name) then
                turtle.dig()
                blocksMined = blocksMined + 1
            end
        end
        
        forward()
        
        -- Check if we've reached the end of the tunnel
        local distanceFromStart = math.abs(position.x - tunnelStartX) + math.abs(position.z - tunnelStartZ)
        
        if distanceFromStart >= CONFIG.TUNNEL_LENGTH then
            print("Completed tunnel at depth " .. currentDepth)
            
            -- Return to tunnel start position
            navigateTo(tunnelStartX, position.y, tunnelStartZ)
            
            -- Move down one block for next layer
            down()
            currentDepth = currentDepth + 1
            
            print("Moving to depth " .. currentDepth .. " / " .. CONFIG.MAX_DEPTH)
            broadcastStatus("descending")
            
            -- Reset for next tunnel
            tunnelStartX = position.x
            tunnelStartZ = position.z
        end
        
        -- Broadcast status every 10 blocks
        if blocksMined % 10 == 0 then
            broadcastStatus("mining")
        end
        
        sleep(0.1)
    end
end

-- Main program
print("Coal Mining Turtle - " .. CONFIG.TURTLE_ID)
print("Layered mining mode: " .. CONFIG.TUNNEL_LENGTH .. " blocks per layer")
print("Maximum depth: " .. CONFIG.MAX_DEPTH .. " blocks")
print("Fuel reserve: 50% (" .. CONFIG.FUEL_RESERVE .. " units)")

-- Record starting Y level
startY = position.y

initModem()
broadcastStatus("ready")

-- Start mining
mineForward()
