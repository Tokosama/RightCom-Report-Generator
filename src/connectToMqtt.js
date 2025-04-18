require("dotenv").config();
const mqtt = require("mqtt");
const { reportDailyWorker } = require("./worker/reportDailyWorker");
const { getTimes } = require("./utils");
const brokerUrl = process.env.REACT_APP_MQTT_BROKER;
const client = mqtt.connect(brokerUrl);

async function connectToMqtt() {
  client.on("connect", () => {
    console.log("connectee au broker ");
    const topic = "rightq/#";
    //const topic = "rightq-v3-backend-events";
    //const topic2 = "rightq/rightq-v3-backend-events/#";
    client.subscribe(topic, (err) => {
      if (err) {
        console.log("Erreur lors de labonnement", err);
      } else {
        console.log("topic:", topic);
      }
    });
  });

  let ticketData = null;
  client.on("message", (topic, message) => {
    console.log(topic);
    if (!topic.includes("agent_actions") && !topic.includes("backend")) {
      console.log(
        "mmmmmmmmmmmmmmmmmmmqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqttttttttttttttttttttttttttttttttttttttttttttttttttt"
      );

      try {
        const msgStr = message.toString();
        // Essayons de parser seulement si ça ressemble à du JSON
        if (msgStr.startsWith("{")) {
          ticketData = JSON.parse(msgStr);
          //console.log(ticketData);
          reportDailyWorker(ticketData);
          // console.log(
          //   "////////////////////////////////////////////////////////////////////"
          // );
        } else {
          console.log("🟡 Message non JSON :", msgStr);
        }
      } catch (err) {
        console.error("❌ Erreur lors du parsing JSON :", err.message);
      }
      //console.log(ticketData);
      //console.log("topic:", topic);
      // console.log("************************************")
      // console.log("message:", JSON.parse(message.toString()));
    }
  });
}

//console.log(ticketData);

module.exports = {
  connectToMqtt,
};
