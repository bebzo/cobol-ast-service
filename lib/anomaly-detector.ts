/**
 * CodeSwitch v7.0 - Statistical Anomaly Detector
 * 
 * Features:
 * 1. Statistical outlier detection
 * 2. Performance anomaly alerts
 * 3. Code quality trend analysis
 * 4. Real-time monitoring
 */

export interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface AnomalyAlert {
  id: string;
  type: 'outlier' | 'trend' | 'threshold' | 'pattern';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  value: number;
  expectedRange: { min: number; max: number };
  timestamp: number;
  suggestion?: string;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
  significance: number;
  prediction: number;
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  count: number;
}

/**
 * Calculate statistical summary
 */
export function calculateStats(values: number[]): StatisticalSummary {
  if (values.length === 0) {
    return {
      mean: 0, median: 0, stdDev: 0, min: 0, max: 0,
      q1: 0, q3: 0, iqr: 0, count: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 === 0 
    ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
    : sorted[Math.floor(n/2)];
  
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const q1Idx = Math.floor(n * 0.25);
  const q3Idx = Math.floor(n * 0.75);
  const q1 = sorted[q1Idx];
  const q3 = sorted[q3Idx];
  const iqr = q3 - q1;

  return {
    mean: round(mean),
    median: round(median),
    stdDev: round(stdDev),
    min: sorted[0],
    max: sorted[n - 1],
    q1: round(q1),
    q3: round(q3),
    iqr: round(iqr),
    count: n
  };
}

function round(n: number, decimals = 2): number {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliers(
  dataPoints: DataPoint[],
  multiplier = 1.5
): AnomalyAlert[] {
  const values = dataPoints.map(d => d.value);
  const stats = calculateStats(values);
  const alerts: AnomalyAlert[] = [];

  const lowerBound = stats.q1 - multiplier * stats.iqr;
  const upperBound = stats.q3 + multiplier * stats.iqr;

  dataPoints.forEach((point, idx) => {
    if (point.value < lowerBound || point.value > upperBound) {
      const deviation = point.value < lowerBound 
        ? (lowerBound - point.value) / stats.stdDev
        : (point.value - upperBound) / stats.stdDev;

      const severity = deviation > 3 ? 'critical' : deviation > 2 ? 'warning' : 'info';
      
      alerts.push({
        id: `outlier-${idx}-${Date.now()}`,
        type: 'outlier',
        severity,
        message: point.value > upperBound
          ? `Value ${point.value} is ${round(deviation)} standard deviations above normal`
          : `Value ${point.value} is ${round(deviation)} standard deviations below normal`,
        value: point.value,
        expectedRange: { min: round(lowerBound), max: round(upperBound) },
        timestamp: point.timestamp,
        suggestion: generateOutlierSuggestion(point, stats)
      });
    }
  });

  return alerts;
}

/**
 * Detect Z-score anomalies
 */
export function detectZScoreAnomalies(
  dataPoints: DataPoint[],
  threshold = 2.5
): AnomalyAlert[] {
  const values = dataPoints.map(d => d.value);
  const stats = calculateStats(values);
  const alerts: AnomalyAlert[] = [];

  if (stats.stdDev === 0) return alerts;

  dataPoints.forEach((point, idx) => {
    const zScore = Math.abs((point.value - stats.mean) / stats.stdDev);
    
    if (zScore > threshold) {
      const severity = zScore > 4 ? 'critical' : zScore > 3 ? 'warning' : 'info';
      
      alerts.push({
        id: `zscore-${idx}-${Date.now()}`,
        type: 'outlier',
        severity,
        message: `Z-score of ${round(zScore)} detected (threshold: ${threshold})`,
        value: point.value,
        expectedRange: { 
          min: round(stats.mean - threshold * stats.stdDev), 
          max: round(stats.mean + threshold * stats.stdDev) 
        },
        timestamp: point.timestamp,
        suggestion: `Value deviates significantly from mean (${stats.mean}). Investigate for data quality issues.`
      });
    }
  });

  return alerts;
}

/**
 * Detect trend anomalies
 */
export function analyzeTrend(dataPoints: DataPoint[]): TrendAnalysis {
  if (dataPoints.length < 3) {
    return { direction: 'stable', changePercent: 0, significance: 0, prediction: 0 };
  }

  // Simple linear regression
  const n = dataPoints.length;
  const xValues = dataPoints.map((_, i) => i);
  const yValues = dataPoints.map(d => d.value);

  const xMean = (n - 1) / 2;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R-squared for significance
  const predictions = xValues.map(x => slope * x + intercept);
  const ssRes = yValues.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
  const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

  // Determine direction
  const changePercent = yMean !== 0 ? (slope * n / yMean) * 100 : 0;
  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  
  if (Math.abs(changePercent) > 5) {
    direction = slope > 0 ? 'increasing' : 'decreasing';
  }

  // Predict next value
  const prediction = slope * n + intercept;

  return {
    direction,
    changePercent: round(changePercent),
    significance: round(rSquared),
    prediction: round(prediction)
  };
}

/**
 * Detect threshold violations
 */
export function detectThresholdViolations(
  dataPoints: DataPoint[],
  thresholds: { warning: number; critical: number; type: 'upper' | 'lower' | 'both' }
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  dataPoints.forEach((point, idx) => {
    let violation = false;
    let severity: 'info' | 'warning' | 'critical' = 'info';

    if (thresholds.type === 'upper' || thresholds.type === 'both') {
      if (point.value > thresholds.critical) {
        violation = true;
        severity = 'critical';
      } else if (point.value > thresholds.warning) {
        violation = true;
        severity = 'warning';
      }
    }

    if (thresholds.type === 'lower' || thresholds.type === 'both') {
      if (point.value < -thresholds.critical) {
        violation = true;
        severity = 'critical';
      } else if (point.value < -thresholds.warning) {
        violation = true;
        severity = severity === 'critical' ? 'critical' : 'warning';
      }
    }

    if (violation) {
      alerts.push({
        id: `threshold-${idx}-${Date.now()}`,
        type: 'threshold',
        severity,
        message: `Value ${point.value} exceeds ${severity} threshold`,
        value: point.value,
        expectedRange: { min: -thresholds.warning, max: thresholds.warning },
        timestamp: point.timestamp,
        suggestion: `Value exceeded ${severity} threshold. Check for performance issues or data errors.`
      });
    }
  });

  return alerts;
}

/**
 * Generate suggestion for outlier
 */
function generateOutlierSuggestion(point: DataPoint, stats: StatisticalSummary): string {
  const deviation = (point.value - stats.mean) / stats.stdDev;
  
  if (point.label?.includes('time') || point.label?.includes('duration')) {
    if (deviation > 0) {
      return 'Performance degradation detected. Check for resource bottlenecks or inefficient code paths.';
    }
    return 'Unusually fast execution. Verify the measurement is correct and not skipping operations.';
  }
  
  if (point.label?.includes('memory')) {
    if (deviation > 0) {
      return 'Memory spike detected. Check for memory leaks or large allocations.';
    }
    return 'Low memory usage. Verify data is being loaded correctly.';
  }
  
  if (point.label?.includes('error') || point.label?.includes('fail')) {
    return 'Error rate anomaly. Review recent changes and error logs.';
  }
  
  return `Unusual value detected. Expected range: ${round(stats.mean - 2*stats.stdDev)} to ${round(stats.mean + 2*stats.stdDev)}.`;
}

/**
 * Monitor data stream for real-time anomalies
 */
export class RealTimeAnomalyMonitor {
  private buffer: DataPoint[] = [];
  private readonly windowSize: number;
  private readonly alertCallback: (alert: AnomalyAlert) => void;
  private rollingStats: StatisticalSummary | null = null;

  constructor(
    windowSize: number,
    alertCallback: (alert: AnomalyAlert) => void
  ) {
    this.windowSize = windowSize;
    this.alertCallback = alertCallback;
  }

  addDataPoint(point: DataPoint): AnomalyAlert[] {
    this.buffer.push(point);
    
    // Keep buffer within window size
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }

    // Need minimum data for analysis
    if (this.buffer.length < 10) {
      return [];
    }

    // Update rolling stats
    this.rollingStats = calculateStats(this.buffer.map(d => d.value));

    // Check for anomalies
    const alerts: AnomalyAlert[] = [];
    
    // Z-score check on latest point
    const zScore = Math.abs((point.value - this.rollingStats.mean) / this.rollingStats.stdDev);
    if (zScore > 3) {
      const alert: AnomalyAlert = {
        id: `realtime-${Date.now()}`,
        type: 'outlier',
        severity: zScore > 4 ? 'critical' : 'warning',
        message: `Real-time anomaly: Z-score ${round(zScore)}`,
        value: point.value,
        expectedRange: {
          min: round(this.rollingStats.mean - 3 * this.rollingStats.stdDev),
          max: round(this.rollingStats.mean + 3 * this.rollingStats.stdDev)
        },
        timestamp: point.timestamp
      };
      alerts.push(alert);
      this.alertCallback(alert);
    }

    // Trend check
    if (this.buffer.length >= 20) {
      const recentTrend = analyzeTrend(this.buffer.slice(-20));
      if (Math.abs(recentTrend.changePercent) > 50 && recentTrend.significance > 0.7) {
        const alert: AnomalyAlert = {
          id: `trend-${Date.now()}`,
          type: 'trend',
          severity: Math.abs(recentTrend.changePercent) > 100 ? 'critical' : 'warning',
          message: `Significant ${recentTrend.direction} trend detected (${recentTrend.changePercent}%)`,
          value: point.value,
          expectedRange: {
            min: this.rollingStats.q1,
            max: this.rollingStats.q3
          },
          timestamp: point.timestamp,
          suggestion: `Strong ${recentTrend.direction} trend with ${round(recentTrend.significance * 100)}% confidence.`
        };
        alerts.push(alert);
        this.alertCallback(alert);
      }
    }

    return alerts;
  }

  getStats(): StatisticalSummary | null {
    return this.rollingStats;
  }

  getBuffer(): DataPoint[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
    this.rollingStats = null;
  }
}

/**
 * Format anomaly alerts for display
 */
export function formatAnomalyAlerts(alerts: AnomalyAlert[]): string {
  if (alerts.length === 0) {
    return 'No anomalies detected.';
  }

  let output = `## Anomaly Alerts (${alerts.length})\n\n`;
  
  const bySeveity = {
    critical: alerts.filter(a => a.severity === 'critical'),
    warning: alerts.filter(a => a.severity === 'warning'),
    info: alerts.filter(a => a.severity === 'info')
  };

  if (bySeveity.critical.length > 0) {
    output += `### Critical (${bySeveity.critical.length})\n`;
    bySeveity.critical.forEach(a => {
      output += `- **${a.type}**: ${a.message}\n`;
      if (a.suggestion) output += `  - Suggestion: ${a.suggestion}\n`;
    });
    output += '\n';
  }

  if (bySeveity.warning.length > 0) {
    output += `### Warnings (${bySeveity.warning.length})\n`;
    bySeveity.warning.forEach(a => {
      output += `- **${a.type}**: ${a.message}\n`;
    });
    output += '\n';
  }

  if (bySeveity.info.length > 0) {
    output += `### Info (${bySeveity.info.length})\n`;
    bySeveity.info.forEach(a => {
      output += `- ${a.message}\n`;
    });
  }

  return output;
}
