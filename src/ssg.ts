import app from './app';
import { toSSG } from 'hono/ssg';
import fs from 'node:fs/promises';

toSSG(app, fs, { dir: './dist' });
