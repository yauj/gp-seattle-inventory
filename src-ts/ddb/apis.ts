import { AWSError, Request } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { APIGatewayProxyCallback } from "aws-lambda";

const DESCRIPTION_TABLE = "gp-seattle-inventory-description"
const ITEMS_TABLE = "gp-seattle-inventory-items"

const client: DocumentClient = new DocumentClient()

/**
 * Adds item to item inventory table. 
 * 
 * @param id Auto-generated ID of item. ID is a combination of 3 random words.
 * @param name Name of the item.
 * @param owner Name of the owner of the item or where the item is stored.
 * @param notes Notes specific to this item.
 * @param borrower Current borrower of item. Blank if available. Initialized as blank.
 */
export function createItem(
    lambdaCallback: APIGatewayProxyCallback,
    id: String,
    name: String,
    owner: String,
    notes: String = "",
    callback?: (data: DocumentClient.PutItemOutput) => void
) {
    var params: DocumentClient.PutItemInput = {
        TableName: ITEMS_TABLE,
        Item: {
            "id": id,
            "name": name,
            "owner": owner,
            "notes": notes,
            "borrower": ""
        }
    }
    client.put(params, logError(lambdaCallback, callback))
}

/**
 * Append to list in the description table
 * 
 * @param name Name of item type
 * @param key Target variable
 * @param val Values to append
 */
export function appendToListDescription(
    lambdaCallback: APIGatewayProxyCallback,
    name: String,
    key: string,
    val: String[],
    callback?: (data: DocumentClient.UpdateItemOutput) => void
) {
    var param: DocumentClient.UpdateItemInput = {
        TableName: DESCRIPTION_TABLE,
        Key: {
            "name": name
        },
        UpdateExpression: "SET #key = list_append(#key, :val)",
        ExpressionAttributeNames: {
            "#key": key
        },
        ExpressionAttributeValues: {
            ":val": val
        }
    }
    client.update(param, logError(lambdaCallback, callback))
}

/**
 * Create new description for item family.
 * 
 * @param name Name of item type. This needs to be unique.
 * @param notes Other notes related to this item type.
 * @param tags Tags to categorize item.
 * @param items List of IDs of all items of this item type.
 */
export function createDescription(
    lambdaCallback: APIGatewayProxyCallback,
    name: String,
    notes: String = "",
    tags: String[] = [],
    items: String[] = [],
    callback?: (data: DocumentClient.PutItemOutput) => void
) {
    var params: DocumentClient.PutItemInput = {
        TableName: DESCRIPTION_TABLE,
        Item: {
            "name": name,
            "notes": notes,
            "tags": tags,
            "items": items
        }
    }
    client.put(params, logError(lambdaCallback, callback))
}

/**
 * Get description of given item type, by name.
 * 
 * @param name Name of item type.
 */
export function getDescription(
    lambdaCallback: APIGatewayProxyCallback,
    name: String,
    callback?: (data: DocumentClient.GetItemOutput) => void
) {
    var params: DocumentClient.GetItemInput = {
        TableName: DESCRIPTION_TABLE,
        Key: {
            "name": name
        }
    }
    client.get(params, logError(lambdaCallback, callback))
}

/**
 * Log error if error is present. Otherwise, will call callback function.
 * This will return a lambda, as that is the callback required for AWS SDK results.
 * 
 * @param err Error object
 * @param data Data return variable, which is irrelevant for default log error function
 * @param lambdaCallback (Optional) Callback to log error with
 * @param callback (Optional) Statement to call in event that no error is thrown
 */
function logError<TResult>(
    lambdaCallback: APIGatewayProxyCallback,
    callback?: (data: TResult) => void
): (err: AWSError, data: TResult) => void {
    return (err: AWSError, data: TResult) => {
        if (err) {
            console.error("Error Encountered with DynamoDB Client:", JSON.stringify(err, null, 2))
            if (lambdaCallback !== undefined) {
                lambdaCallback(err, {
                    statusCode: err.statusCode,
                    body: err.message
                })
            }
        } else if (callback != undefined) {
            callback(data)
        }
    }
}