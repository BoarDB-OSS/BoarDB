import { Request, Response, NextFunction } from "express";
import { MetricsCollector } from "../core/MetricsCollector";
import { ApiWrapperOptions, ApiMetric } from "../types";

/**
 * API monitoring middleware for Express.js
 * Tracks API metrics including response times, status codes, and success rates
 */
export function apiWrapperMiddleware(
  metricsCollector: MetricsCollector,
  options: ApiWrapperOptions = {}
) {
  const {
    excludePaths = ["/health", "/favicon.ico"],
    includeBody = false,
    includeHeaders = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Skip excluded paths
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Override res.send to capture metrics
    res.send = function (data: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const metric: ApiMetric = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        timestamp: startTime,
        ip: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        success: res.statusCode >= 200 && res.statusCode < 400,
      };

      // Optionally include request body
      if (includeBody && req.body) {
        metric.requestBody = req.body;
      }

      // Optionally include request headers
      if (includeHeaders) {
        metric.headers = req.headers;
      }

      metricsCollector.add(metric);
      return originalSend.call(this, data);
    };

    next();
  };
}

export default apiWrapperMiddleware;
