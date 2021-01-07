import { TagTable } from "../db/TagTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { DBClient } from "../injection/DBClient"

/**
 * Update tags of item family
 */
export class UpdateTags {
    public static NAME: string = "update tags"

    private readonly tagTable: TagTable
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.tagTable = new TagTable(client)
        this.transactionsTable = new TransactionsTable(client)
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, UpdateTags.NAME)
                .then(() => "Name of item:")
        } else if (scratch.name === undefined) {
            return this.transactionsTable.appendToScratch(number, "name", request)
                .then(() => "New Tags (separated by spaces):")
        } else {
            scratch.tags = request.split(/(\s+)/)
                .filter((str: string) => str.trim().length > 0)
                .map((str: string) => str.toLowerCase().trim())
            return this.transactionsTable.delete(number)
                .then(() => this.execute(scratch))
        }
    }

    /**
     * Required params for scratch object:
     * @param name Name of item
     * @param tags New tags
     */
    public execute(scratch: ScratchInterface): Promise<string> {
        return this.tagTable.update(scratch.name, scratch.tags)
            .then(() => `Successfully updated tags for '${scratch.name}'`)
    }
}

interface ScratchInterface {
    name?: string
    tags?: string[]
}