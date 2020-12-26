import { MainTable } from "../db/MainTable"
import { ItemTable } from "../db/ItemTable"
import { TagTable } from "../db/TagTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { MainSchema } from "../db/Schemas"
import { DBClient } from "../injection/DBClient"

/**
 * Adds item to item inventory table.
 */
export class DeleteItem {
    public static NAME: string = "delete item"

    private readonly mainTable: MainTable
    private readonly itemTable: ItemTable
    private readonly tagTable: TagTable
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.mainTable = new MainTable(client)
        this.itemTable = new ItemTable(client)
        this.tagTable = new TagTable(client)
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, DeleteItem.NAME)
                .then(() => "ID of item:")
        } else if (scratch.id === undefined) {
            return this.transactionsTable.appendToScratch(number, "id", request)
                .then(() => "Type 'y' to confirm that you want to delete item: '" + request + "'")
        } else {
            if (request === "y") {
                return this.transactionsTable.delete(number)
                    .then(() => this.execute(scratch.id))
            } else {
                return "ERROR: Didn't receive 'y'. Please reply again with a 'y' to proceed with deleting the object, or 'abort' to abort the transaction."
            }
        }
    }

    private execute(id: string): Promise<string> {
        return this.itemTable.delete(id)
                .then((name: string) => this.mainTable.get(name))
                .then((entry: MainSchema) => {
                    if (Object.keys(entry.items).length === 0) {
                        return this.tagTable.delete(entry.name, entry.tags.values)
                            .then(() => this.mainTable.delete(entry.name))
                    } else {
                        return
                    }
                })
                .then(() => "Item Deleted.")
    }
}

/**
 * @param id ID of Item
 */
interface ScratchInterface {
    id?: string
}