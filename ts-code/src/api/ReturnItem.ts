import { MainTable } from "../db/MainTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/DBClient"

/**
 * Return specified item
 */
export class ReturnItem {
    public static NAME: string = "return item"

    private readonly mainTable: MainTable
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.mainTable = new MainTable(client)
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, ReturnItem.NAME)
                .then(() => "IDs of Items (separated by spaces):")
        } else if (scratch.ids === undefined) {
            var ids: string[] = request.split(/(\s+)/)
                .filter((str: string) => str.trim().length > 0)
                .map((str: string) => str.toLowerCase().trim())
            return this.transactionsTable.appendToScratch(number, "ids", ids)
                .then(() => "Name of current borrower:")
        } else {
            scratch.borrower = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    private execute(scratch: ScratchInterface): Promise<string> {
        return Promise.all(scratch.ids.map((id: string) => this.mainTable.updateItem(id, "borrower", "", scratch.borrower)))
            .then(() => `Successfully returned items '${scratch.ids.toString()}'.`)
    }
}

/**
 * @param ids IDs of Items
 * @param borrower Name of borrower
 */
interface ScratchInterface {
    ids?: string[]
    borrower?: string
}