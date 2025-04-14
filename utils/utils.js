const fs = require("fs");

const { readData, saveDataToDb } = require("../lib/leveldb");
const moment = require("moment");
const { differenceInMinutes } = require("date-fns");

async function saveToFile(day, payload) {
  return new Promise((resolve) => {
    //    console.log(JSON.stringify(payload));
    fs.writeFileSync(`reportData/${day}.json`, JSON.stringify(payload));
    resolve();
  });
}
function getWaitingTime(ticket) {
  return 20;
}

function getHandlingTime(ticket) {
  return 20;
  // return Math.random() * 5256;
}
async function getDailyReportDataFromDb(key) {
  console.log(key);
  const data = await readData(key);
  if (!data) {
    await saveDataToDb(key, {});
    console.log("No data");
    getDailyReportDataFromDb(key);
    return;
  } else {
    console.log(data);
  }

  return data;
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
  removeTicketFromDistribution(ticket.objectId, waitingServiceTimeDistribution);
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
  return minutesDiff;
}

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const day = String(yesterday.getDate()).padStart(2, "0");
  const month = String(yesterday.getMonth() + 1).padStart(2, "0"); // Les mois commencent à 0
  const year = yesterday.getFullYear();

  return `${day}_${month}_${year}`;
}
async function updateLongestWaitingTime(ticketWaitingTime, longestWaitingTime,ticket,customer) {
  if (ticketWaitingTime >= longestWaitingTime.waitingTime) {
    console.log("1");
    longestWaitingTime.ticketId = ticket.objectId;
    longestWaitingTime.customerName =
      (customer.firstName || "") + (customer.lastName || "");
    custormerEmail = customer.email || "";
    longestWaitingTime.customerPhone = customer.phone;
    longestWaitingTime.waitingTime = ticketWaitingTime;
    return longestWaitingTime
  }
}
async function getActiveTicketList(currentData) {
  const previousDay = getYesterdayDate();
  const previousData = await getReportDailyData(previousDay);
  // console.log(previousData.activeTickets);
  console.log(previousData)
  return previousData?.activeTickets || null ;
}
module.exports = {
  saveToFile,
  getWaitingTime,
  getHandlingTime,
  getReportDailyData,
  getReportWeeklyData,
  getReportMonthlyData,
  handledWaitingServiceTimeDistribution,
  getDailyReportDataFromDb,
  calculateTime,
  getYesterdayDate,
  updateLongestWaitingTime,
  getActiveTicketList,
};
