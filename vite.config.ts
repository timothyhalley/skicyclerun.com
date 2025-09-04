import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./skicyclerun_key.pem'),
      cert: fs.readFileSync('./skicyclerun_cert.pem'),
    },
    host: 'localhost',
    port: 4321,
  },
});