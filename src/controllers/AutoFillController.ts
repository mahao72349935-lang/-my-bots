/*
 * @Description:
 * @Author: mahao
 * @Date: 2026-03-24 11:13:26
 * @LastEditors: mahao
 * @LastEditTime: 2026-03-24 11:15:42
 */
/*
 * @Description: 自动填充：校验请求并调用 AutoFillService（行为与原 botService 一致）
 */
import type { Request, Response } from 'express';
import type { ReceivedData } from '../services/AutoFillService';
import { runAutoFill } from '../services/AutoFillService';
import { normalizeMockData } from '../utils/normalize';

export async function runPlaywright(req: Request, res: Response): Promise<void> {
	const body = req.body || {};
	const { formFields = [], location, menuName, mockData: rawMock } = body;

	const mockData = normalizeMockData(rawMock);

	if (!location || !menuName) {
		res.status(400).json({
			success: false,
			message: '缺少 location 或 menuName',
		});
		return;
	}
	if (!mockData || mockData.length === 0 || mockData.every((m) => !m || Object.keys(m).length === 0)) {
		res.status(400).json({
			success: false,
			message: 'mockData 不能为空',
		});
		return;
	}

	const payload = { formFields, location, menuName, mockData };
	console.log('📥 收到插件数据:', { location, menuName, rows: mockData.length });

	try {
		// 建议写法
		res.json({ success: true, message: '机器人已启动，请观察浏览器窗体' });
		runAutoFill(payload as ReceivedData).catch((err) => {
			console.error('⚠️ 后台任务异步崩溃:', err);
		});
		console.log('🎉 自动填充流程完成');
	} catch (err: any) {
		console.error('❌ 处理失败:', err);
		res.status(500).json({
			success: false,
			message: err.message || '处理失败',
			error: String(err),
		});
	}
}
