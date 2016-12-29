'use strict';

const primus = require('primus');
const plugin = require(__dirname + '/../src/plugin');
const ioredis = require('ioredis');

const wss = primus.createServer({
    port: 8000,
    redis: new ioredis(6379)
});

wss.plugin('concierge', plugin);
wss.plugin('omega', require('omega-supreme'));
wss.plugin('metroplex', require('metroplex'));

wss.on('connection', (spark) => {
    spark.on('data', (data) => {
        switch(data.action) {
            case 'join-room':
                spark.join(data.body.room)
                break;
            case 'broadcast':
                spark.broadcast(data.body.room, data.body.message);
                break;
            case 'leave-room':
                spark.leave(data.body.room);
                break;
        }
    });
});

const socket = primus.createSocket();


function spawn(id) {
    console.log('New client ['+id+']');
    const client = new socket('http://localhost:8000');
    client.on('data', (data) => {
        console.log(id + ' received', data);
    });

    client.write({
        action: 'join-room',
        body: {
            room: 'test-room'
        }
    });

    setTimeout(() => {
        console.log(id + ' broadcast message');
        client.write({
            action: 'broadcast',
            body: {
                room: 'test-room',
                message: 'message-to-relay'
            }
        });
    }, 2000);

    setTimeout(()=> {
        client.end();
    }, 10000);
}

let id = 0;
setInterval(() => {
    id++;
    spawn(id);
}, 5000);
