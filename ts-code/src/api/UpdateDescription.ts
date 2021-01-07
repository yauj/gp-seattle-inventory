import { MainTable } from "../db/MainTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/DBClient"

/**
 * Update description of item family
 */
export class UpdateDescription {
    public static NAME: string = "update description"

    private readonly mainTable: MainTable
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.mainTable = new MainTable(client)
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, UpdateDescription.NAME)
                .then(() => "Name of item:")
        } else if (scratch.name === undefined) {
            return this.transactionsTable.appendToScratch(number, "name", request)
                .then(() => "New Description:")
        } else {
            scratch.description = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    /**
     * Required params for scratch object:
     * @param name Name of item
     * @param description New description
     */
    public execute(scratch: ScratchInterface): Promise<string> {
        return this.mainTable.update(scratch.name, "description", scratch.description)
            .then(() => `Successfully updated description of '${scratch.name}'`)
    }
}

interface ScratchInterface {
    name?: string
    description?: string
}