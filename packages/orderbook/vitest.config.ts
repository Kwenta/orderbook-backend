/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		include: ['tests/**/(*.)test.ts'],
		exclude: [...configDefaults.exclude, '**/sandbox/**', '**/*.case.test.+(ts|tsx|js)'],
		coverage: {
			enabled: true,
			provider: 'v8',
			reportsDirectory: './coverage/raw/default',
			reporter: ['json', 'text', 'html'],
			exclude: [...(configDefaults.coverage.exclude ?? [])],
		},
		pool: 'forks',
	},
})
