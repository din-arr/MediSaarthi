// Test stand-in for firebase-admin/auth. Tests choose what verifyIdToken returns.
const state = globalThis as unknown as { __firebaseVerify?: (token: string) => Promise<{ phone_number?: string }> };

export function setFirebaseVerify(handler: (token: string) => Promise<{ phone_number?: string }>) {
  state.__firebaseVerify = handler;
}

export function getAuth() {
  return { verifyIdToken: (token: string) => (state.__firebaseVerify ?? (async () => ({})))(token) };
}
