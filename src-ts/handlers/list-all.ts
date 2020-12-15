/**
 * Adds item to inventory.
 */
import { Result, TransactionExecutor } from "amazon-qldb-driver-nodejs";
import { executeLambda, queryAll } from "../qldb/apis";

export const handler = async (event: any): Promise<any> => {
    const returnVal: Result = await executeLambda(async (tx: TransactionExecutor) => {
        return queryAll(tx);
    });

    return {
        "message": returnVal
    };
}