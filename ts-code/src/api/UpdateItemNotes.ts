import { MainTable } from "../db/MainTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/DBClient"

/**
 * Update notes about a item.
 */
export class UpdateItemNotes {
    public static NAME: string = "update item notes"

    private readonly mainTable: MainTable
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.mainTable = new MainTable(client)
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, UpdateItemNotes.NAME)
                .then(() => "ID of item:")
        } else if (scratch.id === undefined) {
            return this.transactionsTable.appendToScratch(number, "id", request)
                .then(() => "New Note:")
        } else {
            scratch.note = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    /**
     * Required params for scratch object:
     * @param id ID of Item
     * @param note String of the new note.
     */
    public execute(scratch: ScratchInterface): Promise<string> {
        return this.mainTable.updateItem(scratch.id, "notes", scratch.note)
            .then(() => `Successfully updated notes about item '${scratch.id}'`)
    }
}

interface ScratchInterface {
    id?: string
    note?: string
}