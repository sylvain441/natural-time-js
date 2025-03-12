/**
 * Performance test suite for natural-time-js library
 * Tests computation speed and caching behavior
 */

import { NaturalDate } from '../../src/index';

interface TestResult {
  testName: string;
  executionTime: number;
  operationsPerSecond: number;
  details?: Record<string, number>;
}

class PerformanceResults {
  results: TestResult[] = [];

  addResult(testName: string, metric: { executionTime: number; operationsPerSecond?: number; details?: Record<string, number> }): void {
    const operationsPerSecond = metric.operationsPerSecond ?? (ITERATIONS / metric.executionTime) * 1000;
    this.results.push({ 
      testName, 
      executionTime: metric.executionTime,
      operationsPerSecond,
      details: metric.details
    });
  }

  printSummary(): string {
    let summary = 'Performance Test Results:\n\n';

    for (const result of this.results) {
      summary += `${result.testName}:\n`;
      summary += `  Execution Time: ${result.executionTime.toFixed(2)}ms\n`;
      summary += `  Operations/Second: ${result.operationsPerSecond.toFixed(2)}\n`;
      if (result.details) {
        for (const [key, value] of Object.entries(result.details)) {
          summary += `  ${key}: ${value.toFixed(2)}\n`;
        }
      }
      summary += '\n';
    }

    return summary;
  }
}

// Constants for testing
const LONGITUDE = 0;
const ITERATIONS = 1000;
const performanceResults = new PerformanceResults();

// Helper functions
const measureExecutionTime = (fn: () => void): { executionTime: number; operationsPerSecond: number } => {
  const start = performance.now();
  fn();
  const end = performance.now();
  const executionTime = end - start;
  const operationsPerSecond = (ITERATIONS / executionTime) * 1000;

  return { executionTime, operationsPerSecond };
};

