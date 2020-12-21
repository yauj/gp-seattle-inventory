import { DBClient } from "../injection/interface"
import { AWSError } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "aws-sdk/lib/request"

export const DESCRIPTION_TABLE: string = "gp-seattle-inventory-description"

/**
 * @param name Name of item type. This needs to be unique.
 * @param notes Other notes related to this item type.
 * @param tags Tags to categorize item.
 * @param items List of IDs of all items of this item type.
 */
export interface DescriptionTable {
    name: string,
    notes: string,
    tags: string[],
    items: string[]
 }

export class DescriptionDB {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Append to list in the description table
     * 
     * @param name Name of item type
     * @param key Target variable
     * @param val Values to append
     */
    public appendToList(
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
        return this.client.update(param)
    }

    /**
     * Create new description for item family.
     * 
     * @param name Name of item type. This needs to be unique.
     * @param notes Other notes related to this item type.
     * @param tags Tags to categorize item.
     * @param items List of IDs of all items of this item type.
     */
    public create(
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
        return this.client.put(params)
    }

    /**
     * Get description of given item type, by name.
     * 
     * @param name Name of item type.
     */
    public get(
        name: string
    ): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> {
        var params: DocumentClient.GetItemInput = {
            TableName: DESCRIPTION_TABLE,
            Key: {
                "name": name
            }
        }
        return this.client.get(params)
    }
}