// Test stand-in for next/headers. Route handlers read the session cookie
// from here; tests set it with `signIn()` in ./db.ts.
const store = globalThis as unknown as { __testSessionToken?: string };

export function setSessionToken(token: string | undefined) {
  store.__testSessionToken = token;
}

export async function cookies() {
  return {
    get(name: string) {
      return store.__testSessionToken ? { name, value: store.__testSessionToken } : undefined;
    },
  };
}