const generateDateRange = (startDate: Date, count: number, incrementMs: number = 86400000): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    dates.push(new Date(currentDate));
    currentDate = new Date(currentDate.getTime() + incrementMs);
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
  const BATCH_SIZE_SMALL = 100;
  const BATCH_SIZE_MEDIUM = 1000;
  const BATCH_SIZE_LARGE = 10000;
  const START_DATE = new Date('2020-01-01T00:00:00Z');
  
  beforeEach(() => {
    performanceResults.results = [];
  });
  
  afterAll(() => {
    // This will only be displayed in the test report if the test fails
    // We'll make it pass, so it won't show up in normal output
    expect(performanceResults.results.length).toBeGreaterThan(0);
  });
  
  describe('1. Instance Creation', () => {
    test('should measure single instance creation time', () => {
      const { executionTime } = measureExecutionTime(() => {
        for (let i = 0; i < ITERATIONS; i++) {
          new NaturalDate(START_DATE, LONGITUDE);
        }
      });
      
      performanceResults.addResult('Single instance creation', { 
        executionTime,
        details: { avgTimePerInstance: executionTime / ITERATIONS }
      });
    });

    test('should measure small batch creation time', () => {
      const dates = generateDateRange(START_DATE, BATCH_SIZE_SMALL);
      
      const { executionTime } = measureExecutionTime(() => {
        dates.forEach(date => new NaturalDate(date, LONGITUDE));
      });
      
      performanceResults.addResult(`Small batch (${BATCH_SIZE_SMALL})`, {
        executionTime,
        details: { avgTimePerInstance: executionTime / BATCH_SIZE_SMALL }
      });
    });

    test('should measure medium batch creation time', () => {
      const dates = generateDateRange(START_DATE, BATCH_SIZE_MEDIUM);
      
      const { executionTime } = measureExecutionTime(() => {
        dates.forEach(date => new NaturalDate(date, LONGITUDE));
      });
      
      performanceResults.addResult(`Medium batch (${BATCH_SIZE_MEDIUM})`, {
        executionTime,
        details: { avgTimePerInstance: executionTime / BATCH_SIZE_MEDIUM }
      });
    });

    test('should measure large batch creation time', () => {
      const dates = generateDateRange(START_DATE, BATCH_SIZE_LARGE);
      
      const { executionTime } = measureExecutionTime(() => {
        dates.forEach(date => new NaturalDate(date, LONGITUDE));
      });
      
      performanceResults.addResult(`Large batch (${BATCH_SIZE_LARGE})`, {
        executionTime,
        details: { avgTimePerInstance: executionTime / BATCH_SIZE_LARGE }
      });
    });
  });

  describe('2. Caching', () => {
    test('should measure caching benefit', () => {
      const dates = generateDateRange(START_DATE, BATCH_SIZE_MEDIUM);
      
      // First run - no cache
      const { executionTime: firstRunTime } = measureExecutionTime(() => {
        dates.forEach(date => new NaturalDate(date, LONGITUDE));
      });
      
      // Second run - with cache
      const { executionTime: secondRunTime } = measureExecutionTime(() => {
        dates.forEach(date => new NaturalDate(date, LONGITUDE));
      });
      
      performanceResults.addResult('Caching benefit', {
        executionTime: firstRunTime,
        details: {
          firstRunTime,
          secondRunTime,
          speedup: firstRunTime / secondRunTime
        }
      });
    });
  });

  describe('3. Location Variations', () => {
    test('should measure performance across different longitudes', () => {
      const longitudes = [-180, -90, 0, 90, 180];
      
      const { executionTime } = measureExecutionTime(() => {
        longitudes.forEach(longitude => {
          new NaturalDate(START_DATE, longitude);
        });
      });
      
      performanceResults.addResult('Different longitudes calculation', {
        executionTime,
        details: {
          count: longitudes.length,
          avgTimePerInstance: executionTime / longitudes.length
        }
      });
    });
  });

  describe('4. Year Transitions', () => {
    test('should measure performance around year transitions', () => {
      const yearTransitionDates: Date[] = [];
      const baseDate = new Date('2020-12-21T00:00:00Z'); // Around winter solstice
      
      // Add dates around the transition
      for (let i = -5; i <= 5; i++) {
        yearTransitionDates.push(new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000));
      }
      
      const { executionTime } = measureExecutionTime(() => {
        yearTransitionDates.forEach(date => new NaturalDate(date, LONGITUDE));
      });
      
      performanceResults.addResult('Year transitions', {
        executionTime,
        details: {
          count: yearTransitionDates.length,
          avgTimePerInstance: executionTime / yearTransitionDates.length
        }
      });
    });
  });

  describe('5. Event Time Calculations', () => {
    test('should measure getTimeOfEvent performance', () => {
      const date = new NaturalDate(START_DATE, LONGITUDE);
      const events = Array.from({ length: ITERATIONS }, (_, i) => START_DATE.getTime() + i * 3600000);
      
      const { executionTime } = measureExecutionTime(() => {
        events.forEach(timestamp => date.getTimeOfEvent(timestamp));
      });
      
      performanceResults.addResult('getTimeOfEvent performance', {
        executionTime,
        details: {
          calls: events.length,
          avgTimePerCall: executionTime / events.length
        }
      });
    });
  });

  describe('6. String Formatting', () => {
    test('should measure string formatting methods performance', () => {
      const date = new NaturalDate(START_DATE, LONGITUDE);
      
      const { executionTime: toStringTime } = measureExecutionTime(() => {
        for (let i = 0; i < ITERATIONS; i++) date.toString();
      });
      
      const { executionTime: toDateStringTime } = measureExecutionTime(() => {
        for (let i = 0; i < ITERATIONS; i++) date.toDateString();
      });
      
      const { executionTime: toTimeStringTime } = measureExecutionTime(() => {
        for (let i = 0; i < ITERATIONS; i++) date.toTimeString();
      });
      
      performanceResults.addResult('String formatting methods', {
        executionTime: toStringTime + toDateStringTime + toTimeStringTime,
        details: {
          toString: toStringTime,
          toDateString: toDateStringTime,
          toTimeString: toTimeStringTime
        }
      });
    });
  });

  afterAll(() => {
    // Write performance results to a file
    const fs = require('fs');
    try {
      fs.writeFileSync('performance-summary.txt', performanceResults.printSummary());
    } catch (e) {
      // If we can't write to a file, log it to the console after all tests
      // This will only show up in the test report if --verbose is used
      console.log(performanceResults.printSummary());
    }
  });
}); 