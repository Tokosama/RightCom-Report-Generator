const fs = require("fs");
const {} = require("date-fns");
const {
  calculateTime,
  updateLongestWaitingTime,
} = require("../../utils/utils.js"); //
const moment = require("moment");
const { saveToFile } = require("../../utils/utils.js");
const currentDate = moment().format("DD_MM_YYYY");
const dailyReport = require(`../../reportData/15_04_2025-final.json`);
async function sampleDaily(data) {
  //console.log(data);
  //RateNoshowCount

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

  //Summary

  let summaryTotal = 0;
  const summarySmartQueues = [];

  // Première boucle pour calculer le total global
  for (const queueId in data.smartQueues) {
    const queue = data.smartQueues[queueId];
    const count = queue.total?.count || 0;

    summaryTotal += count;
  }

  // Deuxième boucle pour construire les smartQueues
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

  // Objet final summary
  const summary = {
    total: summaryTotal,
    smartQueues: summarySmartQueues,
    total_smart_queue: summarySmartQueues.length,
  };

  // averageWaiting Time per SmartQueue

  // Fonction utilitaire pour formater un temps (en secondes) en "HH h MM min SS sec"
  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs} h ${mins} min ${secs} sec`;
  }

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

  //Ticket PPer Agenttttttttt

  const ticketsPerAgent = [];

  let totalAgentTickets = 0;

  for (const agentData of Object.values(data.agents)) {
    totalAgentTickets += agentData.total || 0;
  }

  for (const [agentId, agentData] of Object.entries(data.agents)) {
    const ticketCount = agentData.total || 0;
    const percent =
      totalAgentTickets > 0
        ? +((ticketCount * 100) / totalAgentTickets).toFixed(2)
        : 0;

    ticketsPerAgent.push({
      id: agentId, // ici l'id est bien la clé
      name: agentData.name,
      tickets: ticketCount,
      percent: percent,
    });
  }

  //Ticket Handled Per Service
  const ticketsHandlePerService = [];

  let totalServiceTickets = 0;

  // Calcul du total de tous les tickets de tous les services
  for (const service of Object.values(data.services)) {
    totalServiceTickets += service.total || 0;
  }

  // Génération du tableau
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

  //Final Reportttttttt

  const finalReport = {
    companyAlias: "COMAPNY BETA",
    today: "Monday 12 August, 2024",
    avgWaitedTime: formatTime(Math.floor(data.waitingTime / totalCount)),
    account: "https://company-beta.rightq-beta.rightcomtech.com",
    year: 2024,
    rateOfNoShow,
    summary,
    averageWaitingTimePerSmartQueue,
    ticketsPerAgent,
    ticketsHandlePerService,
    report_name: "Your Daily Personalized Report - COMAPNY BETA",
    daily_csv:
      "https://cdn.rightcomtech.com/api/1.0/download?app_name=rightq&file_id=ec8284cc-8815-4945-abb0-5f4887b2fb00&as_attachment=0",
    senderEmail: "dev@product.rightcom.com",
    env: "beta",
    firstname: "Sabi",
    lastname: "Anouar",
    email: "anouartoko@gmail.com",
    userId: "936b8b19-7681-41ae-9fb5-92545bc078f3",
    companyId: "company-beta",
    companyName: "COMAPNY BETA",
    role: "rightq_admin",
    language: "en",
    timeZone: "US/Pacific",
    xp: "https://company-beta.rightq-beta.rightcomtech.com",
    feedback: "https://rightcom.com/contact/",
    expert: "https://rightcom.com/contact/",
  };
  console.log(finalReport);
}

sampleDaily(dailyReport);
