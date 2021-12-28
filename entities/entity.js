require('../world')

world = new World()

var colTiles = [3]
var intTiles = [7]
var autoGuns = ["shroom_k"]
var singleGuns = ["hunting_rifle"]
var meleeWeapons = ["survival_knife"]
var miningTools = ["bronze_pickaxe", "iron_pickaxe"]
var placeableItems = ["rock", "rocky_floor"]
var priorityTiles = [7]
var placeIds = {
    "rock" : 3,
    "rocky_floor" : 2,
}
var miningToolStrengths = { // must be integer
    "bronze_pickaxe": 1,
    "iron_pickaxe": 2,
}

craftingRecipes = [
    ["medkit", "adrenaline", "cave_beef"],
    ["rock", "rocky_floor", "almond_water"]
]

var initPack = {player:[],bullet:[],floof:[]}
var removePack = {player:[],bullet:[],floof:[]}

function randomRange(min, max) {  
    return Math.floor(Math.random() * (max - min) + min); 
}  

function inverse(obj){
    var retobj = {};
    for(var key in obj){
      retobj[obj[key]] = key;
    }
    return retobj;
  }

// Entity -----------------------------------------------------------------------
Entity = function(){
    var self = {
        // 1 tile = 50px, co-ords = (x * 50, y * 50)
        x:25600, // spawn at (500, 500)
        y:25600,
        speedX:0,
        speedY:0,
        id:"",
    }
    self.update = function(){
        self.updatePosition()
    }
    self.updatePosition = function(){
        self.x += self.speedX
        self.y += self.speedY
    }
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x, 2) + Math.pow(self.y-pt.y, 2))
    }
    return self
}
Entity.getFrameUpdateData = function(){
    var pack = {
        initPack:{
            player:initPack.player,
            bullet:initPack.bullet,
            floof:initPack.floof,
        },
        removePack:{
            player:removePack.player,
            bullet:removePack.bullet,
            floof:removePack.floof,
        },
        updatePack:{
            player:Player.update(),
            bullet:Bullet.update(),
            floof:Floof.update(),
        }
    }

    initPack.player = []
    initPack.bullet = []
    initPack.floof = []

    removePack.player = []
    removePack.bullet = []
    removePack.floof = []

    return pack
}

