const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: {
        origin: "*"
    }
});
const fs = require('fs');
// Create a players Dictionary
var onlinePlayers = {};
var offlinePlayers = JSON.parse(fs.readFileSync('db/playerbase.json','utf-8'));
count = 0;
//When a user is connected get the socket
io.on('connection', (socket) => {

    console.log('connected');

    //If the user disconnect Delete from the players dict
    socket.on('disconnect', () => {

        //loop through the players to find the disconnected player
        for (var id in onlinePlayers) {
            if (onlinePlayers[id].id === socket.id) {
                // send announcement that player has disconnected
                io.emit('userDisconnect', id);
                console.log(`${id} has left!`);
                offlinePlayers[id] = onlinePlayers[id];

                delete onlinePlayers[id];
            }
        }
    });
    //create a new instance of player when they join
    socket.on('newPlayer', (id) => {
        //if the player exists then return
        if (offlinePlayers[id]) {
            onlinePlayers[id] = offlinePlayers[id];
        } else {
            onlinePlayers[id] = {
                x: Math.floor(Math.random() * 1280),
                y: Math.floor(Math.random() * 720),
                health: 10,
                id: socket.id
            }
        }
        console.log(onlinePlayers);
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
        if (onlinePlayers[username].health >= 0 && onlinePlayers[username].health <= 100)
            onlinePlayers[username].health += 10;
        if (onlinePlayers[username].health > 100)
            onlinePlayers[username].health = 100
    });
    // when the button for decreasing health is pressed, the server decreases the health
    socket.on('decHealth', username => {
        if (onlinePlayers[username].health >= 0 && onlinePlayers[username].health <= 100)
            onlinePlayers[username].health -= 10;
        if (onlinePlayers[username].health < 0)
            onlinePlayers[username].health = 0;
    });
});

// server tick rate of changing state of the players, @128tick/s
setInterval(() => {
    io.sockets.emit('state', onlinePlayers);
    count++;
    if (count === '76800') {
        fs.writeFile('db/playerbase.json', JSON.stringify(offlinePlayers)).then(console.log('Playerbase saved'));
        count = 0;
    }
}, 1000 / 128);

http.listen(8080, () => console.log('listening on http://localhost:8080'));