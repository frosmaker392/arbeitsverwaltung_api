process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../src/server');
const should = chai.should();

chai.use(chaiHttp);

describe('POST /register', () => {

    it('should register with correct details, and login immediately', (done) => {
        const user = {
            email: "test3@example.com",
            password: "a testing password",
            passwordConfirmation: "a testing password"
        };
        chai.request(server)
            .post('/register')
            .send(user)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');

                // Property checks
                res.body.should.have.property('success');
                res.body.should.have.property('message');
                res.body.should.have.property('accessToken');
                res.body.should.have.property('refreshToken');

                // Property value and type checks
                res.body.success.should.be.true;
                res.body.message.should.be.a('object');
                res.body.accessToken.should.be.a('string');
                res.body.accessToken.should.not.be.empty;
                res.body.refreshToken.should.be.a('string');
                res.body.refreshToken.should.not.be.empty;

                done();
            });
    });

    it('should not register with incorrect details, and not login', (done) => {
        const user = {
            email: "test4@example.com",
            password: "another password",
            passwordConfirmation: "nother password"
        };
        chai.request(server)
            .post('/register')
            .send(user)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');

                // Property checks
                res.body.should.have.property('success');
                res.body.should.have.property('message');
                res.body.should.not.have.property('accessToken');
                res.body.should.not.have.property('refreshToken');

                // Property value and type checks
                res.body.success.should.be.false;
                res.body.message.should.be.a('string');
                res.body.message.should.not.be.empty;

                done();
            });
    });

});

describe('POST /login', () => {

    before((done) => {
        const user = {
            email: "logintest@example.com",
            password: "password",
            passwordConfirmation: "password"
        };

        chai.request(server)
            .post('/register')
            .send(user)
            .then(() => {
                done();
            });
    });

    it('should login with correct credentials', (done) => {
        const creds = {
            email: "logintest@example.com",
            password: "password"
        }

        chai.request(server)
            .post('/login')
            .send(creds)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');

                // Property checks
                res.body.should.have.property('success');
                res.body.should.have.property('message');
                res.body.should.have.property('accessToken');
                res.body.should.have.property('refreshToken');

                // Property value and type checks
                res.body.success.should.be.true;
                res.body.message.should.be.a('object');
                res.body.accessToken.should.be.a('string');
                res.body.accessToken.should.not.be.empty;
                res.body.refreshToken.should.be.a('string');
                res.body.refreshToken.should.not.be.empty;

                done();
            });
    });

    it("should not login with invalid credentials", (done) => {
        const creds = {
            email: "logintest@example.com",
            password: "passwrod"
        };

        chai.request(server)
            .post('/login')
            .send(creds)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');

                // Property checks
                res.body.should.have.property('success');
                res.body.should.have.property('message');
                res.body.should.not.have.property('accessToken');
                res.body.should.not.have.property('refreshToken');

                // Property value and type checks
                res.body.success.should.be.false;
                res.body.message.should.be.a('string');

                done();
            });
    });

})