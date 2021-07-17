const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/message');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const pathToPublicDir = path.join(__dirname, '../public');

app.use(express.static(pathToPublicDir)); // Serving the files inside public dir to browser

io.on('connection', (socket) => {
    console.log('New websocket connection');

    // socket.emit('message',generateMessage('Welcome !!')); // emit to that particular connection
    // socket.broadcast.emit('message', generateMessage('New user has joined')); // emits the event to everybody except the current connection/user

    socket.on('join',({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username, room});
        if(error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin',`Welcome ${user.username}!!`));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined !!`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback();
    })

    socket.on('sendMsg', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(message)){
            return callback('Profanity is not allowed');
        }
        io.to(user.room).emit('message', generateMessage(user.username, message)); // emits to everybody
        callback(message);
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));;
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback('Location shared');
    })
    // socket.emit('CountUpdated',count);

    // socket.on('increment', () => {
    //     count++;
    //     socket.emit('CountUpdated', count);  // Emit events to particular connection
    //     io.emit('CountUpdated', count);  // Emit events to every single connection
    // })
});

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
})