const fs = require("fs");
const moment = require("moment");
const { differenceInMinutes } = require("date-fns");

async function saveToDb(day, payload) {
  return new Promise((resolve) => {
    //    console.log(JSON.stringify(payload));
    fs.writeFileSync(`reportData/${day}.json`, JSON.stringify(payload));
    resolve();
  });
}
function getWaitingTime(ticket) {
  return 0;
}

function getHandlingTime(ticket) {
  return 0
 // return Math.random() * 5256;
}

async function getReportDailyData(day) {
  if (!fs.existsSync("reportData")) {
    fs.mkdirSync("reportData");
  }
  try {
    let data = fs.readFileSync(`reportData/${day}.json`);
    return JSON.parse(data.toString());
  } catch (e) {}
}
async function getReportWeeklyData(day) {
  if (!fs.existsSync("reportData")) {
    fs.mkdirSync("reportData");
  }
  try {
    let data = fs.readFileSync(`reportData/week-${day}.json`);

    return JSON.parse(data.toString());
  } catch (e) {}
}

async function getReportMonthlyData(day) {
  if (!fs.existsSync("reportData")) {
    fs.mkdirSync("reportData");
  }
  try {
    let data = fs.readFileSync(`reportData/month-${day}.json`);

    return JSON.parse(data.toString());
  } catch (e) {}
}
function removeTicketFromDistribution(ticketId, waitingTimeDistribution) {
  Object.entries(waitingTimeDistribution).forEach(([key]) => {
    waitingTimeDistribution[key] = waitingTimeDistribution[key].filter(
      (value) => value !== ticketId
    );
  });
}
function handledWaitingServiceTimeDistribution(
  ticket,
  waitingServiceTimeDistribution,
  type
) {
  removeTicketFromDistribution(
    ticket.objectId,
    waitingServiceTimeDistribution
  );
  let time;
  if (type == 0) {
    time = getWaitingTime(ticket);
  } else {
    time = getHandlingTime(ticket);
  }

  if (time < 2000) {
    waitingServiceTimeDistribution["lessThanTwo"].push(ticket.objectId);
  } else if (time < 5000) {
    waitingServiceTimeDistribution["lessThanFive"].push(ticket.objectId);
  } else if (time < 10000) {
    waitingServiceTimeDistribution["lessThanTen"].push(ticket.objectId);
  } else if (time < 15000) {
    waitingServiceTimeDistribution["lessThanFifteen"].push(ticket.objectId);
  } else if (time < 30000) {
    waitingServiceTimeDistribution["MoreThanThirty"].push(ticket.objectId);
  } else {
  }
  return waitingServiceTimeDistribution;
}
function calculateTime(lastUpdatedAt) {
  const now = new Date();

  const minutesDiff = differenceInMinutes(now, new Date(lastUpdatedAt));
  return minutesDiff
}
module.exports = {
  saveToDb,
  getWaitingTime,
  getHandlingTime,
  getReportDailyData,
  getReportWeeklyData,
  getReportMonthlyData,
  handledWaitingServiceTimeDistribution,
  calculateTime,
};
