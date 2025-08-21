import axios, { AxiosResponse } from "axios";

// ========================================
// Type Definitions
// ========================================

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  primary?: boolean;
  autoIncrement?: boolean;
  notNull?: boolean;
  defaultValue?: string | number | null;
  after?: string;
}

export interface TableColumn {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
  Comment?: string;
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

// ========================================
// API Configuration
// ========================================

export const api = axios.create({
  baseURL: "/api",
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for error handling
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ========================================
// Metrics API
// ========================================

export const metricsAPI = {
  /**
   * Get metrics summary (total requests, success rate, etc.)
   */
  getSummary: (): Promise<AxiosResponse<MetricsSummary>> =>
    api.get("/metrics/summary"),

  /**
   * Get metrics grouped by endpoint
   */
  getEndpoints: (): Promise<AxiosResponse<EndpointMetric[]>> =>
    api.get("/metrics/endpoints"),

  /**
   * Get recent API metrics
   */
  getRecent: (limit: number = 10): Promise<AxiosResponse<ApiMetric[]>> =>
    api.get(`/metrics/recent?limit=${limit}`),

  /**
   * Get all API metrics
   */
  getAll: (): Promise<AxiosResponse<ApiMetric[]>> => api.get("/metrics/all"),
};

// ========================================
// Database API
// ========================================

export const databaseAPI = {
  // Connection Management
  /**
   * Connect to database with provided configuration
   */
  connect: (
    config: DatabaseConfig
  ): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    api.post("/db/connect", config),

  /**
   * Get current database connection status
   */
  getStatus: (): Promise<AxiosResponse<{ connected: boolean; info?: any }>> =>
    api.get("/db/status"),

  // Table Operations
  /**
   * Get list of all tables in the database
   */
  getTables: (): Promise<
    AxiosResponse<{ success: boolean; tables: string[] }>
  > => api.get("/db/tables"),

  /**
   * Get table schema information
   */
  getTableSchema: (
    tableName: string
  ): Promise<AxiosResponse<{ success: boolean; schema: TableColumn[] }>> =>
    api.get(`/db/table/${encodeURIComponent(tableName)}/schema`),

  /**
   * Get table data with pagination
   */
  getTableData: (
    tableName: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AxiosResponse<{ success: boolean; data: any[] }>> =>
    api.get(
      `/db/table/${encodeURIComponent(
        tableName
      )}/data?limit=${limit}&offset=${offset}`
    ),

  // Query Operations
  /**
   * Execute custom SQL query
   */
  executeQuery: (
    sql: string
  ): Promise<AxiosResponse<{ success: boolean; result: any }>> =>
    api.post("/db/query", { sql }),

  // Row Operations
  /**
   * Insert new row into table
   */
  insertRow: (
    tableName: string,
    data: Record<string, any>
  ): Promise<AxiosResponse<{ success: boolean; result: any }>> =>
    api.post(`/db/table/${encodeURIComponent(tableName)}/row`, { data }),

  /**
   * Update existing row in table
   */
  updateRow: (
    tableName: string,
    data: Record<string, any>,
    where: Record<string, any>
  ): Promise<AxiosResponse<{ success: boolean; result: any }>> =>
    api.put(`/db/table/${encodeURIComponent(tableName)}/row`, { data, where }),

  /**
   * Delete row from table
   */
  deleteRow: (
    tableName: string,
    where: Record<string, any>
  ): Promise<AxiosResponse<{ success: boolean; result: any }>> =>
    api.delete(`/db/table/${encodeURIComponent(tableName)}/row`, {
      data: { where },
    }),

  // Table Management
  /**
   * Create new table
   */
  createTable: (
    tableName: string,
    columns: ColumnDefinition[]
  ): Promise<AxiosResponse<{ success: boolean; result: any }>> =>
    api.post("/db/table", { tableName, columns }),

  /**
   * Drop table
   */
  dropTable: (
    tableName: string
  ): Promise<AxiosResponse<{ success: boolean; result: any }>> =>
    api.delete(`/db/table/${encodeURIComponent(tableName)}`),

  // Column Management
  /**
   * Get detailed column information for table
   */
  getColumnInfo: (
    tableName: string
  ): Promise<AxiosResponse<{ success: boolean; columns: TableColumn[] }>> =>
    api.get(`/db/table/${encodeURIComponent(tableName)}/columns`),

  /**
   * Add new column to table
   */
  addColumn: (
    tableName: string,
    columnDefinition: ColumnDefinition
  ): Promise<AxiosResponse<{ success: boolean; result: any }>> =>
    api.post(`/db/table/${encodeURIComponent(tableName)}/column`, {
      columnDefinition,
    }),

  /**
   * Drop column from table
   */
  dropColumn: (
    tableName: string,
    columnName: string
  ): Promise<AxiosResponse<{ success: boolean; result: any }>> =>
    api.delete(
      `/db/table/${encodeURIComponent(tableName)}/column/${encodeURIComponent(
        columnName
      )}`
    ),

  /**
   * Modify existing column
   */
  modifyColumn: (
    tableName: string,
    columnName: string,
    columnDefinition: Partial<ColumnDefinition>
  ): Promise<AxiosResponse<{ success: boolean; result: any }>> =>
    api.put(
      `/db/table/${encodeURIComponent(tableName)}/column/${encodeURIComponent(
        columnName
      )}`,
      { columnDefinition }
    ),

  /**
   * Rename column
   */
  renameColumn: (
    tableName: string,
    columnName: string,
    newColumnName: string,
    columnDefinition: Partial<ColumnDefinition>
  ): Promise<AxiosResponse<{ success: boolean; result: any }>> =>
    api.patch(
      `/db/table/${encodeURIComponent(tableName)}/column/${encodeURIComponent(
        columnName
      )}`,
      { newColumnName, columnDefinition }
    ),
};

// ========================================
// Error Handling Utilities
// ========================================

/**
 * Extract error message from API response
 */
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return "An unknown error occurred";
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

/**
 * Check if error is a timeout error
 */
export const isTimeoutError = (error: any): boolean => {
  return error.code === "ECONNABORTED" || error.message?.includes("timeout");
};
