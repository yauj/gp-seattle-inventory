/**
 * Adds item to inventory.
 */

import { QldbDriver } from "amazon-qldb-driver-nodejs";
import { LEDGER_NAME, insertItem, queryByName, updateItemByName } from "../qldb/apis";

exports.handler = async function(event) {
    const driver = new QldbDriver(LEDGER);

    try {
        driver.executeLambda(async (tx) => {
            queryByName(tx, event.name).then((result) => {
                const resultList = result.getResultList();
                if (resultList.length === 0) {
                    // Record doesn't exist. Create new document.
                    doc = {
                        name: event.name,
                        locations: [event.location],
                        tags: event.tags,
                        notes: event.notes
                    }
                    return insertItem(tx, doc)
                } else {
                    // Record already exists, update locations.
                    locations = resultList[0].get("locations")
                    locations.push(event.location)
                    return updateItemByName("locations", locations, event.name)
                }
            })
        })
    } finally {
        driver.close();
    }

    return message;
};