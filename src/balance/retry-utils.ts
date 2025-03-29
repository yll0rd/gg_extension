// src/common/utils/retry.utils.ts
import { Logger } from '@nestjs/common';

const logger = new Logger('RetryUtils');

/**
 * Exponential backoff implementation for retries
 */
export class ExponentialBackoff {
  private attempt = 0;

  constructor(
    private readonly initialDelay: number,
    private readonly multiplier: number = 2,
    private readonly maxDelay: number = 30000,
  ) {}

  /**
   * Get the next delay time in milliseconds
   */
  next(): number {
    const delay = Math.min(
      this.initialDelay * Math.pow(this.multiplier, this.attempt),
      this.maxDelay
    );
    this.attempt++;
    return delay;
  }

  /**
   * Reset the backoff state
   */
  reset(): void {
    this.attempt = 0;
  }
}

/**
 * Error types that should trigger a retry
 */
export const RETRYABLE_ERRORS = [
  'NETWORK_ERROR',
  'TIMEOUT',
  'CONNECTION_REFUSED',
  'NODE_IS_SYNCING',
  'TOO_MANY_REQUESTS',
  'RATE_LIMIT_EXCEEDED',
  'SERVICE_UNAVAILABLE',
];

/**
 * Checks if an error should be retried
 */
export function isRetryableError(error: any): boolean {
  // Check for common network errors
  if (!error) return false;
  
  // Check error message for common network-related issues
  const errorMessage = error.message ? error.message.toLowerCase() : '';
  
  return (
    errorMessage.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('socket hang up') ||
    errorMessage.includes('etimedout') ||
    errorMessage.includes('syncing') ||
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('server error') ||
    (error.code && RETRYABLE_ERRORS.includes(error.code)) ||
    error.status === 429 || // Too Many Requests
    error.status === 503 // Service Unavailable
  );
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn Function to retry that returns a Promise
 * @param maxRetries Maximum number of retry attempts
 * @param backoff Backoff strategy
 * @param retryableErrorCheck Custom function to determine if error is retryable
 * @returns Promise with the result of the function or throws the last error
 */
export async function handleRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoff: ExponentialBackoff = new ExponentialBackoff(1000, 2),
  retryableErrorCheck: (error: any) => boolean = isRetryableError,
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        logger.debug(`Retry attempt ${attempt}/${maxRetries}`);
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If we've exhausted all retries or it's not a retryable error, bail out
      if (attempt >= maxRetries || !retryableErrorCheck(error)) {
        break;
      }
      
      const delay = backoff.next();
      logger.debug(`Retryable error: ${error.message}. Retrying in ${delay}ms...`);
      
      // Wait for the backoff period
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we got here, all retries failed
  throw lastError;
}

/**
 * Helper function to retry a blockchain transaction
 * with specialized handling for transaction failures
 */
export async function retryBlockchainTransaction<T>(
  txFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    multiplier?: number;
    maxDelay?: number;
    onBeforeRetry?: (error: any, attempt: number) => Promise<void>;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    multiplier = 2,
    maxDelay = 10000,
    onBeforeRetry,
  } = options;
  
  // Custom backoff strategy
  const backoff = new ExponentialBackoff(initialDelay, multiplier, maxDelay);
  
  // Custom retry condition for blockchain transactions
  const isBlockchainRetryable = (error: any): boolean => {
    if (!error) return false;
    
    const errorMessage = error.message ? error.message.toLowerCase() : '';
    
    // Handle Starknet-specific retryable errors
    return (
      isRetryableError(error) ||
      errorMessage.includes('nonce') ||
      errorMessage.includes('gas') ||
      errorMessage.includes('pending') ||
      errorMessage.includes('underpriced') ||
      errorMessage.includes('already known') ||
      errorMessage.includes('replacement transaction') ||
      errorMessage.includes('insufficient funds') ||
      errorMessage.includes('not found') ||
      (error.code && error.code === 'TRANSACTION_REPLACED')
    );
  };
  
  let attempt = 0;
  
  return handleRetry(
    async () => {
      if (attempt > 0 && onBeforeRetry) {
        await onBeforeRetry(lastError, attempt);
      }
      attempt++;
      return txFn();
    },
    maxRetries,
    backoff,
    isBlockchainRetryable
  );
}
