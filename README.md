# GP Seattle Inventory APIs

This package contains different APIs that perform operations against the relevant DynamoDB tables.

## APIs

There are a list of APIs that have been implemented in the api folder. The API classes all contain the following:
- `public constructor(client: DBClient)`
    - Public constructor to initialize the API class.
- `public static NAME: string`
    - This is the name used to initialize the router transaction
- `public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string>`
    - This is the main function that is used to understand router requests.
- `public execute(scratch: ScratchInterface): Promise<?>`
    - This is the main function that is used to execute the specific API. 
    **This is the function that should be used to call the API from code.**
- `interface ScratchInterface`
    - Interface defining the variables that are expected for the execute function.
    Note that this interface is not exported.

## Router

One way the APIs are linked up is through the router, where a user can either use a SMS or CLI (for dev)
dialogue to invoke APIs.

The SMS router is invoked through sending a message to the designated number,
which triggers a SNS notification, which in turn triggers a Lambda invocation of the SMS router code.

A CLI router was created for the purposes of testing, which can be invoked by pulling the code,
then running the following:
- `npm install`
- `npm run build`
- From the `__dev__/handlers/router` directory: `node CLIRouter.js`