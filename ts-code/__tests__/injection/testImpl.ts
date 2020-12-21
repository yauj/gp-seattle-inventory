import { DESCRIPTION_TABLE, DescriptionTable } from "../../src/ddb/description";
import { ITEMS_TABLE, ItemsTable } from "../../src/ddb/items";
import { TRANSACTIONS_TABLE, TransactionsTable } from "../../src/ddb/transactions";
import { DBClient } from "../../src/injection/interface";
import { AWSError, EKS } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "aws-sdk/lib/request"

interface LocalDB {
    description: { [key: string]: DescriptionTable },
    items: { [key: string]: ItemsTable },
    transactions: { [key: string]: TransactionsTable }
}

/**
 * Local instance of DBClient, which stores everything as part of a single object
 */
export class LocalDBClient implements DBClient {
    private db: LocalDB = {
        description: {},
        items: {},
        transactions: {}
    }

    public delete(params: DocumentClient.DeleteItemInput): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> {
        return this.newPromise(() => {
            delete this.getTable(params.TableName)[params.Key[0]]
            return {}
        })
    }
    
    public get(params: DocumentClient.GetItemInput): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> {
        return this.newPromise(() => {
            return { Item: this.getTable(params.TableName)[params.Key[0]] }
        })
    }

    public put(params: DocumentClient.PutItemInput): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
        return this.newPromise(() => {
            if (params.TableName === DESCRIPTION_TABLE) {
                var descriptionValue: DescriptionTable = params.Item as DescriptionTable
                var descriptionKey: string = descriptionValue.name
                this.db.description[descriptionKey] = descriptionValue
            } else if (params.TableName === ITEMS_TABLE) {
                var itemsValue: ItemsTable = params.Item as ItemsTable
                var itemsKey: string = itemsValue.id
                this.db.items[itemsKey] = itemsValue
            } else if (params.TableName == TRANSACTIONS_TABLE) {
                var transactionsValue: TransactionsTable = params.Item as TransactionsTable
                var transactionsKey: string = transactionsValue.number
                this.db.transactions[transactionsKey] = transactionsValue
            } else {
                throw new Error("Invalid Table Name")
            }
            return {}
        })
    }

    public update(params: DocumentClient.UpdateItemInput): Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>> {
        throw Error("Unimplemented")
    } 

    private getTable(tableName: string) {
        if (tableName === DESCRIPTION_TABLE) {
            return this.db.description
        } else if (tableName === ITEMS_TABLE) {
            return this.db.items
        } else if (tableName == TRANSACTIONS_TABLE) {
            return this.db.transactions
        } else {
            throw new Error("Invalid Table Name")
        }
    }

    private newPromise<T>(runnable: () => T): Promise<PromiseResult<T, AWSError>> {
        return new Promise((resolve: (value: PromiseResult<T, AWSError>) => void, reject: (reason?: any) => void) => {
            try {
                var response: T = runnable()
                resolve({...response, ...{ $response: null }})
            } catch (err) {
                reject(err)
            }
        })
    }
}