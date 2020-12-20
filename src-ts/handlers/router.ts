import { addDescriptionRouter } from "./add-description"
import { addItemRouter } from "./add-item";
import { deleteTransaction, getTransaction, Transaction } from "../ddb/apis"
import { SNSEvent, SNSEventRecord, SNSHandler } from "aws-lambda"
import { AWSError, Pinpoint } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

const PINPOINT_APP_ID: string = "0ca91d5a35c8404cbfc39fa4d2818092"
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

    console.log("Starting request from " + responseDestination)

    return getTransaction(responseDestination)
        .then((data: DocumentClient.GetItemOutput) => routeRequest(data, responseDestination, request))
        .catch(logError)
        .then((response: string) => sendMessage(response, responseOrigination, responseDestination))
}

function routeRequest(data: DocumentClient.GetItemOutput, number: string, request: string): string | PromiseLike<string> {
    if (data.Item) {
        var txItem: Transaction = data.Item as Transaction
        if (request === "reset") {
            return deleteTransaction(number)
                .then(() => "Request Reset")
        } else if (txItem.type === "add description") {
            return addDescriptionRouter(number, request, txItem.scratch)
        } else if (txItem.type === "add item") {
            return addItemRouter(number, request, txItem.scratch)
        } else {
            return deleteTransaction(number)
                .then(() => "Current Request Type is Invalid. Deleting Transaction.")
        }
    } else {
        if (request.toLowerCase() === "reset") {
            return "No Request To Reset"
        } else if (request.toLowerCase() === "add description") {
            return addDescriptionRouter(number, request)
        } else if (request.toLowerCase() === "add item") {
            return addItemRouter(number, request)
        } else if (request.toLowerCase() === "help") {
            return "TODO: Implement Help Menu"
        } else {
            return "TODO: Implement Bad Request"
        }
    }
}

/**
 * Function to send Pinpoint response. This is passed down to callbacks, and is the future that is
 * tracked by the top level lambda method, to ensure that all callbacks have been called.
 */
function sendMessage(response: string, originationNumber: string, destinationNumber: string): Promise<any> {
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

function logError(err: any): string {
    var errMsg: string = "Error Encountered: " + err
    console.error(errMsg)
    return errMsg
}