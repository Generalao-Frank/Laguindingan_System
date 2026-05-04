import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Add this to handle MP4 video files
  assetsInclude: ['**/*.mp4'],
  // Optional: Configure server for better video loading
  server: {
    fs: {
      strict: false,
    },
    // Optional: Increase timeout for large video files
    warmup: {
      clientFiles: ['./src/assets/**/*.mp4'],
    },
  },
  // Optimize video files in build
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(1);
          if (/mp4|webm|ogg/.test(extType)) {
            return `assets/videos/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
})