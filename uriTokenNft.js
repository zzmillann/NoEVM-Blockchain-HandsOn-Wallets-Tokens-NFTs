require("dotenv").config();
const { Client, Wallet } = require("xahau");

function toHex(str) {
  return Buffer.from(str, "utf8").toString("hex").toUpperCase();
}

async function mintURIToken() {
  const client = new Client("wss://xahau-test.net");
  await client.connect();

  const creator = Wallet.fromSeed(process.env.WALLET_SEED, {algorithm: 'secp256k1'});

  // Crear un URIToken con una URI que apunta a los metadatos
  const mint = {
    TransactionType: "URITokenMint",
    Account: creator.address,
    // URI de ejemplo (puede ser IPFS, HTTPS, etc.) - Ejemplo: ipfs://bafybeieza5w4rkes55paw7jgpo4kzsbyywhw7ildltk3kjx2ttkmt7texa/106.json
    URI: toHex("ipfs://bafkreig3x2t6rbhmrbxjf5neeui2wyrui6oheqqfuwfb6dsjr3lvkhnbna"),
    Flags: 1, // tfBurnable: el emisor puede quemar el token
  };

  const prepared = await client.autofill(mint);
  const signed = creator.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  console.log("Resultado:", result.result.meta.TransactionResult);

  if (result.result.meta.TransactionResult === "tesSUCCESS") {
    console.log("¡URIToken creado con éxito!");
    console.log("Hash tx:", signed.hash);

    // Buscar el URIToken creado en los nodos afectados
    const created = result.result.meta.AffectedNodes.find(
      (n) => n.CreatedNode?.LedgerEntryType === "URIToken"
    );
    if (created) {
      console.log("URIToken ID:", created.CreatedNode.LedgerIndex);
      console.log("Address:", creator.address);

    }
  }

  await client.disconnect();
}

mintURIToken();