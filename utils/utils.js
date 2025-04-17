const fs = require("fs/promises");
const axios = require("axios");
require("dotenv").config();
const path = require("path");
const { parse, format } = require("date-fns");

const { readData, saveDataToDb } = require("../lib/leveldb");
const moment = require("moment");
const { differenceInMinutes, differenceInSeconds } = require("date-fns");

async function saveToFile(company, day, payload) {
  return new Promise((resolve) => {
    //    console.log(JSON.stringify(payload));
    fs.writeFile(
      `reportData/dailyReport/${company}-${day}.json`,
      JSON.stringify(payload)
    );
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
async function getDailyReportDataFromDb(company, date) {
  const key = `dailyReport/${company}-${date}`;
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

async function getReportDailyData(company, day) {
  const dirPath = path.join("reportData", "dailyReport");
  const filePath = path.join(dirPath, `${company}-${day}.json`);

  try {
    // Vérifie si le dossier existe, sinon le créer
    await fs.access(dirPath).catch(async () => {
      await fs.mkdir(dirPath, { recursive: true });
    });

    // Lire le fichier
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Erreur dans getReportDailyData:", e.message);
    return null;
  }
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
  const secondsDiff = differenceInSeconds(now, new Date(lastUpdatedAt));
  return secondsDiff;
}

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const day = String(yesterday.getDate()).padStart(2, "0");
  const month = String(yesterday.getMonth() + 1).padStart(2, "0"); // Les mois commencent à 0
  const year = yesterday.getFullYear();

  return `${day}_${month}_${year}`;
}
async function updateLongestWaitingTime(
  ticketWaitingTime,
  longestWaitingTime,
  ticketId,
  customer
) {
  if (ticketWaitingTime >= longestWaitingTime.waitingTime) {
    longestWaitingTime.ticketId = ticketId;
    longestWaitingTime.customerName =
      (customer.firstName || "") + (customer.lastName || "");
    longestWaitingTime.custormerEmail = customer.email || "";
    longestWaitingTime.customerPhone = customer.phone || "";
    longestWaitingTime.waitingTime = ticketWaitingTime;
  }
  return longestWaitingTime;
}
async function getActiveTicketList(company) {
  const previousDay = getYesterdayDate();
  const previousData = await getReportDailyData(company, previousDay);
  // console.log(previousData.activeTickets);
  console.log("getttttttttttttttttttttttt");
  console.log(previousData);
  return previousData?.activeTickets || null;
}

async function getTimes(ticketId, company) {
  try {
    const res = await axios.get(
      `${process.env.TIMES_CALCUL_URL}/readTimes?objectId=${ticketId}&company=${company}`
    );

    return res.data; // <- ici tu retournes bien la valeur
  } catch (err) {
    //console.error(err);
    return null; // <- en cas d'erreur, retourne null ou un objet vide
  }
}

async function getAllDailyReports() {
  try {
    const directoryPath = path.join(__dirname, "../reportData", "dailyReport");
    const files = fs.readdir(directoryPath);
    return files;
  } catch (err) {
    console.error("Erreur lors de la lecture du dossier :", err);
    return [];
  }
}
function convertDate(date) {
  // Convertir le string en objet Date
  const parsedDate = parse(date, "dd_MM_yyyy", new Date());
  // Formater l’objet Date
  const formatted = format(parsedDate, "EEEE dd MMMM, yyyy");
  return formatted;
}

function formatTime(seconds) {
  // Fonction utilitaire pour formater un temps (en secondes) en "HH h MM min SS sec"

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs} h ${mins} min ${secs} sec`;
}

module.exports = {
  saveToFile,
  getTimes,
  getWaitingTime,
  getHandlingTime,
  getReportDailyData,
  getAllDailyReports,
  getReportWeeklyData,
  getReportMonthlyData,
  handledWaitingServiceTimeDistribution,
  getDailyReportDataFromDb,
  calculateTime,
  getYesterdayDate,
  updateLongestWaitingTime,
  getActiveTicketList,
  convertDate,
  formatTime,
};
