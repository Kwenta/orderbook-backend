import { Worker } from 'node:worker_threads'

export const workers = {
	book: new Worker('./src/db_worker.js', { workerData: { name: 'book' } }),
	misc: new Worker('./src/db_worker.js', { workerData: { name: 'misc' } }),
	nonce: new Worker('./src/db_worker.js', { workerData: { name: 'nonce' } }),
}

const handleLogs = (worker: Worker) => {
	worker.on('message', (message) => {
		const data = JSON.parse(message)
		switch (data.type) {
			case 'log':
				console.log(data.message) // Write it raw, tslog has already made it look nice on the worker thread
				break
		}
	})
}

for (const worker of Object.values(workers)) {
	handleLogs(worker)
}
