-- Fleet Dashboard for 3x5 Monitor (17 Turtles)
-- Displays turtle name, fuel %, and inventory %
-- Ultra-compact format optimized for parallel mining operation

local monitor = peripheral.find("monitor")
if not monitor then
    error("No monitor found!")
end

local modem = peripheral.find("modem")
if not modem then
    error("No wireless modem found!")
end

rednet.open(peripheral.getName(modem))

-- Turtle tracking
local turtles = {}
local STALE_TIMEOUT = 30

-- Display configuration
monitor.setTextScale(0.5)
monitor.clear()

local function getInventoryPercent(coal, maxSlots)
    -- Assuming coal stacks to 64, calculate % of total inventory space used
    maxSlots = maxSlots or 16  -- Turtles have 16 slots
    local maxItems = maxSlots * 64
    return math.floor((coal / maxItems) * 100)
end

local function displayDashboard()
    monitor.clear()
    monitor.setCursorPos(1, 1)
    
    -- Header
    monitor.setTextColor(colors.white)
    monitor.write("COAL MINING FLEET")
    monitor.setCursorPos(1, 2)
    monitor.write("Name       Fuel  Inv")
    monitor.setCursorPos(1, 3)
    monitor.write(string.rep("-", 25))
    
    -- Sort turtles by ID for consistent display
    local sortedTurtles = {}
    for id, data in pairs(turtles) do
        table.insert(sortedTurtles, {id = id, data = data})
    end
    table.sort(sortedTurtles, function(a, b) return a.id < b.id end)
    
    -- Display each turtle (compact format)
    local line = 4
    local activeTurtles = 0
    local totalCoal = 0
    
    for _, turtle in ipairs(sortedTurtles) do
        local data = turtle.data
        
        -- Skip stale turtles
        if os.clock() - data.lastSeen > STALE_TIMEOUT then
            turtles[turtle.id] = nil
        else
            -- Shorten turtle name: "coal_miner_1" -> "T1"
            local shortName = data.name:gsub("coal_miner_", "T")
            
            -- Calculate percentages
            local fuelPercent = math.floor((data.fuel / 100000) * 100)  -- Updated to 100k max fuel
            local invPercent = getInventoryPercent(data.coal, 16)
            
            -- Set color based on fuel level and status
            if data.status == "paused" then
                monitor.setTextColor(colors.gray)
            elseif fuelPercent <= 39 then
                monitor.setTextColor(colors.red)
            elseif fuelPercent >= 40 and fuelPercent <= 69 then
                monitor.setTextColor(colors.yellow)
            elseif invPercent >= 90 then
                monitor.setTextColor(colors.orange)
            else
                monitor.setTextColor(colors.green)
                activeTurtles = activeTurtles + 1
            end
            
            -- Format: "T1         85%   45%"
            local displayLine = string.format("%-10s %3d%%  %3d%%", 
                shortName, 
                fuelPercent, 
                invPercent
            )
            
            monitor.setCursorPos(1, line)
            monitor.write(displayLine)
            
            totalCoal = totalCoal + data.coal
            line = line + 1
        end
    end
    
    -- Footer with summary
    monitor.setCursorPos(1, line + 1)
    monitor.setTextColor(colors.white)
    monitor.write(string.rep("-", 25))
    monitor.setCursorPos(1, line + 2)
    monitor.write(string.format("Active: %d/%d", activeTurtles, #sortedTurtles))
    monitor.setCursorPos(1, line + 3)
    monitor.write(string.format("Total Coal: %d", totalCoal))
end

-- Main loop
print("Fleet Dashboard Running...")
print("Monitoring 17 mining turtles")
print("Press Ctrl+T to stop")

while true do
    -- Listen for turtle status updates
    local senderId, message = rednet.receive("turtle_status", 1)
    
    if senderId and message then
        -- Update turtle data
        turtles[senderId] = {
            name = message.name or "turtle_" .. senderId,
            fuel = message.fuel or 0,
            coal = message.coal or 0,
            status = message.status or "unknown",
            lastSeen = os.clock()
        }
        
        -- Refresh display
        displayDashboard()
    end
    
    -- Periodic refresh to remove stale turtles
    if math.random() < 0.1 then  -- 10% chance each loop
        displayDashboard()
    end
end
