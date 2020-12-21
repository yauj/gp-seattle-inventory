import { DBClient } from "../injection/interface"
import { AWSError } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "aws-sdk/lib/request"

const ITEMS_TABLE = "gp-seattle-inventory-items"

/**
 * @param id Auto-generated ID of item. ID is a combination of 3 random words.
 * @param name Name of the item.
 * @param owner Name of the owner of the item or where the item is stored.
 * @param notes Notes specific to this item.
 * @param borrower Current borrower of item. Blank if available. Initialized as blank. 
 */
export interface ItemsTable {
    id: string,
    name: string,
    owner: string,
    notes: string,
    borrower: string
}

export class ItemsDB {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Adds item to item inventory table. 
     * 
     * @param id Auto-generated ID of item. ID is a combination of 3 random words.
     * @param name Name of the item.
     * @param owner Name of the owner of the item or where the item is stored.
     * @param notes Notes specific to this item.
     * @param borrower Current borrower of item. Blank if available. Initialized as blank.
     */
    public create(
        id: string,
        name: string,
        owner: string,
        notes: string = ""
    ): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
        var params: DocumentClient.PutItemInput = {
            TableName: ITEMS_TABLE,
            Item: {
                "id": id,
                "name": name,
                "owner": owner,
                "notes": notes,
                "borrower": ""
            }
        }
        return this.client.put(params)
    }
}