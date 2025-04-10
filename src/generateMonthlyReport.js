const { getMonth } = require("date-fns");
const { calculateTime } = require("../utils/utils.js"); //

const currentMonth = getMonth(new Date()) + 1;

const monthlyReport = require(`./reportData/month-${currentMonth}.json`);

const {
  saveToFile,
  getWaitingTime,
  getHandlingTime,
  getReportDailyData,
  handledWaitingServiceTimeDistribution,
} = require("../utils/utils.js");
function generateMonthlyReport(data) {
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
      service: ticketService,
      smartQueue: ticketSmartQueue,
      agent: ticketAgent,
      handlingTime: ticketHandlingTime,

      status: ticketStatus, //
      lastUpdatedAt: ticketLastUpdatedAt, //

      waitingTime: ticketWaitingTime,
    } = ticket;

    //
    let lastHandlingTime = 0;
    let lastWaitingTime = 0;
    if (ticketStatus == "ATTENDING") {
      lastHandlingTime = calculateTime(ticketLastUpdatedAt);
      console.log(lastHandlingTime);
    } else {
      lastWaitingTime = calculateTime(ticketLastUpdatedAt);
      console.log(lastWaitingTime);
    }
    //

    //data.services[ticketService] = (data.services[ticketService] || 0) + 1;
    if (typeof ticketAgent == "string") {
      if (data.agents[ticketAgent]) {
        data.agents[ticketAgent] = {
          ...data.agents[ticketAgent],
          count: (data.agents[ticketAgent].count || 0) + 1,
          handlingTime:
            (data.agents[ticketAgent].handlingTime || 0) +
            ticketHandlingTime +
            lastHandlingTime,
        };
      } else {
        data.agents[ticketAgent] = {
          ...data.agents[ticketAgent],
          count: 1,
          handlingTime: ticketHandlingTime + lastHandlingTime,
        };
      }
    }

    data.smartQueues[ticketSmartQueue] = {
      ...data.smartQueues[ticketSmartQueue],
      waitingTime:
        (data.smartQueues[ticketSmartQueue]?.waitingTime || 0) +
        ticketWaitingTime +
        lastWaitingTime,
      handlingTime:
        (data.smartQueues[ticketSmartQueue]?.handlingTime || 0) +
        ticketHandlingTime +
        lastHandlingTime,
      total: {
        ...data.smartQueues[ticketSmartQueue]?.["total"],
        count: (data.smartQueues[ticketSmartQueue]?.["total"].count || 0) + 1,
      },
      services: {
        ...data.smartQueues[ticketSmartQueue]?.["services"],

        [ticketService]:
          (data.smartQueues[ticketSmartQueue]?.["services"][ticketService] ||
            0) + 1,
      },
    };
    data.waitingTime =
      (data.waitingTime || 0) + ticketWaitingTime + lastWaitingTime;
    data.handlingTime =
      (data.handlingTime || 0) + ticketHandlingTime + lastHandlingTime;

    data.services[ticketService] = {
      ...data.services[ticketService],
      count: (data.services[ticketService].count || 0) + 1,
      waitingTime:
        (data.services[ticketService].waitingTime || 0) +
        ticketWaitingTime +
        lastWaitingTime,

      handlingTime:
        (data.services[ticketService].handlingTime || 0) +
        ticketHandlingTime +
        lastHandlingTime,
    };
    // data.waitingTimeDistribution = handledWaitingServiceTimeDistribution(
    //   ticket,
    //   data.waitingTimeDistribution,
    //   0
    // );
    // data.serviceTimeDistribution = handledWaitingServiceTimeDistribution(
    //   ticket,
    //   data.serviceTimeDistribution,
    //   0
    // );
  }
  delete data["activeTickets"];
  delete data["handledTickets"];
  saveToFile(`month-${currentMonth}-final`, data);
}

generateMonthlyReport(monthlyReport);
