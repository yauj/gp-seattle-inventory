import { DBClient, TYPES } from "./interface"
import { AWSError } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "aws-sdk/lib/request"
import { Container, injectable } from "inversify";

export function getContainer(): Container {
    var container = new Container()
    container.bind<DBClient>(TYPES.DBClient).to(DDBClient).inSingletonScope()
    return container
}

@injectable()
export class DDBClient implements DBClient {
    private readonly docClient = new DocumentClient()

    public delete(params: DocumentClient.DeleteItemInput): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> {
        return this.docClient.delete(params).promise()
    }
    
    public get(params: DocumentClient.GetItemInput): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> {
        return this.docClient.get(params).promise()
    }

    public put(params: DocumentClient.PutItemInput): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
        return this.docClient.put(params).promise()
    }

    public update(params: DocumentClient.UpdateItemInput): Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>> {
        return this.docClient.update(params).promise()
    }

    
}