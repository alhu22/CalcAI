import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Replace with your desired port
    host: true, // Allow access from other devices on the network
  },
});
