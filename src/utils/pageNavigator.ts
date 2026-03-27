/*
 * @Description: 页面导航公共工具 —— 进入目标页、处理登录入口、点击菜单
 * @Author: mahao
 * @Date: 2026-03-27
 */
import { Page } from 'playwright';

/**
 * 导航到指定地址，填写用户名/密码后点击登录按钮（如存在），再定位并点击目标菜单项。
 * 三个步骤均为「尽力而为」：若元素不存在则静默跳过，不抛出异常。
 */
export async function navigateLoginAndMenu(
	page: Page,
	location: string,
	menuName: string,
	username: string,
	password: string,
): Promise<void> {
	await page.goto(location);
	console.log('🚀 已进入页面:', location);

	const loginButton = page.locator('button.el-button:has-text("登"), button.el-button:has-text("登录")').first();
	try {
		await loginButton.waitFor({ state: 'visible', timeout: 3000 });

		// 填写用户名和密码
		const usernameInput = page.locator('input[placeholder="请输入用户名"]').first();
		const passwordInput = page.locator('input[placeholder="请输入密码"]').first();
		await usernameInput.fill(username);
		await passwordInput.fill(password);
		console.log('📝 已填写用户名和密码');

		await loginButton.click();
		console.log('🔐 已点击登录');
		await page.waitForTimeout(1500);
	} catch {
		// 无登录入口则跳过
	}

	try {
		const menuItem = page.locator(`.el-menu-item:has-text("${menuName}")`).first();
		await menuItem.waitFor({ state: 'visible', timeout: 3000 });
		await menuItem.click();
		console.log('📋 已点击菜单:', menuName);
		await page.waitForTimeout(800);
	} catch {
		// 可能已在目标页，跳过
	}
}
