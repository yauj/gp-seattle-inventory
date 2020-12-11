export const LEDGER_NAME = "GP-Seattle-Inventory";
const TABLE = "inventory";

export async function insertItem(tx, doc) {
    return tx.execute(`INSERT INTO ${TABLE} ${name}`);
}

export async function queryByName(tx, name) {
    return tx.execute(`SELECT * FROM ${TABLE} WHERE name = ${name}`);
}

export async function updateItemByName(tx, key, value, name) {
    return tx.execute(`UPDATE ${TABLE} SET ${key} = ${value} WHERE name = ${name}`);
}