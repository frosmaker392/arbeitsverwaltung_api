const bcrypt = require('bcryptjs');
const database = require('./database');
const { svr_logger } = require('./logger');
const { responseObj } = require('./response');

const email_regex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

module.exports = {
    register,
    authenticate
}

// Async function to register a user into the database,
// awaits a response JSON ( required : email, password, passwordConfirmation )
async function register(user) {
    if (user.email === undefined || user.password === undefined || user.passwordConfirmation === undefined)
        return responseObj(false, "API Error - expected fields are undefined!");

    if (!email_regex.test(user.email)) 
        return responseObj(false, "Invalid email format!");

    if (user.password.length < 8)
        return responseObj(false, "Password must be at least 8 characters long!")

    if (user.password != user.passwordConfirmation)
        return responseObj(false, "Passwords do not match!");

    // Waits until the hash is generated
    const passwordHash = await bcrypt.hash(user.password, await bcrypt.genSalt(10))
                        .catch(err =>  {
                            svr_logger.error(err);
                            return responseObj(false, "authenticate", "Seems to be something wrong on our side.")
                        });

    try {
        const entry = { email: user.email, password: passwordHash };

        // Throws error if there is already a user with the same email
        const addedUser = database.dbAddUser(entry);

        return responseObj(true, addedUser);
    } catch (err) {
        return responseObj(false, "Email already exists!");
    }
}

// Authentication method given the user object
// ( required params : email, password )
async function authenticate(user) {
    if (user.email === undefined || user.password === undefined)
        return responseObj(false, "API Error - expected fields are undefined!");

    userFromDb = database.dbGetUserBy('email', user.email);

    if (userFromDb) {
        // Waits until the comparison has been made
        const passwordMatches = await bcrypt.compare(user.password, userFromDb.password)
        .catch(err =>  {
            svr_logger.error(err);
            return responseObj(false, "Seems to be something wrong on our side.")
        });

        if (passwordMatches)
            return responseObj(true, { id: userFromDb.id, email: userFromDb.email});
    }

    return responseObj(false, "Email and/or password is incorrect!");
}