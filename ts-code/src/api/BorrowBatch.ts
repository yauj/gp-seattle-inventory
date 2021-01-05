import { BatchTable } from "../db/BatchTable"
import { MainTable } from "../db/MainTable"
import { SearchIndexSchema } from "../db/Schemas"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/DBClient"

/**
 * Borrow all items in a batch
 */
export class BorrowBatch {
    public static NAME: string = "borrow batch"

    private readonly mainTable: MainTable
    private readonly batchTable: BatchTable
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.mainTable = new MainTable(client)
        this.batchTable = new BatchTable(client)
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, BorrowBatch.NAME)
                .then(() => "Name of Batch:")
        } else if (scratch.name === undefined) {
            return this.transactionsTable.appendToScratch(number, "name", request)
                .then(() => "Name of intended borrower:")
        } else {
            scratch.borrower = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    private execute(scratch: ScratchInterface): Promise<string> {
        return this.batchTable.get(scratch.name)
            .then((entry: SearchIndexSchema) => {
                if (entry) {
                    return Promise.all(entry.val.values.map((id: string) =>
                        this.mainTable.updateItem(id, "borrower", scratch.borrower, "")
                    ))
                } else {
                    throw Error(`Could not find batch '${scratch.name}'`)
                }
            })
            .then(() => `Successfully borrowed items in batch '${scratch.name}'`)
    }
}

/**
 * @param name Name of batch
 */
interface ScratchInterface {
    name?: string
    borrower?: string
}