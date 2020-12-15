import { Result, TransactionExecutor, QldbDriver } from "amazon-qldb-driver-nodejs";

const LEDGER_NAME = "GP-Seattle-Inventory";
const TABLE = "inventory";

export async function executeLambda(
    txLambda: (tx: TransactionExecutor) => any
): Promise<Result>  {
    const driver = new QldbDriver(LEDGER_NAME);

    try {
        return driver.executeLambda(async (tx: TransactionExecutor) => {
            try {
                return txLambda(tx);
            } catch (e) {
                console.error(e);
                throw e;
            }
        });
    } finally {
        driver.close();
    }
}

export async function insertItem(tx: TransactionExecutor, doc: Record<string, any>): Promise<Result> {
    return tx.execute(`INSERT INTO ${TABLE} ?`, doc);
}

export async function queryAll(tx: TransactionExecutor): Promise<Result> {
    return tx.execute(`SELECT * FROM ${TABLE}`);
}

export async function queryByName(tx: TransactionExecutor, name: String): Promise<Result> {
    return tx.execute(`SELECT * FROM ${TABLE} WHERE name = ${name}`);
}

export async function updateItemByName(tx: TransactionExecutor, key: String, value: Object, name: String): Promise<Result> {
    return tx.execute(`UPDATE ${TABLE} SET ${key} = ? WHERE name = ${name}`, value);
}