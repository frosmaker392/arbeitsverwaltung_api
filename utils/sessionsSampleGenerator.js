const dayjs = require('dayjs');
const { sessionsTable } = require('../controllers/dbController');
const { getWeekYearAndDay } = require('./dateUtils');

const userId = 3;
const noOfWeeks = 5;
let startDate = dayjs("2021-02-01");

for (let i = 0; i < noOfWeeks * 7; i++) {
    const dateStr = startDate.format('YYYY-MM-DD');
    const [weekYear, dayNumber] = getWeekYearAndDay(dateStr);

    sessionsTable.getOrAddSession(userId, weekYear, dayNumber);

    const activeDuration = Math.floor(Math.random() * 8.0 * 3600);
    const inactiveDuration = Math.floor(Math.random() * 4.0 * 3600);

    sessionsTable.updateSession(userId, weekYear, dayNumber, 
        activeDuration, inactiveDuration);

    startDate = startDate.add(1, 'day');
}