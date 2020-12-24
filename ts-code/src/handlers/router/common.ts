import { AddItem } from "../../api/add-item"
import { TransactionsDB } from "../../db/transactions"
import { DBClient } from "../../injection/interface";
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { TransactionsSchema } from "../../db/schemas";
import { PrintTable } from "../../api/print-table";

export class Router {
    private readonly client: DBClient
    private readonly transactionsDB: TransactionsDB

    public constructor(client: DBClient) {
        this.client = client
        this.transactionsDB = new TransactionsDB(client)
    }

    /**
     * Process given request string.
     * 
     * @param request String to process.
     * @param number Corresponding unique number, which is used to identify transactions from a given source.
     */
    public processRequest(request: string, number: string): Promise<string> {
        var processedRequest: string = request.toLowerCase()
        processedRequest = processedRequest === "none" ? "" : processedRequest
        return this.transactionsDB.get(number)
            .then((data: DocumentClient.GetItemOutput) => this.routeRequest(data, number, processedRequest))
            .catch(this.logError)
    }

    private routeRequest(data: DocumentClient.GetItemOutput, number: string, request: string): string | PromiseLike<string> {
        if (data.Item) {
            var txItem: TransactionsSchema = data.Item as TransactionsSchema
            if (request === "reset") {
                return this.transactionsDB.delete(number)
                    .then(() => "Request Reset")
            } else if (txItem.type == "print table") {
                return new PrintTable(this.client).router(number, request, txItem.scratch)
            } else if (txItem.type === "add item") {
                return new AddItem(this.client).router(number, request, txItem.scratch)
            } else {
                return this.transactionsDB.delete(number)
                    .then(() => "Current Request Type is Invalid. Deleting Transaction.")
            }
        } else {
            if (request === "reset") {
                return "No Request To Reset"
            } else if (request == "print table") {
                return new PrintTable(this.client).router(number, request)
            } else if (request === "add item") {
                return new AddItem(this.client).router(number, request)
            } else if (request === "help") {
                return "TODO: Implement Help Menu"
            } else {
                return "Invalid Request. Please reply with HELP "
            }
        }
    }

    private logError(err: any): string {
        console.error(err)
        return err
    }
}