// Player -----------------------------------------------------------------------
{
Player = function(id, username, socket, progress){
    var self = Entity()
    self.id = id
    self.number = "" + Math.floor(Math.random() * 100)
    self.username = username
    self.inventory = new Inventory(progress.items, socket, true)
    self.effects = []
    self.pressingRight = false
    self.pressingLeft = false
    self.pressingUp = false
    self.pressingDown = false
    self.holdingMouseLeft = false
    self.holdingMouseRight = false
    self.mouseX = 0
    self.mouseY = 0
    self.mouseCanvasX = 0
    self.mouseCanvasY = 0
    self.mouseAngle = 0
    self.maxSpeed = 10
    self.hp = 100
    self.hpMax = 100
    self.score = 0
    self.activeSlot = 0
    self.hotbar = ["Nothing", "Nothing", "Nothing", "Nothing", "Nothing"]
    self.loadedChunks = []
    self.lookingRight = false
    self.spriteId = undefined
    self.currentRightClick = 0
    self.lastRightClick = 0
    self.currentLeftClick = 0
    self.lastLeftClick = 0
    self.tileDestroyState = 0

    self.inventory.addItem("survival_knife", 1)
    self.inventory.addItem("bronze_pickaxe", 1)
    self.inventory.addItem("iron_pickaxe", 1)
    self.inventory.addItem("rock", 32)
    self.inventory.addItem("shroom_k", 1)
    self.inventory.addItem("hunting_rifle", 1)
    self.inventory.addItem("almond_water", 15)

    var superUpdate = self.update;
    self.update = function(){
        self.updateSpeed()
        superUpdate()

        for(var i = 0; i < self.hotbar.length; i++)
            if(!self.inventory.hasItem(self.hotbar[i], 1) && self.hotbar[i] !== "Nothing")
                self.hotbar[i] = "Nothing"

        self.mouseCanvasX = self.mouseX + self.x - 900 // 900 = 1800/2
        self.mouseCanvasY = self.mouseY + self.y - 480 // 480 = 960/2

        let currentChunk = world.getChunk(Math.floor((self.x / 50) / 32), Math.floor((self.y / 50) / 32))
        
        let currentMouseChunk = world.getChunk(Math.floor((self.mouseCanvasX / 50) / 32), Math.floor((self.mouseCanvasY / 50) / 32))
        let mouseXInChunk = Math.floor(self.mouseCanvasX / 50 - currentMouseChunk.x * 32)
        let mouseYInChunk = Math.floor(self.mouseCanvasY / 50 - currentMouseChunk.y * 32)

        let mouseChunkX = Math.floor((self.mouseCanvasX / 50) / 32)
        let mouseChunkY = Math.floor((self.mouseCanvasY / 50) / 32)
        let mouseChunkidx = (mouseChunkX << 16) | mouseChunkY

        let tileToPlace = 0

        if(self.hotbar[self.activeSlot] !== "Nothing")
            self.spriteId = self.inventory.getItemSpriteId(self.hotbar[self.activeSlot])
        else
            self.spriteId = 0
        //console.log(self.inventory.hasItem(self.hotbar[self.activeSlot], 1))

        getTile = function(xic, yic){
            return currentMouseChunk.tiles[yic * currentMouseChunk.width + xic]
        }

        if(self.currentRightClick > self.lastRightClick){
            /*
            if(colTiles.includes(getTile(mouseXInChunk, mouseYInChunk))){
                currentMouseChunk.tiles[mouseYInChunk * currentMouseChunk.width + mouseXInChunk] = 1
                tileToPlace = 1
            }
            else{
                currentMouseChunk.tiles[mouseYInChunk * currentMouseChunk.width + mouseXInChunk] = 3
                tileToPlace = 3
            }           
            */  

            if(intTiles.includes(getTile(mouseXInChunk, mouseYInChunk))){
                //currentMouseChunk.tiles[mouseYInChunk * currentMouseChunk.width + mouseXInChunk] = 1
                console.log("interactable tile")
            }      

            if(singleGuns.includes(self.hotbar[self.activeSlot])){
                self.shootBullet(self.mouseAngle, 50)
            }

            self.lastRightClick = self.currentRightClick
        }

        if(self.holdingMouseLeft){
            if(miningTools.includes(self.hotbar[self.activeSlot]) && getTile(mouseXInChunk, mouseYInChunk) !== 1){
                self.tileDestroyState += 1 * miningToolStrengths[self.hotbar[self.activeSlot]]
                if(self.tileDestroyState >= 50){
                    if(inverse(placeIds)[getTile(mouseXInChunk, mouseYInChunk)] !== undefined)
                        self.inventory.addItem(inverse(placeIds)[getTile(mouseXInChunk, mouseYInChunk)], 1)

                    currentMouseChunk.tiles[mouseYInChunk * currentMouseChunk.width + mouseXInChunk] = 1
                    tileToPlace = 1

                    socket.broadcast.emit('tile-change',{
                        tileToPlace: tileToPlace,
                        mouseChunk: currentMouseChunk,
                        chunkX: mouseChunkX,
                        chunkY: mouseChunkY,
                        tileX: mouseXInChunk,
                        tileY: mouseYInChunk,
                    })
                    self.tileDestroyState = 0
                }
            } 
        }

        if(self.currentLeftClick > self.lastLeftClick){
            let recipesToSend = []
            for(var i = 0; i < craftingRecipes.length; i++){
                let hasNeededItems = 0
                for(var j = 0; j < craftingRecipes[i].length-1; j++){
                    if(self.inventory.hasItem(craftingRecipes[i][j], 1)){
                        hasNeededItems += 1
                    }
                }
                if(hasNeededItems == craftingRecipes[i].length-1){
                    //console.log(craftingRecipes[i][craftingRecipes[i].length-1])
                    recipesToSend.push(craftingRecipes[i][craftingRecipes[i].length-1])
                }
            }

            self.inventory.addRecipes(recipesToSend)

            self.tileDestroyState = 0
            self.lastLeftClick = self.currentLeftClick
        }

        if(self.holdingMouseRight){
            if(autoGuns.includes(self.hotbar[self.activeSlot])){
                self.shootBullet(self.mouseAngle, 8)
            }

            if(meleeWeapons.includes(self.hotbar[self.activeSlot])){
                self.meleeAttack(self.mouseAngle)
            }

            if(placeableItems.includes(self.hotbar[self.activeSlot]) && !priorityTiles.includes(getTile(mouseXInChunk, mouseYInChunk))){
                if(currentMouseChunk.tiles[mouseYInChunk * currentMouseChunk.width + mouseXInChunk] !== placeIds[self.hotbar[self.activeSlot]]){
                    self.inventory.removeItem(self.hotbar[self.activeSlot], 1)
                    if(inverse(placeIds)[getTile(mouseXInChunk, mouseYInChunk)] !== undefined)
                        self.inventory.addItem(inverse(placeIds)[getTile(mouseXInChunk, mouseYInChunk)], 1)
                }

                currentMouseChunk.tiles[mouseYInChunk * currentMouseChunk.width + mouseXInChunk] = placeIds[self.hotbar[self.activeSlot]]
                tileToPlace = placeIds[self.hotbar[self.activeSlot]]

                socket.broadcast.emit('tile-change',{
                    tileToPlace: tileToPlace,
                    mouseChunk: currentMouseChunk,
                    chunkX: mouseChunkX,
                    chunkY: mouseChunkY,
                    tileX: mouseXInChunk,
                    tileY: mouseYInChunk,
                })
            }
        }
    }

    self.shootBullet = function(angle, lifetime){
        var b = Bullet(self.id, angle, lifetime, 32)
        b.x = self.x
        b.y = self.y
    }

    self.meleeAttack = function(angle){
        var b = Bullet(self.id, angle, 1, 32)
        b.x = self.x
        b.y = self.y
    }

    self.updateSpeed = function(){
        let currentChunk = world.getChunk(Math.floor((self.x / 50) / 32), Math.floor((self.y / 50) / 32))
        let xInChunk = Math.floor(self.x / 50 - currentChunk.x * 32)
        let yInChunk = Math.floor(self.y / 50 - currentChunk.y * 32)

        getTile = function(xic, yic){
            return currentChunk.tiles[yic * currentChunk.width + xic]
        }

        //console.log(getTile(xInChunk, yInChunk))

        let topRight = colTiles.includes(getTile(xInChunk + 1, yInChunk + 1))
        let bottomRight = colTiles.includes(getTile(xInChunk + 1, yInChunk - 1))
        let topLeft = colTiles.includes(getTile(xInChunk - 1, yInChunk + 1))
        let bottomLeft = colTiles.includes(getTile(xInChunk - 1, yInChunk - 1))
        let rightTop = colTiles.includes(getTile(xInChunk + 1, yInChunk - 1))
        let leftTop = colTiles.includes(getTile(xInChunk - 1, yInChunk - 1))
        let rightBottom = colTiles.includes(getTile(xInChunk + 1, yInChunk + 1))
        let leftBottom = colTiles.includes(getTile(xInChunk - 1, yInChunk + 1))

        let worldsize = 51200 // width and height of world in pixels
        if(self.pressingRight && self.x < worldsize && !topRight && !bottomRight)
            self.speedX = self.maxSpeed
        else if(self.pressingLeft && self.x > 0 && !topLeft && !bottomLeft)
            self.speedX = -self.maxSpeed
        else if(topRight && bottomRight){
            if(xInChunk >= 30)
                self.speedX = self.maxSpeed
            else
                self.speedX = -1
        }
        else if(topLeft && bottomLeft){
            if(xInChunk <= 0)
                self.speedX = -self.maxSpeed
            else
                self.speedX = 1
        }
        else
            self.speedX = 0

        if(self.pressingUp && self.y > 0 && !rightTop && !leftTop)
            self.speedY = -self.maxSpeed
        else if(self.pressingDown && self.y < worldsize && !rightBottom && !leftBottom)
            self.speedY = self.maxSpeed
        else if (rightTop && leftTop){
            if(yInChunk <= 0)
                self.speedY = -self.maxSpeed
            else
                self.speedY = 1
        }
        else if (rightBottom && leftBottom){
            if(yInChunk >= 30)
                self.speedY = self.maxSpeed
            else
                self.speedY = -1
        }
        else
            self.speedY = 0
    }

    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            username:self.username,
            hp:self.hp,
            hpMax:self.hpMax,
            score:self.score,
            effects:self.effects,
            chunk:world.getChunk(Math.floor((self.x / 50) / 32), Math.floor((self.y / 50) / 32)),
            hotbar:self.hotbar,
            activeSlot:self.activeSlot,
            lookingRight:self.lookingRight,
            spriteId:self.spriteId,
            tileDestroyState:self.tileDestroyState,
        }
    }
    self.getUpdatePack = function(){
        let chunkx = Math.floor((self.x / 50) / 32)
        let chunky = Math.floor((self.y / 50) / 32)
        let chunkToSend = []

        for (let dx = -1; dx < 2; dx++) {
            for (let dy = -1; dy < 2; dy++) {
                const idx = ((chunkx + dx) << 16) | (chunky + dy)
                
                if (!self.loadedChunks.includes(idx)){
                    self.loadedChunks.push(idx)
                    chunkToSend.push(world.getChunk(chunkx + dx, chunky + dy))
                }
            }
        }
        
        if(chunkToSend.length > 0){
            for (let i = self.loadedChunks.length - 1; i >= 0; i--){
                let idx = self.loadedChunks[i]
                let chunkX = idx >> 16
                let chunkY = idx & 0xffff

                if (Math.abs(chunkX - chunkx) > 1 || Math.abs(chunkY - chunky) > 1){
                    self.loadedChunks.splice(i, 1)
                }
            }
        }

        return {
            id:self.id,
            x:self.x,
            y:self.y,
            hp:self.hp,
            score:self.score,
            effects:self.effects,
            chunk:chunkToSend,
            hotbar:self.hotbar,
            activeSlot:self.activeSlot,
            lookingRight:self.lookingRight,
            spriteId:self.spriteId,
            tileDestroyState:self.tileDestroyState,
        }
    }

    self.die = function(){
        self.hp = self.hpMax
        self.x = 25600
        self.y = 25600

        // a bit buggy:
        //self.effects = []
        //self.maxSpeed = 10
    }

    Player.list[id] = self
    initPack.player.push(self.getInitPack())
    return self
}
Player.list = {}

