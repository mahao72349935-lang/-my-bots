import { chromium } from '@playwright/test';
import { fillForm } from './components/Form';

const fakerData = [
	{
		mn: 'MN194208',
		deviceName: 'VOCs在线监测系统',
		password: '123456',
		deviceCategory: 'OTHER',
		overdueTime: '2026-03-11',
		stationId: '2031189145417900033',
	},
	{
		mn: 'MN194209',
		deviceName: '智慧农业环境传感器',
		password: '123456',
		deviceCategory: 'OTHER',
		overdueTime: '2026-03-11',
		stationId: '2031189145417900033',
	},
];

const typeFakerData = [
	{
		name: 'mn',
		type: 'input',
		placeholder: 'MN编码',
		label: 'MN编码',
	},
	{
		name: 'deviceName',
		type: 'input',
		placeholder: '设备名称',
		label: '设备名称',
	},
	{
		name: 'password',
		type: 'input',
		placeholder: '设备密码',
		label: '设备密码',
	},
	{
		name: 'deviceCategory',
		type: 'select',
		placeholder: '设备分类',
		label: '设备分类',
	},
	{
		name: 'overdueTime',
		type: 'date',
		placeholder: '过期时间',
		label: '过期时间',
	},
	{
		name: 'stationId',
		type: 'select',
		placeholder: '所属站点',
		label: '所属站点',
	},
];

async function run() {
	const browser = await chromium.launch({
		headless: false,
		slowMo: 800, // 每个动作停顿 0.8s，方便你观察
	});

	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		await page.goto('http://localhost:5173/siteManage');
		console.log('🚀 已进入页面...');
		const loginButton = page.locator('button.el-button:has-text("登"), button.el-button:has-text("登录")').first();
		await loginButton.waitFor({ state: 'visible', timeout: 5000 });
		await loginButton.click();

		// 点击站点管理
		await page.locator('.el-menu-item:has-text("设备管理")').click();

		for (let i = 0; i < fakerData.length; i++) {
			const data = fakerData[i];
			console.log(`正在处理第 ${i + 1}/${fakerData.length} 条: ${data.mn}`);

			const addButton = page.locator('button.el-button:has-text("新"), button.el-button:has-text("新增")').first();
			await addButton.waitFor({ state: 'visible', timeout: 5000 });
			await addButton.click();

			const dialog = page.locator('.el-dialog').last();
			await dialog.waitFor({ state: 'visible', timeout: 5000 });

			// 使用抽离的表单组件自动填写表单
			await fillForm(page, dialog, typeFakerData, data);

			// --- 改动点 4: 点击“确定”按钮 ---
			// 定位弹窗底部 footer 里的确定按钮
			const confirmBtn = dialog.locator('button.el-button--primary:has-text("确"), .el-dialog__footer button:has-text("确定")').first();
			await confirmBtn.click();

			// 等待弹窗关闭
			await dialog.waitFor({ state: 'hidden', timeout: 5000 });
			console.log(`✅ 第 ${i + 1} 条创建成功`);

			// 稍微缓冲一下，等待列表刷新
			await page.waitForTimeout(500);
		}

		console.log('🎉 所有假数据全部处理完毕！');
	} catch (error) {
		console.error('❌ 脚本运行出错:', error);
		// 报错时保持浏览器不关闭，让你看清楚卡在哪里
		await page.pause();
	}
}

run();
