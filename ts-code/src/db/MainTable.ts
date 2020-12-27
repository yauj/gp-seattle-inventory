import { MAIN_TABLE,  MainSchema, SecondaryIndexSchema, ITEMS_TABLE } from "./Schemas"
import { DBClient } from "../injection/DBClient"
import { DocumentClient, GetItemOutput } from "aws-sdk/clients/dynamodb"

export class MainTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Create new description for item family.
     * 
     * Tags and Items are initialized as empty.
     */
    public create(
        name: string,
        description: string
    ): Promise<DocumentClient.PutItemOutput> {
        var item: MainSchema = {
            name: name,
            description: description,
            items: {}
        }
        var params: DocumentClient.PutItemInput = {
            TableName: MAIN_TABLE,
            Item: item
        }
        return this.client.put(params)
    }

    /**
     * Delete description
     * 
     * Checks that Tags and Items are empty before proceeding.
     */
    public delete(
        name: string
    ): Promise<DocumentClient.DeleteItemOutput> {
        return this.get(name)
            .then((entry: MainSchema) => {
                if (Object.keys(entry.items).length === 0 && entry.tags === undefined) {
                    var params: DocumentClient.DeleteItemInput = {
                        TableName: MAIN_TABLE,
                        Key: {
                            name: name
                        }
                    }
                    return this.client.delete(params)
                } else {
                    throw Error(`Either items or tags aren't empty, so unable to delete '${name}'`)
                }
            })
    }

    /**
     * Get description of given item type, by name.
     */
    public get(
        name: string
    ): Promise<MainSchema> {
        var params: DocumentClient.GetItemInput = {
            TableName: MAIN_TABLE,
            Key: {
                "name": name
            }
        }
        return this.client.get(params)
            .then((output: DocumentClient.GetItemOutput) => output.Item as MainSchema)
    }

    /**
     * Update name level attribute
     */
    public update(
        name: string,
        key: string,
        val: string
    ): Promise<DocumentClient.UpdateItemOutput> {
        var params: DocumentClient.UpdateItemInput = {
            TableName: MAIN_TABLE,
            Key: {
                "name": name
            },
            UpdateExpression: "SET #key = :val",
            ConditionExpression: 'attribute_exists(#key)',
            ExpressionAttributeNames: {
                "#key": key
            },
            ExpressionAttributeValues: {
                ":val": val
            }
        }
        return this.client.update(params)
    }

    /**
     * Update item attribute
     */
    public updateItem(
        id: string,
        key: "borrower" | "owner" | "notes",
        val: string,
        expectedValue?: string
    ): Promise<GetItemOutput> {
        var itemSearchParams: DocumentClient.GetItemInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "key": id
            }
        }
        return this.client.get(itemSearchParams)
            .then((data: DocumentClient.GetItemOutput) => {
                if (data.Item) {
                    var entry: SecondaryIndexSchema = data.Item as SecondaryIndexSchema
                    return this.get(entry.val)
                } else {
                    throw Error(`Couldn't find item ${id} in the database.`)
                }
            }).then((entry: MainSchema) => {
                if (expectedValue !== undefined && entry.items[id][key] !== expectedValue) {
                    throw Error(`'${key}' is currently '${entry.items[id][key]}', `
                        + `which isn't equal to the expected value of '${expectedValue}'.`)
                } else {
                    var updateParams: DocumentClient.UpdateItemInput = {
                        TableName: MAIN_TABLE,
                        Key: {
                            "name": entry.name
                        },
                        UpdateExpression: "SET #attr1.#attr2.#key = :val",
                        ExpressionAttributeNames: {
                            "#attr1": "items",
                            "#attr2": id,
                            "#key": key
                        },
                        ExpressionAttributeValues: {
                            ":val": val
                        }
                    }
                    return this.client.update(updateParams)
                }
            })
    }
}