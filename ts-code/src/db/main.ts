import { MAIN_TABLE,  MainSchema } from "./schemas";
import { DBClient } from "../injection/interface"
import { AWSError } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "aws-sdk/lib/request"

export class MainDB {
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
            tags: [],
            items: {}
        }
        var params: DocumentClient.PutItemInput = {
            TableName: MAIN_TABLE,
            Item: item
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