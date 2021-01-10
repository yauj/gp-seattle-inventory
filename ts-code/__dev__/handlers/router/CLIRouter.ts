import { Router } from "../../../src/handlers/router/Router"
import { DBClient } from "../../../src/injection/db/DBClient"
import { DDBClient } from "../../../src/injection/db/DDBClient"
import { CloudWatchClient } from "../../../src/injection/metrics/CloudWatchClient"
import { MetricsClient } from "../../../src/injection/metrics/MetricsClient"
import { LocalDBClient } from "../../../__tests__/injection/db/LocalDBClient"
import { userInfo } from "os"

const prompt = require("prompt")
const number: string = `${userInfo().username}-test-number`

/**
 * Local: node CLIRouter.js
 * Remote: node CLIRouter.js remote
 */
var client: DBClient
var router: Router

/**
 * Dev script to test out router.
 */
function run() {
    if (process.argv[2] === "remote") {
        console.log("CONNECTING TO PRODUCTION DATABASE")
        client = new DDBClient({ region: "us-west-2" })
        var metrics: MetricsClient = new CloudWatchClient(
            `${userInfo().username}-Local`,
            { region: "us-west-2" }
        )
        router = new Router(client, metrics)
    } else {
        client = new LocalDBClient()
        router = new Router(client)
    }

    prompt.start()
    getSchema(undefined, { response: "help" })
}

async function getSchema(err: any, request: any) {
    if (err) { 
        console.log(err)
        return 1
    } else {
        console.log(await router.processRequest(request.response, number))
        prompt.get(["response"], getSchema)
        return 0
    }
}

run()