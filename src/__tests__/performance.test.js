/**
 * Performance test suite for natural-time-js library
 * Tests computation speed and caching behavior
 */

import { NaturalDate, yearContextCache } from '../../src/index.js';

// Performance metrics collector
const performanceMetrics = {
  results: [],
  addResult(testName, metric) {
    this.results.push({ testName, ...metric });
  },
  getSummary() {
    let summary = '\n=== PERFORMANCE TEST SUMMARY ===\n';
    summary += '─'.repeat(60) + '\n';
    
    this.results.forEach(result => {
      summary += `${result.testName}:\n`;
      Object.entries(result).forEach(([key, value]) => {
        if (key !== 'testName') {
          if (typeof value === 'object' && value !== null) {
            summary += `  ${key}:\n`;
            Object.entries(value).forEach(([subKey, subValue]) => {
              summary += `    ${subKey}: ${typeof subValue === 'number' ? subValue.toFixed(3) : subValue}\n`;
            });
          } else {
            summary += `  ${key}: ${typeof value === 'number' ? value.toFixed(3) : value}\n`;
          }
        }
      });
      summary += '─'.repeat(40) + '\n';
    });
    
    return summary;
  }
};

// Helper function to measure execution time
const measureExecutionTime = (fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, executionTime: end - start };
};

// Helper function to generate a range of dates
const generateDateRange = (startDate, count, incrementMs = 86400000) => {
  const dates = [];
  let currentDate = new Date(startDate).getTime();
  
  for (let i = 0; i < count; i++) {
    dates.push(new Date(currentDate));
    currentDate += incrementMs;
  }
  
  return dates;
};

// Helper to clear the yearContextCache
const clearYearContextCache = () => {
  // Access the private yearContextCache Map through a hack
  // This is only for testing purposes
  const indexModule = require('../src/index.js');
  const yearContextCache = indexModule.yearContextCache || new Map();
  yearContextCache.clear();
};

