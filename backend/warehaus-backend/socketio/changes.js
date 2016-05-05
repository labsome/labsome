'use strict';
var logger = require('../logger');
var db = require('../db');
var r = require('rethinkdbdash')(db.config());

const USERS_ROOM = 'users';

const sendNotification = (table_config, io, err, change) => {
    logger.debug(`Received notification: dbTable=${table_config.dbTable} err=${err} change.old_val.id=${change.old_val ? change.old_val.id :
 'null'} change.new_val.id=${change.new_val ? change.new_val.id : 'null'}:`);
    if (err) {
        return;
    }
    if (change.new_val === null) {
        io.to(USERS_ROOM).emit(`object_deleted:${table_config.dbTable}`, table_config.onDelete(change.old_val));
    } else {
        io.to(USERS_ROOM).emit(`object_changed:${table_config.dbTable}`, table_config.onUpdate(change.new_val));
    }
};

const listenForChanges = (tables_config) => {
    return (ctx) => {
        tables_config.forEach(table_config => {
            r.table(table_config.dbTable).changes().run(function(err, cursor) {
                if (err) {
                    console.log(`error: While waiting for changes on ${table_config.dbTable}: ${err}`);
                    process.exit(1);
                }
                cursor.each((err, change) => {
                    sendNotification(table_config, ctx.io, err, change);
                });
            });
        });
    };
};

const sendObjectId = (object) => {
    return {id: object.id};
};

const sendEntireObject = (object) => {
    return {object};
};

module.exports = {
    USERS_ROOM,
    listenForChanges,
    sendObjectId,
    sendEntireObject
};
