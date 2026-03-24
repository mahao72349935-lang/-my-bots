import { chromium } from '@playwright/test';

// 1. 模拟数据生成器
const generateRandomData = (i: number) => {
	return {
		mn: `MN${Date.now().toString().slice(-5)}${i}`,
		deviceName: `测试设备${i}`,
		password: `123456`,
		deviceCategory: `OTHER`,
		overdueTime: `2026-03-11`,
		stationId: `2031189145417900033`,
	};
};

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

		for (let i = 1; i <= 10; i++) {
			const data = generateRandomData(i);
			console.log(`正在处理第 ${i}/10 条: ${data.mn}`);

			// --- 改动点 1: 更加稳健的“新增”按钮定位 ---
			// 优先寻找 class 包含 el-button 且文字包含“新”和“增”的按钮
			const addButton = page.locator('button.el-button:has-text("新"), button.el-button:has-text("新增")').first();
			await addButton.waitFor({ state: 'visible', timeout: 5000 });
			await addButton.click();

			// --- 改动点 2: 确保弹窗已渲染 ---
			const dialog = page.locator('.el-dialog').last();
			await dialog.waitFor({ state: 'visible', timeout: 5000 });

			// --- 改动点 3: 使用更纯粹的选择器填充 ---
			// 填充站点名称
			await dialog.locator('input[placeholder*="MN编码"]').fill(data.mn);

			// 填充经纬度 (通过 label 后的第一个 input)
			await dialog.locator('.el-form-item:has-text("设备名称") input').first().fill(data.deviceName);
			await dialog.locator('.el-form-item:has-text("设备密码") input').first().fill(data.password);

			// 填充 MN 码
			// await dialog.locator('input[placeholder*="MN码"]').fill(data.currentMn);

			// await dialog.locator('textarea[placeholder*="安装地址"], input[placeholder*="安装地址"]').fill(data.address);

			await page.locator('.el-dialog .el-form-item__label').getByText('设备分类').click();
			const options = page.locator('.el-select-dropdown__item:visible');
			const count = await options.count();
			if (count > 0) {
				// 4. 生成一个 0 到 count-1 之间的随机整数
				const randomIndex = Math.floor(Math.random() * count);

				// 5. 打印一下随机选了第几个（方便调试）
				const selectedText = await options.nth(randomIndex).innerText();
				console.log(`随机选择了第 ${randomIndex + 1} 个选项: ${selectedText}`);

				// 6. 点击该随机选项
				await options.nth(randomIndex).click();
			} else {
				console.error('未能找到下拉选项，请检查下拉框是否成功展开');
			}

			await page.locator('.el-form-item__label').getByText('所属站点').click();
			const stationOptions = page.locator('.el-select-dropdown__item:visible');
			const stationCount = await stationOptions.count();
			if (stationCount > 0) {
				// 4. 生成一个 0 到 count-1 之间的随机整数
				const randomIndex = Math.floor(Math.random() * stationCount);

				// 5. 打印一下随机选了第几个（方便调试）
				const selectedText = await stationOptions.nth(randomIndex).innerText();
				console.log(`随机选择了第 ${randomIndex + 1} 个选项: ${selectedText}`);

				// 6. 点击该随机选项
				await stationOptions.nth(randomIndex).click();
			} else {
				console.error('未能找到下拉选项，请检查下拉框是否成功展开');
			}

			await page.locator('.el-dialog .el-form-item__label').getByText('过期时间').click();

			// 填充过期时间  随机生成一个格式为2026-12-31的日期
			const randomDate = new Date(Date.now() + Math.random() * 63072000000);
			const dateStr = randomDate.toISOString().split('T')[0];
			// 这里的定位器需要指向 input 元素
			await page.locator('.el-form-item:has-text("过期时间") input').fill(dateStr);
			// 2. 填充完后敲一下回车，确保数据被 Vue 监听到并关闭面板
			await page.keyboard.press('Enter');
			// --- 改动点 4: 点击“确定”按钮 ---
			// 定位弹窗底部 footer 里的确定按钮
			const confirmBtn = dialog.locator('button.el-button--primary:has-text("确"), .el-dialog__footer button:has-text("确定")').first();
			await confirmBtn.click();

			// 等待弹窗关闭
			await dialog.waitFor({ state: 'hidden', timeout: 5000 });
			console.log(`✅ 第 ${i} 条创建成功`);

			// 稍微缓冲一下，等待列表刷新
			await page.waitForTimeout(500);
		}

		console.log('🎉 10条数据全部处理完毕！');
	} catch (error) {
		console.error('❌ 脚本运行出错:', error);
		// 报错时保持浏览器不关闭，让你看清楚卡在哪里
		await page.pause();
	}
}

run();
