/**
 * Adds item to inventory.
 */
import { Result, TransactionExecutor } from "amazon-qldb-driver-nodejs";
import { dom } from "ion-js";
import { executeLambda, insertItem, queryByName, updateItemByName } from "../qldb/apis";

export const handler = async (event: any): Promise<any> => {
    const returnVal: Result = await executeLambda(async (tx: TransactionExecutor) => {
        return queryByName(tx, event.name).then((result: Result) => {
            var resultList: dom.Value[] = result.getResultList();
            if (resultList.length === 0) {
                // Record doesn't exist. Create new document.
                var doc: Record<string, any> = {
                    "name": event.name,
                    "locations": [event.location],
                    "tags": event.tags,
                    "notes": event.notes
                };
                return insertItem(tx, doc);
            } else {
                // Record already exists, update locations.
                var locations: dom.Value[] = resultList[0].get("locations").elements();
                locations.push(dom.Value.from(event.location));
                return updateItemByName(tx, "locations", locations, event.name);
            }
        })
    });

    return {
        "message": returnVal
    };
}