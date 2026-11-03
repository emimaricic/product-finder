import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.test before any module initialises so e2e tests never touch the dev DB.
dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true,
});
