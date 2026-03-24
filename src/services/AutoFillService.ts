/*
 * @Description: 根据入参启动独立浏览器会话并自动填充表单（每次新开浏览器，结束后关闭）
 * @Author: mahao
 * @Date: 2026-03-19
 */
import { chromium } from 'playwright';
import { fillForm } from '../components/FormHandler';
import { navigateLoginAndMenu } from '../utils/navigateLoginAndMenu';

export interface ReceivedData {
	formFields: Array<{ name: string; type: string; placeholder?: string; label: string }>;
	location: string;
	menuName: string;
	/** mockData 为数组，每条对应一次表单填充 */
	mockData: Record<string, string | number>[];
}

/**
 * 使用入参启动全新 Chromium 实例，填表结束后关闭浏览器，保证会话隔离。
 */
export async function runAutoFill(data: ReceivedData): Promise<void> {
	if (!data) {
		throw new Error('runAutoFill 需要传入 data');
	}
	const { location, menuName, formFields, mockData } = data;

	const mockDataList = Array.isArray(mockData) ? mockData : mockData ? [mockData] : [];
	if (mockDataList.length === 0 || mockDataList.every((m) => !m || Object.keys(m).length === 0)) {
		throw new Error('mockData 为空，无法填充表单');
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

			const addButton = page.locator('button.el-button:has-text("新"), button.el-button:has-text("新增")').first();
			await addButton.waitFor({ state: 'visible', timeout: 5000 });

			for (let i = 0; i < mockDataList.length; i++) {
				await addButton.click();
				console.log(`➕ 已点击新增 (${i + 1}/${mockDataList.length})`);

				const dialog = page.locator('.el-dialog').last();
				await dialog.waitFor({ state: 'visible', timeout: 5000 });

				await fillForm(page, dialog, formFields, mockDataList[i]);
				console.log(`📝 表单已填充 (${i + 1}/${mockDataList.length})`);

				const confirmBtn = dialog.locator('button.el-button--primary:has-text("确"), .el-dialog__footer button:has-text("确定")').first();
				await confirmBtn.click();

				await dialog.waitFor({ state: 'hidden', timeout: 5000 });
				if (i < mockDataList.length - 1) await page.waitForTimeout(500);
			}
			console.log('✅ 表单提交成功');
		} catch (error) {
			console.error('❌ 自动填充失败:', error);
			await page.pause();
			throw error;
		}
	} finally {
		await browser.close();
	}
}
