import { DescriptionDB } from "../ddb/description";
import { ItemsDB } from "../ddb/items";
import { TransactionsDB } from "../ddb/transactions";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const randomWords = require("random-words")

export class AddItem {
    private readonly descriptionDB: DescriptionDB = new DescriptionDB()
    private readonly itemsDB: ItemsDB = new ItemsDB()
    private readonly transactionsDB: TransactionsDB = new TransactionsDB()

    /**
     * Adds item to item inventory table. Note that if there is no corresponding record in the
     * description table, then a blank description will be added to that table.
     */
    public router(number: string, request: string, scratch?: ScratchInterface): Promise<string> {
        if (scratch === undefined) {
            return this.transactionsDB.create(number, "add item")
                .then(() => "Name of item:")
        } else if (scratch.name === undefined) {
            return this.transactionsDB.appendToScratch(number, "name", request)
                .then(() => "Owner of this item (or location where it's stored if church owned):")
        } else if (scratch.owner === undefined) {
            return this.transactionsDB.appendToScratch(number, "owner", request)
                .then(() => "Notes about this specific item:")
        } else {
            var name: string = scratch.name
            var owner: string = scratch.owner
            var notes: string = request

            return this.execute(name, owner, notes)
                .then(() => this.transactionsDB.delete(number))
                .then(() => "Created Description for item.")
        }
    }

    private execute(name: string, owner: string, notes: string): Promise<any> {
        var id: string = randomWords({ exactly: 3, join: "-" })

        return this.itemsDB.create(id, name, owner, notes)
            .then(() => this.descriptionDB.get(name))
            .then((data: DocumentClient.GetItemOutput) => {
                if (data.Item) {
                    // Description Exists, so just update id list
                    return this.descriptionDB.appendToList(name, "items", [id])
                } else {
                    // No Existing Description, so create a new description
                    return this.descriptionDB.create(name, undefined, undefined, [id])
                }
            })
    }
}

/**
 * @param name Name of Item
 * @param notes Owner of this item (or location where it's stored if church owned)
 * @param tags Notes about this specific item (In practice, never specified)
 */
interface ScratchInterface {
    name?: string,
    owner?: string,
    notes?: string[]
}