# primus-concierge
A room management system meant to work with a redis-backed primus cluster.

# installation
```
npm install --save primus-concierge
```

# usage
```js
const primus = require('primus');
const primus_concierge = require('primus-concierge');

const wss = primus.createServer({
    port: 8000,
    redis: {
        host: 'localhost',
        port: 6379
    }
});

wss.plugin('concierge', primus_concierge);

wss.on('connection', (spark) => {
    spark.on('data', (data) => {
        switch(data.action) {
                case 'join-room':
                    spark.join(data.body.room);
                    break;
                case 'broadcast':
                    spark.broadcast(data.body.room, data.body.message);
                    break;
                case 'leave-room':
                    spark.leave(data.body.room);
                    break;
                case 'say':
                    spark.say(data.body.to, data.body.message);
                    break;
        }
    });
});
```


# api
Concierge adapts the spark that is available after a connection has been established.

## spark-api

### spark.\_rooms: Array
Spark.\_rooms is an array object that contains a set of rooms that the current spark belongs to. Because it is entirely in-memory, if a user "disconnects" for any reason, they are removed from all the rooms they belong to

### spark.join(room_name: string)
By calling this method, you will join the current spark to the room specified. If the room does not exist, it is created. The current membership of the room is tracked in redis

### spark.leave(room_name: string)
This method will cause the spark to leave the specified room

### spark.broadcast(room_name: string, msg: any)
This will send the message provided to all sockets within a room, except for the sender.

### spark.say(id: string, msg: any) 
This will allow you to message any spark that this server has access to and send them the msg provided. This method relies on having [omega-supreme](https://github.com/primus/omega-supreme) installed and loaded for message support across a primus cluster. If you are not using omega-supreme, just don't use this particular message and you'll be fine

### spark.roommates(room_name: string, cb: function(err: Error, roommates: Array))
Return a list of people in the room specified. If you are looking up a room that you are a part of, please note that it will also return your socket id

# todo
[ ] Add support for room events

# license
MIT
