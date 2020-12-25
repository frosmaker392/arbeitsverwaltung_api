const jwt = require('jsonwebtoken');
const config = require('./config.json');

const database = require('./database.js')

// Middleware that parses the token using the secret and gets the user object from it
// and sets the property in the request object
function authenticateToken(req, res, next) {
    // Gather the jwt access token from the request header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ msg: 'Token is invalid' });
    }

    verifyToken(authHeader)
        .then(user => {
            req.user = user;
            next();
        }).catch(err => {
            res.status(401).json( { msg: err });
        });
}

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
    const userRefreshTokens = database.dbGetTokensBy('userId', payload.id);

    if (!userRefreshTokens || userRefreshTokens.length >= 5) {
        database.dbDeleteTokensById(payload.id);
    }

    const refreshToken = jwt.sign({ user: payload }, config.secret, { expiresIn: '30d' });
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

    const allRefreshTokens = database.dbGetTokensBy('userId', user.id);
    if (!allRefreshTokens) {
        throw new Error('Access is forbidden');
    }

    console.log(allRefreshTokens);

    const currentRefreshToken = allRefreshTokens.find(rt => rt.refreshToken === token);
    if (!currentRefreshToken) {
        throw new Error('Refresh token is wrong');
    }

    const payload = {
        id : user.id,
        email: user.email
    };

    const newRefreshToken = getUpdatedRefreshToken(token, payload);
    const newAccessToken = getAccessToken(payload);
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

module.exports = {
    authenticateToken,
    getAccessToken,
    getRefreshToken,
    refreshToken
};