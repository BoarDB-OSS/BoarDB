import * as mysql from "mysql2/promise";
import {
  DatabaseConfig,
  TableColumn,
  ColumnDefinition,
  QueryResult,
  ServerResponse,
} from "../types";

export class DBConnector {
  private config: DatabaseConfig;
  private connection: mysql.Connection | null = null;
  public isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port || 3306,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
      });

      this.isConnected = true;
      console.log("MySQL connected successfully");
      return true;
    } catch (error: any) {
      console.error("MySQL connection failed:", error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.isConnected = false;
      console.log("MySQL disconnected");
    }
  }

  async query(
    sql: string,
    params: any[] = []
  ): Promise<{ rows: any; fields: any }> {
    if (!this.isConnected || !this.connection) {
      throw new Error("Database not connected");
    }

    try {
      // Use query() for statements without parameters or with backtick identifiers
      // Use execute() only for parameterized queries with ? placeholders
      if (params.length === 0) {
        const [rows, fields] = await this.connection.query(sql);
        return { rows, fields };
      } else {
        const [rows, fields] = await this.connection.execute(sql, params);
        return { rows, fields };
      }
    } catch (error: any) {
      console.error("Query execution failed:", error.message);
      throw error;
    }
  }

  async getTables(): Promise<string[]> {
    const result = await this.query("SHOW TABLES");
    return result.rows.map((row: any) => Object.values(row)[0] as string);
  }

  async getTableSchema(tableName: string): Promise<TableColumn[]> {
    // Escape table name to prevent SQL injection
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const result = await this.query(`DESCRIBE \`${escapedTableName}\``);
    return result.rows;
  }

  async getTableData(
    tableName: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    // Escape table name to prevent SQL injection
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");

    // Build the query with direct values instead of prepared statements for LIMIT/OFFSET
    const sql = `SELECT * FROM \`${escapedTableName}\` LIMIT ${parseInt(
      String(limit)
    )} OFFSET ${parseInt(String(offset))}`;
    const result = await this.query(sql);
    return result.rows;
  }

  async executeQuery(sql: string): Promise<QueryResult> {
    const result = await this.query(sql);

    // Handle different types of queries
    if (result.fields && result.fields.length > 0) {
      // SELECT queries with fields
      return {
        rows: result.rows,
        fields: result.fields.map((field: any) => ({
          name: field.name,
          type: field.type,
        })),
      };
    } else {
      // INSERT, UPDATE, DELETE, etc. without fields
      return {
        rows: result.rows,
        fields: [],
        affectedRows: result.rows.affectedRows || 0,
        insertId: result.rows.insertId || null,
        message: this.getQueryResultMessage(sql, result.rows),
      };
    }
  }

  private getQueryResultMessage(sql: string, rows: any): string {
    const sqlUpper = sql.trim().toUpperCase();

    if (sqlUpper.startsWith("INSERT")) {
      return `Inserted ${rows.affectedRows || 0} row(s). Insert ID: ${
        rows.insertId || "N/A"
      }`;
    } else if (sqlUpper.startsWith("UPDATE")) {
      return `Updated ${rows.affectedRows || 0} row(s). Changed: ${
        rows.changedRows || 0
      }`;
    } else if (sqlUpper.startsWith("DELETE")) {
      return `Deleted ${rows.affectedRows || 0} row(s)`;
    } else if (sqlUpper.startsWith("CREATE")) {
      return `Table created successfully`;
    } else if (sqlUpper.startsWith("DROP")) {
      return `Table dropped successfully`;
    } else if (sqlUpper.startsWith("ALTER")) {
      return `Table altered successfully`;
    } else {
      return `Query executed successfully. Affected rows: ${
        rows.affectedRows || 0
      }`;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.query("SELECT 1");
      return true;
    } catch (error) {
      return false;
    }
  }

  getConnectionInfo(): DatabaseConfig & { isConnected: boolean } {
    return {
      host: this.config.host,
      port: this.config.port || 3306,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      isConnected: this.isConnected,
    };
  }

  async insertRow(
    tableName: string,
    data: Record<string, any>
  ): Promise<ServerResponse> {
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");

    // Get table schema to check for auto_increment columns
    const schema = await this.getTableSchema(tableName);
    const autoIncrementCol = schema.find((col) =>
      col.Extra.includes("auto_increment")
    );

    // Filter out empty auto_increment fields
    const filteredData = { ...data };
    if (
      autoIncrementCol &&
      (filteredData[autoIncrementCol.Field] === "" ||
        filteredData[autoIncrementCol.Field] === null ||
        filteredData[autoIncrementCol.Field] === undefined)
    ) {
      delete filteredData[autoIncrementCol.Field];
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = fields.map(() => "?").join(",");

    if (fields.length === 0) {
      // If no fields to insert (all were auto_increment), use DEFAULT VALUES
      const sql = `INSERT INTO \`${escapedTableName}\` () VALUES ()`;
      const result = await this.query(sql);
      return {
        insertId: result.rows.insertId,
        affectedRows: result.rows.affectedRows,
      };
    }

    const sql = `INSERT INTO \`${escapedTableName}\` (\`${fields.join(
      "`, `"
    )}\`) VALUES (${placeholders})`;
    const result = await this.query(sql, values);

    return {
      insertId: result.rows.insertId,
      affectedRows: result.rows.affectedRows,
    };
  }

  async updateRow(
    tableName: string,
    data: Record<string, any>,
    where: Record<string, any>
  ): Promise<ServerResponse> {
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const setFields = Object.keys(data)
      .map((field) => `\`${field}\` = ?`)
      .join(", ");
    const whereFields = Object.keys(where)
      .map((field) => `\`${field}\` = ?`)
      .join(" AND ");

    const setValues = Object.values(data);
    const whereValues = Object.values(where);

    const sql = `UPDATE \`${escapedTableName}\` SET ${setFields} WHERE ${whereFields}`;
    const result = await this.query(sql, [...setValues, ...whereValues]);

    return {
      affectedRows: result.rows.affectedRows,
      changedRows: result.rows.changedRows,
    };
  }

  async deleteRow(
    tableName: string,
    where: Record<string, any>
  ): Promise<ServerResponse> {
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const whereFields = Object.keys(where)
      .map((field) => `\`${field}\` = ?`)
      .join(" AND ");
    const whereValues = Object.values(where);

    const sql = `DELETE FROM \`${escapedTableName}\` WHERE ${whereFields}`;
    const result = await this.query(sql, whereValues);

    return {
      affectedRows: result.rows.affectedRows,
    };
  }

  async createTable(
    tableName: string,
    columns: ColumnDefinition[]
  ): Promise<ServerResponse> {
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const columnDefinitions = columns
      .map(
        (col) =>
          `\`${col.name}\` ${col.type}${col.primary ? " PRIMARY KEY" : ""}${
            col.autoIncrement ? " AUTO_INCREMENT" : ""
          }${col.notNull ? " NOT NULL" : ""}`
      )
      .join(", ");

    const sql = `CREATE TABLE \`${escapedTableName}\` (${columnDefinitions})`;
    const result = await this.query(sql);

    return {
      affectedRows: result.rows.affectedRows,
    };
  }

  async dropTable(tableName: string): Promise<ServerResponse> {
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const sql = `DROP TABLE \`${escapedTableName}\``;
    const result = await this.query(sql);

    return {
      affectedRows: result.rows.affectedRows,
    };
  }

  async addColumn(
    tableName: string,
    columnDefinition: ColumnDefinition
  ): Promise<ServerResponse> {
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const { name, type, notNull, defaultValue, after } = columnDefinition;

    let sql = `ALTER TABLE \`${escapedTableName}\` ADD COLUMN \`${name}\` ${type}`;

    if (notNull) {
      sql += " NOT NULL";
    }

    if (defaultValue !== undefined && defaultValue !== null) {
      sql += ` DEFAULT '${defaultValue}'`;
    }

    if (after) {
      sql += ` AFTER \`${after}\``;
    }

    const result = await this.query(sql);
    return {
      affectedRows: result.rows.affectedRows,
    };
  }

  async dropColumn(
    tableName: string,
    columnName: string
  ): Promise<ServerResponse> {
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const escapedColumnName = columnName.replace(/[^a-zA-Z0-9_]/g, "");
    const sql = `ALTER TABLE \`${escapedTableName}\` DROP COLUMN \`${escapedColumnName}\``;
    const result = await this.query(sql);

    return {
      affectedRows: result.rows.affectedRows,
    };
  }

  async modifyColumn(
    tableName: string,
    columnName: string,
    columnDefinition: Partial<ColumnDefinition>
  ): Promise<ServerResponse> {
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const escapedColumnName = columnName.replace(/[^a-zA-Z0-9_]/g, "");
    const { type, notNull, defaultValue } = columnDefinition;

    let sql = `ALTER TABLE \`${escapedTableName}\` MODIFY COLUMN \`${escapedColumnName}\` ${type}`;

    if (notNull) {
      sql += " NOT NULL";
    }

    if (defaultValue !== undefined && defaultValue !== null) {
      sql += ` DEFAULT '${defaultValue}'`;
    }

    const result = await this.query(sql);
    return {
      affectedRows: result.rows.affectedRows,
    };
  }

  async renameColumn(
    tableName: string,
    oldColumnName: string,
    newColumnName: string,
    columnDefinition: Partial<ColumnDefinition>
  ): Promise<ServerResponse> {
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const escapedOldName = oldColumnName.replace(/[^a-zA-Z0-9_]/g, "");
    const escapedNewName = newColumnName.replace(/[^a-zA-Z0-9_]/g, "");
    const { type, notNull, defaultValue } = columnDefinition;

    let sql = `ALTER TABLE \`${escapedTableName}\` CHANGE COLUMN \`${escapedOldName}\` \`${escapedNewName}\` ${type}`;

    if (notNull) {
      sql += " NOT NULL";
    }

    if (defaultValue !== undefined && defaultValue !== null) {
      sql += ` DEFAULT '${defaultValue}'`;
    }

    const result = await this.query(sql);
    return {
      affectedRows: result.rows.affectedRows,
    };
  }

  async getColumnInfo(tableName: string): Promise<TableColumn[]> {
    const escapedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const sql = `SHOW FULL COLUMNS FROM \`${escapedTableName}\``;
    const result = await this.query(sql);

    return result.rows.map((col: any) => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default,
      Extra: col.Extra,
      Comment: col.Comment || "",
    }));
  }
}

export default DBConnector;
