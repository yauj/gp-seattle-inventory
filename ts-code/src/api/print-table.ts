import { TransactionsDB } from "../db/transactions"
import { MAIN_TABLE, ITEMS_TABLE, TAGS_TABLE, TRANSACTIONS_TABLE } from "../db/schemas";
import { DBClient } from "../injection/interface"
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const randomWords = require("random-words")

/**
 * Scan entire table, returning as a string
 * 
 * WARNING: THIS IS A EXPENSIVE OPERATION
 */
export class PrintTable {
    private readonly client: DBClient
    private readonly transactionsDB: TransactionsDB

    public constructor(client: DBClient) {
        this.client = client
        this.transactionsDB = new TransactionsDB(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): Promise<any> {
        if (scratch === undefined) {
            return this.transactionsDB.create(number, "print table")
                .then(() => "Name of table: (Options: main, items, tags, transactions)")
        } else {
            return this.transactionsDB.delete(number)
                .then(() => {
                    var params: DocumentClient.ScanInput = {
                        TableName: this.getTableName(request),
                    }
                    return this.client.scan(params)
                }).then((output: DocumentClient.ScanOutput) => JSON.stringify(output.Items))
        }
    }

    private getTableName(tableName: string): string {
        if (tableName === "main") {
            return MAIN_TABLE
        } else if (tableName === "items") {
            return ITEMS_TABLE
        } else if (tableName === "tags") {
            return TAGS_TABLE
        } else if (tableName === "transactions") {
            return TRANSACTIONS_TABLE
        } else {
            throw Error("Unsupported Table Name: " + tableName)
        }
    }
}

/**
 * @param name Name of Item
 * @param notes Owner of this item (or location where it's stored if church owned)
 * @param tags Notes about this specific item (In practice, never specified)
 */
interface ScratchInterface {
    name?: string,
    createItem?: boolean,
    categoryNotes?: string,
    tags?: string[], 
    owner?: string,
    itemNotes?: string
}