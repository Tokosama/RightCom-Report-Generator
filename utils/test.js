// const { differenceInMinutes } = require("date-fns");
// const { getReportDailyData, getYesterdayDate, getActiveTicketList } = require("./utils");
// const lastUpdateAt = new Date("2025-03-17T10:10:58.782Z");
// const now = new Date();
// const minutesDiff = differenceInMinutes(now, lastUpdateAt);
// console.log(minutesDiff); // Devrait donner environ 53 minutes
// getActiveTicketList();
//whyHGbIEd369S6uH
const Parse = require('parse/node');
const lodash = require('lodash');

const objectId = "OK7td9e9tagY0dDt";
const company = "makloud-access";
const smartQueue = "XaD25rPCvp";
const service = "CLZfDXQMvV";
const status = "NOSHOW";
const axios = require("axios");
//const { getTimes } = require("./utils");
require("dotenv").config();
// axios
//   .post(
//     `${process.env.TIMES_CALCUL_URL}/writeTimes`,
//     {
//       objectId,
//       company,
//       smartQueue,
//       service,
//       status,
//     },
//     {}
//   )
//   .then((res) => {
//     console.log(res);
//   })
//   .catch((err) => {
//     console.log(err);
//   });
// axios
//   .get(
//     `${process.env.TIMES_CALCUL_URL}/readTimes?objectId=${objectId}&company=${company}`,
//   )
//   .then((res) => {
//     console.log(res.data);
//   })
//   .catch((err) => {
//     console.log(err);
//   });

//console.log(getTimes(ticket))
//axiossssssssssssssssssssssssssssssssssssssssssssss

//const xpCache = require("./xpCache");

const getRealmUsersWithRolesCache = async (company) => {
axios
  .post(
    `https://xp-api.rightcomtech.com/rest/functions/getRealmUsersWithRoles`,
    {
      realm: "makloud-access",
      token: "rightq",

      _ApplicationId: "rightcomxp",
      _JavaScriptKey: "javascriptKey",
      _ClientVersion: "js4.1.0",
    },
    {}
  )
  .then((res) => {
   // console.dir(res.data.result[0], { depth: null, colors: true });
    return res.data
  })
  .catch((err) => {
    console.log(err);
  });
};

// module.exports = getRealmUsersWithRolesCache;

function getUserByRole(company, companyUsers, role) {
  return lodash
    .filter(companyUsers, (user) =>
      lodash.some(user.clientMappings, (mapping) =>
        lodash.some(mapping.mappings, { name: role })
      )
    )
    .filter((u) => u.enabled)
    .map((u) => ({ ...u, company }));
}

function getAdmins(company, companyUsers) {
  return getUserByRole(company, companyUsers, "rightq_admin");
}
// //getAdmins();
function getManagers(company, companyUsers) {
  return getUserByRole(company, companyUsers, "rightq_manager");
}

const getRealmCache = async (company) => {
    try {
      const res = await axios.post(
        `https://xp-api.rightcomtech.com/rest/functions/getRealm`,
        {
          realm: "makloud-access",
          token: "rightq",
          _ApplicationId: "rightcomxp",
          _JavaScriptKey: "javascriptKey",
          _ClientVersion: "js4.1.0",
        }
      );
     // console.dir(res.data);
      return res.data; // ✅ ce retour sera bien accessible avec await
    } catch (err) {
      console.log(err);
      return null;
    }
  };
  
module.exports = getRealmCache;

// const redis = require("../connection");
// const {
//   PARSE_APP_ID,
//   PARSE_JAVASCRIPT_KEY,
//   RIGHTQ_BACKEND,
// } = require("../constants");

const getCompanyInfoCache = async (company) => {
  const key = `${company}_info`;

 // let companyInfoCacheData = await redis.get(key);
 let companyInfoCacheData = undefined;

  try {
    companyInfoCacheData = JSON.parse(companyInfoCacheData);
  } catch (e) {
    companyInfoCacheData = undefined;
  }

  if (companyInfoCacheData) return companyInfoCacheData;

  Parse.initialize(PARSE_APP_ID, PARSE_JAVASCRIPT_KEY);
  Parse.serverURL = "https://rightq-v2-backend-beta.rightcomtech.com/api";

  const companyInfo = await Parse.Cloud.run("checkCompanyInfos", {
    realm: company,
    token: Date.now(),
  }).catch((error) => {
    console.log(error);
  });

  if (companyInfo) {
    companyInfoCacheData = companyInfo.toJSON();
   // redis.set(key, JSON.stringify(companyInfoCacheData), "EX", 180);
  }
  console.log("testttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt")

  return companyInfoCacheData;
};

module.exports = getCompanyInfoCache;

function extractReceiverInfo(users, roleName) {
  if (!Array.isArray(users) || users.length === 0) {
    return [];
  }

  return users
    .filter((user) =>
      user.clientMappings?.rightq?.mappings?.some(
        (mapping) => mapping.name === roleName
      )
    )
    .map((user) => ({
      id: user.id,
      firstname: user.firstName,
      lastname: user.lastName,
      email: user.email,
      role: roleName,
    }));
}
const PARSE_APP_ID = "rightq"
const PARSE_JAVASCRIPT_KEY ="javascriptKey"

async function getCompanyInfos() {
  Parse.initialize(PARSE_APP_ID, PARSE_JAVASCRIPT_KEY);
  Parse.serverURL = "https://rightq-v2-backend-beta.rightcomtech.com/api";
  let company = "opkeyemi";

  let companyUsers = await getRealmUsersWithRolesCache(company);
  const administrators = getAdmins(company, companyUsers);
  const managers = getManagers(company, companyUsers);

  const Adminsreceivers = extractReceiverInfo(administrators, "rightq_admin");
  const managersreceivers = extractReceiverInfo(managers, "rightq_manager");

  const companyInfo = await getRealmCache(company);
  console.log(companyInfo)

  const companyInfosCache = await getCompanyInfoCache(company);
  return {
    companyInfo,
    Adminsreceivers,
    managersreceivers,
    companyInfosCache,
  };
}
async function main() {
    const compInfo = await getCompanyInfos();
    console.log(compInfo);
  }
  
  main();
  
// const compInfo =  getCompanyInfos();
// console.log(compInfo)