Player.onConnect = function(socket, username, progress){
    var player = Player(socket.id, username, socket, progress)
    player.inventory.refreshRender()
    socket.on("keyPress", function(data){
        if(data.inputId === 'left'){
            player.pressingLeft = data.state
            player.lookingRight = false
        }
		else if(data.inputId === 'right'){
            player.pressingRight = data.state
            player.lookingRight = true
        }
		else if(data.inputId === 'up')
			player.pressingUp = data.state
		else if(data.inputId === 'down')
			player.pressingDown = data.state
        else if(data.inputId === 'hold_left')
            player.holdingMouseLeft = data.state
        else if(data.inputId === 'hold_right')
            player.holdingMouseRight = data.state
        else if (data.inputId === "mouseAngle")
            player.mouseAngle = data.state
        else if (data.inputId === "clientX")
            player.mouseX = data.state
        else if (data.inputId === "clientY")
            player.mouseY = data.state
        else if (data.inputId === "left_click")
            player.currentLeftClick += 1
        else if (data.inputId === "right_click")
            player.currentRightClick += 1
        else if (data.inputId === "one")
            player.activeSlot = 0
        else if (data.inputId === "two")
            player.activeSlot = 1
        else if (data.inputId === "three")
            player.activeSlot = 2
        else if (data.inputId === "four")
            player.activeSlot = 3
        else if (data.inputId === "five")
            player.activeSlot = 4
    })  

    socket.on("sendMsgToServer", function(data){
        var playerName = ("" + socket.id).slice(2,7)
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit("addToChat", player.username + " (" + player.number + ")" +": " + data)
        }
    })

    socket.emit("init",{
        selfId:socket.id,
        player:Player.getAllInitPack(),
        bullet:Bullet.getAllInitPack(),
        floof:Floof.getAllInitPack(),
    })
}

