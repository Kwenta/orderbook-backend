import * as path from 'path'
import { Logger } from 'tslog'
import { LOG_COLOURS, LOG_LEVELS } from './constants'

export const ansiColorWrap = (val: string | number, code: keyof typeof LOG_COLOURS) =>
	`\u001b[${LOG_COLOURS[code]}m${val}\u001b[0m`

const root = `${path.join(__dirname, '..').replace(/^[a-zA-Z]:/, '')}\\`

export const logger = new Logger({
	name: 'orderbook       ',
	overwrite: {
		formatMeta: (meta) => {
			if (!meta) return ''
			const { date, logLevelName, path, name } = meta
			const location = (
				path?.fullFilePath ? ` ${path?.fileName}:${path?.fileLine}:${path?.fileColumn}` : ''
			).replace(root, '')

			const level = logLevelName as keyof typeof LOG_LEVELS

			const colour = LOG_LEVELS[level] ?? LOG_LEVELS.INFO
			return `${date.toISOString()} {${name}} ${`[${ansiColorWrap(logLevelName, colour)}]`.padEnd(20, ' ')} ${location.padEnd(50, ' ')} `
		},
	},
})
