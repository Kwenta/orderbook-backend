In order to run the service, you will need:

A postgres database to persist the data to
    This will enable you to provide the variables: 
```
DB_PASSWORD=
DB_HOST=
DB_NAME=
DB_USER=
DB_PORT=
```

An RPC node to query chain data from and send transactions to
    This will be provided by `RPC_URL`

A contract deployed on a chain that will be used for settlement
    For this, you will need to provide 
```
DOMAIN_VERSION=
DOMAIN_NAME=
CONTRACT_ADDRESS=
```
