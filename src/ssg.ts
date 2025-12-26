import app from './app';
import { toSSG } from 'hono/ssg';
import fs from 'node:fs/promises';

const main = async () => {
  const result = await toSSG(app, fs, { dir: './dist' });
  if (!result.success) {
    console.error('SSG build failed:', result.error);
    process.exit(1);
  }
  console.log('SSG build completed successfully');
  console.log('Generated files:', result.files?.length || 0);
};

main();
