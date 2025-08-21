import { ApiMetric, MetricsSummary, EndpointMetric } from "../types";

/**
 * Collects and manages API metrics
 * Provides methods for tracking, summarizing, and analyzing API performance
 */
export class MetricsCollector {
  private metrics: ApiMetric[] = [];
  private maxEntries: number;
  private summary: Omit<MetricsSummary, "successRate"> = {
    totalRequests: 0,
    successRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
  };

  constructor(maxEntries: number = 1000) {
    this.maxEntries = Math.max(100, maxEntries); // Minimum 100 entries
  }

  /**
   * Add a new API metric
   */
  add(metric: ApiMetric): void {
    this.metrics.unshift(metric);

    // Keep only the most recent entries
    if (this.metrics.length > this.maxEntries) {
      const removed = this.metrics.splice(this.maxEntries);
      // Recalculate summary without removed entries
      this.recalculateSummary();
    } else {
      this.updateSummary(metric);
    }
  }

  /**
   * Update summary with new metric
   */
  private updateSummary(metric: ApiMetric): void {
    this.summary.totalRequests++;

    if (metric.success) {
      this.summary.successRequests++;
    } else {
      this.summary.failedRequests++;
    }

    // Calculate rolling average
    const totalResponseTime = this.metrics.reduce(
      (sum, m) => sum + m.responseTime,
      0
    );
    this.summary.averageResponseTime = Math.round(
      totalResponseTime / this.metrics.length
    );
  }

  /**
   * Recalculate summary from all current metrics
   */
  private recalculateSummary(): void {
    this.summary = {
      totalRequests: this.metrics.length,
      successRequests: this.metrics.filter((m) => m.success).length,
      failedRequests: this.metrics.filter((m) => !m.success).length,
      averageResponseTime:
        this.metrics.length > 0
          ? Math.round(
              this.metrics.reduce((sum, m) => sum + m.responseTime, 0) /
                this.metrics.length
            )
          : 0,
    };
  }

  getAll(): ApiMetric[] {
    return this.metrics;
  }

  getSummary(): MetricsSummary {
    return {
      ...this.summary,
      successRate:
        this.summary.totalRequests > 0
          ? Math.round(
              (this.summary.successRequests / this.summary.totalRequests) * 100
            )
          : 0,
    };
  }

  /**
   * Get metrics grouped by endpoint
   */
  getByEndpoint(): EndpointMetric[] {
    const endpoints = new Map<string, EndpointMetric>();

    this.metrics.forEach((metric) => {
      const key = `${metric.method} ${metric.path}`;

      if (!endpoints.has(key)) {
        endpoints.set(key, {
          method: metric.method,
          path: metric.path,
          count: 0,
          successCount: 0,
          failedCount: 0,
          totalResponseTime: 0,
          averageResponseTime: 0,
        });
      }

      const endpoint = endpoints.get(key)!;
      endpoint.count++;
      endpoint.totalResponseTime += metric.responseTime;
      endpoint.averageResponseTime = Math.round(
        endpoint.totalResponseTime / endpoint.count
      );

      if (metric.success) {
        endpoint.successCount++;
      } else {
        endpoint.failedCount++;
      }
    });

    return Array.from(endpoints.values()).sort((a, b) => b.count - a.count); // Sort by request count descending
  }

  getRecent(limit: number = 10): ApiMetric[] {
    return this.metrics.slice(0, limit);
  }

  /**
   * Clear all metrics and reset summary
   */
  clear(): void {
    this.metrics = [];
    this.summary = {
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * Get metrics count
   */
  getCount(): number {
    return this.metrics.length;
  }

  /**
   * Get metrics within time range
   */
  getByTimeRange(startTime: number, endTime: number): ApiMetric[] {
    return this.metrics.filter(
      (metric) => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }
}

export default MetricsCollector;
