import {defineConfig} from 'vite';

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: ['src/label-videos-with-cloud-video-ai.html'],
    },
  },
});
