const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');

chai.use(chaiHttp);

// Helper function for any methods requiring authentication
function registerHelper(email, password, tokensObj, done) {
    const user = {
        email: email,
        password: password,
        passwordConfirmation: password
    };

    chai.request(server)
        .post('/api/register')
        .send(user)
        .end((err, res) => {
            tokensObj.ac = res.body.accessToken;
            tokensObj.rf = res.body.refreshToken;

            done();
        });
}

module.exports = {
    registerHelper
}