Player.getAllInitPack = function(){
    var players = []
    for(var i in Player.list)
        players.push(Player.list[i].getInitPack())
    return players
}

Player.onDisconnect = function(socket){
    let player = Player.list[socket.id]
    if(!player)
        return
    Database.savePlayerProgress({
        username:player.username,
        items:player.inventory.items,
    })
    delete Player.list[socket.id]
    removePack.player.push(socket.id)
}

Player.update = function(){
    var pack = []
    for (var i in Player.list){
        var player = Player.list[i]

        if(player.hp <= 0)
            player.die()

        player.update()
        pack.push(player.getUpdatePack())
    }
    return pack
}
}

// Bullet -----------------------------------------------------------------------
{
Bullet = function(parent, angle, lifetime, size){
    var self = Entity()
    self.id = Math.random()
    self.speedX = Math.cos(angle/180*Math.PI) * 45
    self.speedY = Math.sin(angle/180*Math.PI) * 45
    self.parent = parent
    self.timer = 0
    self.toRemove = false

    var superUpdate = self.update
    self.update = function(){
        if (self.timer++ > lifetime) // Remove after (x) amount of frames/updates
            self.toRemove = true
        superUpdate()

        // Collision
        for (var i in Player.list){
            var p = Player.list[i]
            if(self.getDistance(p) < size && self.parent !== p.id){
                p.hp -= 1
                if(p.hp <= 0){
                    var shooter = Player.list[self.parent]
                    if(shooter){
                        shooter.score += Math.round(p.score / 2 + 5)
                        p.score = Math.round(p.score / 2)
                    }
                }
                self.toRemove = true
            }
        }

        let currentChunk = world.getChunk(Math.floor((self.x / 50) / 32), Math.floor((self.y / 50) / 32))
        let xInChunk = Math.floor(self.x / 50 - currentChunk.x * 32)
        let yInChunk = Math.floor(self.y / 50 - currentChunk.y * 32)

        getTile = function(xic, yic){
            return currentChunk.tiles[yic * currentChunk.width + xic]
        }

        let right = colTiles.includes(getTile(xInChunk + 1, yInChunk))
        let left = colTiles.includes(getTile(xInChunk - 1, yInChunk))
        let above = colTiles.includes(getTile(xInChunk, yInChunk - 1))
        let under = colTiles.includes(getTile(xInChunk, yInChunk + 1))

        if (left || right || above || under)
            self.toRemove = true

        if(colTiles.includes(getTile(xInChunk, yInChunk)))
            self.toRemove = true
    }

    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
        }
    }
    self.getUpdatePack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
        }
    }

    Bullet.list[self.id] = self
    initPack.bullet.push(self.getInitPack())
    return self
}
Bullet.list = {}

