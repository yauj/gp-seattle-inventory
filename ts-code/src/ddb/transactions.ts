import { DBClient } from "../injection/interface"
import { AWSError } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "aws-sdk/lib/request"

export const TRANSACTIONS_TABLE: string = "gp-seattle-inventory-transactions"

/**
 * @param number Phone Number being used for response.
 * @param type Type of transaction being performed
 * @param scratch Scratch space used by transactions. Initialized as empty.
 */ 
export interface TransactionsTable {
    number: string,
    type: string,
    scratch: any
}

export class TransactionsDB {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Append to scratch space map
     * 
     * @param number Phone Number being used for response.
     * @param key Target variable
     * @param val Value to append
     */
    public appendToScratch(
        number: string,
        key: string,
        val: any
    ): Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>> {
        var param: DocumentClient.UpdateItemInput = {
            TableName: TRANSACTIONS_TABLE,
            Key: {
                "number": number
            },
            UpdateExpression: "SET scratch.#key = :val",
            ExpressionAttributeNames: {
                "#key": key
            },
            ExpressionAttributeValues: {
                ":val": val
            }
        }
        return this.client.update(param)
    }

    /**
     * Create new Transaction
     * 
     * @param number Phone Number being used for response.
     * @param type Type of transaction being performed
     * @param scratch Scratch space used by transactions. Initialized as empty.
     */
    public create(
        number: string,
        type: string
    ): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
        var params: DocumentClient.PutItemInput = {
            TableName: TRANSACTIONS_TABLE,
            Item: {
                "number": number,
                "type": type,
                "scratch": {}
            }
        }
        return this.client.put(params)
    }

    /**
     * Delete by phone number
     * 
     * @param number Phone Number being used for response.
     */
    public delete(
        number: string
    ): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> {
        var params: DocumentClient.DeleteItemInput = {
            TableName: TRANSACTIONS_TABLE,
            Key: {
                "number": number
            }
        }
        return this.client.delete(params)
    }

    /**
     * Get transaction entry by phone number
     * 
     * @param number Phone Number being used for response.
     */
    public get(
        number: string
    ): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> {
        var params: DocumentClient.GetItemInput = {
            TableName: TRANSACTIONS_TABLE,
            Key: {
                "number": number
            }
        }
        return this.client.get(params)
    }
}