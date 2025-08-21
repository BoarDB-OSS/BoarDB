import { MetricsCollector } from "./MetricsCollector";
import { DBConnector } from "./DBConnector";
import { FrontendServer } from "../server/frontendServer";
import apiWrapperMiddleware from "../middleware/apiWrapper";
import { BoarDBConfig, DatabaseConfig, ApiWrapperOptions } from "../types";

export class BoarDB {
  public config: BoarDBConfig;
  public metrics: MetricsCollector;
  public dbConnector: DBConnector | null = null;
  public frontendServer: FrontendServer | null = null;
  private isStarted: boolean = false;

  constructor(config: BoarDBConfig = {}) {
    this.config = config;
    this.metrics = new MetricsCollector();
  }

  apiWrapper(options: ApiWrapperOptions = {}) {
    return apiWrapperMiddleware(this.metrics, options);
  }

  async startBoarDB(port: number = 3333): Promise<FrontendServer> {
    if (this.isStarted && this.frontendServer) {
      console.log(`BoarDB is already running on port ${port}`);
      return this.frontendServer;
    }

    this.frontendServer = new FrontendServer(this, port);
    this.isStarted = true;

    await this.frontendServer.start();
    console.log(`🚀 BoarDB started successfully!`);
    console.log(`📊 Access your dashboard at: http://localhost:${port}`);
    return this.frontendServer;
  }

  async connectDB(dbConfig: DatabaseConfig): Promise<DBConnector> {
    this.dbConnector = new DBConnector(dbConfig);
    await this.dbConnector.connect();
    return this.dbConnector;
  }

  getMetrics() {
    return this.metrics.getAll();
  }

  getDBConnector(): DBConnector | null {
    return this.dbConnector;
  }

  stop(): void {
    if (this.frontendServer) {
      this.frontendServer.stop();
      this.isStarted = false;
    }
    if (this.dbConnector) {
      this.dbConnector.disconnect();
    }
  }
}

export default BoarDB;
