import { DocumentClient } from "aws-sdk/clients/dynamodb"

export const MAIN_TABLE: string = "gp-seattle-inventory-main"

/**
 * @param name Name of item type. This needs to be unique.
 * @param description Optional description of item.
 * @param tags Tags to categorize item.
 * @param items List of IDs of all items of this item type.
 * @param id ID of item. User specified.
 */
export interface MainSchema {
    name: string,
    description: string,
    tags?: DocumentClient.StringSet,
    items: { [id: string]: ItemSchema }
}

/**
 * @param owner Name of the owner of the item or where the item is stored.
 * @param notes Notes specific to this item.
 * @param borrower Current borrower of item. Blank if available. Initialized as blank. 
 * @param batch List of batches this item is part of.
 */
export interface ItemSchema {
    owner: string,
    borrower: string,
    batch?: DocumentClient.StringSet,
    notes: string
}

export const ITEMS_TABLE: string = "gp-seattle-inventory-items"
export interface SecondaryIndexSchema {
    key: string,
    val: string
}

export const BATCH_TABLE: string = "gp-seattle-inventory-batch"
export const TAGS_TABLE: string = "gp-seattle-inventory-tags"
export interface SearchIndexSchema {
    key: string,
    val?: DocumentClient.StringSet
}

export const REQUESTS_TABLE: string = "gp-seattle-inventory-requests"
/**
 * @param id ID of Request
 * @param status Status of Request
 */
export interface RequestSchema {
    id: string,
    status: "STARTED" | "SUCCESS" | "FAILED"
}

export const TRANSACTIONS_TABLE: string = "gp-seattle-inventory-transactions"
/**
 * @param number Phone Number being used for response.
 * @param type Type of transaction being performed
 * @param scratch Scratch space used by transactions. Initialized as empty.
 */ 
export interface TransactionsSchema {
    number: string,
    type: string,
    scratch: any
}