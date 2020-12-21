import "reflect-metadata";
import { Router } from "../../src/handlers/router/common"
import { DDBClient } from "../../src/injection/implementation"
import AWS = require("aws-sdk")

const number: string = "test-number"

async function run() {
    var router: Router = new Router(new DDBClient({ region: "us-west-2" }))

    console.log(await router.processRequest(process.argv[2], number))
}

run()