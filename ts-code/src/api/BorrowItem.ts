import { MainTable } from "../db/MainTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/DBClient"

/**
 * Borrow specified item
 */
export class BorrowItem {
    public static NAME: string = "borrow item"

    private readonly mainTable: MainTable
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.mainTable = new MainTable(client)
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, BorrowItem.NAME)
                .then(() => "ID of item:")
        } else if (scratch.id === undefined) {
            return this.transactionsTable.appendToScratch(number, "id", request)
                .then(() => "Name of intended borrower:")
        } else {
            scratch.borrower = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    private execute(scratch: ScratchInterface): Promise<string> {
        return this.mainTable.updateItem(scratch.id, "borrower", scratch.borrower, "")
            .then(() => `Successfully borrowed item '${scratch.id}'.`)
    }  
}

/**
 * @param id ID of Item
 * @param borrower Name of borrower
 */
interface ScratchInterface {
    id?: string
    borrower?: string
}