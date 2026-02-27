const { ECDSA, Wallet } = require("xahau");

// Generar wallet con el algoritmo por defecto (secp256k1)
const wallet1 = Wallet.generate(ECDSA.secp256k1);
console.log("=== Wallet secp256k1 ===");
console.log("Dirección:", wallet1.address);
console.log("Clave pública:", wallet1.publicKey);
console.log("Seed:", wallet1.seed);

// Generar wallet con el algoritmo ed25519
const wallet2 = Wallet.generate();
console.log("=== Wallet ed25519 ===");
console.log("Dirección:", wallet2.address);
console.log("Clave pública:", wallet2.publicKey);
console.log("Seed:", wallet2.seed);