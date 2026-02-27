 const { Wallet } = require("xahau");

// Restaurar wallet desde un seed existente
// (usa tu propio seed de testnet)
const seed = "ssv9fE7uKD6UgY37kWvcSigkd8Bbb";
// Si prefieres derivarla en ed25519, elimina {algorithm: 'secp256k1'} ya que usará ed25519 por defecto
const wallet = Wallet.fromSeed(seed, {algorithm: 'secp256k1'});

console.log("Dirección:", wallet.address);
console.log("Clave pública:", wallet.publicKey);
console.log("Seed:", wallet.seed);

// El mismo seed siempre genera la misma dirección
// ¡Nunca compartas tu seed!