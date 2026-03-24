/*
 * @Description:
 * @Author: mahao
 * @Date: 2026-03-12 15:00:58
 * @LastEditors: mahao
 * @LastEditTime: 2026-03-24 09:48:53
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
		// 经度

		if (field.type === 'input') {
			await dialog.locator(`.el-form-item:has-text("${field.label}") input`).first().fill(String(value));
		} else if (field.type === 'textarea') {
			await dialog.locator(`.el-form-item:has-text("${field.label}") textarea`).first().fill(String(value));
		} else if (field.type === 'select') {
			// 下拉选择器：点击展开，优先选择与 data 中值匹配的选项
			await dialog.locator(`.el-form-item:has-text("${field.label}") .el-select`).first().click();
			await page.waitForTimeout(300);
			const options = page.locator('.el-select-dropdown__item:visible:not(.is-disabled)');
			const count = await options.count();
			if (count > 0) {
				const targetValue = String(value).trim();
				let clicked = false;
				for (let i = 0; i < count; i++) {
					const optionText = (await options.nth(i).innerText()).trim();
					if (optionText === targetValue || optionText.includes(targetValue)) {
						await options.nth(i).click();
						console.log(`字段 ${field.name} 选择了: ${optionText}`);
						clicked = true;
						break;
					}
				}
				if (!clicked) {
					// 无匹配：仅一项选第一项，多项则随机
					if (count === 1) {
						await options.nth(0).click();
					} else {
						const idx = Math.floor(Math.random() * count);
						await options.nth(idx).click();
					}
				}
			} else {
				console.error(`字段 ${field.name} 未能找到下拉选项`);
			}
		}
	}
}
