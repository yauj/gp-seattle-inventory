import { MAIN_TABLE, ItemSchema, ITEMS_TABLE, SecondaryIndexSchema } from "./schemas";
import { DBClient } from "../injection/interface"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

export class ItemDB {
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
     * Get name from id
     * 
     * @param id ID of item
     */
    public get(
        id: string
    ): Promise<string> {
        var params: DocumentClient.GetItemInput = {
            TableName: ITEMS_TABLE,
            Key: {
                "key": id
            }
        }
        return this.client.get(params)
            .then((output: DocumentClient.GetItemOutput) => (output.Item as SecondaryIndexSchema).val)
    }
}