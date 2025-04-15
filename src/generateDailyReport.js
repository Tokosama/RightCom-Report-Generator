const fs = require("fs");
const {
  calculateTime,
  updateLongestWaitingTime,
  getTimes,
} = require("../utils/utils.js"); //
const moment = require("moment");
const { saveToFile } = require("../utils/utils.js");
const currentDate = moment().format("DD_MM_YYYY");
const dailyReport = require(`../reportData/${currentDate}.json`);

async function generateDailyReport(data) {
  // if(!data.smartQueues) data.smartQueues ={}
  // if(!data.services) data.services ={}
  // if(!data.agents) data.agents ={}

  const {
    activeTickets,
    smartQueues,
    services,
    agents,
    waitingTime,
    handlingTime,
  } = data;

  for (const ticket of activeTickets) {
    const {
      id: ticketId,
      company: company,
      service: ticketService,
      serviceName: ticketServiceName,
      smartQueue: ticketSmartQueue,
      smartQueueName:ticketSmartQueueName,
      agent: ticketAgent,
      agentName: ticketAgentName,
      waitingTime: ticketWaitingTime,
      handlingTime: ticketHandlingTime,
      status: ticketStatus, //
      lastUpdatedAt: ticketLastUpdatedAt,
      customer: ticketCustomer, //
    } = ticket;
    // Waiting and Handling time management
    let lastHandlingTime = 0;
    let lastWaitingTime = 0;
    //Calcul of the Timessss
    if (ticketStatus == "ATTENDING") {
      lastHandlingTime = calculateTime(ticketLastUpdatedAt);
      // console.log(lastHandlingTime);
    } else {
      lastWaitingTime = calculateTime(ticketLastUpdatedAt);
      // console.log(lastWaitingTime);
    }
    const timeData = await getTimes(ticketId, company);
    let fullWaitingTime = timeData?.waitingTime;
    let fullHandlingTime = timeData?.handlingTime;

    let fullWaitingTime2 = ticketWaitingTime + lastWaitingTime;
    let fullHandlingTime2 = ticketHandlingTime + lastHandlingTime;
    // console.log(timeData?.objectId);

    // console.log(fullWaitingTime);
    // console.log(lastWaitingTime);

    // serviceData
    let serviceData = data.services[ticketService] || {
      name: null,
      total: 0,
    };
    serviceData.name = data.services[ticketService]?.name || ticketServiceName;
    serviceData.total = (data.services[ticketService]?.total || 0) + 1;

    //agent Data
    let agentData = data.agents[ticketAgent] || {
      name: null,
      total: 0,
    };
    agentData.name = data.agents[ticketAgent]?.name || ticketAgentName;
    agentData.total = (data.agents[ticketAgent]?.total || 0) + 1;

    //longest Waiting Time
    let longestWaitingTime = data.longestWaitingTime || {
      ticketId: null,
      customerName: null,
      custormerEmail: null,
      customerPhone: null,
      waitingTime: 0,
    };
    console.log(longestWaitingTime);
    console.log("********************************************");

    longestWaitingTime = await updateLongestWaitingTime(
      fullWaitingTime,
      longestWaitingTime,
      ticket,
      ticketCustomer
    );
    console.log(longestWaitingTime);

    //data attributions
    data.longestWaitingTime = longestWaitingTime;
    data.services[ticketService] = serviceData;
    data.agents[ticketAgent] = agentData;

    // data.services[ticketService] = data.services[ticketService] || {
    //   id: ticketService,
    //   name: ticketName,
    //   ticket: 0,
    // };

    // data.services[ticketService].ticket =
    //   data.services[ticketService].ticket + 1;

    // if (typeof ticketAgent == "string") {
    //   if (data.agents[ticketAgent]) {
    //     data.agents[ticketAgent] = (data.agents[ticketAgent] || 0) + 1;
    //   } else {
    //     data.agents[ticketAgent] = 1;
    //   }
    // }

    data.smartQueues[ticketSmartQueue] = {
      ...data.smartQueues[ticketSmartQueue],
      name: data.smartQueues[ticketSmartQueue]?.name || ticketSmartQueueName,
      waitingTime:
        (data.smartQueues[ticketSmartQueue]?.waitingTime || 0) +
        fullWaitingTime,
      handlingTime:
        (data.smartQueues[ticketSmartQueue]?.handlingTime || 0) +
        fullHandlingTime,
      total: {
        ...data.smartQueues[ticketSmartQueue]?.["total"],
        count: (data.smartQueues[ticketSmartQueue]?.["total"].count || 0) + 1,
      },
      services: {
        ...data.smartQueues[ticketSmartQueue]?.["services"],

        [ticketService]: {
          name:
            data.smartQueues[ticketSmartQueue]?.["services"][ticketService]
              ?.name || ticketServiceName,
          waitingTime:
            (data.smartQueues[ticketSmartQueue]?.["services"][ticketService]
              ?.waitingTime || 0) + fullWaitingTime,
          handlingTime:
            (data.smartQueues[ticketSmartQueue]?.["services"][ticketService]
              ?.handlingTime || 0) + fullHandlingTime,
          total: {
            ...data.smartQueues[ticketSmartQueue]?.["services"][ticketService]
              ?.total,

            count:
              (data.smartQueues[ticketSmartQueue]?.["services"][ticketService]
                ?.total.count || 0) + 1,
          },
        },
      },
      agents: {
        ...data.smartQueues[ticketSmartQueue]?.["agents"],

        [ticketAgent]: {
          name:
            data.smartQueues[ticketSmartQueue]?.["agents"][ticketAgent]?.name ||
            ticketAgentName,
          handlingTime:
            (data.smartQueues[ticketSmartQueue]?.["agents"][ticketAgent]
              ?.handlingTime || 0) + fullHandlingTime,
          total: {
            ...data.smartQueues[ticketSmartQueue]?.["agents"][ticketAgent]
              ?.total,

            count:
              (data.smartQueues[ticketSmartQueue]?.["agents"][ticketAgent]
                ?.total.count || 0) + 1,
          },
        },
      },
    };

    data.waitingTime = (data.waitingTime || 0) + fullWaitingTime;
    data.handlingTime = (data.handlingTime || 0) + fullHandlingTime;
  }
  delete data["activeTickets"];
  delete data["handledTickets"];

  saveToFile(`${currentDate}-final`, data);
}

generateDailyReport(dailyReport);
