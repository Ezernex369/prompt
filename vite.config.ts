// prompt/vite.config.ts

import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // เพิ่มบรรทัดนี้เข้าไป และแก้ชื่อ "prompt-c3bb8568324f5dd7ca1bf32754d20263d65534f0" 
      // ให้เป็นชื่อ GitHub Repository ของคุณ
      base: '/prompt-c3bb8568324f5dd7ca1bf32754d20263d65534f0/', 
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
