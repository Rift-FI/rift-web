/**
 * Transaction Lock Utility
 * Prevents duplicate transactions by storing recent transaction data in localStorage
 * and comparing against new transactions within a 1-minute window.
 */

const LOCK_KEY = "rift_transaction_lock";
const LOCK_DURATION_MS = 60 * 1000; // 1 minute

export interface TransactionLockData {
  type: "withdraw" | "send" | "pay" | "airtime" | "offramp";
  amount: number;
  recipient: string;
  currency: string;
  timestamp: number;
}

/**
 * Get the current transaction lock from localStorage
 */
export function getTransactionLock(): TransactionLockData | null {
  try {
    const lockData = localStorage.getItem(LOCK_KEY);
    if (!lockData) return null;
    
    const parsed: TransactionLockData = JSON.parse(lockData);
    
    // Check if lock has expired
    const now = Date.now();
    if (now - parsed.timestamp > LOCK_DURATION_MS) {
      // Lock expired, clear it
      clearTransactionLock();
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error("Error reading transaction lock:", error);
    return null;
  }
}

/**
 * Set a new transaction lock
 */
export function setTransactionLock(data: Omit<TransactionLockData, "timestamp">): void {
  try {
    const lockData: TransactionLockData = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCK_KEY, JSON.stringify(lockData));
    console.log("🔒 Transaction lock set:", lockData);
  } catch (error) {
    console.error("Error setting transaction lock:", error);
  }
}

/**
 * Clear the transaction lock
 */
export function clearTransactionLock(): void {
  try {
    localStorage.removeItem(LOCK_KEY);
    console.log("🔓 Transaction lock cleared");
  } catch (error) {
    console.error("Error clearing transaction lock:", error);
  }
}

/**
 * Check if a transaction is a duplicate (same amount, recipient, and type within 1 minute)
 * Returns the remaining seconds to wait if duplicate, or 0 if not a duplicate
 */
export function isDuplicateTransaction(
  type: TransactionLockData["type"],
  amount: number,
  recipient: string,
  currency: string
): { isDuplicate: boolean; remainingSeconds: number } {
  const existingLock = getTransactionLock();
  
  if (!existingLock) {
    return { isDuplicate: false, remainingSeconds: 0 };
  }
  
  // Normalize recipient for comparison (trim and lowercase)
  const normalizedRecipient = recipient.trim().toLowerCase();
  const normalizedExistingRecipient = existingLock.recipient.trim().toLowerCase();
  
  // Check if it's the same transaction
  const isSameType = existingLock.type === type;
  const isSameAmount = Math.abs(existingLock.amount - amount) < 0.01; // Allow small floating point differences
  const isSameRecipient = normalizedRecipient === normalizedExistingRecipient;
  const isSameCurrency = existingLock.currency === currency;
  
  if (isSameType && isSameAmount && isSameRecipient && isSameCurrency) {
    const elapsed = Date.now() - existingLock.timestamp;
    const remaining = LOCK_DURATION_MS - elapsed;
    const remainingSeconds = Math.ceil(remaining / 1000);
    
    if (remainingSeconds > 0) {
      console.log(`⚠️ Duplicate transaction detected. Wait ${remainingSeconds}s`);
      return { isDuplicate: true, remainingSeconds };
    }
  }
  
  return { isDuplicate: false, remainingSeconds: 0 };
}

/**
 * Helper hook-friendly function to check and set lock
 * Returns error message if duplicate, null if OK to proceed
 */
export function checkAndSetTransactionLock(
  type: TransactionLockData["type"],
  amount: number,
  recipient: string,
  currency: string
): string | null {
  const { isDuplicate, remainingSeconds } = isDuplicateTransaction(
    type,
    amount,
    recipient,
    currency
  );
  
  if (isDuplicate) {
    return `A similar transaction was just submitted. Please wait ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} before trying again.`;
  }
  
  // Set the lock for this transaction
  setTransactionLock({ type, amount, recipient, currency });
  
  return null;
}

