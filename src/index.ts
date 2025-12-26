import { Hono } from 'hono';

const app = new Hono();

// Unicode escape converter functions
function toUnicodeEscape(text: string): string {
  return text
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      if (code > 127) {
        return '\\u' + code.toString(16).padStart(4, '0');
      }
      return char;
    })
    .join('');
}

function fromUnicodeEscape(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });
}

// API Routes
app.post('/api/encode', async (c) => {
  try {
    const { text } = await c.req.json();
    if (typeof text !== 'string') {
      return c.json({ error: 'text must be a string' }, 400);
    }
    const result = toUnicodeEscape(text);
    return c.json({ result });
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

app.post('/api/decode', async (c) => {
  try {
    const { text } = await c.req.json();
    if (typeof text !== 'string') {
      return c.json({ error: 'text must be a string' }, 400);
    }
    const result = fromUnicodeEscape(text);
    return c.json({ result });
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

export default app;
