import { AddItem } from "../../api/AddItem"
import { DeleteItem } from "../../api/DeleteItem"
import { BorrowItem } from "../../api/BorrowItem"
import { ReturnItem } from "../../api/ReturnItem"
import { PrintTable } from "../../api/internal/PrintTable"
import { TransactionsTable } from "../../db/TransactionsTable"
import { TransactionsSchema } from "../../db/Schemas"
import { DBClient } from "../../injection/DBClient"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

const HELP_MENU: string = "Note that all incoming strings are processed with the following assumptions:\n"
    + "- All incoming strings are made into lowercase.\n"
    + "- The keyword 'none' is replaced with a empty string.\n"
    + "Supported Operations:\n"
    + "- 'add item': Add new item to the database.\n"
    + "- 'borrow item': Mark item as borrowed.\n"
    + "- 'return item': Mark borrowed item as returned.\n"
    + "- 'delete item': Delete item from database, by item id.\n"
    + "- 'abort': Reset ongoing transaction.\n"
    + "- 'help': Returns this help menu."

export class Router {
    private readonly client: DBClient
    private readonly transactionsTable: TransactionsTable

    public constructor(client: DBClient) {
        this.client = client
        this.transactionsTable = new TransactionsTable(client)
    }

    /**
     * Process given request string.
     * 
     * @param request String to process.
     * @param number Corresponding unique number, which is used to identify transactions from a given source.
     */
    public processRequest(request: string, number: string): Promise<string> {
        var processedRequest: string = request.toLowerCase()
        processedRequest = (processedRequest === "none") ? "" : processedRequest

        return this.transactionsTable.get(number)
            .then((data: DocumentClient.GetItemOutput) => {
                if (data.Item) {
                    var entry: TransactionsSchema = data.Item as TransactionsSchema
                    return this.routeRequest(number, processedRequest, entry.type, entry.scratch)
                } else {
                    return this.routeRequest(number, processedRequest, processedRequest)
                }
            })
            .catch(this.logError)
    }

    private routeRequest(
        number: string,
        request: string,
        type: string,
        scratch?: any
    ): string | PromiseLike<string> {
        if (request === "abort") {
            return this.abort(number, scratch)
        } else if (type === PrintTable.NAME) {
            return new PrintTable(this.client).router(number, request, scratch)
        } else if (type === AddItem.NAME) {
            return new AddItem(this.client).router(number, request, scratch)
        } else if (type === BorrowItem.NAME) {
            return new BorrowItem(this.client).router(number, request, scratch)
        } else if (type === ReturnItem.NAME) {
            return new ReturnItem(this.client).router(number, request, scratch)
        } else if (type === DeleteItem.NAME) {
            return new DeleteItem(this.client).router(number, request, scratch)
        } else {
            return this.footer(number, request, scratch)
        }
    }

    private abort(number: string, scratch?: any): string | PromiseLike<string> {
        if (scratch) {
            return this.transactionsTable.delete(number)
                    .then(() => "Request Reset")
        } else {
            return "No Request to Abort."
        }
    }

    private footer(number: string, request: string, scratch?: any): string | PromiseLike<string> {
        if (scratch) {
            return this.transactionsTable.delete(number)
                .then(() => "Request type is invalid. Transaction data is corrupt. Deleting transaction.")
        } else {
            if (request === "help") {
                return HELP_MENU
            } else {
                return "Invalid Request. Please reply with HELP to get valid operations."
            }
        }
    }

    private logError(err: any): string {
        console.error(err)
        return err
    }
}