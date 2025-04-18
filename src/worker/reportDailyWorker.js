const tickets = require("../../tickets.json"); // Importer directement
const fs = require("fs");
const moment = require("moment");
const {
  saveToFile,
  getWaitingTime,
  getHandlingTime,
  getReportDailyData,
  getDailyReportDataFromDb,
  getActiveTicketList,
  getYesterdayDateString,
  updateLongestWaitingTime,
  getTimes,
} = require("../utils/index.js");

const { saveDataToDb } = require("../lib/leveldb.js");

async function reportDailyWorker(ticket) {
  console.log(
    "reeeeeeeeeeeeeeeeporttttttttttttttttttttttDailyyyyyyyyyyyyyyyyyyyyyyyyyy"
  );
  //get Time infos
  const timeData = await getTimes(ticket.objectId, ticket.company);
  const { status, company, objectId: ticketId } = ticket;
  const currentDate = moment().format("DD_MM_YYYY");
  //getDailyReportDataFromDb
  // const currentData =
  //   (await getDailyReportDataFromDb(company, currentDate)) || {};
  const currentData = await getReportDailyData(company, currentDate);
  let data = null;
  console.log(currentData);
  if (!currentData) {
    data = {};
    data.activeTickets = await getActiveTicketList(company);
  } else {
    data = currentData;
  }
  const ticketWaitingTime = timeData?.waitingTime;
  const ticketHandlingTime = timeData?.handlingTime;

  // const ticketWaitingTime = getWaitingTime(ticket);
  // const ticketHandlingTime = getHandlingTime(ticket);
  if (["NOSHOW", "CLOSED"].includes(status)) {
    const { smartQueue, service, agent, names, customer } = ticket;
    if (!data.smartQueues) data.smartQueues = {};
    if (!data.services) data.services = {};
    if (!data.agents) data.agents = {};

    let queueData = data.smartQueues[smartQueue] || {
      name: null,
      waitingTime: 0,
      handlingTime: 0,
      total: { count: 0, closed: 0, noshow: 0 },
      services: {},
      agents: {},
    };
    queueData.name = data.smartQueues[smartQueue]?.name || names.smartQueueName;

    console.log();
    console.log(smartQueue);
    let serviceQueueData = queueData.services[service] || {
      name: null,
      waitingTime: 0,
      handlingTime: 0,
      total: {
        count: 0,
        closed: 0,
        noshow: 0,
      },
    };
    let agentQueueData = queueData.agents[agent] || {
      name: null,
      handlingTime: 0,
      total: 0,
    };

    let serviceData = data.services[service] || {
      name: null,
      waitingTime: 0,
      handlingTime: 0,
      total: 0,
    };

    let agentData = data.agents[agent] || {
      name: null,
      handlingTime: 0,
      total: 0,
    };
    // let serviceTicketsCount = data.services[service] || 0;
    // let agentTicketsCount = data.agents[agent] || 0;
    data.waitingTime = (data.waitingTime || 0) + ticketWaitingTime;
    data.handlingTime = (data.handlingTime || 0) + ticketHandlingTime;
    let longestWaitingTime = data.longestWaitingTime || {
      ticketId: null,
      customerName: null,
      custormerEmail: null,
      customerPhone: null,
      waitingTime: 0,
    };
    //service by smart Queues
    serviceQueueData.name = names.serviceName;
    if (!serviceQueueData.total) {
      serviceQueueData.total = {};
    }
    serviceQueueData.total.count = (serviceQueueData.total?.count || 0) + 1;
    serviceQueueData.waitingTime =
      (serviceQueueData.waitingTime || 0) + ticketWaitingTime;
    serviceQueueData.handlingTime =
      (serviceQueueData.handlingTime || 0) + ticketHandlingTime;

    //agent by smart Queues
    if (!agentQueueData.total) {
      agentQueueData.total = {};
    }
    agentQueueData.name = names.agentName;
    agentQueueData.total.count = (agentQueueData.total?.count || 0) + 1;
    agentQueueData.handlingTime =
      (agentQueueData.handlingTime || 0) + ticketHandlingTime;

    // basics values
    serviceData.name = serviceData.name || names.serviceName;
    serviceData.total = (serviceData.total || 0) + 1;
    serviceData.waitingTime =
      (serviceData.waitingTime || 0) + ticketWaitingTime;
    serviceData.handlingTime =
      (serviceData.handlingTime || 0) + ticketHandlingTime;

    agentData.name = agentData.name || names.agentName;
    agentData.total = (agentData.total || 0) + 1;
    agentData.handlingTime = (agentData.handlingTime || 0) + ticketHandlingTime;

    data.services[service] = serviceData;
    data.agents[agent] = agentData;

    if (!queueData.services) queueData.services = {};
    let queueServiceTicketsCount = queueData.services[service] || 0;
    queueData.services[service] = queueServiceTicketsCount + 1;

    // increment waiting and handling time
    queueData.waitingTime = (queueData.waitingTime || 0) + ticketWaitingTime;
    queueData.handlingTime = (queueData.handlingTime || 0) + ticketHandlingTime;
    queueData.total.count = queueData.total.count + 1;

    //----------------------------------------------

    longestWaitingTime = await updateLongestWaitingTime(
      ticketWaitingTime,
      longestWaitingTime,
      ticketId,
      customer
    );

    data.longestWaitingTime = longestWaitingTime;

    if (status === "NOSHOW") {
      serviceQueueData.total.noshow = (serviceQueueData.total?.noshow || 0) + 1;
      agentQueueData.total.noshow = (agentQueueData.total?.noshow || 0) + 1;

      queueData.total.noshow = (queueData.total.noshow || 0) + 1;
    }
    if (status === "CLOSED") {
      serviceQueueData.total.closed = (serviceQueueData.total?.closed || 0) + 1;
      agentQueueData.total.closed = (agentQueueData.total?.closed || 0) + 1;

      queueData.total.closed = (queueData.total.closed || 0) + 1;
    }
    // add agents per smartqueue  and service per smartqueue to the data
    queueData.services[service] = serviceQueueData;
    queueData.agents[agent] = agentQueueData;
    data.smartQueues[smartQueue] = queueData;
    console.log(queueData);
    // remove ticket from active tickets list
    data.activeTickets = data.activeTickets?.filter(
      (activeTicket) => activeTicket.id !== ticketId
    );
  } else {
    if (!data.activeTickets) data.activeTickets = [];
    //if (!data.handledTickets) data.handledTickets = [];

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
        serviceName: ticket.names.serviceName,
        agent: ticket.agent,
        agentName: ticket.names.agentName,
        company: ticket.company,
        smartQueue: ticket.smartQueue,
        smartQueueName: ticket.names.smartQueueName,
        status: ticket.status,
        lastUpdatedAt: ticket.statusUpdatedAt.iso,
        customer: {
          firstName: ticket.customer.firstName,
          lastName: ticket.customer.lastName,
          email: ticket.customer.email,
          phone: ticket.customer.phone,
        },
        // events: ticket.ticketEvents,
      });
    } else {
      data.activeTickets.push({
        id: ticketId,
        waitingTime: ticketWaitingTime,
        handlingTime: ticketHandlingTime,
        service: ticket.service,
        serviceName: ticket.names.serviceName,
        agent: ticket.agent,
        agentName: ticket.names.agentName,
        company: ticket.company,
        smartQueue: ticket.smartQueue,
        smartQueueName: ticket.names.smartQueueName,
        status: ticket.status,
        lastUpdatedAt: ticket.statusUpdatedAt.iso,
        customer: {
          firstName: ticket.customer.firstName,
          lastName: ticket.customer.lastName,
          email: ticket.customer.email,
          phone: ticket.customer.phone,
        },
        // events: ticket.ticketEvents,
      });
    }

    // if (status === "ATTENDING") {
    //   // add ticket to the handled tickets list
    //   if (
    //     !data.handledTickets.find(
    //       (handledTicket) => handledTicket.id === ticketId
    //     )
    //   ) {
    //     data.handledTickets.push({
    //       id: ticketId,
    //       waitingTime: ticketWaitingTime,
    //       handlingTime: ticketHandlingTime,

    //       service: ticket.service,
    //       agent: ticket.agent,
    //       smartQueue: ticket.smartQueue,
    //       // events: ticket.ticketEvents,
    //     });
    //   }
    // }
  }
  //console.log(currentData);
  // await saveDataToDb(company,currentDate, data);
  await saveToFile(company, currentDate, data);
}
//
// async function processTickets() {
//   for (const ticket of tickets) {
//     await reportDailyWorker(ticket);
//   }
// }
// processTickets();
module.exports = {
  reportDailyWorker,
};
