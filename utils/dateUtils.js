const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');

dayjs.extend(isoWeek);

// Returns the week year in the format and the day of week
// in the format ["ww-yyyy", d]
// from the given date string "yyyy-mm-dd"
function getWeekYearAndDay(date) {
    const djsDate = dayjs(date, 'YYYY-MM-DD', true);
    const weekNumber = djsDate.isoWeek();

    if (!djsDate.isValid())
        throw new Error("Invalid date format!");

    return [`${weekNumber < 10 ? "0" + weekNumber : weekNumber}-${djsDate.isoWeekYear()}`,
            djsDate.isoWeekday()];
}

// A valid week year should be in the form of ww-yyyy
function isValidWeekYear(weekYear) {
    const regex = /^\d{2}-\d{4}$/;
    return regex.test(weekYear);
}

module.exports = {
    getWeekYearAndDay,
    isValidWeekYear
}