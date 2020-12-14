import { TransactionExecutor, QldbDriver } from "amazon-qldb-driver-nodejs";

const LEDGER_NAME = "GP-Seattle-Inventory";
const TABLE = "inventory";

export async function executeLambda(
    txLambda: (tx: TransactionExecutor) => any
): Promise<any>  {
    const driver = new QldbDriver(LEDGER_NAME);

    try {
        driver.executeLambda(txLambda);
    } finally {
        driver.close();
    }
}

export async function insertItem(tx: TransactionExecutor, doc: Object) {
    return tx.execute(`INSERT INTO ${TABLE} ?`, doc);
}

export async function queryByName(tx: TransactionExecutor, name: String) {
    return tx.execute(`SELECT * FROM ${TABLE} WHERE name = ${name}`);
}

export async function updateItemByName(tx: TransactionExecutor, key: String, value: Object, name: String) {
    return tx.execute(`UPDATE ${TABLE} SET ${key} = ? WHERE name = ${name}`, value);
}