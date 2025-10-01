/*
Table: repositories_security_tools
Description: Tracks the security tools associated with each repository
Columns:
- repository_name (string, primary key)
- programming_languages (string)
- tool_category (string)
- tool_name (string)
- is_required (boolean)
- implemented (boolean)
- info_url (string)
- updated_at (timestamp, default to current timestamp, update on modification)
*/

// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return knex.schema.createTable('repositories_security_tools', table => {
    table.comment(
      'Tracks the security tools associated with each repository',
    );
    table
      .string('repository_name')
      .primary()
      .notNullable()
      .comment('Repository name');
    table
      .string('programming_languages')
      .nullable()
      .comment('Programming languages used in the repository');
    table.string('tool_category')
      .nullable()
      .comment('Category of the security tool');
    table.string('tool_name')
      .nullable()
      .comment('Name of the security tool');
    table
      .boolean('is_required')
      .defaultTo(false)
      .comment('Whether this tool is required');
    table
      .boolean('implemented')
      .defaultTo(false)
      .comment('Whether the tool has been implemented');
    table.string('info_url')
      .nullable()
      .comment('URL with more information about the tool implementation, e.g. GithubActions Workflow or Settigs page');
    table
      .timestamp('updated_at')
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment('Timestamp of last update');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  return knex.schema.dropTable('repositories_security_tools');
};