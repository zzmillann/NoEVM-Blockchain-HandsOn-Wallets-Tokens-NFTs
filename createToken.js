require("dotenv").config();
const { Client, Wallet, xahToDrops } = require("xahau");

// Necesitas dos wallets con fondos en testnet y definelas en tu .env:
//   ISSUER_SEED  → Cuenta emisora del token
//   RESERVE_SEED  → Cuenta de reserva/distribución
// Puedes obtener fondos del faucet: https://xahau-test.net

// Si token_currency > 3 chars, convertir a hex de 40 (relleno con 0)
function normalizeCurrency(token_currency) {
  if (typeof token_currency !== "string") return token_currency;

  const cur = token_currency.trim();

  // 3 o menos: standard currency code
  if (cur.length <= 3) return cur;

  // >3: convertir a hex y pad a 40 (20 bytes) con 0 a la derecha
  const hex = Buffer.from(cur, "utf8").toString("hex").toUpperCase();

  if (hex.length > 40) {
    throw new Error(
      `token_currency demasiado largo: "${cur}" -> hex ${hex.length} (>40). Máx ~20 bytes en UTF-8.`
    );
  }

  return hex.padEnd(40, "0");
}

async function createAndDistributeToken() {
  const client = new Client("wss://xahau-test.net");
  await client.connect();

  // === CUENTAS ===
  const issuer = Wallet.fromSeed(process.env.ISSUER_SEED, {algorithm: 'secp256k1'});
  const reserve = Wallet.fromSeed(process.env.RESERVE_SEED, {algorithm: 'secp256k1'});

  const TOKEN_CURRENCY_INPUT = "MTK";          // Nombre del token (3 chars) o hex de 40 chars para nombres largos
  const TOTAL_SUPPLY = "1000000";        // Supply total a emitir
  
  const TOKEN_CURRENCY = normalizeCurrency(TOKEN_CURRENCY_INPUT);


  console.log("=== Creación de token ===");
  console.log("Emisor:", issuer.address);
  console.log("Reserva:", reserve.address);
  console.log("Token:", TOKEN_CURRENCY);
  console.log("Supply:", TOTAL_SUPPLY);

  // === PASO 1: Configurar la cuenta emisora con DefaultRipple ===
  console.log("--- Paso 1: Configurar DefaultRipple en el emisor ---");
  const accountSet = {
    TransactionType: "AccountSet",
    Account: issuer.address,
    SetFlag: 8, // asfDefaultRipple
  };

  const prep1 = await client.autofill(accountSet);
  const signed1 = issuer.sign(prep1);
  const result1 = await client.submitAndWait(signed1.tx_blob);
  console.log("DefaultRipple:", result1.result.meta.TransactionResult);

  if (result1.result.meta.TransactionResult !== "tesSUCCESS") {
    console.log("Error configurando el emisor. Abortando.");
    await client.disconnect();
    return;
  }

  // === PASO 2: La cuenta de reserva crea TrustLine hacia el emisor ===
  console.log("--- Paso 2: Crear TrustLine (reserva → emisor) ---");
  const trustSet = {
    TransactionType: "TrustSet",
    Account: reserve.address,
    LimitAmount: {
      currency: TOKEN_CURRENCY,
      issuer: issuer.address,
      value: TOTAL_SUPPLY, // Aceptar hasta el supply total
    },
  };

  const prep2 = await client.autofill(trustSet);
  const signed2 = reserve.sign(prep2);
  const result2 = await client.submitAndWait(signed2.tx_blob);
  console.log("TrustLine:", result2.result.meta.TransactionResult);

  if (result2.result.meta.TransactionResult !== "tesSUCCESS") {
    console.log("Error creando TrustLine. Abortando.");
    await client.disconnect();
    return;
  }

  // === PASO 3: El emisor envía todo el supply a la cuenta de reserva ===
  console.log("--- Paso 3: Emitir tokens (emisor → reserva) ---");
  const issuePayment = {
    TransactionType: "Payment",
    Account: issuer.address,
    Destination: reserve.address,
    Amount: {
      currency: TOKEN_CURRENCY,
      issuer: issuer.address,
      value: TOTAL_SUPPLY,
    },
  };

  const prep3 = await client.autofill(issuePayment);
  const signed3 = issuer.sign(prep3);
  const result3 = await client.submitAndWait(signed3.tx_blob);
  console.log("Emisión:", result3.result.meta.TransactionResult);

  if (result3.result.meta.TransactionResult !== "tesSUCCESS") {
    console.log("Error emitiendo tokens. Abortando.");
    await client.disconnect();
    return;
  }

  console.log("¡Token creado y distribuido a la cuenta de reserva!");
  console.log("Supply total:", TOTAL_SUPPLY, TOKEN_CURRENCY);

  // === VERIFICAR: Consultar balance de la cuenta de reserva ===
  console.log("--- Verificación ---");
  const lines = await client.request({
    command: "account_lines",
    account: reserve.address,
    ledger_index: "validated",
  });

  const tokenLine = lines.result.lines.find(
    (l) => l.currency === TOKEN_CURRENCY && l.account === issuer.address
  );

  if (tokenLine) {
    console.log("Balance de reserva:", tokenLine.balance, TOKEN_CURRENCY);
    console.log("Emisor:", tokenLine.account);
    console.log("Límite:", tokenLine.limit, TOKEN_CURRENCY);
  }

  // === PASO 4 (ejemplo): Distribuir tokens a un usuario final ===
  // El usuario final debe crear primero su TrustLine hacia el emisor
  // Luego la cuenta de reserva le envía tokens:
  //
  // const distribution = {
  //   TransactionType: "Payment",
  //   Account: reserve.address,
  //   Destination: "rDireccionDelUsuarioFinal",
  //   Amount: {
  //     currency: TOKEN_CURRENCY,
  //     issuer: issuer.address,
  //     value: "100",
  //   },
  // };

  await client.disconnect();
}

createAndDistributeToken();