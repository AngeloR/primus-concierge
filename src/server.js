'use strict';

const ioredis = require('ioredis');

function Server(primus, options) {
    var key_prefix = options.redis_prefix ? options.redis_prefix : 'concierge';
    var delimeter = options.redis_key_delimeter ? options.redis_key_delimiter : ':';
    var redis = options.redis.sadd ? options.redis : new ioredis(options.redis);

    primus.Spark.prototype.say = say;
    primus.Spark.prototype.roommates = roommates;
    primus.Spark.prototype.broadcast = broadcast;
    primus.Spark.prototype.join = join;
    primus.Spark.prototype.leave = leave;
    primus.Spark.prototype._rooms = [];

    primus.on('disconnection', disconnect_handler);

    function room_key(room_name) {
        return [key_prefix, 'room', room_name].join(delimeter);
    }

    function disconnect_handler(spark) {
        let cmds = [];
        cmds.push(['del', spark.id]);
        spark._rooms.forEach((room) => {
            cmds.push(['srem', room, spark.id]);
        });

        redis.pipeline(cmds).exec((err) => {
            if(err) {
                this.emit('error', err);
                return;
            }
        });
    }

    function join(room_name) {
        const room = room_key(room_name);
        redis.sadd(room, this.id, (err) => {
            if(err) {
                this.emit('error', err);
                return;
            }

            if(this._rooms.indexOf(room) < 0) {
                this._rooms.push(room);
            }
        });
    };

    function leave(room_name) {
        const room = room_key(room_name);

        redis.srem(room, this.id, (err) => {
            if(err) {
                this.emit('error', err);
                return;
            }

            this._rooms.splice(this._rooms.indexOf(room), 1);
        });
    };

    function say(id, msg) {
        primus.forward.spark(id, msg, (err, res) => {
            if(err) {
                this.emit('error', err);
                return;
            }
        });
    }

    function broadcast(room_name, msg) {
        this.roommates(room_name, (err, roommates) => {
            if(err) {
                this.emit('error', err);
                return;
            }

            // this ensures that when we broadcast a message, we are not 
            // sending it to the user where the message originated
            roommates.splice(roommates.indexOf(this.id), 1);
            primus.forward.sparks(roommates, msg, (err, res) => {
            });
        });
    };


    function roommates(room_name, cb) {
        const room = room_key(room_name);
        redis.smembers(room, cb);
    }
}

module.exports = Server;