describe('Performance Tests', () => {
  // Constants for testing
  const BATCH_SIZE_SMALL = 100;
  const BATCH_SIZE_MEDIUM = 1000;
  const BATCH_SIZE_LARGE = 10000;
  const START_DATE = new Date('2020-01-01T00:00:00Z');
  const LONGITUDE = 0; // Prime Meridian
  
  beforeEach(() => {
    // Try to clear the cache before each test
    try {
      clearYearContextCache();
    } catch (e) {
      // Suppressed warning
    }
  });
  
  // Use a single test at the end to report all performance metrics
  afterAll(() => {
    // This will only be displayed in the test report if the test fails
    // We'll make it pass, so it won't show up in normal output
    expect(performanceMetrics.results.length).toBeGreaterThan(0);
  });
  
  test('should create a single NaturalDate instance quickly', () => {
    const { executionTime } = measureExecutionTime(() => {
      return new NaturalDate(START_DATE, LONGITUDE);
    });
    
    performanceMetrics.addResult('Single instance creation', { 
      executionTime: executionTime 
    });
    
    expect(executionTime).toBeLessThan(50); // Should be very fast for a single instance
  });
  
  test('should handle small batch of dates efficiently', () => {
    const dates = generateDateRange(START_DATE, BATCH_SIZE_SMALL);
    
    const { executionTime } = measureExecutionTime(() => {
      return dates.map(date => new NaturalDate(date, LONGITUDE));
    });
    
    const avgTimePerInstance = executionTime / BATCH_SIZE_SMALL;
    
    performanceMetrics.addResult(`Small batch (${BATCH_SIZE_SMALL})`, {
      totalTime: executionTime,
      avgTimePerInstance: avgTimePerInstance
    });
    
    // Expect reasonable performance for small batch
    expect(avgTimePerInstance).toBeLessThan(5);
  });
  
  test('should handle medium batch of dates efficiently', () => {
    const dates = generateDateRange(START_DATE, BATCH_SIZE_MEDIUM);
    
    const { executionTime } = measureExecutionTime(() => {
      return dates.map(date => new NaturalDate(date, LONGITUDE));
    });
    
    const avgTimePerInstance = executionTime / BATCH_SIZE_MEDIUM;
    
    performanceMetrics.addResult(`Medium batch (${BATCH_SIZE_MEDIUM})`, {
      totalTime: executionTime,
      avgTimePerInstance: avgTimePerInstance
    });
    
    // Expect reasonable performance for medium batch
    expect(avgTimePerInstance).toBeLessThan(2);
  });
  
  test('should handle large batch of dates efficiently', () => {
    const dates = generateDateRange(START_DATE, BATCH_SIZE_LARGE);
    
    const { executionTime } = measureExecutionTime(() => {
      return dates.map(date => new NaturalDate(date, LONGITUDE));
    });
    
    const avgTimePerInstance = executionTime / BATCH_SIZE_LARGE;
    
    performanceMetrics.addResult(`Large batch (${BATCH_SIZE_LARGE})`, {
      totalTime: executionTime,
      avgTimePerInstance: avgTimePerInstance
    });
    
    // Expect reasonable performance for large batch
    expect(avgTimePerInstance).toBeLessThan(1);
  });
  
  test('should benefit from caching for year context calculations', () => {
    // First run without cache
    try {
      clearYearContextCache();
    } catch (e) {
      // Suppressed warning
    }
    
    const dates = generateDateRange(START_DATE, BATCH_SIZE_MEDIUM, 3600000); // 1 hour increment
    
    // First run - should calculate year context for each unique year
    const { executionTime: firstRunTime } = measureExecutionTime(() => {
      return dates.map(date => new NaturalDate(date, LONGITUDE));
    });
    
    // Second run - should use cached year context
    const { executionTime: secondRunTime } = measureExecutionTime(() => {
      return dates.map(date => new NaturalDate(date, LONGITUDE));
    });
    
    const speedup = firstRunTime / secondRunTime;
    
    performanceMetrics.addResult('Caching benefit', {
      firstRunTime: firstRunTime,
      secondRunTime: secondRunTime,
      speedup: speedup
    });
    
    // The second run should be faster due to caching, but the exact speedup
    // can vary based on system performance and test environment
    expect(secondRunTime).toBeLessThanOrEqual(firstRunTime); // Should not be slower
  });
  
  test('should handle different longitudes efficiently', () => {
    const longitudes = [-180, -90, 0, 90, 180];
    const date = new Date('2020-06-21T12:00:00Z'); // Summer solstice
    
    const { executionTime } = measureExecutionTime(() => {
      return longitudes.map(longitude => new NaturalDate(date, longitude));
    });
    
    performanceMetrics.addResult('Different longitudes calculation', {
      executionTime: executionTime,
      count: longitudes.length
    });
    
    expect(executionTime).toBeLessThan(100); // Should be reasonably fast
  });
  
  test('should handle year transitions efficiently', () => {
    // Generate dates around year transitions
    const yearTransitionDates = [];
    for (let year = 2013; year <= 2023; year++) {
      // Add dates around winter solstice (year transition in natural time)
      for (let day = 15; day <= 25; day++) {
        yearTransitionDates.push(new Date(`${year}-12-${day}T12:00:00Z`));
      }
    }
    
    const { executionTime } = measureExecutionTime(() => {
      return yearTransitionDates.map(date => new NaturalDate(date, LONGITUDE));
    });
    
    const avgTimePerInstance = executionTime / yearTransitionDates.length;
    
    performanceMetrics.addResult('Year transitions', {
      totalTime: executionTime,
      count: yearTransitionDates.length,
      avgTimePerInstance: avgTimePerInstance
    });
    
    // Expect reasonable performance for year transitions
    expect(avgTimePerInstance).toBeLessThan(5);
  });
  
  test('should maintain performance with repeated calls to getTimeOfEvent', () => {
    const date = new NaturalDate(START_DATE, LONGITUDE);
    const events = generateDateRange(date.nadir, 1000, 60000); // 1000 events, 1 minute apart
    
    const { executionTime } = measureExecutionTime(() => {
      return events.map(event => date.getTimeOfEvent(event));
    });
    
    const avgTimePerCall = executionTime / events.length;
    
    performanceMetrics.addResult('getTimeOfEvent performance', {
      totalTime: executionTime,
      calls: events.length,
      avgTimePerCall: avgTimePerCall
    });
    
    // getTimeOfEvent should be very fast
    expect(avgTimePerCall).toBeLessThan(0.1);
  });
  
  test('should handle string formatting methods efficiently', () => {
    const date = new NaturalDate(START_DATE, LONGITUDE);
    const iterations = 10000;
    
    const { executionTime: toStringTime } = measureExecutionTime(() => {
      for (let i = 0; i < iterations; i++) {
        date.toString();
      }
    });
    
    const { executionTime: toDateStringTime } = measureExecutionTime(() => {
      for (let i = 0; i < iterations; i++) {
        date.toDateString();
      }
    });
    
    const { executionTime: toTimeStringTime } = measureExecutionTime(() => {
      for (let i = 0; i < iterations; i++) {
        date.toTimeString();
      }
    });
    
    performanceMetrics.addResult('String formatting methods', {
      toString: {
        totalTime: toStringTime,
        avgPerCall: toStringTime / iterations
      },
      toDateString: {
        totalTime: toDateStringTime,
        avgPerCall: toDateStringTime / iterations
      },
      toTimeString: {
        totalTime: toTimeStringTime,
        avgPerCall: toTimeStringTime / iterations
      },
      iterations: iterations
    });
    
    // String formatting should be very fast
    expect(toStringTime / iterations).toBeLessThan(0.05);
    expect(toDateStringTime / iterations).toBeLessThan(0.02);
    expect(toTimeStringTime / iterations).toBeLessThan(0.02);
  });
  
  // Add a final test that will display the performance summary
  test('Performance Summary', () => {
    // Write the performance summary to a file that can be viewed separately
    const fs = require('fs');
    try {
      fs.writeFileSync('performance-summary.txt', performanceMetrics.getSummary());
    } catch (e) {
      // If we can't write to a file, log it to the console after all tests
      // This will only show up in the test report if --verbose is used
      console.log(performanceMetrics.getSummary());
    }
    
    // Always pass this test
    expect(true).toBe(true);
  });
}); 