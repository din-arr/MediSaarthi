// Test stand-in for firebase-admin/app.
const apps: unknown[] = [];
export const cert = (value: unknown) => value;
export const getApps = () => apps;
export function initializeApp(options: unknown) {
  const app = { options };
  apps.push(app);
  return app;
}
