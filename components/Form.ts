/*
 * @Description:
 * @Author: mahao
 * @Date: 2026-03-12 15:00:58
 * @LastEditors: mahao
 * @LastEditTime: 2026-03-12 16:13:18
 */
import { Page, Locator } from '@playwright/test';

export interface FieldConfig {
	name: string;
	type: string;
	placeholder?: string;
	label: string;
}

/**
 * 自动填写表单组件
 * @param page Playwright Page 对象
 * @param dialog 弹窗 Locator 对象
 * @param fieldConfigs 表单字段配置
 * @param data 要填写的假数据
 */
export async function fillForm(page: Page, dialog: Locator, fieldConfigs: FieldConfig[], data: any) {
	for (const field of fieldConfigs) {
		const value = data[field.name];
		if (value === undefined || value === null) continue;

		// 时间选择器
		if (field.type === 'date') {
			await page.locator('.el-dialog .el-form-item__label').getByText(field.label).click();
			const dateStr = String(value);
			await page.locator(`.el-form-item:has-text("${field.label}") input`).fill(dateStr);
			await page.keyboard.press('Enter');
			continue;
		}

		if (field.type === 'input') {
			await dialog.locator(`.el-form-item:has-text("${field.label}") input`).first().fill(String(value));
		} else if (field.type === 'textarea') {
			await dialog.locator(`.el-form-item:has-text("${field.label}") textarea`).first().fill(String(value));
		} else if (field.type === 'select') {
			// 下拉：假数据与真实选项往往对不上，在可见项中随机选一项
			await dialog.locator(`.el-form-item:has-text("${field.label}") .el-select`).first().click();
			await page.waitForTimeout(300);
			const options = page.locator('.el-select-dropdown__item:visible');
			const count = await options.count();
			if (count > 0) {
				const idx = Math.floor(Math.random() * count);
				const optionText = (await options.nth(idx).innerText()).trim();
				await options.nth(idx).click();
				console.log(`字段 ${field.name} 随机选择 (${idx + 1}/${count}): ${optionText}`);
			} else {
				console.error(`字段 ${field.name} 未能找到下拉选项`);
			}
		}
	}
}
