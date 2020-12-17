import { createItem, getDescription, appendToListDescription, createDescription } from "../ddb/apis";
import { APIGatewayProxyEvent, APIGatewayProxyCallback, Context, APIGatewayProxyHandler } from "aws-lambda"
import { DocumentClient } from "aws-sdk/clients/dynamodb";
var randomWords = require("random-words")

/**
 * Adds item to item inventory table. Note that if there is no corresponding record in the
 * description table, then a blank description will be added to that table.
 * 
 * @param name Name of the item.
 * @param owner Name of the owner of the item or where the item is stored.
 * @param notes (Optional) Notes specific to this item.
 */
export const handler: APIGatewayProxyHandler = (
    event: APIGatewayProxyEvent,
    _: Context,
    callback: APIGatewayProxyCallback
) => {
    var input = JSON.parse(event.body)
    var name: String = input.name
    var owner: String = input.owner
    var notes: String = 'notes' in input ? input.notes : ""

    var id: String = randomWords({ exactly: 3, join: "-" })

    // Create Item
    createItem(callback, id, name, owner, notes, (_: any) => {
        // Update Description with item
        getDescription(callback, name, (data: DocumentClient.GetItemOutput) => {
            if (data.Item) {
                // Description Exists, so just update id list
                appendToListDescription(callback, name, "items", [id], (_: any) => {
                    callback(undefined, {
                        statusCode: 200,
                        body: "SUCCESSFUL"
                    })
                })
            } else {
                // No Existing Description, so create a new description
                createDescription(callback, name, undefined, undefined, [id], (_: any) => {
                    callback(undefined, {
                        statusCode: 200,
                        body: "SUCCESSFUL"
                    })
                })
            }
        })
    })
}