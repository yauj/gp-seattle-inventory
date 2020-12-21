import { AddDescription } from "../../api/add-description"
import { AddItem } from "../../api/add-item"
import { TransactionsDB, TransactionsTable } from "../../ddb/transactions"
import { DBClient } from "../../injection/interface";
import { DocumentClient } from "aws-sdk/clients/dynamodb"

export class Router {
    private readonly addItem: AddItem
    private readonly addDescription: AddDescription
    private readonly transactionsDB: TransactionsDB

    public constructor(client: DBClient) {
        this.addItem = new AddItem(client)
        this.addDescription = new AddDescription(client)
        this.transactionsDB = new TransactionsDB(client)
    }

    /**
     * Process given request string.
     * 
     * @param request String to process.
     * @param number Corresponding unique number, which is used to identify transactions from a given source.
     */
    public processRequest(request: string, number: string): Promise<string> {
        return this.transactionsDB.get(number)
            .then((data: DocumentClient.GetItemOutput) => this.routeRequest(data, number, request))
            .catch(this.logError)
    }

    private routeRequest(data: DocumentClient.GetItemOutput, number: string, request: string): string | PromiseLike<string> {
        if (data.Item) {
            var txItem: TransactionsTable = data.Item as TransactionsTable
            if (request === "reset") {
                return this.transactionsDB.delete(number)
                    .then(() => "Request Reset")
            } else if (txItem.type === "add description") {
                return this.addDescription.router(number, request, txItem.scratch)
            } else if (txItem.type === "add item") {
                return this.addItem.router(number, request, txItem.scratch)
            } else {
                return this.transactionsDB.delete(number)
                    .then(() => "Current Request Type is Invalid. Deleting Transaction.")
            }
        } else {
            if (request.toLowerCase() === "reset") {
                return "No Request To Reset"
            } else if (request.toLowerCase() === "add description") {
                return this.addDescription.router(number, request)
            } else if (request.toLowerCase() === "add item") {
                return this.addItem.router(number, request)
            } else if (request.toLowerCase() === "help") {
                return "TODO: Implement Help Menu"
            } else {
                return "Invalid Request. Please reply with HELP "
            }
        }
    }

    private logError(err: any): string {
        var errMsg: string = "Error Encountered: " + err
        console.error(errMsg)
        return errMsg
    }
}