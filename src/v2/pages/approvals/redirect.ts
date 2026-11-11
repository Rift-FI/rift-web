export const POST_LOGIN_REDIRECT_KEY = "rift_post_login_redirect";

/** Called once the shell mounts after login: resume a pending /approve link (or Yield sign-in). */
export function consumePostLoginRedirect(): string | null {
  try {
    const to = localStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    if (to) localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    return to && (to.startsWith("/approve/") || to === "/app/yield") ? to : null;
  } catch {
    return null;
  }
}
