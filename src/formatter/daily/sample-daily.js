const fs = require("fs");
const moment = require("moment");
const {
  saveToFile,
  getAllDailyReports,
  convertDate,
  formatTime,
} = require("../../utils/index.js");
const {
  dailyDataUpdateBeforeFormater,
} = require("../../utils/dailyDataUpdateBeforeFormatter.js");
const { getCompanyInfos } = require("../../utils/getCompanyInfo.js");
const { getAllDailyReportsFromDb, readData } = require("../../lib/leveldb.js");
const { generateDailyReport } = require("../../utils/generateReport.js");
const currentYear = new Date().getFullYear();
// dailyDataUpdateBeforeFormater();

async function sampleDaily(companyId, date, data) {
  //RateNoshowCount-------------------------------------------------------------------
  let totalCount = 0;
  let totalNoShow = 0;
  for (const queueId in data.smartQueues) {
    const queue = data.smartQueues[queueId];

    if (queue.total) {
      totalCount += queue.total.count || 0;
      totalNoShow += queue.total.noshow || 0;
    }
  }
  const rateOfNoShow = {
    percent:
      totalCount > 0
        ? parseFloat(((totalNoShow / totalCount) * 100).toFixed(2))
        : 0,
    of: totalNoShow,
    total: totalCount,
  };

  //Summary--------------------------------------------------------------------
  let summaryTotal = 0;
  const summarySmartQueues = [];
  //
  for (const queueId in data.smartQueues) {
    const queue = data.smartQueues[queueId];
    const count = queue.total?.count || 0;

    summaryTotal += count;
  }
  for (const queueId in data.smartQueues) {
    const queue = data.smartQueues[queueId];
    const count = queue.total?.count || 0;

    summarySmartQueues.push({
      id: queueId,
      smartQueue: data.smartQueues[queueId].name, // ou un autre nom si dispo
      visitors: {
        total: count,
        percent:
          summaryTotal > 0
            ? parseFloat(((count / summaryTotal) * 100).toFixed(2))
            : 0,
      },
    });
  }
  const summary = {
    total: summaryTotal,
    smartQueues: summarySmartQueues,
    total_smart_queue: summarySmartQueues.length,
  };

  // averageWaiting Time per SmartQueue-----------------------------------------------------
  const averageWaitingTimePerSmartQueue = [];
  for (const [queueId, queue] of Object.entries(data.smartQueues)) {
    const totalCount = queue.total?.count || 0;
    const waitTime = queue.waitingTime || 0;

    const avgTimeSec = totalCount > 0 ? Math.floor(waitTime / totalCount) : 0;
    averageWaitingTimePerSmartQueue.push({
      id: queueId,
      smartQueue: queueId, // ou remplace par un nom plus lisible si dispo
      avgWaitingTime: formatTime(avgTimeSec),
    });
  }

  //Ticket Per Agenttttttttt------------------------------------------------------------------
  const ticketsPerAgent = [];
  let totalAgentTickets = 0;

  for (const [agentId, agentData] of Object.entries(data.agents)) {
    const ticketCount = agentData.total || 0;

    totalAgentTickets += ticketCount;
  }
  for (const [agentId, agentData] of Object.entries(data.agents)) {
    const ticketCount = agentData.total || 0;
    const percent =
      totalAgentTickets > 0 ? (ticketCount * 100) / totalAgentTickets : 0;
    // ✅ Ne push que si l'ID n'est pas vide
    console.log(agentData);
    if (
      agentId &&
      agentData &&
      agentId.trim() !== "" &&
      agentData.name &&
      agentData.name?.trim() !== ""
    ) {
      ticketsPerAgent.push({
        id: agentId,
        name: agentData.name,
        tickets: ticketCount,
        percent: percent,
      });
    }
  }

  //Ticket Handled Per Service-------------------------------------------------------------
  const ticketsHandlePerService = [];
  let totalServiceTickets = 0;
  for (const service of Object.values(data.services)) {
    totalServiceTickets += service.total || 0;
  }
  for (const [serviceId, serviceData] of Object.entries(data.services)) {
    const ticketCount = serviceData.total || 0;
    const percent =
      totalServiceTickets > 0
        ? +((ticketCount * 100) / totalServiceTickets).toFixed(2)
        : 0;

    ticketsHandlePerService.push({
      id: serviceId, // ici, on utilise l’id comme clé de l’objet
      serviceName: serviceData.name,
      tickets: ticketCount,
      percent: percent,
    });
  }
  //Initialisation of the report

  const finalReport = {
    companyAlias: undefined,
    today: convertDate(date),
    avgWaitedTime: formatTime(Math.floor(data.waitingTime / totalCount)),
    account: "https://company-beta.rightq-beta.rightcomtech.com",
    year: currentYear,
    rateOfNoShow,
    summary,
    averageWaitingTimePerSmartQueue,
    ticketsPerAgent,
    ticketsHandlePerService,
    report_name: undefined,
    daily_csv:
      "https://cdn.rightcomtech.com/api/1.0/download?app_name=rightq&file_id=ec8284cc-8815-4945-abb0-5f4887b2fb00&as_attachment=0",
    senderEmail: "dev@product.rightcom.com",
    env: "beta",
    firstname: undefined,
    lastname: undefined,
    email: undefined,
    userId: undefined,
    companyId: undefined,
    companyName: undefined,
    role: "rightq_admin",
    language: undefined,
    timeZone: undefined,
    xp: "https://company-beta.rightq-beta.rightcomtech.com",
    feedback: "https://rightcom.com/contact/",
    expert: "https://rightcom.com/contact/",
  };

  //get Comapny Infosssssssssssssssssssssssss
  const globalCompanyInfo = await getCompanyInfos(companyId);
  const { companyInfo, Adminsreceivers, companyInfosCache } = globalCompanyInfo;

  //Adapt report for each Adminn for each Admin in AdminnReceiver and companyInfo
  const finalReports = [];
  Adminsreceivers.forEach((admin) => {
    const personalizedReport = {
      ...finalReport, // copie du modèle de base
      firstname: admin.firstname,
      lastname: admin.lastname,
      email: admin.email,
      userId: admin.id,
      report_name: `Your Daily Personalized Report - ${companyInfosCache.companyName}`,
      companyAlias: companyInfosCache.companyName,
      companyId: companyInfosCache.companyId,
      companyName: companyInfosCache.companyName,
      language: companyInfo.result?.attributes?.language,
      timeZone: companyInfo.result?.attributes?.timezone, // par défaut
    };

    finalReports.push(personalizedReport);
  });
  //Print each REport and send it to the userss
  for (const report of finalReports) {
    console.log(report);
    console.log("//////////////////////////////////////////////");

    generateDailyReport("daily_admin_report", report);
  }
}

