/*
 * @Description: 筛选删除：校验请求并调用 FilterDeleteService（行为与原 botService 一致）
 */
import type { Request, Response } from 'express';
import { runFilterDelete } from '../services/FilterDeleteService';

export async function runDelete(req: Request, res: Response): Promise<void> {
	const body = req.body || {};
	const { filters, location, menuName } = body;

	if (!Array.isArray(filters) || filters.length === 0) {
		res.status(400).json({
			success: false,
			message: '缺少 filters 或 filters 为空数组',
		});
		return;
	}
	if (!location || !menuName) {
		res.status(400).json({
			success: false,
			message: '缺少 location 或 menuName',
		});
		return;
	}
	const bad = filters.find((f) => !f || !f.label || f.value === undefined || f.value === null || f.value === '');
	if (bad !== undefined) {
		res.status(400).json({
			success: false,
			message: 'filters 中每项均需包含 label 与 value',
		});
		return;
	}

	const payload = { filters, location, menuName };

	try {
		res.json({ success: true, message: '正在执行删除任务' });
		await runFilterDelete(payload);
		console.log('🎉 删除流程完成');
	} catch (err: any) {
		console.error('❌ 删除失败:', err);
		res.status(500).json({
			success: false,
			message: err.message || '删除失败',
			error: String(err),
		});
	}
}
