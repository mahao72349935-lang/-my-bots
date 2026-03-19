/*
 * @Description: 根据 receivedData.json 自动打开页面并填充表单
 * @Author: mahao
 * @Date: 2026-03-19
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { chromium } from 'playwright';
import { fillForm } from './Form';

export interface ReceivedData {
	formFields: Array<{ name: string; type: string; placeholder?: string; label: string }>;
	location: string;
	menuName: string;
	mockData: Record<string, string | number>;
}

/**
 * 根据 receivedData 启动浏览器，定位页面并自动填充表单
 * @param data 可选，若传入则使用入参；否则从 data/receivedData.json 读取
 */
export async function runAutoFill(data?: ReceivedData): Promise<void> {
	const resolvedData: ReceivedData = data ?? JSON.parse(readFileSync(join(__dirname, '..', 'data', 'receivedData.json'), 'utf-8'));
	const { location, menuName, formFields, mockData } = resolvedData;

	if (!mockData || Object.keys(mockData).length === 0) {
		throw new Error('mockData 为空，无法填充表单');
	}

	const browser = await chromium.launch({
		headless: false,
		slowMo: 500,
	});

	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		// 1. 根据 location 进入目标页面
		await page.goto(location);
		console.log('🚀 已进入页面:', location);

		// 2. 如有登录按钮则点击
		const loginButton = page.locator('button.el-button:has-text("登"), button.el-button:has-text("登录")').first();
		try {
			await loginButton.waitFor({ state: 'visible', timeout: 3000 });
			await loginButton.click();
			console.log('🔐 已点击登录');
			await page.waitForTimeout(1500);
		} catch {
			// 无登录按钮则跳过
		}

		// 3. 根据 menuName 点击对应菜单（若当前页未包含目标菜单则尝试点击）
		try {
			const menuItem = page.locator(`.el-menu-item:has-text("${menuName}")`).first();
			await menuItem.waitFor({ state: 'visible', timeout: 3000 });
			await menuItem.click();
			console.log('📋 已点击菜单:', menuName);
			await page.waitForTimeout(800);
		} catch {
			// 可能已在目标页，跳过
		}

		// 4. 点击新增按钮
		const addButton = page.locator('button.el-button:has-text("新"), button.el-button:has-text("新增")').first();
		await addButton.waitFor({ state: 'visible', timeout: 5000 });
		await addButton.click();
		console.log('➕ 已点击新增');

		// 5. 等待弹窗出现
		const dialog = page.locator('.el-dialog').last();
		await dialog.waitFor({ state: 'visible', timeout: 5000 });

		// 6. 使用 fillForm 填充表单
		await fillForm(page, dialog, formFields, mockData);
		console.log('📝 表单已填充');

		// 7. 点击确定
		const confirmBtn = dialog.locator('button.el-button--primary:has-text("确"), .el-dialog__footer button:has-text("确定")').first();
		await confirmBtn.click();

		await dialog.waitFor({ state: 'hidden', timeout: 5000 });
		console.log('✅ 表单提交成功');
	} catch (error) {
		console.error('❌ 自动填充失败:', error);
		await page.pause();
		throw error;
	}
}
