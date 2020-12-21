import { Router } from "./common";
import { getContainer } from "../../injection/default";
import { SNSEvent, SNSEventRecord, SNSHandler } from "aws-lambda";
import { AWSError, Pinpoint } from "aws-sdk";
import { Container } from "inversify";

const PINPOINT_APP_ID: string = "0ca91d5a35c8404cbfc39fa4d2818092"
const pinpoint: Pinpoint = new Pinpoint()

/**
 * Main entry handler, which splits up the records to be handled separately.
 */
export const handler: SNSHandler = async (event: SNSEvent) => {
    var smsRouter: SMSRouter = new SMSRouter()
    getContainer()
    await Promise.all(event.Records.map(await smsRouter.processRecord))
}

class SMSRouter {
    private readonly router: Router = new Router()
    
    private readonly container: Container = getContainer()

    /**
     * Function to route requests
     */
    public processRecord(record: SNSEventRecord): Promise<any> {
        var message = JSON.parse(record.Sns.Message)
        var request: string = message.messageBody.toLowerCase()

        var responseOrigination = message.destinationNumber
        var responseDestination = message.originationNumber

        console.log("Starting request from " + responseDestination)

        return this.router.processRequest(request, responseDestination)
            .then((response: string) => this.sendMessage(response, responseOrigination, responseDestination))
    }

    /**
     * Function to send Pinpoint response. This is passed down to callbacks, and is the future that is
     * tracked by the top level lambda method, to ensure that all callbacks have been called.
     */
    private sendMessage(response: string, originationNumber: string, destinationNumber: string): Promise<any> {
        var params: Pinpoint.Types.SendMessagesRequest = {
            ApplicationId: PINPOINT_APP_ID,
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
                console.error("Error encountered when attempting to send to " + destinationNumber + "\n" + err.message)
            } else {
                console.log("Message sent to " + destinationNumber)
                console.log(response)
            }
        }).promise()
    }
}