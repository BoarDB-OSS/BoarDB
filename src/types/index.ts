export interface BoarDBConfig {
  port?: number;
  host?: string;
}

export interface DatabaseConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
}

export interface ApiMetric {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  success: boolean;
  requestBody?: any;
  headers?: any;
}

export interface MetricsSummary {
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  successRate: number;
}

export interface EndpointMetric {
  method: string;
  path: string;
  count: number;
  successCount: number;
  failedCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
}

export interface TableColumn {
  Field: string;
  Type: string;
  Null: "YES" | "NO";
  Key: string;
  Default: string | null;
  Extra: string;
  Comment?: string;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  primary?: boolean;
  autoIncrement?: boolean;
  notNull?: boolean;
  defaultValue?: string | null;
  after?: string;
}

export interface QueryResult {
  rows: any[];
  fields: QueryField[];
  affectedRows?: number;
  insertId?: number | null;
  message?: string;
}

export interface QueryField {
  name: string;
  type: number;
}

export interface ApiWrapperOptions {
  excludePaths?: string[];
  includeBody?: boolean;
  includeHeaders?: boolean;
}

export interface DatabaseResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ServerResponse {
  affectedRows: number;
  insertId?: number;
  changedRows?: number;
}

// Express Request/Response extensions
export interface BoarDBRequest extends Request {
  boaredb?: {
    startTime: number;
  };
}
