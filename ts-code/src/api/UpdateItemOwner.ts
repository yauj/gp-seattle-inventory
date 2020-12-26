import { MainTable } from "../db/MainTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/DBClient"

/**
 * Update owner of item.
 */
export class UpdateItemOwner {
    public static NAME: string = "update item owner"

    private readonly mainTable: MainTable
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.mainTable = new MainTable(client)
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, UpdateItemOwner.NAME)
                .then(() => "ID of item:")
            } else if (scratch.id === undefined) {
                return this.transactionsTable.appendToScratch(number, "id", request)
                    .then(() => "Current Owner (or location where it's stored if church owned):")
        } else if (scratch.currentOwner === undefined) {
            return this.transactionsTable.appendToScratch(number, "currentOwner", request)
                .then(() => "New Owner (or location where it's stored if church owned):")
        } else {
            scratch.newOwner = request
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    private execute(scratch: ScratchInterface): Promise<string> {
        return this.mainTable.updateItem(scratch.id, "owner", scratch.newOwner, scratch.currentOwner)
            .then(() => `Successfully updated owner for item '${scratch.id}'`)
    }
}

/**
 * @param id ID of Item
 * @param currentOwner Name of current owner
 * @param newOwner Name of new owner
 */
interface ScratchInterface {
    id?: string
    currentOwner?: string
    newOwner?: string
}