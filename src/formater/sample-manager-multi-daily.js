const fs = require("fs");
const {} = require("date-fns");
const {
  calculateTime,
  updateLongestWaitingTime,
} = require("../../utils/utils.js"); //
const moment = require("moment");
const { saveToFile } = require("../../utils/utils.js");
const currentDate = moment().format("DD_MM_YYYY");
const dailyReport = require(`../../reportData/${currentDate}-final.json`);

async function sampleMultiDaily(data) {



  
}

sampleMultiDaily(dailyReport);
