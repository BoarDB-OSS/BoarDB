import express, { Request, Response, Application } from "express";
import { Server } from "http";
import * as path from "path";
import cors from "cors";
import compression from "compression";
import { BoarDB } from "../core/BoarDB";

export class FrontendServer {
  private boarDB: BoarDB;
  private port: number;
  private app: Application;
  private server: Server | null = null;

  constructor(boarDB: BoarDB, port: number = 3333) {
    this.boarDB = boarDB;
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Metrics endpoints
    this.app.get("/api/metrics/summary", (req: Request, res: Response) => {
      res.json(this.boarDB.metrics.getSummary());
    });

    this.app.get("/api/metrics/endpoints", (req: Request, res: Response) => {
      res.json(this.boarDB.metrics.getByEndpoint());
    });

    this.app.get("/api/metrics/recent", (req: Request, res: Response) => {
      const limit = parseInt(req.query.limit as string) || 10;
      res.json(this.boarDB.metrics.getRecent(limit));
    });

    this.app.get("/api/metrics/all", (req: Request, res: Response) => {
      res.json(this.boarDB.metrics.getAll());
    });

    // Database connection
    this.app.post("/api/db/connect", async (req: Request, res: Response) => {
      try {
        const { host, port, user, password, database } = req.body;

        if (!host || !user || !password || !database) {
          return res.status(400).json({
            success: false,
            message: "Missing required database connection parameters",
          });
        }

        await this.boarDB.connectDB({ host, port, user, password, database });
        res.json({ success: true, message: "Database connected successfully" });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          message: "Database connection failed: " + error.message,
        });
      }
    });

    this.app.get("/api/db/status", (req: Request, res: Response) => {
      if (!this.boarDB.dbConnector) {
        return res.json({ connected: false });
      }
      res.json({
        connected: this.boarDB.dbConnector.isConnected,
        info: this.boarDB.dbConnector.getConnectionInfo(),
      });
    });

    // Table operations
    this.app.get("/api/db/tables", async (req: Request, res: Response) => {
      try {
        if (!this.boarDB.dbConnector || !this.boarDB.dbConnector.isConnected) {
          return res
            .status(400)
            .json({ success: false, message: "Database not connected" });
        }

        const tables = await this.boarDB.dbConnector.getTables();
        res.json({ success: true, tables });
      } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    this.app.get(
      "/api/db/table/:tableName/schema",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const schema = await this.boarDB.dbConnector.getTableSchema(
            req.params.tableName
          );
          res.json({ success: true, schema });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    this.app.get(
      "/api/db/table/:tableName/data",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const limit = parseInt(req.query.limit as string) || 100;
          const offset = parseInt(req.query.offset as string) || 0;
          const data = await this.boarDB.dbConnector.getTableData(
            req.params.tableName,
            limit,
            offset
          );
          res.json({ success: true, data });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    this.app.post("/api/db/query", async (req: Request, res: Response) => {
      try {
        if (!this.boarDB.dbConnector || !this.boarDB.dbConnector.isConnected) {
          return res
            .status(400)
            .json({ success: false, message: "Database not connected" });
        }

        const { sql } = req.body;
        if (!sql) {
          return res
            .status(400)
            .json({ success: false, message: "SQL query is required" });
        }

        const result = await this.boarDB.dbConnector.executeQuery(sql);
        res.json({ success: true, result });
      } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Row operations
    this.app.post(
      "/api/db/table/:tableName/row",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const { data } = req.body;
          if (!data || typeof data !== "object") {
            return res
              .status(400)
              .json({ success: false, message: "Row data is required" });
          }

          const result = await this.boarDB.dbConnector.insertRow(
            req.params.tableName,
            data
          );
          res.json({ success: true, result });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    this.app.put(
      "/api/db/table/:tableName/row",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const { data, where } = req.body;
          if (
            !data ||
            typeof data !== "object" ||
            !where ||
            typeof where !== "object"
          ) {
            return res.status(400).json({
              success: false,
              message: "Row data and where condition are required",
            });
          }

          const result = await this.boarDB.dbConnector.updateRow(
            req.params.tableName,
            data,
            where
          );
          res.json({ success: true, result });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    this.app.delete(
      "/api/db/table/:tableName/row",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const { where } = req.body;
          if (!where || typeof where !== "object") {
            return res
              .status(400)
              .json({ success: false, message: "Where condition is required" });
          }

          const result = await this.boarDB.dbConnector.deleteRow(
            req.params.tableName,
            where
          );
          res.json({ success: true, result });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    // Table management
    this.app.post("/api/db/table", async (req: Request, res: Response) => {
      try {
        if (!this.boarDB.dbConnector || !this.boarDB.dbConnector.isConnected) {
          return res
            .status(400)
            .json({ success: false, message: "Database not connected" });
        }

        const { tableName, columns } = req.body;
        if (!tableName || !columns || !Array.isArray(columns)) {
          return res.status(400).json({
            success: false,
            message: "Table name and columns are required",
          });
        }

        const result = await this.boarDB.dbConnector.createTable(
          tableName,
          columns
        );
        res.json({ success: true, result });
      } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    this.app.delete(
      "/api/db/table/:tableName",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const result = await this.boarDB.dbConnector.dropTable(
            req.params.tableName
          );
          res.json({ success: true, result });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    // Column operations
    this.app.get(
      "/api/db/table/:tableName/columns",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const columns = await this.boarDB.dbConnector.getColumnInfo(
            req.params.tableName
          );
          res.json({ success: true, columns });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    this.app.post(
      "/api/db/table/:tableName/column",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const { columnDefinition } = req.body;
          if (
            !columnDefinition ||
            !columnDefinition.name ||
            !columnDefinition.type
          ) {
            return res.status(400).json({
              success: false,
              message: "Column name and type are required",
            });
          }

          const result = await this.boarDB.dbConnector.addColumn(
            req.params.tableName,
            columnDefinition
          );
          res.json({ success: true, result });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    this.app.delete(
      "/api/db/table/:tableName/column/:columnName",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const result = await this.boarDB.dbConnector.dropColumn(
            req.params.tableName,
            req.params.columnName
          );
          res.json({ success: true, result });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    this.app.put(
      "/api/db/table/:tableName/column/:columnName",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const { columnDefinition } = req.body;
          if (!columnDefinition || !columnDefinition.type) {
            return res
              .status(400)
              .json({ success: false, message: "Column type is required" });
          }

          const result = await this.boarDB.dbConnector.modifyColumn(
            req.params.tableName,
            req.params.columnName,
            columnDefinition
          );
          res.json({ success: true, result });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    this.app.patch(
      "/api/db/table/:tableName/column/:columnName",
      async (req: Request, res: Response) => {
        try {
          if (
            !this.boarDB.dbConnector ||
            !this.boarDB.dbConnector.isConnected
          ) {
            return res
              .status(400)
              .json({ success: false, message: "Database not connected" });
          }

          const { newColumnName, columnDefinition } = req.body;
          if (!newColumnName || !columnDefinition || !columnDefinition.type) {
            return res.status(400).json({
              success: false,
              message: "New column name and type are required",
            });
          }

          const result = await this.boarDB.dbConnector.renameColumn(
            req.params.tableName,
            req.params.columnName,
            newColumnName,
            columnDefinition
          );
          res.json({ success: true, result });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    );

    // Static files
    this.app.use(express.static(path.join(__dirname, "../../frontend")));

    this.app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "../../frontend/index.html"));
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

export default FrontendServer;
