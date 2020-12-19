import { createDescription, appendToScratchTransaction, createTransaction, deleteTransaction } from "../ddb/apis";
import { MapAttributeValue } from "aws-sdk/clients/dynamodb";

export function addDescriptionRouter(number: string, request: string, scratch?: MapAttributeValue): Promise<string> {
    if (scratch === undefined) {
        return createTransaction(number, "add description")
            .then(() => { return "Name of item:" })
    } else if (scratch.name === undefined) {
        return appendToScratchTransaction(number, "name", request)
            .then(() => { return "Notes about this type of item:" })
    } else if (scratch.notes === undefined) {
        return appendToScratchTransaction(number, "notes", request)
            .then(() => { return "Corresponding Tags (separated by commas):" })
    } else {
        var name: string = scratch.name.S
        var notes: string = scratch.notes.S
        var tags: string[] = request.split(",").map((str: string) => {
            return str.toLowerCase().trim()
        })

        return createDescription(name, notes, tags)
            .then(() => deleteTransaction(number))
            .then(() => { return "Created Description for item." })
    }
}