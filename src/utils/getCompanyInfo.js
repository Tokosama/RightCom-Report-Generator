const axios = require("axios");
const PARSE_APP_ID = "rightq";
const PARSE_JAVASCRIPT_KEY = "javascriptKey";
const Parse = require("parse/node");
const lodash = require("lodash");
require("dotenv").config();

const company = "makloud-access";
const getRealmUsersWithRolesCache = async (company) => {
  try {
    const res = await axios.post(
      `https://xp-api.rightcomtech.com/rest/functions/getRealmUsersWithRoles`,
      {
        realm: company,
        token: "rightq",
        _ApplicationId: "rightcomxp",
        _JavaScriptKey: "javascriptKey",
        _ClientVersion: "js4.1.0",
      }
    );
    return res.data;
  } catch (err) {
    console.error("Erreur lors de la requête :", err);
    return null; // important d'avoir un fallback
  }
};
function getUserByRole(company, companyUsers, role) {
  // console.log(companyUsers.result);
  return lodash
    .filter(companyUsers.result, (user) =>
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
//-------------------------------------------
const getRealmCache = async (company) => {
  try {
    const res = await axios.post(
      `https://xp-api.rightcomtech.com/rest/functions/getRealm`,
      {
        realm: company,
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

  return companyInfoCacheData;
};
//---------------------------------------------------------------
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

async function getCompanyInfos(companyId) {
  Parse.initialize(PARSE_APP_ID, PARSE_JAVASCRIPT_KEY);
  Parse.serverURL = "https://rightq-v2-backend-beta.rightcomtech.com/api";
  let company = companyId;

  let companyUsers = await getRealmUsersWithRolesCache(company);
  const administrators = getAdmins(company, companyUsers);
  const managers = getManagers(company, companyUsers);

  const Adminsreceivers = extractReceiverInfo(administrators, "rightq_admin");
  const managersreceivers = extractReceiverInfo(managers, "rightq_manager");

  const companyInfo = await getRealmCache(company);

  const companyInfosCache = await getCompanyInfoCache(company);
  return {
    companyInfo,
    Adminsreceivers,
    managersreceivers,
    companyInfosCache,
  };
}
async function main() {
  const companyInfo = await getCompanyInfos("opkeyemi");
  console.dir(companyInfo, { depth: null, colors: true });
}

//main();

module.exports = {
  getCompanyInfos,
};
