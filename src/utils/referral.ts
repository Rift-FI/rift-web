/**
 * Generate a random 6-character alphanumeric referral code
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get the full referral link for a given code.
 *
 * Uses the current window origin so sandbox builds (wallet.sandbox.riftfi.com)
 * produce sandbox referral links instead of pointing users at prod.
 * Falls back to prod host for SSR / non-browser callers.
 */
export function getReferralLink(code: string): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://wallet.riftfi.xyz";
  return `${origin}/auth?referrer=${code}`;
}

