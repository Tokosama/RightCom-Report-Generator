const cron = require("node-cron");
const path = require("path");
const fs = require("fs");
const {
  sampleMonoDaily,
} = require("./formatter/daily/sample-manager-mono-daily");
const {
  sampleMultiDaily,
} = require("./formatter/daily/sample-manager-multi-daily");
const { getAllDailyReports } = require("./utils");
const { sampleDaily } = require("./formatter/daily/sample-daily");
const {
  dailyDataUpdateBeforeFormater,
} = require("./utils/dailyDataUpdateBeforeFormatter");

//✅ Fonction principale pour traiter les rapports
// (async () => {
//     const allReports = await getAllDailyReports();
//     //  const allKey = await  getAllDailyReportsFromDb()
//     console.log(allReports);
//     allReports.forEach(async (file) => {
//       const [namePart, datePartWithExt] = file.split(/-(?=\d{2}_\d{2}_\d{4})/);

//       console.log(datePartWithExt);
//       const date = datePartWithExt.replace(".json", "");
//       const companyId = namePart;

//       const dailyReport = require(`../reportData/dailyReport/${file}`);
//       const addActvieToReport = await dailyDataUpdateBeforeFormater(dailyReport);
//       sampleDaily(companyId, date, addActvieToReport);
//       //console.dir(addActvieToReport, { depth: null, colors: true });

//       //console.log(`Company ID: ${companyId}, Date: ${date}`);
//     });
//   })();

////////////////////////////
async function processAllReports() {
  const allReports = await getAllDailyReports();

  allReports.forEach(async (file) => {
    const [namePart, datePartWithExt] = file.split(/-(?=\d{2}_\d{2}_\d{4})/);
    const date = datePartWithExt.replace(".json", "");
    const companyId = namePart;

    const dailyReport = require(`../reportData/dailyReport/${file}`);
    const addActvieToReport = await dailyDataUpdateBeforeFormater(dailyReport);
    // sampleDaily(companyId, date, addActvieToReport);
    sampleMonoDaily(companyId, date, addActvieToReport);
    // sampleMultiDaily(companyId, date, addActvieToReport);
  });
}

async function run() {
  processAllReports();
}

run();

module.exports = {
  processAllReports,
};
//🕛 Cron job — chaque jour à midi

// Pour tester manuellement à tout moment
// (async () => {
//   await processAllReports();
// })();
