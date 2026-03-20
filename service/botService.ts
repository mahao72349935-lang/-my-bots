/*
 * @Description: 接收插件数据并调用 Playwright 自动填表（不落盘）
 * @Author: mahao
 * @Date: 2026-03-19 16:59:26
 * @LastEditors: mahao
 * @LastEditTime: 2026-03-20 17:27:24
 */
const express = require('express');
const cors = require('cors');
const { runAutoFill } = require('../components/runAutoFill');
const { runFilterDelete } = require('../components/runFilterDelete');

const app = express();
app.use(cors());
app.use(express.json());

function normalizeMockData(raw) {
	if (raw == null) return null;
	return Array.isArray(raw) ? raw : [raw];
}

app.post('/api/run-playwright', async (req, res) => {
	const body = req.body || {};
	const { formFields = [], location, menuName, mockData: rawMock } = body;

	const mockData = normalizeMockData(rawMock);

	if (!location || !menuName) {
		return res.status(400).json({
			success: false,
			message: '缺少 location 或 menuName',
		});
	}
	if (!mockData || mockData.length === 0 || mockData.every((m) => !m || Object.keys(m).length === 0)) {
		return res.status(400).json({
			success: false,
			message: 'mockData 不能为空',
		});
	}

	const payload = { formFields, location, menuName, mockData };
	console.log('📥 收到插件数据:', { location, menuName, rows: mockData.length });

	try {
		res.json({ success: true, message: '自动填充完成' });
		await runAutoFill(payload);
		console.log('🎉 自动填充流程完成');
	} catch (err) {
		console.error('❌ 处理失败:', err);
		res.status(500).json({
			success: false,
			message: err.message || '处理失败',
			error: String(err),
		});
	}
});

app.post('/api/run-delete', async (req, res) => {
	const body = req.body || {};
	const { filters, location, menuName } = body;

	if (!Array.isArray(filters) || filters.length === 0) {
		return res.status(400).json({
			success: false,
			message: '缺少 filters 或 filters 为空数组',
		});
	}
	if (!location || !menuName) {
		return res.status(400).json({
			success: false,
			message: '缺少 location 或 menuName',
		});
	}
	const bad = filters.find((f) => !f || !f.label || f.value === undefined || f.value === null || f.value === '');
	if (bad !== undefined) {
		return res.status(400).json({
			success: false,
			message: 'filters 中每项均需包含 label 与 value',
		});
	}

	const payload = { filters, location, menuName };

	try {
		res.json({ success: true, message: '正在执行删除任务' });
		await runFilterDelete(payload);
		console.log('🎉 删除流程完成');
	} catch (err) {
		console.error('❌ 删除失败:', err);
		res.status(500).json({
			success: false,
			message: err.message || '删除失败',
			error: String(err),
		});
	}
});

const PORT = 3000;
app.listen(PORT, () => {
	console.log(`✨ 本地自动化服务: http://localhost:${PORT}`);
	console.log(`POST /api/run-playwright  |  POST /api/run-delete`);
});
