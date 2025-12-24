-- Pocket Computer Remote Control for Coal Mining Turtles
-- Controls individual or all turtles in fleet

local modem = peripheral.find("modem")
if not modem then
    error("No wireless modem found!")
end

rednet.open(peripheral.getName(modem))

-- Turtle tracking
local turtles = {}
local selectedIndex = 1
local STALE_TIMEOUT = 30

-- Display turtles list
local function displayTurtles()
    term.clear()
    term.setCursorPos(1, 1)
    print("=== TURTLE FLEET CONTROL ===")
    print("")
    
    -- Sort turtles by name
    local sortedTurtles = {}
    for id, data in pairs(turtles) do
        table.insert(sortedTurtles, {id = id, data = data})
    end
    table.sort(sortedTurtles, function(a, b) return a.data.name < b.data.name end)
    
    -- Remove stale turtles
    for i = #sortedTurtles, 1, -1 do
        if os.clock() - sortedTurtles[i].data.lastSeen > STALE_TIMEOUT then
            turtles[sortedTurtles[i].id] = nil
            table.remove(sortedTurtles, i)
        end
    end
    
    if #sortedTurtles == 0 then
        print("No active turtles found")
        print("Waiting for status broadcasts...")
        return
    end
    
    -- Display each turtle
    for i, turtle in ipairs(sortedTurtles) do
        local data = turtle.data
        local prefix = (i == selectedIndex) and "> " or "  "
        local color = (i == selectedIndex) and colors.yellow or colors.white
        
        -- Color based on status
        if data.status == "paused" or data.status == "waiting" then
            color = colors.gray
        elseif data.fuelPercent and data.fuelPercent <= 39 then
            color = colors.red
        elseif data.fuelPercent and data.fuelPercent <= 69 then
            color = (i == selectedIndex) and colors.yellow or colors.orange
        elseif i ~= selectedIndex then
            color = colors.green
        end
        
        term.setTextColor(color)
        print(string.format("%s%s", prefix, data.name))
        term.setTextColor(colors.white)
        print(string.format("   Fuel: %d%% | Coal: %d", 
            data.fuelPercent or 0, 
            data.coal or 0))
        print(string.format("   Status: %s", data.status or "unknown"))
        print("")
    end
    
    -- Controls help
    term.setTextColor(colors.lightGray)
    print("----------------------------")
    print("UP/DOWN: Select turtle")
    print("R: Return selected to base")
    print("G: Resume selected turtle")
    print("A: Return ALL turtles")
    print("H: Resume ALL turtles")
    print("Q: Quit")
end

-- Send command to turtle
local function sendCommand(turtleId, command)
    rednet.broadcast({
        command = command,
        target = turtleId
    }, "turtle_command")
end

-- Main control loop
local function main()
    print("Initializing remote control...")
    print("Discovering turtles...")
    sleep(2)
    
    while true do
        -- Listen for turtle status updates
        local senderId, message = rednet.receive("turtle_status", 0.5)
        
        if senderId and message then
            turtles[senderId] = {
                name = message.name or "turtle_" .. senderId,
                fuel = message.fuel or 0,
                fuelPercent = message.fuelPercent or 0,
                coal = message.coal or 0,
                status = message.status or "unknown",
                position = message.position or {x=0, y=0, z=0},
                lastSeen = os.clock()
            }
        end
        
        -- Display current state
        displayTurtles()
        
        -- Check for user input
        local event, key = os.pullEvent("key")
        
        -- Get sorted list for navigation
        local sortedTurtles = {}
        for id, data in pairs(turtles) do
            table.insert(sortedTurtles, {id = id, data = data})
        end
        table.sort(sortedTurtles, function(a, b) return a.data.name < b.data.name end)
        
        if #sortedTurtles > 0 then
            if key == keys.up then
                -- Move selection up
                selectedIndex = selectedIndex - 1
                if selectedIndex < 1 then
                    selectedIndex = #sortedTurtles
                end
                
            elseif key == keys.down then
                -- Move selection down
                selectedIndex = selectedIndex + 1
                if selectedIndex > #sortedTurtles then
                    selectedIndex = 1
                end
                
            elseif key == keys.r then
                -- Return selected turtle
                local selectedTurtle = sortedTurtles[selectedIndex]
                if selectedTurtle then
                    print("Sending return command to " .. selectedTurtle.data.name)
                    sendCommand(selectedTurtle.data.name, "return")
                    sleep(0.5)
                end
                
            elseif key == keys.g then
                -- Resume selected turtle
                local selectedTurtle = sortedTurtles[selectedIndex]
                if selectedTurtle then
                    print("Sending resume command to " .. selectedTurtle.data.name)
                    sendCommand(selectedTurtle.data.name, "resume")
                    sleep(0.5)
                end
                
            elseif key == keys.a then
                -- Return ALL turtles
                print("Returning ALL turtles to base...")
                for _, turtle in ipairs(sortedTurtles) do
                    sendCommand(turtle.data.name, "return")
                    sleep(0.2)  -- Small delay between commands
                end
                sleep(1)
                
            elseif key == keys.h then
                -- Resume ALL turtles
                print("Resuming ALL turtles...")
                for _, turtle in ipairs(sortedTurtles) do
                    sendCommand(turtle.data.name, "resume")
                    sleep(0.2)  -- Small delay between commands
                end
                sleep(1)
            end
        end
        
        if key == keys.q then
            -- Quit
            term.clear()
            term.setCursorPos(1, 1)
            print("Remote control closed")
            return
        end
    end
end

-- Run the program
main()
