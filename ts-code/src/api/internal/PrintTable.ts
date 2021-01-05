import { TransactionsTable } from "../../db/TransactionsTable"
import { MAIN_TABLE, ITEMS_TABLE, TAGS_TABLE, TRANSACTIONS_TABLE } from "../../db/Schemas"
import { DBClient } from "../../injection/DBClient"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

/**
 * Scan entire table, returning as a string
 * 
 * WARNING: THIS IS A EXPENSIVE OPERATION
 */
export class PrintTable {
    public static NAME: string = "print table"

    private readonly client: DBClient
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.client = client
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, PrintTable.NAME)
                .then(() => "Name of table: (Options: main, items, tags, transactions)")
        } else {
            scratch.tableName = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    private execute(scratch: ScratchInterface): Promise<string> {
        var params: DocumentClient.ScanInput = {
            TableName: this.getTableName(scratch.tableName)
        }
        return this.client.scan(params)
            .then((output: DocumentClient.ScanOutput) => JSON.stringify(output.Items))
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
 * @param tableName Name of target table
 */
interface ScratchInterface {
    tableName?: string
}