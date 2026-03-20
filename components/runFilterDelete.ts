/*
 * @Description: 按筛选条件查询列表并删除所有匹配行（独立浏览器会话）
 * @Author: mahao
 * @Date: 2026-03-20
 */
import { chromium, Page } from 'playwright';

export interface FilterDeletePayload {
	filters: { label: string; value: string }[];
	location: string;
	menuName: string;
}

async function navigateLoginAndMenu(page: Page, location: string, menuName: string): Promise<void> {
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

/** 在列表页筛选区按 label 定位表单项，根据 DOM 判断 input / select 并写入 value */
async function fillFilterField(page: Page, label: string, value: string): Promise<void> {
	const item = page.locator(`.el-form-item:has-text("${label}")`).first();
	await item.waitFor({ state: 'visible', timeout: 8000 });

	const selectRoot = item.locator('.el-select').first();
	if ((await selectRoot.count()) > 0) {
		await selectRoot.click();
		await page.waitForTimeout(300);
		const options = page.locator('.el-select-dropdown__item:visible');
		const n = await options.count();
		const target = String(value).trim();
		let picked = false;
		for (let i = 0; i < n; i++) {
			const text = (await options.nth(i).innerText()).trim();
			if (text === target || text.includes(target)) {
				await options.nth(i).click();
				console.log(`筛选字段 ${label} 选择: ${text}`);
				picked = true;
				break;
			}
		}
		if (!picked && n > 0) {
			const idx = Math.floor(Math.random() * n);
			const text = (await options.nth(idx).innerText()).trim();
			await options.nth(idx).click();
			console.log(`筛选字段 ${label} 无匹配，随机选: ${text}`);
		}
		return;
	}

	const input = item.locator('.el-input__inner, input').first();
	await input.fill(String(value));
	console.log(`筛选字段 ${label} 已输入: ${value}`);
}

async function clickQuery(page: Page): Promise<void> {
	const btn = page
		.locator('button.el-button:has-text("查询"), button.el-button:has-text("搜索")')
		.first();
	await btn.waitFor({ state: 'visible', timeout: 8000 });
	await btn.click();
	console.log('🔍 已点击查询');
	await page.waitForTimeout(800);
}

async function confirmDeleteDialog(page: Page): Promise<void> {
	const msgOk = page.locator('.el-message-box__btns button.el-button--primary').first();
	try {
		await msgOk.waitFor({ state: 'visible', timeout: 2500 });
		await msgOk.click();
		return;
	} catch {
		/* try popconfirm */
	}
	const popOk = page.locator('.el-popconfirm .el-button--primary').first();
	await popOk.waitFor({ state: 'visible', timeout: 2500 });
	await popOk.click();
}

/** 反复删除表格第一行，直到当前表格无数据行 */
async function deleteAllVisibleRows(page: Page): Promise<void> {
	const maxOps = 500;
	for (let k = 0; k < maxOps; k++) {
		const rows = page.locator('.el-table__body-wrapper tbody tr.el-table__row');
		const count = await rows.count();
		if (count === 0) {
			console.log('✅ 当前列表已无可删除行');
			return;
		}

		const firstRow = rows.first();
		const delBtn = firstRow
			.locator('button:has-text("删除"), .el-button:has-text("删除"), a:has-text("删除")')
			.first();
		if ((await delBtn.count()) === 0) {
			console.log('⚠️ 表格无「删除」按钮（空数据或列结构不同），停止');
			return;
		}
		await delBtn.waitFor({ state: 'visible', timeout: 5000 });
		await delBtn.click();
		await confirmDeleteDialog(page);
		await page.waitForTimeout(600);
		console.log(`🗑️ 已删除 1 条（本轮剩余约 ${count - 1} 行）`);
	}
	throw new Error('删除次数超过安全上限，请检查页面或选择器');
}

/**
 * 打开浏览器 → 登录 → 进菜单 → 填筛选条件 → 查询 → 删除表格中所有行
 */
export async function runFilterDelete(payload: FilterDeletePayload): Promise<void> {
	const { filters, location, menuName } = payload;
	if (!Array.isArray(filters) || filters.length === 0 || !location || !menuName) {
		throw new Error('runFilterDelete 需要 filters（非空数组）、location、menuName');
	}

	const browser = await chromium.launch({
		headless: false,
		slowMo: 500,
	});

	try {
		const context = await browser.newContext();
		const page = await context.newPage();

		try {
			await navigateLoginAndMenu(page, location, menuName);
			for (const { label, value } of filters) {
				await fillFilterField(page, label, value);
			}
			await clickQuery(page);
			await deleteAllVisibleRows(page);
			console.log('✅ 筛选并删除流程结束');
		} catch (error) {
			console.error('❌ 筛选删除失败:', error);
			await page.pause();
			throw error;
		}
	} finally {
		await browser.close();
	}
}
