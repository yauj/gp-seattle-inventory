import { MAIN_TABLE,  MainSchema } from "./Schemas"
import { DBClient } from "../injection/DBClient"
import { AWSError } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "aws-sdk/lib/request"

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
        notes: string
    ): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
        var item: MainSchema = {
            name: name,
            notes: notes,
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
     * Checks that Tags and Items are empty.
     */
    public delete(
        name: string
    ): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> {
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
                    throw Error("Either items or tags aren't empty, so unable to delete '" + name + "'")
                }
            })
    }

    /**
     * Get description of given item type, by name.
     * 
     * @param name Name of item type.
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
}