import { AWSError } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "aws-sdk/lib/request";

const DESCRIPTION_TABLE = "gp-seattle-inventory-description"
const ITEMS_TABLE = "gp-seattle-inventory-items"
const TRANSACTIONS_TABLE = "gp-seattle-inventory-items"

const client: DocumentClient = new DocumentClient()

/**
 * DESCRIPTION TABLE OPERATIONS
 */

/**
 * Append to list in the description table
 * 
 * @param name Name of item type
 * @param key Target variable
 * @param val Values to append
 */
export function appendToListDescription(
    name: string,
    key: string,
    val: string[]
): Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>> {
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
    return client.update(param).promise()
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
    name: string,
    notes: string = "",
    tags: string[] = [],
    items: string[] = []
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
    var params: DocumentClient.PutItemInput = {
        TableName: DESCRIPTION_TABLE,
        Item: {
            "name": name,
            "notes": notes,
            "tags": tags,
            "items": items
        }
    }
    return client.put(params).promise()
}

/**
 * Get description of given item type, by name.
 * 
 * @param name Name of item type.
 */
export function getDescription(
    name: string
): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> {
    var params: DocumentClient.GetItemInput = {
        TableName: DESCRIPTION_TABLE,
        Key: {
            "name": name
        }
    }
    return client.get(params).promise()
}

/** 
 * ITEM TABLE OPERATIONS
 */

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
    id: string,
    name: string,
    owner: string,
    notes: string = ""
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
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
    return client.put(params).promise()
}

/**
 * TRANSACTION TABLE OPERATIONS
 */

 /**
 * Append to scratch space map
 * 
 * @param number Phone Number being used for response.
 * @param key Target variable
 * @param val Value to append
 */
export function appendToScratchTransaction(
    number: string,
    key: string,
    val: any
): Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>> {
    var param: DocumentClient.UpdateItemInput = {
        TableName: DESCRIPTION_TABLE,
        Key: {
            "number": number
        },
        UpdateExpression: "SET scratch.#key = :val",
        ExpressionAttributeNames: {
            "#key": key
        },
        ExpressionAttributeValues: {
            ":val": val
        }
    }
    return client.update(param).promise()
}

/**
 * Create new Transaction
 * 
 * @param number Phone Number being used for response.
 * @param type Type of transaction being performed
 * @param scratch Scratch space used by transactions. Initialized as empty.
 */
export function createTransaction(
    number: string,
    type: string
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
    var params: DocumentClient.PutItemInput = {
        TableName: TRANSACTIONS_TABLE,
        Item: {
            "number": number,
            "type": type,
            "scratch": {}
        }
    }
    return client.put(params).promise()
}

/**
 * Delete by phone number
 * 
 * @param number Phone Number being used for response.
 */
export function deleteTransaction(
    number: string
): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> {
    var params: DocumentClient.DeleteItemInput = {
        TableName: TRANSACTIONS_TABLE,
        Key: {
            "number": number
        }
    }
    return client.delete(params).promise()
}

/**
 * Get transaction entry by phone number
 * 
 * @param number Phone Number being used for response.
 */
export function getTransaction(
    number: string
): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> {
    var params: DocumentClient.GetItemInput = {
        TableName: TRANSACTIONS_TABLE,
        Key: {
            "number": number
        }
    }
    return client.get(params).promise()
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
