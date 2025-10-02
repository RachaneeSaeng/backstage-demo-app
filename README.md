# [Backstage](https://backstage.io)

This is your newly scaffolded Backstage App, Good Luck!

To start the app, run:

```sh
yarn install
yarn start
```

## To create a database migration
1. Run command `knex init` at you backend plugin folder, it will generate a `knexfile.js` for you. 
This file consist of database connection settings and other Knex-related configurations for different environments (e.g., development, testing, production).
2. Run command `knex migrate:make <migration_name>` at you backend plugin folder,it will generate a migration file (.js) under `/migrations` folder.
Then you have to update the file to define your migration script.
3. run command `npx knex migrate:latest` to apply the latest change to your target database.

## To debug locally?
Refer to this official document to setup your local environment for debugging.
https://github.com/backstage/backstage/blob/master/docs/tooling/local-dev/debugging.md