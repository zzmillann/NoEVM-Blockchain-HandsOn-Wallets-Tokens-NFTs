const { Client, Wallet } = require("xahau");

async function createTestnetWallet() {
  const client = new Client("wss://xahau-test.net");
  await client.connect();

  // Generar una nueva wallet
  const wallet = Wallet.generate();
  console.log("Wallet generada:");
  console.log("  Dirección:", wallet.address);
  console.log("  Seed:", wallet.seed);

  // Solicitar fondos del faucet de testnet
  console.log("Solicitando fondos del faucet...");
  const fundResult = await client.fundWallet(wallet);

  console.log("¡Wallet financiada!");
  console.log("  Balance:", fundResult.balance, "XAH");

  // Verificar la cuenta en el ledger
  const response = await client.request({
    command: "account_info",
    account: wallet.address,
    ledger_index: "validated",
  });

  const account = response.result.account_data;
  console.log("Datos de la cuenta en el ledger:");
  console.log("  Balance:", account.Balance, "drops");
  console.log("  Balance:", Number(account.Balance) / 1_000_000, "XAH");
  console.log("  Secuencia:", account.Sequence);

  await client.disconnect();
}

createTestnetWallet();