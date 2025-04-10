const fs = require("fs");
const {} = require("date-fns");
const { calculateTime } = require("../utils/utils.js"); //
const moment = require("moment");
const { saveToFile } = require("../utils/utils.js");
const currentDate = moment().format("DD_MM_YYYY");
const dailyReport = require(`./reportData/${currentDate}.json`);

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
      service: ticketService,
      smartQueue: ticketSmartQueue,
      agent: ticketAgent,
      waitingTime: ticketWaitingTime,
      handlingTime: ticketHandlingTime,
      status: ticketStatus, //
      lastUpdatedAt: ticketLastUpdatedAt, //
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
    data.services[ticketService] = (data.services[ticketService] || 0) + 1;
    //----------------------------------------------------

    //---------------------------------------------------
    //---------------------------------------------------

    data.services[ticketService] = data.services[ticketService] || {
      id: ticketService,
      name: ticketName,
      ticket: 0,
    };

    data.services[ticketService].ticket =
      data.services[ticketService].ticket + 1;

    //---------------------------------------------------

    //---------------------------------------------------

    //---------------------------------------------------
    if (typeof ticketAgent == "string") {
      if (data.agents[ticketAgent]) {
        data.agents[ticketAgent] = (data.agents[ticketAgent] || 0) + 1;
      } else {
        data.agents[ticketAgent] = 1;
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
  }
  delete data["activeTickets"];
  delete data["handledTickets"];

  saveToFile(`${currentDate}-final`, data);
}

generateDailyReport(dailyReport);
