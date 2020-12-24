"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDBClient = void 0;
const schemas_1 = require("../../src/db/schemas");
/**
 * Local instance of DBClient, which stores everything as part of a single object
 */
class LocalDBClient {
    constructor() {
        this.db = {
            main: {},
            items: {},
            tags: {},
            transactions: {}
        };
    }
    /**
     * Return entire database as a string
     */
    toJSON() {
        return JSON.stringify(this.db);
    }
    delete(params) {
        return this.newPromise(() => {
            delete this.getTable(params.TableName)[Object.values(params.Key)[0]];
            return {};
        });
    }
    get(params) {
        return this.newPromise(() => {
            return { Item: this.getTable(params.TableName)[Object.values(params.Key)[0]] };
        });
    }
    put(params) {
        return this.newPromise(() => {
            if (params.TableName === schemas_1.MAIN_TABLE) {
                const val = params.Item;
                const key = val.name;
                this.db.main[key] = val;
            }
            else if (params.TableName === schemas_1.ITEMS_TABLE) {
                const val = params.Item;
                const key = val.key;
                this.db.items[key] = val;
            }
            else if (params.TableName === schemas_1.TAGS_TABLE) {
                const val = params.Item;
                const key = val.key;
                this.db.tags[key] = val;
            }
            else if (params.TableName == schemas_1.TRANSACTIONS_TABLE) {
                const val = params.Item;
                const key = val.number;
                this.db.transactions[key] = val;
            }
            else {
                throw new Error("Invalid Table Name: " + params.TableName);
            }
            return {};
        });
    }
    update(params) {
        return this.newPromise(() => {
            if (params.UpdateExpression === "SET #key = list_append(#key, :val)") {
                // TODO: Maybe a bug, where concatenation is not working
                const key = params.ExpressionAttributeNames["#key"];
                const val = params.ExpressionAttributeValues[":val"];
                this.getTable(params.TableName)[Object.values(params.Key)[0]][key]
                    = this.getTable(params.TableName)[Object.values(params.Key)[0]][key].concat(val);
            }
            else if (params.UpdateExpression === "SET #attr.#key = :val") {
                const attr = params.ExpressionAttributeNames["#attr"];
                const key = params.ExpressionAttributeNames["#key"];
                const val = params.ExpressionAttributeValues[":val"];
                this.getTable(params.TableName)[Object.values(params.Key)[0]][attr][key] = val;
            }
            else {
                throw Error("Unsupported UpdateExpression: " + params.UpdateExpression);
            }
            return {};
        });
    }
    // Default to full table scan for now.
    scan(params) {
        return this.newPromise(() => {
            const table = Object.values(this.getTable(params.TableName));
            return {
                Items: table,
                Count: table.length,
                ScannedCount: table.length
            };
        });
    }
    getTable(tableName) {
        if (tableName === schemas_1.MAIN_TABLE) {
            return this.db.main;
        }
        else if (tableName === schemas_1.ITEMS_TABLE) {
            return this.db.items;
        }
        else if (tableName === schemas_1.TAGS_TABLE) {
            return this.db.tags;
        }
        else if (tableName == schemas_1.TRANSACTIONS_TABLE) {
            return this.db.transactions;
        }
        else {
            throw new Error("Invalid Table Name");
        }
    }
    newPromise(runnable) {
        return new Promise((resolve, reject) => {
            try {
                const response = runnable();
                resolve({ ...response, ...{ $response: null } });
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.LocalDBClient = LocalDBClient;
//# sourceMappingURL=testImpl.js.map