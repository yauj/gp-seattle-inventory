import { MainTable } from "../db/MainTable"
import { ItemTable } from "../db/ItemTable"
import { BatchTable } from "../db/BatchTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { MainSchema, SearchIndexSchema, SecondaryIndexSchema } from "../db/Schemas"
import { DBClient } from "../injection/DBClient"

/**
 * Get List of Items from Batch ID
 */
export class GetBatch {
    public static NAME: string = "get batch"

    private readonly mainTable: MainTable
    private readonly itemTable: ItemTable
    private readonly batchTable: BatchTable
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.mainTable = new MainTable(client)
        this.itemTable = new ItemTable(client)
        this.batchTable = new BatchTable(client)
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, GetBatch.NAME)
                .then(() => "Name of Batch:")
        } else {
            scratch.name = request
            return this.transactionsTable.delete(number)
                    .then(() => this.execute(scratch))
        }
    }

    private execute(scratch: ScratchInterface): Promise<string> {
        return this.batchTable.get(scratch.name)
            .then((batchEntry: SearchIndexSchema) => {
                if (batchEntry) {
                    return Promise.all(batchEntry.val.values.map((id: string) => {
                        return this.itemTable.get(id)
                            .then((secondaryEntry: SecondaryIndexSchema) => this.mainTable.get(secondaryEntry.val))
                            .then((mainEntry: MainSchema) => this.item(mainEntry, id))
                    })).then((items: string[]) => `batch: ${scratch.name}` + items.join(""))
                } else {
                    throw new Error(`Unable to find Batch '${scratch.name}'`)
                }
            })
    }

    private item(entry: MainSchema, id: string) {
        return `\n  id: ${id}`
            + `\n    name: ${entry.name}`
            + `\n    owner: ${entry.items[id].owner}`
            + `\n    borrower: ${entry.items[id].borrower}`
    }
}

/**
 * @param name Name of Batch
 */
interface ScratchInterface {
    name?: string
}