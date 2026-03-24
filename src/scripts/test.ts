/*
 * @Description: 站点设备管理流程
 * @Author: mahao
 * @Date: 2026-03-12 14:53:44
 * @LastEditors: mahao
 * @LastEditTime: 2026-03-12 17:19:33
 */
import { chromium } from '@playwright/test';

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

		await page.locator('.el-menu-item:has-text("设备管理")').click();

		// 获取表格中 mn码是 MN194209的数据 然后点击这条的更换站点按钮
		const mn194209 = page.locator('tr', { hasText: 'MN1773304839710' }).locator('button:has-text("更换站点")').first();
		await mn194209.waitFor({ state: 'visible', timeout: 5000 });
		await mn194209.click();
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

		console.log('🎉 更换站点成功！');
	} catch (error) {
		console.error('❌ 脚本运行出错:', error);
		// 报错时保持浏览器不关闭，让你看清楚卡在哪里
		await page.pause();
	}
}

run();
