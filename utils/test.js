const { differenceInMinutes } = require("date-fns");
const { getReportDailyData, getYesterdayDate, getActiveTicketList } = require("./utils");

const lastUpdateAt = new Date("2025-03-17T10:10:58.782Z");
const now = new Date();

const minutesDiff = differenceInMinutes(now, lastUpdateAt);
console.log(minutesDiff); // Devrait donner environ 53 minutes




getActiveTicketList();

module.exports = {}