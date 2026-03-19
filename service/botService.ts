/*
 * @Description:
 * @Author: mahao
 * @Date: 2026-03-19 16:59:26
 * @LastEditors: mahao
 * @LastEditTime: 2026-03-19 16:59:33
 */
// server.js
const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();

// 必须开启 CORS，否则 Chrome 插件的 fetch 请求会被拦截
app.use(cors());
// 允许解析 JSON 格式的请求体
app.use(express.json());

// 定义一个接收插件数据的 POST 接口
app.post('/api/run-playwright', async (req, res) => {
	const mockData = req.body;
	console.log('📥 收到插件发来的测试数据:', mockData);

	let browser;
	try {
		// 1. 启动浏览器 (headless: false 让你能亲眼看着它操作)
		browser = await chromium.launch({ headless: false, slowMo: 50 });
		const page = await browser.newPage();

		console.log('🚀 正在打开设备管理页面...');
		// 2. 访问你的本地项目页面
		await page.goto('http://localhost:5173/deviceManagement');

		// 3. 点击“新增”按钮 (Playwright 会智能等待按钮出现)
		// 注意：这里的选择器 ('text="新增"') 可能需要根据你实际的 DOM 结构调整
		await page.click('button:has-text("新增")');

		// 4. 填充表单数据
		console.log('✍️ 正在自动填写表单...');

		// 假设你的设备名称输入框有一个特定的 placeholder 或 id，这里以 placeholder 为例
		await page.fill('input[placeholder="请输入设备名称"]', mockData.stationName);

		// 处理“设备分类”只能选“数采仪”的下拉框逻辑 (针对 Vue/ElementPlus 等组件)
		await page.click('input[placeholder="请选择设备分类"]'); // 点击展开下拉框
		await page.click('li:has-text("数采仪")'); // 点击对应选项

		// 填入经纬度等其他信息
		await page.fill('input[placeholder="请输入经度"]', mockData.lon.toString());
		await page.fill('input[placeholder="请输入纬度"]', mockData.lat.toString());
		await page.fill('input[placeholder="请输入详细地址"]', mockData.address);

		// 5. 点击提交/保存
		await page.click('button:has-text("确定")'); // 或者 "保存"

		console.log('✅ Playwright 自动化填表执行完毕！');

		// 延迟几秒让你看清结果再关浏览器
		await page.waitForTimeout(3000);
		await browser.close();

		// 给插件返回成功响应
		res.json({ success: true, message: '自动化填表成功！' });
	} catch (error) {
		console.error('❌ Playwright 执行过程中出错:', error);
		if (browser) await browser.close();
		res.status(500).json({ success: false, message: error.message });
	}
});

// 启动服务，监听 3000 端口
const PORT = 3000;
app.listen(PORT, () => {
	console.log(`✨ 本地自动化服务已启动: http://localhost:${PORT}`);
	console.log(`等待 Chrome 插件发送 POST 请求到 /api/run-playwright ...`);
});
