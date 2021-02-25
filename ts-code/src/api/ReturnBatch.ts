import { BatchTable } from "../db/BatchTable"
import { MainTable } from "../db/MainTable"
import { SearchIndexSchema } from "../db/Schemas"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

/**
 * Borrow all items in a batch
 */
export class ReturnBatch {
    public static NAME: string = "return batch"

    private readonly mainTable: MainTable
    private readonly batchTable: BatchTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.mainTable = new MainTable(client)
        this.batchTable = new BatchTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, ReturnBatch.NAME)
                .then(() => "Name of Batch:")
        } else if (scratch.name === undefined) {
            return this.transactionsTable.appendToScratch(number, "name", request)
                .then(() => "Name of current borrower:")
        } else if (scratch.borrower === undefined) {
            return this.transactionsTable.appendToScratch(number, "borrower", request)
                .then(() => "Optional notes to leave about this action:")
        } else {
            scratch.notes = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    /**
     * Required params in scratch
     * @param name Name of batch
     * @param borrower Name of borrower
     * @param notes Notes about this action
     */
    public execute(scratch: ScratchInterface): Promise<string> {
        return emitAPIMetrics(
            () => {
                return this.batchTable.get(scratch.name)
                    .then((entry: SearchIndexSchema) => {
                        if (entry) {
                            return Promise.all(entry.val.values.map((id: string) =>
                                this.mainTable.changeBorrower(id, scratch.borrower, "return", scratch.notes)
                            ))
                        } else {
                            throw Error(`Could not find batch '${scratch.name}'`)
                        }
                    })
                    .then(() => `Successfully returned items in batch '${scratch.name}'`)
            },
            ReturnBatch.NAME, this.metrics
        )
    }
}

interface ScratchInterface {
    name?: string,
    borrower?: string,
    notes?: string
}