//excution of the programme for fileStorage
// (async () => {
//   const allReports = await getAllDailyReports();
//   //  const allKey = await  getAllDailyReportsFromDb()
//   console.log(allReports);
//   allReports.forEach(async (file) => {
//     const [namePart, datePartWithExt] = file.split(/-(?=\d{2}_\d{2}_\d{4})/);

//     console.log(datePartWithExt);
//     const date = datePartWithExt.replace(".json", "");
//     const companyId = namePart;

//     const dailyReport = require(`../../reportData/dailyReport/${file}`);
//     const addActvieToReport = await dailyDataUpdateBeforeFormater(dailyReport);
//     sampleDaily(companyId, date, addActvieToReport);

//     //console.dir(addActvieToReport, { depth: null, colors: true });

//     //console.log(`Company ID: ${companyId}, Date: ${date}`);
//   });
// })();

//execution of the programme with database
// (async () => {
//   const allKeys = await getAllDailyReportsFromDb();

//   for (const key of allKeys) {
//     try {
//       const dailyReport = await readData(key);

//       // Exemple de clé : "dailyReport/companyA-17_04_2025"
//       const [_, filename] = key.split("dailyReport/"); // on récupère juste "companyA-17_04_2025"
//       const [companyId, date] = filename.split(/-(?=\d{2}_\d{2}_\d{4})/); // companyA, 17_04_2025

//       const addActiveToReport = await dailyDataUpdateBeforeFormater(
//         dailyReport
//       );
//       sampleDaily(companyId, date, addActiveToReport);

//       // Pour debug :
//       // console.dir(addActiveToReport, { depth: null, colors: true });
//     } catch (err) {
//       console.error(`❌ Erreur lors du traitement de ${key}`, err);
//     }
//   }
// })();
//sampleDaily(dailyReport);

module.exports = {
  sampleDaily,
};
