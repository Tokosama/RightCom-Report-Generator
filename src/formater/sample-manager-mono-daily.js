const fs = require("fs");
const {} = require("date-fns");
const {
  calculateTime,
  updateLongestWaitingTime,
  formatTime,
} = require("../../utils/utils.js"); //
const moment = require("moment");
const { saveToFile } = require("../../utils/utils.js");
const currentDate = moment().format("DD_MM_YYYY");
const dailyReport = require(`../../reportData/15_04_2025-final.json`);
async function sampleDaily(data) {
  // formatage of All Customerssssssssssssssssssssssssssssssss
  let totalCount = 0;
  let totalServed = 0;
  let totalNoShow = 0;
  let totalWaitingTime = 0;
  let totalHandlingTime = 0;

  for (const sqId in data.smartQueues) {
    const queue = data.smartQueues[sqId];
    const total = queue.total || {};

    totalCount += total.count || 0;
    totalServed += total.closed || 0;
    totalNoShow += total.noshow || 0;
    totalWaitingTime += queue.waitingTime || 0;
    totalHandlingTime += queue.handlingTime || 0;
  }

  const servedPercent = totalCount ? (totalServed / totalCount) * 100 : 0;
  const noShowPercent = totalCount ? (totalNoShow / totalCount) * 100 : 0;

  const avgWaiting = totalCount ? totalWaitingTime / totalCount : 0;
  const avgService = totalCount ? totalHandlingTime / totalCount : 0;
  const avgTime = avgWaiting + avgService;
  const allCustomers = {
    served: {
      total: totalServed,
      percent: parseFloat(servedPercent.toFixed(2)),
    },
    noShow: {
      total: totalNoShow,
      percent: parseFloat(noShowPercent.toFixed(2)),
    },
    avgWaiting: formatTime(avgWaiting),
    avgService: formatTime(avgService),
    avgTime: formatTime(avgTime),
    total: totalCount,
  };



  //service Request Listsssss ,


  let totalServiceCount = 0;
const serviceRequests = [];

  console.log(allCustomers);
  //   const finalReport = {
  //     companyAlias: "COMAPNY BETA",
  //     today: "Monday 12 August, 2024",
  //     avgWaitedTime: formatTime(Math.floor(data.waitingTime / totalCount)),
  //     account: "https://company-beta.rightq-beta.rightcomtech.com",
  //     year: 2024,
  //     rateOfNoShow,
  //     summary,
  //     averageWaitingTimePerSmartQueue,
  //     ticketsPerAgent,
  //     ticketsHandlePerService,
  //     report_name: "Your Daily Personalized Report - COMAPNY BETA",
  //     daily_csv:
  //       "https://cdn.rightcomtech.com/api/1.0/download?app_name=rightq&file_id=ec8284cc-8815-4945-abb0-5f4887b2fb00&as_attachment=0",
  //     senderEmail: "dev@product.rightcom.com",
  //     env: "beta",
  //     firstname: "Sabi",
  //     lastname: "Anouar",
  //     email: "anouartoko@gmail.com",
  //     userId: "936b8b19-7681-41ae-9fb5-92545bc078f3",
  //     companyId: "company-beta",
  //     companyName: "COMAPNY BETA",
  //     role: "rightq_admin",
  //     language: "en",
  //     timeZone: "US/Pacific",
  //     xp: "https://company-beta.rightq-beta.rightcomtech.com",
  //     feedback: "https://rightcom.com/contact/",
  //     expert: "https://rightcom.com/contact/",
  //   };
  //   console.log(finalReport);
}

sampleDaily(dailyReport);
