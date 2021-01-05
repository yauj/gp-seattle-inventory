import { Router } from "./Router"
import { DDBClient } from "../../injection/DDBClient"
import { SNSEvent, SNSEventRecord, SNSHandler } from "aws-lambda"
import { AWSError, Pinpoint } from "aws-sdk"

const pinpoint: Pinpoint = new Pinpoint()

/**
 * Main entry handler, which splits up the records to be handled separately.
 */
export const handler: SNSHandler = async (event: SNSEvent) => {
    await Promise.all(event.Records.map(await processRecord))
}

/**
 * Function to route requests
 */
function processRecord(record: SNSEventRecord): Promise<any> {
    var message = JSON.parse(record.Sns.Message)
    var request: string = message.messageBody.toLowerCase()

    var responseOrigination = message.destinationNumber
    var responseDestination = message.originationNumber

    console.log(`Starting request from ${responseDestination}`)

    var router: Router = new Router(new DDBClient())

    return router.processRequest(request, responseDestination)
        .then((response: string) => sendMessage(response, responseOrigination, responseDestination))
}

/**
 * Function to send Pinpoint SMS response.
 */
function sendMessage(response: string, originationNumber: string, destinationNumber: string): Promise<any> {
    var params: Pinpoint.Types.SendMessagesRequest = {
        ApplicationId: process.env.PinpointAppId,
        MessageRequest: {
            Addresses: {
                [destinationNumber]: {
                    ChannelType: 'SMS'
                }
            },
            MessageConfiguration: {
                SMSMessage: {
                    Body: response,
                    MessageType: 'PROMOTIONAL',
                    OriginationNumber: originationNumber
                }
            }
        }
    }

    return pinpoint.sendMessages(params, (err: AWSError, _: Pinpoint.SendMessagesResponse) => {
        if (err) {
            console.error(`Error encountered when attempting to send to ${destinationNumber}`)
            console.error(err)
        } else {
            console.log(`Message sent to ${destinationNumber}`)
        }
    }).promise()
}