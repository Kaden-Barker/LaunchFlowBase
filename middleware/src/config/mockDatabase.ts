import knex, { Knex } from 'knex';

export class mockDatabase {
  private db: Knex;
  private tables: Set<string> = new Set();

  constructor() {
    this.db = knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:'
      },
      useNullAsDefault: true
    });
  }

  /**
   * Create a new table with the specified schema
   * @param tableName - Name of the table to create
   * @param schema - Object defining the table schema
   */
  async createTable(tableName: string, schema: Record<string, string>): Promise<void> {
    if (this.tables.has(tableName)) {
      throw new Error(`Table ${tableName} already exists`);
    }

    await this.db.schema.createTable(tableName, (table) => {
      // Add id column as primary key
      table.increments('id').primary();
      
      // Add columns based on schema
      for (const [columnName, columnType] of Object.entries(schema)) {
        switch (columnType.toLowerCase()) {
          case 'string':
            table.string(columnName);
            break;
          case 'number':
            table.float(columnName);
            break;
          case 'boolean':
            table.boolean(columnName);
            break;
          case 'date':
            table.date(columnName);
            break;
          default:
            throw new Error(`Unsupported column type: ${columnType}`);
        }
      }
    });

    this.tables.add(tableName);
  }

  /**
   * Insert data into a table
   * @param tableName - Name of the table to insert into
   * @param data - Array of objects containing the data to insert
   */
  async insertData(tableName: string, data: Record<string, any>[]): Promise<void> {
    if (!this.tables.has(tableName)) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    await this.db(tableName).insert(data);
  }

  /**
   * Get all data from a table
   * @param tableName - Name of the table to query
   */
  async getAllData(tableName: string): Promise<any[]> {
    if (!this.tables.has(tableName)) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    return await this.db(tableName).select('*');
  }

  /**
   * Clear all data from a table
   * @param tableName - Name of the table to clear
   */
  async clearTable(tableName: string): Promise<void> {
    if (!this.tables.has(tableName)) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    await this.db(tableName).del();
  }

  /**
   * Drop a table
   * @param tableName - Name of the table to drop
   */
  async dropTable(tableName: string): Promise<void> {
    if (!this.tables.has(tableName)) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    await this.db.schema.dropTable(tableName);
    this.tables.delete(tableName);
  }

  /**
   * Get the underlying Knex instance
   */
  getKnexInstance(): Knex {
    return this.db;
  }

  /**
   * Destroy the database connection
   */
  async destroy(): Promise<void> {
    await this.db.destroy();
  }
} 