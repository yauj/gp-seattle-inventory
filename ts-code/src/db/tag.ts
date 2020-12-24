import { MAIN_TABLE, SearchIndexSchema, TAGS_TABLE } from "./schemas";
import { DBClient } from "../injection/interface"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

export class TagDB {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Adds tags
     */
    public create(
        name: string,
        tags: string[]
    ): Promise<any> {
        return Promise.all(tags.map((tag: string) => this.createSingleTag(name, tag)))
    }

    private createSingleTag(
        name: string,
        tag: string
    ): Promise<any> {
        var mainParams: DocumentClient.UpdateItemInput = {
            TableName: MAIN_TABLE,
            Key: {
                "name": name
            },
            UpdateExpression: "SET #key = list_append(#key, :val)",
            ExpressionAttributeNames: {
                "#key": "tags"
            },
            ExpressionAttributeValues: {
                ":val": [tag]
            }
        }

        var searchParams: DocumentClient.GetItemInput = {
            TableName: TAGS_TABLE,
            Key: {
                "key": tag
            }
        }

        return  this.client.update(mainParams)
            .then(() => this.client.get(searchParams))
            .then((output: DocumentClient.GetItemOutput) => {
                if (output.Item) {
                    // Index exists, so update
                    var updateParam: DocumentClient.UpdateItemInput = {
                        TableName: TAGS_TABLE,
                        Key: {
                            "key": tag
                        },
                        UpdateExpression: "SET #key = list_append(#key, :val)",
                        ExpressionAttributeNames: {
                            "#key": "val"
                        },
                        ExpressionAttributeValues: {
                            ":val": [name]
                        }
                    }
                    return this.client.update(updateParam)
                } else {
                    // Index doesn't exists, so put
                    var putItem: SearchIndexSchema = {
                        key: tag,
                        val: [name]
                    }
                    var putParam: DocumentClient.PutItemInput = {
                        TableName: TAGS_TABLE,
                        Item: putItem
                    }
                    return this.client.put(putParam)
                }
            })
    }

    /**
     * Get list of names from tag
     * 
     * @param tag Tag name
     */
    public get(
        tag: string
    ): Promise<string[]> {
        var params: DocumentClient.GetItemInput = {
            TableName: TAGS_TABLE,
            Key: {
                "key": tag
            }
        }
        return this.client.get(params)
            .then((output: DocumentClient.GetItemOutput) => (output.Item as SearchIndexSchema).val)
    }
}