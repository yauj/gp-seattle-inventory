import { Router } from "./Router"
import { RequestSchema, REQUESTS_TABLE } from "../../db/Schemas"
import { DBClient } from "../../injection/DBClient"
import { DDBClient } from "../../injection/DDBClient"
import { SNSEvent, SNSEventRecord, SNSHandler } from "aws-lambda"
import { AWSError, Pinpoint } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

const pinpoint: Pinpoint = new Pinpoint()

/**
 * Main entry handler, which splits up the records to be handled separately.
 */
export const handler: SNSHandler = async (event: SNSEvent) => {
    await Promise.all(event.Records.map((record: SNSEventRecord) => new SMSRouter(record).processRecord()))
}

class SMSRouter {
    private db: DBClient = new DDBClient()
    private id: string
    private request: string
    private responseOrigination: string
    private responseDestination: string

    public constructor(record: SNSEventRecord) {
        this.id = record.Sns.MessageId

        var message = JSON.parse(record.Sns.Message)
        this.request = message.messageBody.toLowerCase()
        this.responseOrigination = message.destinationNumber
        this.responseDestination = message.originationNumber
    }

    /**
     * Function to route requests
     */
    public processRecord(): Promise<any> {
        console.log(`Starting request from ${this.responseDestination}`)

        return this.checkUnique()
            .then((unique: boolean) => {
                if (unique) {
                    return new Router(this.db).processRequest(this.request, this.responseDestination)
                        .then(
                            (response: string) => this.setFinalRecordStatus("SUCCESS").then(() => response),
                            (reason: any) => this.setFinalRecordStatus("FAILED").then(() => reason)
                        ).then((response: string) => this.sendMessage(response))
                } else {
                    return
                }
            })
    }

    /**
     * Function to check for request uniqueness
     */
    private checkUnique(itr: number = 1): Promise<boolean> {
        var item: RequestSchema = {
            id: this.id,
            status: "STARTED"
        }
        var putParam: DocumentClient.PutItemInput = {
            TableName: REQUESTS_TABLE,
            Item: item,
            ConditionExpression: "attribute_not_exists(id)"
        }
        return this.db.put(putParam)
            .then(
                () => true,
                (reason: any) => {
                    var getParam: DocumentClient.GetItemInput = {
                        TableName: REQUESTS_TABLE,
                        Key: {
                            id: this.id
                        }
                    }
                    return this.db.get(getParam)
                        .then((data: DocumentClient.GetItemOutput) => {
                            var entry = data.Item as RequestSchema
                            if (entry.status === "FAILED") {
                                return true
                            } else if (entry.status === "SUCCESS") {
                                return false
                            } else if (itr > 3) {
                                return false
                            } else {
                                return new Promise(function(resolve, reject) {
                                    window.setTimeout(() => this.checkUnique(itr + 1).then(resolve, reject), itr * 1000);
                                });
                            }
                        })
                }
            )
    }

    private setFinalRecordStatus(status: "SUCCESS" | "FAILED"): Promise<DocumentClient.UpdateItemOutput> {
        var param: DocumentClient.UpdateItemInput = {
            TableName: REQUESTS_TABLE,
            Key: {
                "id": this.id
            },
            UpdateExpression: "SET #key = :val",
            ExpressionAttributeNames: {
                "#key": "status"
            },
            ExpressionAttributeValues: {
                ":val": status
            }
        }
        return this.db.update(param)
    }

    /**
     * Function to send Pinpoint SMS response.
     */
    private sendMessage(response: string): Promise<any> {
        var params: Pinpoint.Types.SendMessagesRequest = {
            ApplicationId: process.env.PinpointAppId,
            MessageRequest: {
                Addresses: {
                    [this.responseDestination]: {
                        ChannelType: 'SMS'
                    }
                },
                MessageConfiguration: {
                    SMSMessage: {
                        Body: response,
                        MessageType: 'PROMOTIONAL',
                        OriginationNumber: this.responseOrigination
                    }
                }
            }
        }

        return pinpoint.sendMessages(params, (err: AWSError, _: Pinpoint.SendMessagesResponse) => {
            if (err) {
                console.error(`Error encountered when attempting to send to ${this.responseDestination}`)
                console.error(err)
            } else {
                console.log(`Message sent to ${this.responseDestination}`)
            }
        }).promise()
    }
}

