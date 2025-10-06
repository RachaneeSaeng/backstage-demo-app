/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('repositories_security_tools', table => {
    table.comment(
      'Tracks the security tools associated with each repository',
    );
    table
      .string('repository_name', 100)
      .primary()
      .notNullable()
      .comment('Repository name');
    table
      .string('tool_category', 32)
      .notNullable()
      .comment('Category of the security tool');
    table
      .string('tool_name', 32)
      .notNullable()
      .comment('Name of the security tool');
    table
      .boolean('is_required')
      .defaultTo(false)
      .comment('Whether this tool is required');
    table
      .boolean('implemented')
      .defaultTo(false)
      .comment('Whether the tool has been implemented');
    table
      .string('info_url')
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
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('repositories_security_tools');
};
