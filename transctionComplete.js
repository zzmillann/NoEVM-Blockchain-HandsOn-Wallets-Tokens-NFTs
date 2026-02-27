require("dotenv").config();
const { Client, Wallet } = require("xahau");

async function flujoCompleto() {
  const client = new Client("wss://xahau-test.net");
  await client.connect();

  const wallet = Wallet.fromSeed(process.env.WALLET_SEED, {algorithm: 'secp256k1'});

  // =============================================
  // FASE 1: Construir la transacción
  // =============================================
  const tx = {
    TransactionType: "Payment",
    Account: wallet.address,
    Destination: "rMXEZJecFdn1dVtE21pZ8duZz2E36KGaCp",
    Amount: "5000000", // 5 XAH en drops
  };

  console.log("1. Transacción construida:");
  console.log("   Tipo:", tx.TransactionType);
  console.log("   Campos definidos:", Object.keys(tx).length);

  // =============================================
  // FASE 2: Preparar (autofill)
  // =============================================
  const prepared = await client.autofill(tx);

  console.log("2. Transacción preparada (autofill):");
  console.log("   Fee:", prepared.Fee, "drops");
  console.log("   Sequence:", prepared.Sequence);
  console.log("   LastLedgerSequence:", prepared.LastLedgerSequence);
  console.log("   NetworkID:", prepared.NetworkID);
  console.log("   Campos totales:", Object.keys(prepared).length);

  // =============================================
  // FASE 3: Firmar
  // =============================================
  const signed = wallet.sign(prepared);

  console.log("3. Transacción firmada:");
  console.log("   Hash:", signed.hash);
  console.log("   tx_blob (primeros 60 chars):", signed.tx_blob.substring(0, 60) + "...");
  console.log("   Longitud del blob:", signed.tx_blob.length, "caracteres hex");

  // =============================================
  // FASE 4: Enviar
  // =============================================
  console.log("4. Enviando al nodo...");
  const result = await client.submitAndWait(signed.tx_blob);

  // =============================================
  // FASE 5: Resultado validado
  // =============================================
  console.log("5. Resultado validado:");
  console.log("   TransactionResult:", result.result.meta.TransactionResult);
  console.log("   Ledger:", result.result.ledger_index);
  console.log("   Nodos afectados:", result.result.meta.AffectedNodes.length);

  await client.disconnect();
}

flujoCompleto().catch(console.error);