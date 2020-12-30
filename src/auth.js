const jwt = require('jsonwebtoken');
const config = require('./config.json');
const { responseObj } = require('./response')

const database = require('./database');
const { svr_logger } = require('./logger');

// Middleware that parses the token using the secret and gets the user object from it
// and sets the property in the request object
function authenticateToken(req, res, next) {
    // Gather the jwt access token from the request header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json( responseObj(false, 'Token is invalid') );
    }

    verifyToken(authHeader)
        .then(user => {
            req.user = user;
            next();
        }).catch(err => {
            res.status(401).json( responseObj(false, err) );
        });
}

// Manual verification of the token, useful for client auth for web sockets
function verifyToken(token) {
    return new Promise((resolve, reject) => {
        if (!token.startsWith('Bearer')) {
            return reject('Token is invalid');
        }

        token = token.slice(7, token.length);
        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                return reject(err.message);
            }
            if (!decoded || !decoded.user) {
                return reject('Token is invalid');
            }
            resolve(decoded.user);
        });
    });
}

// Generates a short-living access token
function getAccessToken(payload) {
    return jwt.sign({ user: payload }, config.secret, { expiresIn: config.tokenLife });
}

// Generates a long-living refresh token, and adds it to the database
function getRefreshToken(payload) {
    // Deletes any existing refresh tokens corresponding with the user (capping the session amount to 1 per user)
    database.dbDeleteTokensById(payload.id);

    const refreshToken = jwt.sign({ user: payload }, config.secret, { expiresIn: config.refreshTokenLife });
    database.dbAddToken(payload.id, refreshToken);
    
    return refreshToken;
}

// Refreshes the refresh token, returns the new access and refresh tokens
function refreshToken(token) {
    const decoded = jwt.verify(token, config.secret);

    const user = database.dbGetUserBy('id', decoded.user.id);
    if (!user) {
        throw new Error('Access is forbidden');
    }

    const currentRefreshToken = database.dbGetTokenBy('userId', user.id);
    if (!currentRefreshToken) {
        throw new Error('Access is forbidden');
    } else if  (currentRefreshToken.refreshToken !== token) {
        throw new Error('Refresh token is wrong')
    }

    const payload = {
        id : user.id,
        email: user.email
    };

    const newRefreshToken = getUpdatedRefreshToken(token, payload);
    const newAccessToken = getAccessToken(payload);

    svr_logger.info(`Session refreshed for user of id ${user.id}`);
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
}

// Generates a new refresh token and replaces the old one in the database
function getUpdatedRefreshToken(oldRToken, payload) {
    const newRT = jwt.sign({ user: payload }, config.secret, { expiresIn: config.refreshTokenLife });

    database.dbUpdateToken(oldRToken, newRT)

    return newRT;
}

function deleteRefreshToken(userId) {
    database.dbDeleteTokensById(userId);
}

module.exports = {
    authenticateToken,
    verifyToken,
    getAccessToken,
    getRefreshToken,
    refreshToken,
    deleteRefreshToken
};