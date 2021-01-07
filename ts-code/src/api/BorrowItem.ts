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
                .then(() => "IDs of Items (separated by spaces):")
        } else if (scratch.ids === undefined) {
            var ids: string[] = request.split(/(\s+)/)
                .filter((str: string) => str.trim().length > 0)
                .map((str: string) => str.toLowerCase().trim())
            return this.transactionsTable.appendToScratch(number, "ids", ids)
                .then(() => "Name of intended borrower:")
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
     * Required params in scratch object:
     * @param ids IDs of Items
     * @param borrower Name of borrower
     * @param notes Notes about this action
     */
    public execute(scratch: ScratchInterface): Promise<string> {
        return Promise.all(scratch.ids.map((id: string) =>
                this.mainTable.changeBorrower(id, scratch.borrower, "borrow", scratch.notes)
            )).then(() => `Successfully borrowed items '${scratch.ids.toString()}'.`)
    }  
}

interface ScratchInterface {
    ids?: string[],
    borrower?: string,
    notes?: string
}