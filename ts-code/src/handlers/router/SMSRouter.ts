import { Router } from "./Router"
import { DBClient } from "../../injection/DBClient"
import { DDBClient } from "../../injection/DDBClient"
import { SNSEvent, SNSEventRecord, SNSHandler } from "aws-lambda"
import { Pinpoint } from "aws-sdk"

const pinpoint: Pinpoint = new Pinpoint()

/**
 * Main entry handler, which splits up the records to be handled separately.
 */
export const handler: SNSHandler = async (event: SNSEvent) => {
    await Promise.all(event.Records.map((record: SNSEventRecord) => new SMSRouter(record).processRecord()))
}

class SMSRouter {
    private db: DBClient = new DDBClient()
    private request: string
    private responseOrigination: string
    private responseDestination: string

    public constructor(record: SNSEventRecord) {
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

        return new Router(this.db).processRequest(this.request, this.responseDestination)
            .then((response: string) => this.sendMessage(response))
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

        return pinpoint.sendMessages(params).promise()
            .then(
                () => {
                    console.log(`Message sent to ${this.responseDestination}`)
                },
                (reason: any) => {
                    console.error(`Error encountered when attempting to send to ${this.responseDestination}:`)
                    console.error(reason)
                }
            )
    }
}

