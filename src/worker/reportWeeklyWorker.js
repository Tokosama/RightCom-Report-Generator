const { getISOWeek } = require("date-fns");
const tickets = require("../../tickets.json");
const fs = require("fs");
const moment = require("moment");

const {
  saveToFile,
  getWaitingTime,
  getHandlingTime,
  getReportWeeklyData,
  handledWaitingServiceTimeDistribution,
} = require("../utils/utils.js");

async function reportWeeklyWorker(ticket) {
  const { status, objectId: ticketId } = ticket;

  const currentWeek = getISOWeek(new Date());
  let data = (await getReportWeeklyData(currentWeek)) || {};
  if (["NOSHOW", "CLOSED"].includes(status)) {
    const ticketWaitingTime = getWaitingTime(ticket);
    const ticketHandlingTime = getHandlingTime(ticket);
    const { smartQueue, service, agent } = ticket;
    if (!data.smartQueues) data.smartQueues = {};
    if (!data.services) data.services = {};
    if (!data.agents) data.agents = {};

    //Array retaining the  waitingTimeDistribution
    if (!data.waitingTimeDistribution)
      data.waitingTimeDistribution = {
        lessThanTwo: [],
        lessThanFive: [],
        lessThanTen: [],
        lessThanFifteen: [],
        lessThanThirty: [],
        moreThanThirty: [],
      };
    if (!data.serviceTimeDistribution)
      data.serviceTimeDistribution = {
        lessThanTwo: [],
        lessThanFive: [],
        lessThanTen: [],
        lessThanFifteen: [],
        lessThanThirty: [],
        moreThanThirty: [],
      };

    let queueData = data.smartQueues[smartQueue] || {
      waitingTime: 0,
      handlingTime: 0,
      total: { count: 0, noshowCount: 0, closedCount: 0 },
    };

    // check if service exists
    if (!data.services[service]) {
      data.services[service] = {
        count: 0,
        noShowCount: 0,
        waitingTime: 0,
        handlingTime: 0,
      };
    }
    //agent
    if (!data.agents[agent]) {
      data.agents[agent] = {
        count: 0,
        handlingTime: 0,
      };
    }
    let serviceTicketsCount = data.services[service]["count"] || 0;
    let serviceNoShowCount = data.services[service]["noShow"] || 0;
    let serviceWaitingTime = data.services[service]["waitingTime"] || 0;
    let serviceHandlingTime = data.services[service]["handlingTime"] || 0;

    let agentTicketsCount = data.agents[agent]["count"] || 0;
    let agentHandlingTime = data.agents[agent]["handlingTime"] || 0;

    data.waitingTime = (data.waitingTime || 0) + ticketWaitingTime;
    data.handlingTime = (data.handlingTime || 0) + ticketHandlingTime;

    data.services[service] = {
      count: serviceTicketsCount + 1,
      waitingTime: serviceWaitingTime + getWaitingTime(ticket),
      handlingTime: serviceHandlingTime + getHandlingTime(ticket),
    };
    data.agents[agent] = {
      count: agentTicketsCount + 1,
      handlingTime: agentHandlingTime + getHandlingTime(ticket),
    };
    if (!queueData.services) queueData.services = {};
    let queueServiceTicketsCount = queueData.services[service] || 0;
    queueData.services[service] = queueServiceTicketsCount + 1;

    //increment waiting and handling time
    queueData.waitingTime = (queueData.waitingTime || 0) + ticketWaitingTime;
    queueData.handlingTime = (queueData.handlingTime || 0) + ticketHandlingTime;
    queueData.total.count = queueData.total.count + 1;
    // Make a show Count
    if (status === "NOSHOW") {
      data.services[service] = {
        ...data.services[service],
        noShow: serviceNoShowCount + 1,
      };
      queueData.total.noshowCount = queueData.total.noshowCount + 1;
    }

    //Make a CLOSED count
    if (status === "CLOSED") {
      queueData.total.closedCount = queueData.total.closedCount + 1;
      data.serviceTimeDistribution = handledWaitingServiceTimeDistribution(
        ticket,
        data.serviceTimeDistribution,
        0
      );
    }
    //+++++++++++++++++++
    data.waitingTimeDistribution = handledWaitingServiceTimeDistribution(
      ticket,
      data.waitingTimeDistribution
    );

    //+++++++++++++++++++
    data.smartQueues[smartQueue] = queueData;
    data.activeTickets = data.activeTickets?.filter(
      (activeTicket) => activeTicket.id !== ticketId
    );
  } else {
    if (!data.activeTickets) data.activeTickets = [];
    if (!data.handledTickets) data.handledTickets = [];
    // if (!data.waitingTimeDistribution)
    //   data.waitingTimeDistribution = {
    //     lessThanTwo: [],
    //     lessThanFive: [],
    //     lessThanTen: [],
    //     lessThanFifteen: [],
    //     lessThanThirty: [],
    //     moreThanThirty: [],
    //   };
    // if (!data.serviceTimeDistribution)
    //   data.serviceTimeDistribution = {
    //     lessThanTwo: [],
    //     lessThanFive: [],
    //     lessThanTen: [],
    //     lessThanFifteen: [],
    //     lessThanThirty: [],
    //     moreThanThirty: [],
    //   };

    //--------
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
    //------

    if (status === "ATTENDING") {
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
      // data.serviceTimeDistribution = handledWaitingServiceTimeDistribution(
      //   ticket,
      //   data.waitingTimeDistribution,
      //   1
      // );
    }
    // if (status === "ONHOLD") {
    //   data.serviceTimeDistribution = handledWaitingServiceTimeDistribution(
    //     ticket,
    //     data.serviceTimeDistribution,
    //     1
    //   );
    // }
  }

  await saveToFile(`week-${currentWeek}`, data);
}

async function processTickets() {
  for (const ticket of tickets) {
    await reportWeeklyWorker(ticket);
  }
}
-processTickets();
