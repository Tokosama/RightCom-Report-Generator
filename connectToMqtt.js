require("dotenv").config();
const mqtt = require("mqtt");
const { reporDailytWorker } = require("./src/reportDailyWorker");
const brokerUrl = process.env.REACT_APP_MQTT_BROKER;
const client = mqtt.connect(brokerUrl);

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
  if (!topic.includes("agent_actions")) {
    //console.log("**************************************");
    ticketData = JSON.parse(message.toString());
    reporDailytWorker(ticketData);
    //console.log(ticketData);
    //console.log("topic:", topic);
    console.log("message:", JSON.parse(message.toString()));
  }
});

console.log(ticketData);
