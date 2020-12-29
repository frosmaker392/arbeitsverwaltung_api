const app = require('express')();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const url = require('url');

const config = require('./config.json');
const wsServer = require('./socket_server')
const auth = require('./auth')
const { register, authenticate } = require('./login_register');

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
    res.sendStatus(404);
});

const server = app.listen(config.port, () => {
    console.log(`Listening from ${config.port}`);
});

server.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url).pathname;
    const authHeader = req.headers.authorization;

    auth.verifyToken(authHeader)
        .then(user => {
            if(!user)
                throw new Error('User is undefined');

            if (pathname === '/sockets') {
                wsServer.handleUpgrade(req, socket, head, ws => {
                    wsServer.emit('connection', ws, req);
                });
            }

        }).catch(err => {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        });
});

module.exports = server;