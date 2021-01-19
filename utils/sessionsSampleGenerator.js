const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const dayjs = require('dayjs');
const { sessionsTable } = require('../controllers/dbController');
const { getWeekYearAndDay } = require('./dateUtils');

try {
    readline.question('User ID : ', (idStr) => {
        const userId = Number.parseInt(idStr);

        readline.question('Number of weeks : ', (numOfWeeksStr) => {
            const numOfWeeks = Number.parseInt(numOfWeeksStr);

            readline.question('Start date (YYYY-MM-DD) : ', (startDateStr) => {
                let startDate = dayjs(startDateStr);

                for (let i = 0; i < numOfWeeks * 7; i++) {
                    const dateStr = startDate.format('YYYY-MM-DD');
                    const [weekYear, dayNumber] = getWeekYearAndDay(dateStr);
                
                    sessionsTable.getOrAddSession(userId, weekYear, dayNumber);
                
                    const activeDuration = Math.floor(Math.random() * 8.0 * 3600);
                    const inactiveDuration = Math.floor(Math.random() * 4.0 * 3600);
                
                    sessionsTable.updateSession(userId, weekYear, dayNumber, 
                        activeDuration, inactiveDuration);
                
                    startDate = startDate.add(1, 'day');
                }

                console.log(`Inserted/updated ${numOfWeeks * 7} session entries`);
                readline.close();
            });
        });
    });
} catch (err) {
    console.log("An error occurred! Aborting process...");
    console.error(err);
    readline.close();
}