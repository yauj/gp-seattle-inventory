import { Router } from "../../src/handlers/router/common"
import { DDBClient } from "../../src/injection/impl"

const number: string = "test-number"

/**
 * Dev script to test out router. Steps to run:
 * npm install
 * npm run build
 * node router.js '<request string>'
 */
async function run() {
    var router: Router = new Router(new DDBClient({ region: "us-west-2" }))

    console.log(await router.processRequest(process.argv[2], number))
}

run()