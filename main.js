const { readAll } = require("./lib/leveldb");
const { getDailyReportDataFromDb } = require("./utils/utils");

async function main() {
  // await saveDataToDb("todaydab", { test2: "something 2" });
  //  getDailyReportDataFromDb();

  readAll();
}

main();
