const { connectToMqtt } = require("./connectToMqtt");
const { processAllReports } = require("./sendAllReport");
const cron = require("node-cron");

// const { readAll } = require("./lib/leveldb");
// const { getDailyReportDataFromDb } = require("./utils/utils");

async function main() {
  // await saveDataToDb("todaydab", { test2: "something 2" });
  //  getDailyReportDataFromDb();
  connectToMqtt();
  // readAll();
  //await processAllReports();

  cron.schedule("8 12 * * *", async () => {
    console.log("⏰ Exécution automatique du sampleDaily à midi !");
    await processAllReports();
  });
}

main();
