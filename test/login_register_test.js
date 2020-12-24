process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = chai.expect;

const { register, authenticate } = require('../src/login_register.js');

describe("register()", () => {

    it("should return success with valid credentials", async () => {
        register( { email: "test@test.com", 
                    password: "password",
                    passwordConfirmation: "password" } )
                    .then( (res) => {
                        expect( res.success ).to.be.true;
                        expect( res.message ).to.be.a('object');
                        expect( res.message.email ).to.equal("test@test.com");
                    });
    });

    describe("should return failed when", async () => {

        it("one of the obj attributes are undefined", async () => {
            register( { email: "test2@test.com", 
                        passwordConfirmation: "password" } )
                        .then( (res) => {
                            expect( res.success ).to.be.false;
                        });
            
            register( { password: "password", 
                        passwordConfirmation: "password" } )
                        .then( (res) => {
                            expect( res.success ).to.be.false;
                        });
        });
        
        it("the email is not in a correct format", async () => {
            register( { email: "test2@testcom", 
                    password: "password",
                    passwordConfirmation: "password" } )
                    .then( (res) => {
                        expect( res.success ).to.be.false;
                    });
        });

        it("the password is less than 8 characters long", async () => {
            register( { email: "test2@test.com", 
                    password: "passwor",
                    passwordConfirmation: "passwor" } )
                    .then( (res) => {
                        expect( res.success ).to.be.false;
                    });
        });

        it("passwords do not match", async () => {
            register( { email: "test2@test.com", 
                    password: "password",
                    passwordConfirmation: "passwrod" } )
                    .then( (res) => {
                        expect( res.success ).to.be.false;
                    });
        });

        it("the email already exists", async () => {
            register( { email: "admin@example.com", 
                    password: "password",
                    passwordConfirmation: "password" } )
                    .then( (res) => {
                        expect( res.success ).to.be.false;
                    });
        });
    });
});

describe( "authenticate()", () => {

    before(() => {
        register( { email: "test2@test.com", 
                    password: "password",
                    passwordConfirmation: "password" } );
    } )

    it("should return success with valid credentials", async () => {
        authenticate( { email: "test2@test.com",
                        password: "password" } )
                        .then( (res) => { 
                            expect( res.success ).to.be.true;
                            expect( res.message ).to.be.a('object');
                            expect( res.message.email ).to.equal("test2@test.com"); 
                        });
    });

    it( "should return failed with invalid credentials", async () => {
        authenticate( { email: "test2@test.com",
                        password: "passworld" } )
                        .then( (res) => { 
                            expect( res.success ).to.be.false; 
                        });

        authenticate( { email: "test69@test.com",
                        password: "password" } )
                        .then( (res) => { 
                            expect( res.success ).to.be.false; 
                        });
    });
});