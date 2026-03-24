/*
 * @Description: 站点设备管理流程
 * @Author: mahao
 * @Date: 2026-03-12 14:53:44
 * @LastEditors: mahao
 * @LastEditTime: 2026-03-12 16:40:04
 */
import { chromium } from '@playwright/test';
import { fillForm } from '../components/FormHandler';
import { deviceFakerData, deviceTypeFakerData, siteFakerData, siteTypeFakerData } from '../fixtures';

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
		await page.locator('.el-menu-item:has-text("站点管理")').click();

		for (let i = 0; i < siteFakerData.length; i++) {
			const data = siteFakerData[i];
			console.log(`正在处理第 ${i + 1}/${siteFakerData.length} 条: ${data.stationName}`);
			const addButton = page.locator('button.el-button:has-text("新"), button.el-button:has-text("新增")').first();
			await addButton.waitFor({ state: 'visible', timeout: 5000 });
			await addButton.click();

			const dialog = page.locator('.el-dialog').last();
			await dialog.waitFor({ state: 'visible', timeout: 5000 });

			await fillForm(page, dialog, siteTypeFakerData, data);

			const confirmBtn = dialog.locator('button.el-button--primary:has-text("确"), .el-dialog__footer button:has-text("确定")').first();
			await confirmBtn.click();

			// 等待弹窗关闭
			await dialog.waitFor({ state: 'hidden', timeout: 5000 });
			console.log(`✅ 第 ${i + 1} 条创建成功`);

			// 稍微缓冲一下，等待列表刷新
			await page.waitForTimeout(500);
		}

		// 点击设备管理
		await page.locator('.el-menu-item:has-text("设备管理")').click();

		for (let i = 0; i < deviceFakerData.length; i++) {
			const data = deviceFakerData[i];
			console.log(`正在处理第 ${i + 1}/${deviceFakerData.length} 条: ${data.mn}`);

			const addButton = page.locator('button.el-button:has-text("新"), button.el-button:has-text("新增")').first();
			await addButton.waitFor({ state: 'visible', timeout: 5000 });
			await addButton.click();

			const dialog = page.locator('.el-dialog').last();
			await dialog.waitFor({ state: 'visible', timeout: 5000 });

			// 使用抽离的表单组件自动填写表单
			await fillForm(page, dialog, deviceTypeFakerData, data);

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

		// 获取到宽窄巷子空气监测

		// 获取到宽窄巷子空气监测
		const data = page.locator('tr', { hasText: 'MN1773304839709' }).locator('button:has-text("更换站点")').first();

		await data.waitFor({ state: 'visible', timeout: 5000 });
		await data.click();

		const dialog = page.locator('.el-dialog').last();
		await dialog.waitFor({ state: 'visible', timeout: 5000 });
		await page.locator('.el-dialog .el-form-item__label').getByText('所属站点').click();
		const options = page.locator('.el-select-dropdown__item:visible');
		const count = await options.count();
		if (count > 0) {
			const randomIndex = Math.floor(Math.random() * count);
			const selectedText = await options.nth(randomIndex).innerText();
			console.log(`所属站点 随机选择了第 ${randomIndex + 1} 个选项: ${selectedText}`);
			await options.nth(randomIndex).click();
		} else {
			console.error(`所属站点 未能找到下拉选项，请检查下拉框是否成功展开`);
		}
		// 点击当条数据 更换站点
		const confirmBtn = dialog.locator('button.el-button--primary:has-text("确"), .el-dialog__footer button:has-text("确定")').first();
		await confirmBtn.click();
		await dialog.waitFor({ state: 'hidden', timeout: 500 });
		console.log('🎉 所有假数据全部处理完毕！');
	} catch (error) {
		console.error('❌ 脚本运行出错:', error);
		// 报错时保持浏览器不关闭，让你看清楚卡在哪里
		await page.pause();
	}
}

run();
