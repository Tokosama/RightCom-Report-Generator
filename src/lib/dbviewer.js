// viewerServer.js
const { createViewerServer } = require('@pcan/leveldb-viewer');
const leveldown = require('leveldown');
const levelup = require('levelup');
const encode = require('encoding-down');

// Crée la base de données avec leveldown, encode avec json pour les valeurs
const db = levelup(encode(leveldown('./database'), { keyEncoding: 'buffer', valueEncoding: 'json' }));

// Crée un serveur HTTP pour visualiser la base
const server = createViewerServer(db);

// Démarre le serveur sur le port 9090 (ou un autre si tu préfères)
server.listen(9090, () => {
  console.log('Server started on http://localhost:9090');
});

