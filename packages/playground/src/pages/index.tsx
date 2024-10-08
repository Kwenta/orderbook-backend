import Playground from '@/components/playground'
import type { NextPage } from 'next'
import Head from 'next/head'

const Home: NextPage = () => {
	return (
		<div>
			<Head>
				<title>RainbowKit App</title>
				<meta content="Generated by @rainbow-me/create-rainbowkit" name="description" />
				<link href="/favicon.ico" rel="icon" />
			</Head>

			<Playground />
		</div>
	)
}

export default Home
