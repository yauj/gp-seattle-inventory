import { BatchTable } from "../db/BatchTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/DBClient"

/**
 * Delete Batch
 */
export class DeleteBatch {
    public static NAME: string = "delete batch"

    private readonly batchTable: BatchTable
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.batchTable = new BatchTable(client)
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, DeleteBatch.NAME)
                .then(() => "Name of Batch:")
        } else if (scratch.name === undefined) {
            return this.transactionsTable.appendToScratch(number, "name", request)
                .then(() => `Type 'y' to confirm that you want to delete batch: '${request}'`)
        } else {
            if (request === "y") {
                return this.transactionsTable.delete(number)
                    .then(() => this.execute(scratch))
            } else {
                return "ERROR: Didn't receive 'y'. Please reply again with a 'y' to proceed with deleting the object, or 'abort' to abort the transaction."
            }
        }
    }

    private execute(scratch: ScratchInterface): Promise<string> {
        return this.batchTable.delete(scratch.name)
            .then(() => `Successfully deleted batch '${scratch.name}'`)
    }
}

/**
 * @param name Name of batch
 */
interface ScratchInterface {
    name?: string
}