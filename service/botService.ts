/*
 * @Description:
 * @Author: mahao
 * @Date: 2026-03-19 16:59:26
 * @LastEditors: mahao
 * @LastEditTime: 2026-03-20 10:53:47
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
	// 需要生成的测试数据条数，从接口入参获取（插件可传 mockCount: number，默认 1）
	const mockCount = Math.max(1, parseInt(receivedData.mockCount, 10) || 1);

	try {
		// 确保 data 目录存在
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true });
		}
		// 1. 准备要写入的数据（不含 useDeepSeekMock、openNewWindow、mockCount）
		const { useDeepSeekMock: _, openNewWindow: __, mockCount: ___, ...dataToSave } = receivedData;

		// 2. 读取 formFields
		const formFields = dataToSave.formFields || [];

		if (useDeepSeekMock) {
			if (formFields.length === 0) {
				console.log('⚠️ 未找到 formFields，跳过生成模拟数据');
				fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
				return res.json({ success: true, message: '数据已保存，无 formFields', filePath: DATA_FILE });
			}
			// 3. 调用 DeepSeek 生成模拟数据（数组）
			console.log(`🤖 正在调用 DeepSeek 生成 ${mockCount} 条模拟数据...`);
			const mockDataList = await generateMockData(formFields, mockCount);
			const data = { ...dataToSave, mockData: mockDataList };
			fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
			console.log('✅ 模拟数据已生成并写入:', DATA_FILE);
		} else {
			// 不使用 DeepSeek 时，确保 mockData 为数组格式（兼容插件传入的单条对象）
			if (dataToSave.mockData && !Array.isArray(dataToSave.mockData)) {
				dataToSave.mockData = [dataToSave.mockData];
			}
			fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
			console.log('📂 跳过 DeepSeek，已使用 receivedData.json 中已有数据（mockData 已规范为数组）');
		}

		const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

		// 4. 启动浏览器并填充表单（data 已包含正确的 mockData 数组）
		await runAutoFill(data, { openNewWindow });
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
