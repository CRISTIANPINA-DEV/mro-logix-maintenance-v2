// src/lib/pinUtils.ts
export function generatePIN(length = 8): string {
    // Generate a numeric PIN
    return Array.from(
      { length },
      () => Math.floor(Math.random() * 10).toString()
    ).join('');
  }

export function isPinExpired(pinCreatedAt: Date | null): boolean {
  if (!pinCreatedAt) return true;
  
  const now = new Date();
  const expirationTime = new Date(pinCreatedAt);
  // Add 3 minutes to the PIN creation time
  expirationTime.setMinutes(expirationTime.getMinutes() + 3);
  
  // Return true if current time is after expiration time
  return now > expirationTime;
}

export function validatePin(userPin: string, inputPin: string, pinCreatedAt: Date | null): { valid: boolean; reason?: string } {
  if (!pinCreatedAt) {
    return { valid: false, reason: 'PIN not generated' };
  }
  
  if (isPinExpired(pinCreatedAt)) {
    return { valid: false, reason: 'PIN expired' };
  }
  
  if (userPin !== inputPin) {
    return { valid: false, reason: 'Invalid PIN' };
  }
  
  return { valid: true };
}

  