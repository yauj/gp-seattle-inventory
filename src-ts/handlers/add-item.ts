import {
    appendToListDescription, createDescription, getDescription, createItem,
    appendToScratchTransaction, createTransaction, deleteTransaction
} from "../ddb/apis";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

var randomWords = require("random-words")

/**
 * Adds item to item inventory table. Note that if there is no corresponding record in the
 * description table, then a blank description will be added to that table.
 */
export function addItemRouter(number: string, request: string, scratch?: ScratchInterface): Promise<string> {
    if (scratch === undefined) {
        return createTransaction(number, "add item")
            .then(() => "Name of item:")
    } else if (scratch.name === undefined) {
        return appendToScratchTransaction(number, "name", request)
            .then(() => "Owner of this item (or location where it's stored if church owned):")
    } else if (scratch.owner === undefined) {
        return appendToScratchTransaction(number, "owner", request)
            .then(() => "Notes about this specific item:")
    } else {
        var name: string = scratch.name
        var owner: string = scratch.owner
        var notes: string = request

        return execute(name, owner, notes)
            .then(() => deleteTransaction(number))
            .then(() => "Created Description for item.")
    }
}

function execute(name: string, owner: string, notes: string): Promise<any> {
    var id: string = randomWords({ exactly: 3, join: "-" })

    return createItem(id, name, owner, notes)
        .then(() => getDescription(name))
        .then((data: DocumentClient.GetItemOutput) => {
            if (data.Item) {
                // Description Exists, so just update id list
                return appendToListDescription(name, "items", [id])
            } else {
                // No Existing Description, so create a new description
                return createDescription(name, undefined, undefined, [id])
            }
        })
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