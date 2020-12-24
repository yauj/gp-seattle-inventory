export const MAIN_TABLE: string = "gp-seattle-inventory-main"

/**
 * @param name Name of item type. This needs to be unique.
 * @param notes Other notes related to this item type.
 * @param tags Tags to categorize item.
 * @param items List of IDs of all items of this item type.
 * @param id Auto-generated ID of item. ID is a combination of 3 random words.
 */
export interface MainSchema {
    name: string,
    notes: string,
    tags: string[],
    items: { [id: string]: ItemSchema }
}

/**
 * @param owner Name of the owner of the item or where the item is stored.
 * @param notes Notes specific to this item.
 * @param borrower Current borrower of item. Blank if available. Initialized as blank. 
 */
export interface ItemSchema {
    owner: string,
    borrower: string,
    notes: string
}

export const ITEMS_TABLE: string = "gp-seattle-inventory-items"
export interface SecondaryIndexSchema {
    key: string,
    val: string
}

export const TAGS_TABLE: string = "gp-seattle-inventory-tags"
export interface SearchIndexSchema {
    key: string,
    val: string[]
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