const Database = require('better-sqlite3');

const inTesting = process.env.NODE_ENV === 'test';
const DBSOURCE = inTesting ? ":memory:" : "db/db.sqlite";

if (inTesting)
    console.log("Database is in testing mode.");

const db = new Database(DBSOURCE, { verbose: console.log });

try {
    db.prepare(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email text UNIQUE,
        password text,
        created_at text,
        CONSTRAINT email_unique UNIQUE (email)
        )`).run();

    db.prepare(`CREATE TABLE refresh (
        id INTEGER PRIMARY KEY,
        userId int,
        refreshToken text
        )`).run();

    const insert = db.prepare('INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)');
    insert.run("admin@example.com", "$2a$10$k8f8FpWlVW77MCJA23N6zew1uxZfiGifZLnejlMGcmMTWXdMxEGz6",
        (new Date()).toUTCString());
    
    console.log('DB initialization success!');

} catch (err) {
    // Clear all sessions upon initialization
    db.prepare('DELETE FROM refresh').run();
    console.log('Table has been created! Skipping db initialization');
}

// Returns the user object with variableName equal the variable
function dbGetUserBy(variableName, variable) {
    return db.prepare(`SELECT * FROM users WHERE ${variableName} = ?`).get(variable);
}

// Returns the added user object with id (without password hash)
function dbAddUser(user) {
    const insert = db.prepare('INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)');
    const info = insert.run(user.email, user.password, (new Date()).toUTCString());

    console.log(`User ${user.email} successfully added with id ${info.lastInsertRowid}`);

    return { id: info.lastInsertRowid, email: user.email };
}

// Returns a list of all tokens with variableName equal variable
function dbGetTokensBy(variableName, variable) {
    return db.prepare(`SELECT * FROM refresh WHERE ${variableName} = ?`).all(variable);
}

function dbAddToken(userId, token) {
    const insert = db.prepare('INSERT INTO refresh (userId, refreshToken) VALUES (?, ?)');
    insert.run(userId, token);
}

function dbUpdateToken(oldToken, newToken) {
    const update = db.prepare(`UPDATE refresh SET refreshToken = ? WHERE refreshToken = ?`);
    update.run(newToken, oldToken);
}

function dbDeleteTokensById(userId) {
    db.prepare('DELETE FROM refresh WHERE userId = ?').run(userId);
}

module.exports = {
    dbAddUser,
    dbGetUserBy,
    dbGetTokensBy,
    dbAddToken,
    dbUpdateToken,
    dbDeleteTokensById
};