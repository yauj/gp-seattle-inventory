import { createDescription, appendToScratchTransaction, createTransaction, deleteTransaction } from "../ddb/apis";

export function addDescriptionRouter(number: string, request: string, scratch?: ScratchInterface): Promise<string> {
    if (scratch === undefined) {
        return createTransaction(number, "add description")
            .then(() => "Name of item:")
    } else if (scratch.name === undefined) {
        return appendToScratchTransaction(number, "name", request)
            .then(() => "Notes about this type of item:")
    } else if (scratch.notes === undefined) {
        return appendToScratchTransaction(number, "notes", request)
            .then(() => "Tags (separated by commas):")
    } else {
        var name: string = scratch.name as string
        var notes: string = scratch.notes as string
        var tags: string[] = request.split(",").map((str: string) => {
            return str.toLowerCase().trim()
        })

        return createDescription(name, notes, tags)
            .then(() => deleteTransaction(number))
            .then(() => "Created Description for item.")
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