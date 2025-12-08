import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 静音 Dart Sass legacy JS API 弃用警告，避免测试输出噪音
process.env.SASS_SILENCE_DEPRECATIONS = 'legacy-js-api'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
