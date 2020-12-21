import { DescriptionDB } from "../ddb/description";
import { TransactionsDB } from "../ddb/transactions";

export class AddDescription {
    private readonly descriptionDB: DescriptionDB = new DescriptionDB()
    private readonly transactionsDB: TransactionsDB = new TransactionsDB()

    public router(number: string, request: string, scratch?: ScratchInterface): Promise<string> {
        if (scratch === undefined) {
            return this.transactionsDB.create(number, "add description")
                .then(() => "Name of item:")
        } else if (scratch.name === undefined) {
            return this.transactionsDB.appendToScratch(number, "name", request)
                .then(() => "Notes about this type of item:")
        } else if (scratch.notes === undefined) {
            return this.transactionsDB.appendToScratch(number, "notes", request)
                .then(() => "Tags (separated by commas):")
        } else {
            var name: string = scratch.name as string
            var notes: string = scratch.notes as string
            var tags: string[] = request.split(",").map((str: string) => {
                return str.toLowerCase().trim()
            })
    
            return this.descriptionDB.create(name, notes, tags)
                .then(() => this.transactionsDB.delete(number))
                .then(() => "Created Description for item.")
        }
    }
}

/**
 * @param name Name of Item
 * @param notes Notes about this type of item
 * @param tags Tags, to help when searching up the item
 */
interface ScratchInterface {
    name?: string,
    notes?: string,
    tags?: string[]
}