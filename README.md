# GP Seattle Inventory Lambda Functions

This package contains the code for the Lambda APIs, that do different operations against the
relevant DynamoDB tables.

## Router

The main way to access these functions right now is through the router, which routes commands to
underlying operations. Use the "help" interface to get the valid operations.

## Improvements

- Make public node project, to allow others to perform db operations
- TTL for History
- Scheduling