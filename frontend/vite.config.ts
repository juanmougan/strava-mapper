import { defineConfig } from 'vite'

export default defineConfig({
  base: '/strava-mapper/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})