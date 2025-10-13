/**
 * Welford's Online Algorithm for Incremental Statistics
 * 
 * Computes mean and variance incrementally without storing all values.
 * Perfect for tracking duration statistics with minimal memory footprint.
 * 
 * Reference: https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm
 */

export interface WelfordStats {
  count: number;
  mean: number | null;
  m2: number | null;      // Sum of squared differences from mean
  variance: number | null;
  stddev: number | null;
  min: number | null;
  max: number | null;
}

export interface WelfordUpdateInput {
  count: number;
  mean: number | null;
  m2: number | null;
  min: number | null;
  max: number | null;
  newValue: number;
}

/**
 * Update Welford statistics with a new value
 * 
 * @param input - Current statistics and new value
 * @returns Updated statistics
 */
export function updateWelfordStats(input: WelfordUpdateInput): WelfordStats {
  const { count, mean: currentMean, m2: currentM2, min: currentMin, max: currentMax, newValue } = input;

  const newCount = count + 1;
  const delta = newValue - (currentMean || 0);
  const newMean = (currentMean || 0) + delta / newCount;
  const delta2 = newValue - newMean;
  const newM2 = (currentM2 || 0) + delta * delta2;

  const newMin = currentMin === null ? newValue : Math.min(currentMin, newValue);
  const newMax = currentMax === null ? newValue : Math.max(currentMax, newValue);

  // Calculate variance and standard deviation
  // Variance = m2 / count (population variance)
  // For sample variance, use: m2 / (count - 1)
  const variance = newCount > 1 ? newM2 / newCount : null;
  const stddev = variance !== null ? Math.sqrt(variance) : null;

  return {
    count: newCount,
    mean: newMean,
    m2: newM2,
    variance,
    stddev,
    min: newMin,
    max: newMax,
  };
}

/**
 * Get statistics from stored values
 */
export function getWelfordStats(count: number, mean: number | null, m2: number | null, min: number | null, max: number | null): WelfordStats {
  const variance = count > 1 && m2 !== null ? m2 / count : null;
  const stddev = variance !== null ? Math.sqrt(variance) : null;

  return {
    count,
    mean,
    m2,
    variance,
    stddev,
    min,
    max,
  };
}

/**
 * Calculate z-score for a value given mean and standard deviation
 * 
 * Z-score indicates how many standard deviations away from the mean a value is.
 * |z| > 3 is typically considered an outlier.
 * 
 * @param value - The value to test
 * @param mean - Mean of the distribution
 * @param stddev - Standard deviation
 * @returns Z-score, or null if stddev is 0
 */
export function calculateZScore(value: number, mean: number, stddev: number): number | null {
  if (stddev === 0 || isNaN(stddev)) {
    return null;
  }
  return (value - mean) / stddev;
}

/**
 * Check if a value is an outlier based on z-score
 * 
 * @param value - Value to check
 * @param mean - Mean of distribution
 * @param stddev - Standard deviation
 * @param threshold - Z-score threshold (default 3.0)
 * @returns True if value is an outlier
 */
export function isOutlier(value: number, mean: number, stddev: number, threshold: number = 3.0): boolean {
  const zScore = calculateZScore(value, mean, stddev);
  if (zScore === null) return false;
  return Math.abs(zScore) > threshold;
}

/**
 * Calculate median from a sorted array of numbers
 * 
 * @param values - Sorted array of numbers
 * @returns Median value
 */
export function calculateMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    // Even number of values: average of two middle values
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    // Odd number of values: middle value
    return sorted[mid];
  }
}

/**
 * Calculate percentile from sorted array
 * 
 * @param values - Sorted array of numbers
 * @param percentile - Percentile to calculate (0-100)
 * @returns Percentile value
 */
export function calculatePercentile(values: number[], percentile: number): number | null {
  if (values.length === 0) return null;
  if (percentile < 0 || percentile > 100) throw new Error('Percentile must be between 0 and 100');
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) {
    return sorted[lower];
  }
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}





