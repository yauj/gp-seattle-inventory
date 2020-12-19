import { addDescriptionRouter } from "./add-description"
import { addItemRouter } from "./add-item";
import { deleteTransaction, getTransaction } from "../ddb/apis"
import { SNSEvent, SNSEventRecord, SNSHandler, Context } from "aws-lambda"
import { AWSError, Pinpoint } from "aws-sdk"
import { GetItemOutput } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "aws-sdk/lib/request";

const PINPOINT_APP_ID: string = "0ca91d5a35c8404cbfc39fa4d2818092"
const pinpoint: Pinpoint = new Pinpoint()

/**
 * Main entry handler, which splits up the records to be handled separately.
 */
export const handler: SNSHandler = async (event: SNSEvent, context: Context) => {
    await Promise.all(event.Records.map(await processRecord))
}

// TODO: Fix stringPromise

/**
 * Function to route requests
 */
function processRecord(record: SNSEventRecord): Promise<any> {
    var message = JSON.parse(record.Sns.Message)
    var request: string = message.messageBody.toLowerCase()

    var responseOrigination = message.destinationNumber
    var responseDestination = message.originationNumber

    return getTransaction(responseDestination)
        .then((txItem: GetItemOutput) => routeRequest(txItem, responseDestination, request))
        .catch(logError)
        .then((response: string) => sendMessage(response, responseOrigination, responseDestination))
}

function routeRequest(txItem: GetItemOutput, number: string, request: string): string | PromiseLike<string> {
    if (txItem.Item) {
        if (request === "cancel") {
            return deleteTransaction(number)
                .then(() => "Request Cancelled")
        } else if (txItem.Item.type.S === "add description") {
            return addDescriptionRouter(number, request, txItem.Item.scratch.M)
        } else if (txItem.Item.type.S === "add item") {
            return addItemRouter(number, request, txItem.Item.scratch.M)
        } else {
            return deleteTransaction(number)
                .then(() => "Current Request Type is Invalid. Deleting Transaction.")
        }
    } else {
        if (request.toLowerCase() === "cancel") {
            return "No Request To Cancel"
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
                    OriginationNumber: originationNumber,
                    SenderId: 'GP Seattle Inventory'
                }
            }
        }
    }

    return pinpoint.sendMessages(params, (err: AWSError, _: Pinpoint.SendMessagesResponse) => {
        if (err) {
            console.error("Error encountered when attempting to send to " + destinationNumber + "\n" + err.message)
        }
    }).promise()
}

function logError(err: any): string {
    var errMsg: string = "Error Encountered: " + err
    console.error(errMsg)
    return errMsg
}