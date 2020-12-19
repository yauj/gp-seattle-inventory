import { addDescriptionRouter } from "./add-description"
import { addItemRouter } from "./add-item";
import { stringPromise } from "../utility";
import { deleteTransaction, getTransaction } from "../ddb/apis"
import { SNSEvent, SNSEventRecord, SNSHandler, Context } from "aws-lambda"
import { AWSError, Pinpoint } from "aws-sdk"
import { GetItemOutput } from "aws-sdk/clients/dynamodb"

const PINPOINT_APP_ID: string = "0ca91d5a35c8404cbfc39fa4d2818092"
const pinpoint: Pinpoint = new Pinpoint()

/**
 * Main entry handler, which splits up the records to be handled separately.
 */
export const handler: SNSHandler = async (event: SNSEvent, context: Context) => {
    await Promise.all(event.Records.map(await processRecord))
}

/**
 * Function to route requests
 */
function processRecord(record: SNSEventRecord): Promise<any> {
    var msg = JSON.parse(record.Sns.Message)
    var msgBody: string = msg.messageBody.toLowerCase()

    var responseOrigination = msg.destinationNumber
    var responseDestination = msg.originationNumber

    console.log(record.Sns.Message)

    return getTransaction(responseDestination)
        .then((txEntry: GetItemOutput) => routeRequest(responseDestination, txEntry, msgBody))
        .catch(logDynamoDBError)
        .then(sendMessage(responseOrigination, responseDestination))
}

function routeRequest(number: string, txEntry: GetItemOutput, msgBody: string): Promise<string> {
    if (txEntry.Item) {
        if (msgBody.toLowerCase() === "cancel") {
            return stringPromise("No Request To Cancel")
        } else if (msgBody.toLowerCase() === "add description") {
            return addDescriptionRouter(number, msgBody)
        } else if (msgBody.toLowerCase() === "add item") {
            return addItemRouter(number, msgBody)
        } else if (msgBody.toLowerCase() === "help") {
            return stringPromise("TODO: Implement Help Menu")
        } else {
            return stringPromise("TODO: Implement Bad Request")
        }
    } else if (msgBody === "cancel") {
        return deleteTransaction(number)
            .then(() => stringPromise("Request Cancelled"))
    } else {
        if (txEntry.Item.type.S === "add description") {
            return addDescriptionRouter(number, msgBody, txEntry.Item.scratch.M)
        } else if (txEntry.Item.type.S === "add item") {
            return addItemRouter(number, msgBody, txEntry.Item.scratch.M)
        } else {
            return deleteTransaction(number)
                .then(() => stringPromise("Current Request Type is Invalid. Deleting Transaction."))
        }
    }
}

/**
 * Function to send Pinpoint response. This is passed down to callbacks, and is the future that is
 * tracked by the top level lambda method, to ensure that all callbacks have been called.
 */
function sendMessage(originationNumber: string, destinationNumber: string): (body: string) => Promise<any> {
    return (body: string) => {
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
                        Body: body,
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
}

function logDynamoDBError(): (err: AWSError) => Promise<string> {
    return (err: AWSError) => {
        var errMsg: string = "Error Encountered with DynamoDB Client: " + JSON.stringify(err, null, 2)
        console.error(errMsg)
        return stringPromise(errMsg)
    }
}