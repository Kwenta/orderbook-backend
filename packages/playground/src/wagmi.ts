import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const config = getDefaultConfig({
	appName: 'Kwenta Orderbook Playground',
	projectId: 'YOUR_PROJECT_ID',
	chains: [base],
	ssr: true,
})
