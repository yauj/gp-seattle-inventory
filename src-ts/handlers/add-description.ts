import { createDescription } from "../ddb/apis";
import { APIGatewayProxyEvent, APIGatewayProxyCallback, Context, APIGatewayProxyHandler } from "aws-lambda"

/**
 * Adds description for item family.
 * 
 * @param name Name of item type. This needs to be unique.
 * @param notes (Optional) Other notes related to this item type.
 * @param tags (Optional) Tags to categorize item.
 */
export const handler: APIGatewayProxyHandler = (
    event: APIGatewayProxyEvent,
    _: Context,
    callback: APIGatewayProxyCallback
) => {
    var input = JSON.parse(event.body)
    var name: String = input.name
    var notes: String = 'notes' in input ? input.notes : ""
    var tags: String[] = 'tags' in tags ? input.tags : []

    createDescription(callback, name, notes, tags, undefined, (_: any) => {
        callback(undefined, {
            statusCode: 200,
            body: "SUCCESSFUL"
        })
    })
}