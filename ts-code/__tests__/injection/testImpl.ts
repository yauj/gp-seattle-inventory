import { DBClient } from "../../src/injection/interface";
import { AWSError } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "aws-sdk/lib/request"
import { MainSchema, SecondaryIndexSchema, SearchIndexSchema, TransactionsSchema, MAIN_TABLE, ITEMS_TABLE, TRANSACTIONS_TABLE, TAGS_TABLE } from "../../src/db/schemas";

interface LocalDB {
    main: { [key: string]: MainSchema },
    items: { [key: string]: SecondaryIndexSchema },
    tags: { [key: string]: SearchIndexSchema }
    transactions: { [key: string]: TransactionsSchema }
}

/**
 * Local instance of DBClient, which stores everything as part of a single object
 */
export class LocalDBClient implements DBClient {
    private db: LocalDB = {
        main: {},
        items: {},
        tags: {},
        transactions: {}
    }

    /**
     * Return entire database as a string
     */
    public toJSON(): string {
        return JSON.stringify(this.db)
    }

    public delete(params: DocumentClient.DeleteItemInput): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> {
        return this.newPromise(() => {
            delete this.getTable(params.TableName)[Object.values(params.Key)[0]]
            return {}
        })
    }
    
    public get(params: DocumentClient.GetItemInput): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> {
        return this.newPromise(() => {
            return { Item: this.getTable(params.TableName)[Object.values(params.Key)[0]] }
        })
    }

    public put(params: DocumentClient.PutItemInput): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
        return this.newPromise(() => {
            if (params.TableName === MAIN_TABLE) {
                const val: MainSchema = params.Item as MainSchema
                const key: string = val.name
                this.db.main[key] = val
            } else if (params.TableName === ITEMS_TABLE) {
                const val: SecondaryIndexSchema = params.Item as SecondaryIndexSchema
                const key: string = val.key
                this.db.items[key] = val
            } else if (params.TableName === TAGS_TABLE) {
                const val: SearchIndexSchema = params.Item as SearchIndexSchema
                const key: string = val.key
                this.db.tags[key] = val
            } else if (params.TableName == TRANSACTIONS_TABLE) {
                const val: TransactionsSchema = params.Item as TransactionsSchema
                const key: string = val.number
                this.db.transactions[key] = val
            } else {
                throw new Error("Invalid Table Name: " + params.TableName)
            }
            return {}
        })
    }

    public update(params: DocumentClient.UpdateItemInput): Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>> {
        return this.newPromise(() => {
            if (params.UpdateExpression === "SET #key = list_append(#key, :val)") {
                // TODO: Maybe a bug, where concatenation is not working
                const key: string = params.ExpressionAttributeNames["#key"]
                const val: string[] = params.ExpressionAttributeValues[":val"]
                this.getTable(params.TableName)[Object.values(params.Key)[0]][key]
                    = this.getTable(params.TableName)[Object.values(params.Key)[0]][key].concat(val)
            } else if (params.UpdateExpression === "SET #attr.#key = :val") {
                const attr: string = params.ExpressionAttributeNames["#attr"]
                const key: string = params.ExpressionAttributeNames["#key"]
                const val: any = params.ExpressionAttributeValues[":val"]
                this.getTable(params.TableName)[Object.values(params.Key)[0]][attr][key] = val
            } else {
                throw Error("Unsupported UpdateExpression: " + params.UpdateExpression)
            }

            return {}
        })
    }
    
    // Default to full table scan for now.
    public scan(params: DocumentClient.ScanInput): Promise<PromiseResult<DocumentClient.ScanOutput, AWSError>> {
        return this.newPromise(() => {
            const table: any[] = Object.values(this.getTable(params.TableName))
            return {
                Items: table,
                Count: table.length,
                ScannedCount: table.length
            }
        })
    }

    private getTable(tableName: string): any {
        if (tableName === MAIN_TABLE) {
            return this.db.main
        } else if (tableName === ITEMS_TABLE) {
            return this.db.items
        } else if (tableName === TAGS_TABLE) {
            return this.db.tags
        } else if (tableName == TRANSACTIONS_TABLE) {
            return this.db.transactions
        } else {
            throw new Error("Invalid Table Name")
        }
    }

    private newPromise<T>(runnable: () => T): Promise<PromiseResult<T, AWSError>> {
        return new Promise((resolve: (value: PromiseResult<T, AWSError>) => void, reject: (reason?: any) => void) => {
            try {
                const response: T = runnable()
                resolve({...response, ...{ $response: null }})
            } catch (err) {
                reject(err)
            }
        })
    }
}