Bullet.update = function(){
    var pack = []
    for (var i in Bullet.list){
        var bullet = Bullet.list[i]
        bullet.update()
        if (bullet.toRemove) {
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id)
        } else
            pack.push(bullet.getUpdatePack())
    }
    return pack
}

Bullet.getAllInitPack = function(){
    var bullets = []
    for(var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack())
    return bullets
}
}

// Floof ------------------------------------------------------------------------
{
Floof = function(){
    var self = Entity()
    self.x = randomRange(480 * 50, 520 * 50)
    self.y = randomRange(480 * 50, 520 * 50)
    self.id = Math.random()
    self.speedX = 0 
    self.speedY = 0
    self.timer = 0
    self.toRemove = false
    var superUpdate = self.update

    if(Math.random() > 0.5){
        self.speedX = Math.random() * 5
        self.speedY = Math.random() * 5
    } else {
        self.speedX = Math.random() * -5
        self.speedY = Math.random() * -5
    }

    self.update = function(){
        superUpdate()

        // Collision
        for (var i in Bullet.list){
            var b = Bullet.list[i]
            if(self.getDistance(b) < 32){
                // handle collision
                self.toRemove = true
                Player.list[b.parent].inventory.addItem("medkit", 1)
                /*
                for(var i in SOCKET_LIST){
                    SOCKET_LIST[i].emit("addToChat", "floof " + self.number + " was killed")
                }    
                */  
            }
        }

        let currentChunk = world.getChunk(Math.floor((self.x / 50) / 32), Math.floor((self.y / 50) / 32))
        let xInChunk = Math.floor(self.x / 50 - currentChunk.x * 32)
        let yInChunk = Math.floor(self.y / 50 - currentChunk.y * 32)

        getTile = function(xic, yic){
            return currentChunk.tiles[yic * currentChunk.width + xic]
        }

        let right = colTiles.includes(getTile(xInChunk + 1, yInChunk))
        let left = colTiles.includes(getTile(xInChunk - 1, yInChunk))
        let above = colTiles.includes(getTile(xInChunk, yInChunk - 1))
        let under = colTiles.includes(getTile(xInChunk, yInChunk + 1))

        if (right)
            self.speedX = -Math.random()
        if (left)
            self.speedX = Math.random()
        if (above)
            self.speedY = Math.random()
        if (under)
            self.speedY = -Math.random()

        if(colTiles.includes(getTile(xInChunk, yInChunk)))
            self.toRemove = true
    }

    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
        }
    }
    self.getUpdatePack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
        }
    }

    Floof.list[self.id] = self
    initPack.floof.push(self.getInitPack())
    return self
}
Floof.list = {}

Floof.update = function(){
    var floofCount = 0
    for(var i in Floof.list){
        floofCount++
    }
    if (Math.random() < 0.4 && floofCount < 20){
        Floof()
    }
    
    var pack = []
    for (var i in Floof.list){
        var floof = Floof.list[i]
        floof.update()
        if (floof.toRemove) {
            delete Floof.list[i];
            removePack.floof.push(floof.id)
        } else
            pack.push(floof.getUpdatePack())
    }
    return pack
}

Floof.getAllInitPack = function(){
    var floofs = []
    for(var i in Floof.list)
        floofs.push(Floof.list[i].getInitPack())
    return floofs
}
}
