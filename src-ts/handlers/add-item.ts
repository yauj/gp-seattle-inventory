/**
 * Adds item to inventory.
 */
import { Result, TransactionExecutor } from "amazon-qldb-driver-nodejs";
import { dom } from "ion-js";
import { executeLambda, insertItem, queryByName, updateItemByName } from "../qldb/apis";

export const handler = async (event: any): Promise<any> => {
    const returnVal: Result = await executeLambda(async (tx: TransactionExecutor) => {
        var doc: Record<string, any> = {
            "name": event.name,
            "locations": [event.location],
            "tags": event.tags,
            "notes": event.notes
        };
        return insertItem(tx, doc);
    });

    return {
        "message": returnVal
    };
}