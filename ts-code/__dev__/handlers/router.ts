import { Router } from "../../src/handlers/router/common"
import { getContainer } from "../../src/injection/default"
import AWS = require("aws-sdk")

const number: string = "test-number"

async function run() {
    AWS.config.update({ region: "us-west-2" })

    getContainer()

    console.log(await new Router().processRequest(process.argv[2], number))
}

run()