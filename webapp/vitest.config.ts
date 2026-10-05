/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './testSetup.ts',
        pool: 'threads',
        poolOptions: {
            threads: {
                minThreads: 2,
                maxThreads: 3
            }
        },
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'json', 'html']
        }
    },
    plugins: [react()],
    optimizeDeps: {
        exclude: ['crypto']
    }
});