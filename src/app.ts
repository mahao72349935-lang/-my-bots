import cors from 'cors';
import express from 'express';
import automationRouter from './routes/automation';

export function createApp() {
	const app = express();
	app.use(cors());
	app.use(express.json());
	app.use('/api', automationRouter);
	return app;
}
