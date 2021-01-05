import { Router } from "./Router"
import { DDBClient } from "../../injection/DDBClient"
import { SNSEvent, SNSEventRecord, SNSHandler } from "aws-lambda"
import { AWSError, Pinpoint, SES } from "aws-sdk"

const SOURCE_EMAIL: string = "gp.seattle.inventory@gmail.com"

const ses: SES = new SES()

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
    var request: string = message.content.toLowerCase()

    var responseDestination: string = message.mail.commonHeaders.returnPath

    console.log(`Starting request from ${responseDestination}`)

    var router: Router = new Router(new DDBClient())

    return router.processRequest(request, responseDestination)
        .then((response: string) => sendMessage(response, responseDestination))
}

/**
 * Function to send SES response.
 */
function sendMessage(response: string, destinationEmail: string): Promise<any> {
    var params: SES.Types.SendEmailRequest = {
        Destination: {
            ToAddresses: [destinationEmail]
        },
        Message: {
            Body: {
                Text: {
                    Data: response
                }
            },
            Subject: {
                Data: "Header"
            }
        },
        Source: SOURCE_EMAIL
    }

    return ses.sendEmail(params, (err: AWSError) => {
        if (err) {
            console.error(`Error encountered when attempting to send to ${destinationEmail}`)
            console.error(err)
        } else {
            console.log(`Message sent to ${destinationEmail}`)
        }
    }).promise()
}