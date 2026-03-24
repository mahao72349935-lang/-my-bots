import type { Page } from 'playwright';

/** 打开地址 → 尝试点登录 → 尝试点侧边菜单（无则静默跳过） */
export async function navigateLoginAndMenu(page: Page, location: string, menuName: string): Promise<void> {
	await page.goto(location);
	console.log('🚀 已进入页面:', location);

	const loginButton = page.locator('button.el-button:has-text("登"), button.el-button:has-text("登录")').first();
	try {
		await loginButton.waitFor({ state: 'visible', timeout: 3000 });
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
		// 可能已在目标页
	}
}
