import { MAIN_TABLE, ItemSchema, ITEMS_TABLE, SecondaryIndexSchema } from "./Schemas";
import { DBClient } from "../injection/DBClient"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

export class ItemTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Adds item to inventory
     */
    public create(
        id: string,
        name: string,
        owner: string,
        notes: string
    ): Promise<DocumentClient.PutItemOutput> {
        var item: ItemSchema = {
            owner: owner,
            notes: notes,
            borrower: ""
        }
        var mainParams: DocumentClient.UpdateItemInput = {
            TableName: MAIN_TABLE,
            Key: {
                "name": name
            },
            UpdateExpression: "SET #attr.#key = :val",
            ExpressionAttributeNames: {
                "#attr": "items",
                "#key": id
            },
            ExpressionAttributeValues: {
                ":val": item
            }
        }

        var indexItem: SecondaryIndexSchema = {
            key: id,
            val: name
        }
        var indexParams: DocumentClient.PutItemInput = {
            TableName: ITEMS_TABLE,
            Item: indexItem
        }
        return this.client.update(mainParams)
            .then(() => this.client.put(indexParams))
    }

    /**
     * Delete Item if exists. Returns corresponding name of item
     */
    public delete(
        id: string
    ): Promise<string> {
        return this.get(id)
            .then((entry: SecondaryIndexSchema) => {
                if (entry) {
                    var mainParams: DocumentClient.UpdateItemInput = {
                        TableName: MAIN_TABLE,
                        Key: {
                            "name": entry.val
                        },
                        UpdateExpression: "REMOVE #attr.#key",
                        ExpressionAttributeNames: {
                            "#attr": "items",
                            "#key": id
                        }
                    }

                    var itemsParams: DocumentClient.DeleteItemInput = {
                        TableName: ITEMS_TABLE,
                        Key: {
                            "key": id
                        }
                    }

                    return this.client.update(mainParams)
                        .then(() => this.client.delete(itemsParams))
                        .then(() => entry.val)
                } else {
                    throw Error(`Item ${id} doesn't exist.`)
                }
            })
    }

    /**
     * Get name from id
     */
    public get(
        id: string
    ): Promise<SecondaryIndexSchema> {
        var params: DocumentClient.GetItemInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "key": id
            }
        }
        return this.client.get(params)
            .then((output: DocumentClient.GetItemOutput) => output.Item as SecondaryIndexSchema)
    }
}