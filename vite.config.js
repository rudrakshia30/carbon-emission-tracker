import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      all: true,
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/test/**',
        '**/*.test.{js,jsx}',
        'src/components/UI/ErrorBoundary.jsx',
        // App shell & Canvas renderer — integration-tested, not unit-testable
        'src/App.jsx',
        'src/context/AppContext.jsx',
        'src/components/Habitat/HabitatCanvas.jsx',
        'src/components/Habitat/SidebarWidgets.jsx',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 55,
        statements: 60,
      },
    },
  },
})

