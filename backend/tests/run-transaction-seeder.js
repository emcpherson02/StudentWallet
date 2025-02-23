const TransactionSeeder = require('./transaction-seeder');

async function run() {
    const userId = 'USER-ID';
    const token = "BEARER-TOKEN";

    const seeder = new TransactionSeeder(userId, token);
    await seeder.seedTransactions();
}

run().catch(console.error);

// run with 'node run-transaction-seeder.js' on terminal