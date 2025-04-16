const TEMPLATES = require("./templates.json");

const axios = require("axios");
async function generateDailyReport(template, data) {
  const url = "https://jsreport.rightcomtech.com/api/report";

  const env = data.env;
  const companyId = data.companyId;
  let rightq = "rightq-beta";
  let domain = "rightcomtech";

  if (env === "staging") {
    domain = "right-com";
    rightq = "rightq";
  } else if (env === "prod") {
    domain = "rightcom";
    rightq = "rightq";
  }

  const account = `https://${companyId}.${rightq}.${domain}.com`;
  const language = data.language || "en";

  let payload = { ...data, account, xp: account };
  payload.feedback = "https://rightcom.com/contact/";
  payload.expert = "https://rightcom.com/contact/";

  let subject = `${payload.report_name} - ${payload.companyName || ""}`;
  payload.report_name = subject;

  if (data.airflow) {
    payload.report_name = `Apache Airflow - ${subject}`;
  }

  const body = {
    template: {
      shortid: TEMPLATES[template]?.[language] || "",
    },
    data: payload,
  };

  try {
    const response = await axios.post(url, body, {
      auth: {
        username: "rightbot",
        password: "quel@lumiereS01t",
      },
    });

    const receiver = data.email || "";

    if (response && response?.status === 200) {
      console.log(response);
      console.log(`Email sent to ${receiver}`);
      Object.entries(data).forEach(([key, value]) => {
        console.log(`${key} = ${value}`);
      });
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

//generateDailyReport('13e_8cX1a5',data);
//generateDailyReport("daily_admin_report", monoData);

module.exports = { generateDailyReport };
