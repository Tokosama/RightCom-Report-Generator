// leveldb.js
const { Level } = require("level");
// Crée (ou ouvre) la base dans le dossier 'mabase'
const db = new Level("./database", { valueEncoding: "json" });
// ➕ Fonction pour enregistrer une donnée
async function saveDataToDb(company, date, value) {
  const key = `dailyReport/${company}-${date}`;
  try {
    await db.put(key, value);
    console.log(`✅ Donnée enregistrée : ${key}`);
  } catch (err) {
    console.error("❌ Erreur d’enregistrement :", err);
  }
}
async function getAllDailyReportsFromDb() {
  const prefix = "dailyReport/";
  const keys = [];
  const iterator = db.iterator();

  try {
    while (true) {
      const entry = await iterator.next();
      if (!entry) break;

      const [key] = entry;

      if (typeof key === "string" && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
  } catch (err) {
    console.error("❌ Erreur d'itération :", err);
  } finally {
    await iterator.close();
  }

  return keys;
}

// 🔍 Fonction pour lire une donnée
async function readData(key) {
  const value = await db.get(key);
  // console.log(`📦 Donnée récupérée :`, JSON.parse(value));
  if (!value) return null;
  return value;
}

// 📚 Lire toutes les données
async function readAll() {
  console.log("📖 Lecture complète de la base :");

  try {
    for await (const [key, value] of db.iterator()) {
      console.log(`${key} => ${value}`);
    }
    console.log("✅ Lecture terminée");
  } catch (err) {
    console.error("❌ Erreur pendant la lecture :", err);
  }
}

// ❌ Supprimer une donnée
async function deleteData(key) {
  try {
    await db.del(key);
    console.log(`🗑️ Clé supprimée : ${key}`);
  } catch (err) {
    console.error("❌ Erreur de suppression :", err);
  }
}

// saveDataToDb("todaydab", {
//   test: "something",
// });
// async function main() {
//   // await saveDataToDb("todaydab", { test2: "something 2" });
//  // getDailyReportDataFromDb();
// }

// main();
// Export des fonctions
// deleteData("todaydab3")
module.exports = {
  saveDataToDb,
  readData,
  getAllDailyReportsFromDb,
  readAll,
  deleteData,
};
