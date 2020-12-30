const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: {
        origin: "*"
    }
});
const redis = require('redis');
const client = redis.createClient();
// Create a players Dictionary
var onlinePlayers = {};
//When a user is connected get the socket
io.on('connection', (socket) => {
    //If the user disconnect Delete from the players set
    socket.on('disconnect', () => {

        //loop through the players to find the disconnected player
        for (var id in onlinePlayers) {
            if (onlinePlayers[id].id === socket.id) {

                var x = onlinePlayers[id].x;
                var y = onlinePlayers[id].y;
                var health = onlinePlayers[id].health;
                var playerId = onlinePlayers[id].id;
                
                // send announcement that player has disconnected
                io.emit('userDisconnect', id);
                console.log(`${id} has left!`);

                if (client.exists(id)) {
                    client.del(id);
                }
                client.hset(id, "x", x, "y", y, "health", health, "id", playerId);
                delete onlinePlayers[id];
            }
        }
    });
    //create a new instance of player when they join
    socket.on('newPlayer', (id) => {
        //if the player exists then add to online player list
        client.hgetall(id, (err, player) => {
            if (err) throw err; // if database doesn't exist throw an error
            if (player) {
                console.log(`Player connected: ${id}`);
                onlinePlayers[id] = {
                    x: parseInt(player.x), // redis stores int as string, so convert to int
                    y: parseInt(player.y),
                    health: parseInt(player.health),
                    id: socket.id
                }
            } else {
                onlinePlayers[id] = {
                    x: Math.floor(Math.random() * 1280),
                    y: Math.floor(Math.random() * 720),
                    health: 10,
                    id: socket.id
                }
            }
        });
        //When a player joined, broadcast their username
        io.emit('playerJoined', id);
    });

    // movement is logged and made server sided
    socket.on('movement', (data, username) => {
        var player = onlinePlayers[username] || {};
        if (data.left) {
            player.x -= 5;
        }
        if (data.up) {
            player.y -= 5;
        }
        if (data.right) {
            player.x += 5;
        }
        if (data.down) {
            player.y += 5;
        }
    });
    // when the button for increasing health is pressed, the server increases the health
    socket.on('incHealth', username => {
        var health = onlinePlayers[username].health;
        if (health >= 0 && health <= 100)
            health += 10;
        if (health > 100)
            health = 100
        onlinePlayers[username].health = health;
    });
    // when the button for decreasing health is pressed, the server decreases the health
    socket.on('decHealth', username => {
        var health = onlinePlayers[username].health;
        if (health >= 0 && health <= 100)
            health -= 10;
        if (health < 0)
            health = 0;
        onlinePlayers[username].health = health;
    });
});

// server tick rate of changing state of the players, @128tick/s
setInterval(() => {
    io.sockets.emit('state', onlinePlayers);
}, 1000 / 128);

http.listen(8080, () => console.log('listening on http://localhost:8080'));