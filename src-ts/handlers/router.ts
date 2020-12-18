import { addDescriptionRouter } from "./add-description"
import { addItemRouter } from "./add-item";
import { stringPromise } from "../utility";
import { deleteTransaction, getTransaction } from "../ddb/apis"
import { SNSEvent, SNSEventRecord, SNSHandler } from "aws-lambda"
import { AWSError, Pinpoint } from "aws-sdk"
import { GetItemOutput } from "aws-sdk/clients/dynamodb"

const pinpoint = new Pinpoint()

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
    var msg = JSON.parse(record.Sns.Message)
    var msgBody: string = msg.messageBody.toLowerCase()

    return getTransaction(msg.destinationNumber)
        .then((txEntry: GetItemOutput) => routeRequest(msg.destinationNumber, txEntry, msgBody))
        .catch(logDynamoDBError)
        .then(sendMessage(msg.originationNumber, msg.destinationNumber))
}

function routeRequest(number: string, txEntry: GetItemOutput, msgBody: string): Promise<string> {
    if (txEntry.Item) {
        if (msgBody === "cancel") {
            return stringPromise("No Request To Cancel")
        } else if (msgBody === "add description") {
            return addDescriptionRouter(number, msgBody)
        } else if (msgBody === "add item") {
            return addItemRouter(number, msgBody)
        } else if (msgBody === "help") {
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
            ApplicationId: process.env.ApplicationId,
            MessageRequest: {
                Addresses: {
                    [originationNumber]: {
                        ChannelType: 'SMS'
                    }
                },
                MessageConfiguration: {
                    SMSMessage: {
                        Body: body,
                        MessageType: 'PROMOTIONAL',
                        OriginationNumber: destinationNumber
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