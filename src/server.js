const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const config = require('./config.json');
const auth = require('./auth.js')
const { register, authenticate } = require('./login_register.js');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Root endpoint
app.get('/', (req, res, next) => {
    res.json({ "message": "Ok" });
});

// Gives a response for a register attempt. If successful, the user would
// automatically be logged in.
// (required: email, password, passwordConfirmation)
app.post('/register', (req, res) => {
    const user = req.body;

    register(user).then( (response) => {
        if (response.success)
            res.redirect(307, '/login');
        else 
            res.json(response);
    }).catch(err => {
        console.log(err);
        res.sendStatus(501);
    });
});

// Gives a response for a login attempt. If successful, response would contain
// access and refresh tokens.
// (required: email, password)
app.post('/login', (req, res) => {
    const user = req.body;

    authenticate(user).then( response => {
        if (response.success) {
            // Response message should equal the user object now
            const accessToken = auth.getAccessToken(response.message);
            const refreshToken = auth.getRefreshToken(response.message);

            response.accessToken = accessToken;
            response.refreshToken = refreshToken;
        }

        res.json(response);
    }).catch( err => {
        console.log(err);
        res.sendStatus(501);
    });
});

// Returns the updated refresh and access tokens given the refresh token
// (required : refreshToken)
app.post('/refresh-token', (req, res) => {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
        return res.status(403).json({ msg: 'Access is forbidden'});
    }

    try {
        const newTokens = auth.refreshToken(refreshToken);
        res.json(newTokens);
    } catch (err) {
        const message = (err && err.message) || err;
        res.status(403).json({ msg: message });
    }
});

// Some kind of testing route to check for authentication
app.get('/auth-test', auth.authenticateToken, (req, res) => {
    res.json({ success: true, message: "You are authenticated!" });
});

// Default response for any other request
app.use((req, res) => {
    res.status(404);
});

const server = app.listen(config.port, () => {
    console.log(`Listening from ${config.port}`);
});

module.exports = server;