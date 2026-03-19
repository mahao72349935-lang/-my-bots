/*
 * @Description:
 * @Author: mahao
 * @Date: 2026-03-19 16:59:26
 * @LastEditors: mahao
 * @LastEditTime: 2026-03-19 19:22:41
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { generateMockData } = require('../components/generateMockData');
const { runAutoFill } = require('../components/runAutoFill');

// 数据存储目录
const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'receivedData.json');

const app = express();

// 必须开启 CORS，否则 Chrome 插件的 fetch 请求会被拦截
app.use(cors());
// 允许解析 JSON 格式的请求体
app.use(express.json());

// 定义一个接收插件数据的 POST 接口
app.post('/api/run-playwright', async (req, res) => {
	const receivedData = req.body;
	console.log('📥 收到插件发来的测试数据:', receivedData);

		// 是否使用 DeepSeek 生成模拟数据，从接口入参获取（插件可传 useDeepSeekMock: true/false）
		const useDeepSeekMock = receivedData.useDeepSeekMock === true;
		// 是否新开浏览器窗口，从接口入参获取（插件可传 openNewWindow: true/false，默认 true）
		const openNewWindow = receivedData.openNewWindow !== false;

	try {
		// 确保 data 目录存在
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true });
		}
		// 1. 先写入原始数据（不含 useDeepSeekMock、openNewWindow，避免污染存储）
		const { useDeepSeekMock: _, openNewWindow: __, ...dataToSave } = receivedData;
		fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
		console.log('✅ 原始数据已写入:', DATA_FILE);

		// 2. 读取文件，获取 formFields
		const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
		const data = JSON.parse(fileContent);
		const formFields = data.formFields || [];

		if (useDeepSeekMock) {
			if (formFields.length === 0) {
				console.log('⚠️ 未找到 formFields，跳过生成模拟数据');
				return res.json({ success: true, message: '数据已保存，无 formFields', filePath: DATA_FILE });
			}
			// 3. 调用 DeepSeek 生成模拟数据
			console.log('🤖 正在调用 DeepSeek 生成模拟数据...');
			const mockData = await generateMockData(formFields);
			data.mockData = mockData;
			fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
			console.log('✅ 模拟数据已生成并写入:', DATA_FILE);
		} else {
			console.log('📂 跳过 DeepSeek，将使用 receivedData.json 中已有数据');
		}

		// 4. 启动浏览器并填充表单：使用 DeepSeek 时传入 data，否则 runAutoFill 从文件读取
		await runAutoFill(useDeepSeekMock ? data : undefined, { openNewWindow });
		res.json({ success: true, message: useDeepSeekMock ? '数据已保存，模拟数据已生成，自动填充完成' : '数据已保存，自动填充完成', filePath: DATA_FILE });
		console.log('🎉 自动填充流程完成');
	} catch (err) {
		console.error('❌ 处理失败:', err);
		res.status(500).json({ success: false, message: err.message || '处理失败', error: String(err) });
	}
});

// 启动服务，监听 3000 端口
const PORT = 3000;
app.listen(PORT, () => {
	console.log(`✨ 本地自动化服务已启动: http://localhost:${PORT}`);
	console.log(`等待 Chrome 插件发送 POST 请求到 /api/run-playwright ...`);
});
