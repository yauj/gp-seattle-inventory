import { stringPromise } from "../utility"
import { createDescription, appendToScratchTransaction, createTransaction, deleteTransaction } from "../ddb/apis";
import { MapAttributeValue } from "aws-sdk/clients/dynamodb";

export function addDescriptionRouter(number: string, msgBody: string, scratch?: MapAttributeValue): Promise<string> {
    if (scratch === undefined) {
        return createTransaction(number, "add description")
            .then(() => stringPromise("Name of item:"))
    } else if (scratch.name === undefined) {
        return appendToScratchTransaction(number, "name", msgBody)
            .then(() => stringPromise("Notes about this type of item:"))
    } else if (scratch.notes === undefined) {
        return appendToScratchTransaction(number, "notes", msgBody)
            .then(() => stringPromise("Corresponding Tags (separated by commas):"))
    } else {
        var name: string = scratch.name.S
        var notes: string = scratch.notes.S
        var tags: string[] = msgBody.split(",").map((str: string) => {
            return str.toLowerCase().trim()
        })

        return createDescription(name, notes, tags)
            .then(() => deleteTransaction(number))
            .then(() => stringPromise("Created Description for item."))
    }
}