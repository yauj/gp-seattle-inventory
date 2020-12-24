import { MainDB } from "../db/main"
import { ItemDB } from "../db/item"
import { TransactionsDB } from "../db/transactions"
import { MainSchema } from "../db/schemas"
import { DBClient } from "../injection/interface"
import { TagDB } from "../db/tag"

const randomWords = require("random-words")

/**
 * Adds item to item inventory table. Note that if there is no corresponding record in the
 * description table, then a blank description will be added to that table.
 */
export class AddItem {
    private readonly mainDB: MainDB
    private readonly itemDB: ItemDB
    private readonly tagDB: TagDB
    private readonly transactionsDB: TransactionsDB

    public constructor(client: DBClient) {
        this.mainDB = new MainDB(client)
        this.itemDB = new ItemDB(client)
        this.tagDB = new TagDB(client)
        this.transactionsDB = new TransactionsDB(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): Promise<string> {
        if (scratch === undefined) {
            return this.transactionsDB.create(number, "add item")
                .then(() => "Name of item:")
        } else if (scratch.name === undefined) {
            return this.transactionsDB.appendToScratch(number, "name", request)
                .then(() => this.mainDB.get(request))
                .then((item: MainSchema) => {
                    if (item) {
                        // Item already exists. Just append new item.
                        return this.transactionsDB.appendToScratch(number, "createItem", false)
                            .then(() => "Owner of this item (or location where it's stored if church owned):")
                    } else {
                        // Item doesn't exist, so need to create new item.
                        return this.transactionsDB.appendToScratch(number, "createItem", true)
                            .then(() => "Related Category Tags (separated by commas):")
                    }
                })
        } else if (scratch.createItem && scratch.tags == undefined) {
            var tags: string[] = request.split(",").map((str: string) => {
                return str.toLowerCase().trim()
            })
            return this.transactionsDB.appendToScratch(number, "tags", tags)
                .then(() => "Notes about this type of item:")
        } else if (scratch.createItem && scratch.categoryNotes == undefined) {
            return this.transactionsDB.appendToScratch(number, "categoryNotes", request)
            .then(() => "Owner of this item (or location where it's stored if church owned):")
        } else if (scratch.owner === undefined) {
            return this.transactionsDB.appendToScratch(number, "owner", request)
                .then(() => "Notes about this specific item:")
        } else {
            scratch.itemNotes = request

            return this.transactionsDB.delete(number)
                .then(() => this.addDescription(scratch))
                .then(() => this.addItem(scratch))
                .then(() => "Created Description for item.")
        }
    }

    private addDescription(scratch: ScratchInterface): Promise<any> {
        if (scratch.createItem) {
            return this.mainDB.create(scratch.name, scratch.categoryNotes)
                .then(() => this.tagDB.create(scratch.name, scratch.tags))
        } else {
            return Promise.resolve()
        }
    }

    private addItem(scratch: ScratchInterface): Promise<any> {
        var id: string = randomWords({ exactly: 3, join: "-" })
        return this.itemDB.create(id, scratch.name, scratch.owner, scratch.itemNotes)
    }
}

/**
 * @param name Name of Item
 * @param notes Owner of this item (or location where it's stored if church owned)
 * @param tags Notes about this specific item (In practice, never specified)
 */
interface ScratchInterface {
    name?: string,
    createItem?: boolean,
    categoryNotes?: string,
    tags?: string[], 
    owner?: string,
    itemNotes?: string
}