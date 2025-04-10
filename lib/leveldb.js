// leveldb.js
const { Level } = require("level");
// Crée (ou ouvre) la base dans le dossier 'mabase'
const db = new Level("./database", { valueEncoding: "json" });
// ➕ Fonction pour enregistrer une donnée
async function saveDataToDb(key, value) {
  try {
    await db.put(key, value);
    console.log(`✅ Donnée enregistrée : ${key}`);
  } catch (err) {
    console.error("❌ Erreur d’enregistrement :", err);
  }
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
readAll();
module.exports = {
  saveDataToDb,
  readData,
  readAll,
  deleteData,
};
