const tickets = require("../tickets.json"); // Importer directement

const fs = require("fs");
const moment = require("moment");
const {
  saveToFile,
  getWaitingTime,
  getHandlingTime,
  getReportDailyData,
  getDailyReportDataFromDb,
} = require("../utils/utils.js");

const { saveDataToDb } = require("../lib/leveldb.js");

async function reporDailytWorker(ticket) {
  const { status, objectId: ticketId } = ticket;

  const currentDate = moment().format("DD_MM_YYYY");
  //getDailyReportDataFromDb
  //let data = (await getDailyReportDataFromDb(currentDate)) || {};

  let data = (await getReportDailyData(currentDate)) || {};

  if (["NOSHOW", "CLOSED"].includes(status)) {
    const ticketWaitingTime = getWaitingTime(ticket);
    const ticketHandlingTime = getHandlingTime(ticket);

    const { smartQueue, service, agent } = ticket;
    if (!data.smartQueues) data.smartQueues = {};
    if (!data.services) data.services = {};
    if (!data.agents) data.agents = {};

    let queueData = data.smartQueues[smartQueue] || {
      waitingTime: 0,
      handlingTime: 0,
      total: { count: 0, noshowCount: 0 },
    };

    let serviceTicketsCount = data.services[service] || 0;
    let agentTicketsCount = data.agents[agent] || 0;

    data.waitingTime = (data.waitingTime || 0) + ticketWaitingTime;
    data.handlingTime = (data.handlingTime || 0) + ticketHandlingTime;

    data.services[service] = serviceTicketsCount + 1;
    data.agents[agent] = agentTicketsCount + 1;

    if (!queueData.services) queueData.services = {};

    let queueServiceTicketsCount = queueData.services[service] || 0;
    queueData.services[service] = queueServiceTicketsCount + 1;

    // increment waiting and handling time
    queueData.waitingTime = (queueData.waitingTime || 0) + ticketWaitingTime;
    queueData.handlingTime = (queueData.handlingTime || 0) + ticketHandlingTime;

    queueData.total.count = queueData.total.count + 1;
    if (status === "NOSHOW") {
      queueData.total.noshowCount = queueData.total.noshowCount + 1;
    }

    data.smartQueues[smartQueue] = queueData;

    // remove ticket from active tickets list
    data.activeTickets = data.activeTickets?.filter(
      (activeTicket) => activeTicket.id !== ticketId
    );
  } else {
    if (!data.activeTickets) data.activeTickets = [];
    if (!data.handledTickets) data.handledTickets = [];

    // add ticket to the active tickets list  and if exists remove then add again

    if (
      data.activeTickets.find((activeTicket) => activeTicket.id === ticketId)
    ) {
      data.activeTickets = data.activeTickets?.filter(
        (activeTicket) => activeTicket.id !== ticketId
      );
      data.activeTickets.push({
        id: ticketId,
        waitingTime: getWaitingTime(ticket),
        handlingTime: getHandlingTime(ticket),
        service: ticket.service,
        agent: ticket.agent,
        smartQueue: ticket.smartQueue,
        status: ticket.status,
        lastUpdatedAt: ticket.statusUpdatedAt.iso,
        // events: ticket.ticketEvents,
      });
    } else {
      data.activeTickets.push({
        id: ticketId,
        waitingTime: getWaitingTime(ticket),
        handlingTime: getHandlingTime(ticket),

        service: ticket.service,
        agent: ticket.agent,
        smartQueue: ticket.smartQueue,
        status: ticket.status,
        lastUpdatedAt: ticket.statusUpdatedAt.iso,

        // events: ticket.ticketEvents,
      });
    }

    if (status === "ATTENDING") {
      // add ticket to the handled tickets list
      if (
        !data.handledTickets.find(
          (handledTicket) => handledTicket.id === ticketId
        )
      ) {
        data.handledTickets.push({
          id: ticketId,
          waitingTime: getWaitingTime(ticket),
          handlingTime: getHandlingTime(ticket),

          service: ticket.service,
          agent: ticket.agent,
          smartQueue: ticket.smartQueue,
          // events: ticket.ticketEvents,
        });
      }
    }
  }

  //await saveDataToDb(currentDate, data);
  await saveToFile(currentDate, data);
}

async function processTickets() {
  for (const ticket of tickets) {
    await reporDailytWorker(ticket);
  }
}
processTickets();
