import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	sourcemap: true,
	clean: true,
	format: ['cjs', 'esm'],
	onSuccess:
		'dts-bundle-generator src/index.ts --out-file dist/index.d.ts --no-check && cp dist/index.d.ts dist/index.d.mts',
})
