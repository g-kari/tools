import { Hono } from 'hono';

const app = new Hono();

// 将来のAPI拡張用
// 静的ファイルはWorkers Static Assetsで配信（無料）

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

export default app;
