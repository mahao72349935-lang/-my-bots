import { createApp } from './app';
import { PORT } from './config';

const app = createApp();

app.listen(PORT, () => {
	console.log(`✨ 本地自动化服务: http://localhost:${PORT}`);
	console.log(`POST /api/run-playwright  |  POST /api/run-delete`);
});
