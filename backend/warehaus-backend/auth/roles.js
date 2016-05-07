'use strict';

var passport   = require('passport');
var HttpStatus = require('http-status-codes');

const ALL = {
    admin   : 'admin',
    user    : 'user',
    bot     : 'bot',
    deleted : 'deleted'
};

const isRoleValid = (role) => {
    return Object.keys(ALL).indexOf(role) !== -1;
};

const isRoleAllowedToLogin = (role) => {
    return (role === ALL.admin) || (role === ALL.user);
};

const roleRequired = (allowed_roles) => {
    return (req, res, next) => {
        passport.authenticate(['jwt', 'token'], (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
            }
            return req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                if (allowed_roles.indexOf(user.role) === -1) {
                    return res.status(HttpStatus.FORBIDDEN).json({ message: `This API is for ${allowed_roles.join(', ')} only` });
                }
                return next();
            });
        })(req, res, next);
    };
};

const userRequired  = roleRequired([ALL.user, ALL.bot, ALL.admin]);
const adminRequired = roleRequired([ALL.admin]);

module.exports = {
    ALL,
    isRoleValid,
    isRoleAllowedToLogin,
    userRequired,
    adminRequired
};
