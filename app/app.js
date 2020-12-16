const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext("2d");
//making canvas to hidden before the username is entered
canvas.hidden = true;
// making a client instance of the socket
var socket = io('ws://localhost:8080');
var username;
var movement = {
    up: false,
    down: false,
    left: false,
    right: false
}

//creating a listener event when a key is pressed
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'a': // A
            movement.left = true;
            break;
        case 'w': // W
            movement.up = true;
            break;
        case 'd': // D
            movement.right = true;
            break;
        case 's': // S
            movement.down = true;
            break;
    }
});

//creating a listener event when a key is released
document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'a': // A
            movement.left = false;
            break;
        case 'w': // W
            movement.up = false;
            break;
        case 'd': // D
            movement.right = false;
            break;
        case 's': // S
            movement.down = false;
            break;
    }
});
// get the submit button
var submitButton = document.getElementById('setUsername');
//get health buttons
var healthIncButton = document.getElementById('incHealth');
var healthDecButton = document.getElementById('decHealth');

//create new player when submit button is clicked
submitButton.onclick = () => {
    username = document.getElementById('nickname').value;
    socket.emit('newPlayer', username);
    document.getElementById('nickname').hidden = true;
    document.getElementById('setUsername').hidden = true;
    canvas.hidden = false;

    healthIncButton.hidden = false;
    healthDecButton.hidden = false;
}
// add other players to list of users online
socket.on('playerJoined', (player) => {
    const el = document.createElement('li');
    el.innerHTML = player + ' Joined!';
    document.querySelector('ul').appendChild(el);
});

//
socket.on('userDisconnect', (player) => {
    const el = document.createElement('li');
    el.innerHTML = player + ' left!';
    document.querySelector('ul').appendChild(el);
});

//set client side tickrate to 128
setInterval(() => {
    socket.emit('movement', movement, username);
}, 1000 / 128);
//update the state of players upon server request
socket.on('state', (players) => {

    var grd = ctx.createLinearGradient(0, 0, 1280, 0);
    grd.addColorStop(0, "#bdc3c7");
    grd.addColorStop(1, "#2c3e50");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1280, 720);
    var count = 0;

    for (var id in players) {

        var player = players[id];
        var health = player.health;

        //player model
        var fillStyle = (id === username)? "#00FF00" : "#0000FF";
        draw(player.x, player.y, 50, 50, fillStyle, true);

        //health bar
        draw(player.x, player.y - 10, 50 - ((100 - health) * 0.5), 5, "#FF0000", true)

        //health bar outline
        draw(player.x, player.y - 11, 50, 5, false, false, true);

        //player name
        draw(player.x, player.y - 30, false, false, false, false, false, id);

        //Coords
        draw(30 * count, 10, false, false, false, false, false, `X: ${player.x}`);
        draw(30 * count, 20, false, false, false, false, false, `Y: ${player.y}`);

        count++;
    }
});

healthIncButton.onclick = () => {
    socket.emit('incHealth', username);
}
healthDecButton.onclick = () => {
    socket.emit('decHealth', username);
}

draw = (x, y, x1, y1, fillStyle = false, fill = false, stroke = false, text = false) => {
    ctx.beginPath();

    if (fillStyle) ctx.fillStyle = fillStyle;
    if (stroke) ctx.stroke = stroke;
    if (text) ctx.strokeText(text, x, y);
    if (x1 || y1) {
        ctx.rect(x, y, x1, y1);
    }
    if (fill) ctx.fill();
    ctx.closePath();
}