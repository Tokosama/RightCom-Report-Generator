const fs = require("fs");
const {} = require("date-fns");
const {
  calculateTime,
  updateLongestWaitingTime,
  formatTime,
  convertDate,
  getAllDailyReports,
} = require("../../utils/utils.js"); //
const moment = require("moment");
const { saveToFile } = require("../../utils/utils.js");
const currentDate = moment().format("DD_MM_YYYY");
const dailyReport = require(`../../reportData/15_04_2025-final.json`);
const { getCompanyInfos } = require("../../utils/getCompanyInfo.js");

const { generateDailyReport } = require("../../generateReport.js");
const { dailyDataUpdateBeforeFormater } = require("../generateDailyReport.js");
const currentYear = new Date().getFullYear();

async function sampleMonoDaily(companyId, date, data) {
  // formatage of All Customerssssssssssssssssssssssssssssssss
  let totalCount = 0;
  let totalServed = 0;
  let totalNoShow = 0;
  let totalWaitingTime = 0;
  let totalHandlingTime = 0;
  //  console.log(data);
  const smartName = Object.values(data.smartQueues)[0].name;

  //console.log(smartName); // { name: "Sabi OROU", handlingTime: 6, total: 7 }

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

  //service Request Listsssssssssssssssssssssssssssssssssssssssssssss ,
  const servicesRequests = [];
  let totalServiceTickets = 0;

  // Calculer le total global de tous les tickets pour le pourcentage
  for (const serviceId in data.services) {
    totalServiceTickets += data.services[serviceId].total || 0;
  }

  // Génération des servicesRequests
  for (const serviceId in data.services) {
    const service = data.services[serviceId];
    const total = service.total || 0;
    const waitingTime = service.waitingTime || 0;
    const handlingTime = service.handlingTime || 0;

    servicesRequests.push({
      id: serviceId,
      serviceName: service.name || "",
      customers: {
        total,
        percent: totalServiceTickets
          ? parseFloat(((total / totalServiceTickets) * 100).toFixed(2))
          : 0,
      },
      avgWaitingTime: formatTime(total ? waitingTime / total : 0),
      avgServiceTime: formatTime(total ? handlingTime / total : 0),
    });
  }

  //agents Performancessssssssssssssssssssssssssssssssssssssss

  const agentPerformances = [];
  let totalAgentTickets = 0;

  // Étape 1 : Calcul du total global de tickets gérés par tous les agents
  for (const agentId in data.agents) {
    totalAgentTickets += data.agents[agentId].total || 0;
  }

  // Étape 2 : Générer la liste des performances agents
  let counter = 1;

  for (const agentId in data.agents) {
    const agent = data.agents[agentId];
    const total = agent.total || 0;
    const handlingTime = agent.handlingTime || 0;
    const name = agent.name || "";

    // Ignorer les agents sans nom ou identifiants invalides si tu veux
    agentPerformances.push({
      id: agentId,
      ticket: {
        total,
        percent: totalAgentTickets
          ? parseFloat(((total / totalAgentTickets) * 100).toFixed(2))
          : 0,
      },
      name,
      avgService: formatTime(total ? handlingTime / total : 0),
    });
  }

  // console.log(agentPerformances);
  const finalReport = {
    companyAlias: undefined,
    today: convertDate(date),
    missed: totalNoShow,
    waiting: formatTime(totalWaitingTime ? totalWaitingTime : 0),
    year: currentYear,
    smartQueue: smartName,
    customerInformation: {
      time: data.longestWaitingTime.waitingTime,
      ticket: data.longestWaitingTime.ticketId,
      name: data.longestWaitingTime.customerName,
      email: data.longestWaitingTime.custormerEmail,
      phone: data.longestWaitingTime.customerPhone,
    },
    allCustomers,
    servicesRequests,
    agentPerformances,
    report_name: undefined,
    daily_csv:
      "https://cdn.rightcomtech.com/api/1.0/download?app_name=rightq&file_id=9da2b1de-a4c8-437c-a4e8-fbd7e260b1af&as_attachment=0",
    firstname: undefined,
    lastname: undefined,
    email: undefined,
    companyName: undefined,
    userId: undefined,
    companyId: undefined,
    env: "prod",
    role: "online",
    language: undefined,
    timeZone: undefined,
    account: "https://demo.rightq.rightcom.com",
    xp: "https://demo.rightq.rightcom.com",
    feedback: "https://rightcom.com/contact/",
    expert: "https://rightcom.com/contact/",
  };

  console.log(finalReport.customerInformation);
  const globalCompanyInfo = await getCompanyInfos(companyId);
  const { companyInfo, Adminsreceivers, managersreceivers, companyInfosCache } =
    globalCompanyInfo;

  //Adapt report for each Adminn for each Admin in AdminnReceiver and companyInfo
  const finalReports = [];
  //console.log(Adminsreceivers)
  //console.log("*******************************");
  // console.log(managersreceivers);
  managersreceivers.forEach((admin) => {
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
  //console.log(managersreceivers)
  for (const report of finalReports) {
    console.log(report);
    console.log("//////////////////////////////////////////////");
    //generateDailyReport("daily_manager_1q_report", report);
  }
  // console.log(totalNoShow);
}

//excution of the programme
(async () => {
  const allReports = await getAllDailyReports();
  allReports.forEach(async (file) => {
    const [namePart, datePartWithExt] = file.split(/-(?=\d{2}_\d{2}_\d{4})/);
    const date = datePartWithExt.replace(".json", "");
    const companyId = namePart;

    const dailyReport = require(`../../reportData/dailyReport/${file}`);

    const addActvieToReport = await dailyDataUpdateBeforeFormater(dailyReport);
    sampleMonoDaily(companyId, date, addActvieToReport);
    //console.dir(addActvieToReport, { depth: null, colors: true });

    //console.log(`Company ID: ${companyId}, Date: ${date}`);
  });
})();
