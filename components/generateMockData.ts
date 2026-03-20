/*
 * @Description: 使用 DeepSeek API 根据 formFields 生成模拟数据
 * @Author: mahao
 * @Date: 2026-03-19
 */
import OpenAI from 'openai';

export interface FormField {
	name: string;
	type: string;
	placeholder?: string;
	label: string;
}

/**
 * 使用 DeepSeek API 根据 formFields 生成模拟数据
 * @param formFields 表单字段配置
 * @param count 需要生成的测试数据条数，默认 1
 */
export async function generateMockData(formFields: FormField[], count: number = 1): Promise<Record<string, string | number>[]> {
	const apiKey = process.env.DEEPSEEK_API_KEY;
	if (!apiKey) {
		throw new Error('未配置 DEEPSEEK_API_KEY，请在 .env 文件中设置');
	}

	const openai = new OpenAI({
		baseURL: 'https://api.deepseek.com',
		apiKey,
	});

	const fieldsDesc = formFields.map((f) => `- ${f.name} (${f.type}): ${f.placeholder || f.label}`).join('\n');

	const prompt = `你是一个表单测试数据生成助手。请根据以下表单字段，生成 ${count} 份真实、合理的模拟填写数据。

表单字段：
${fieldsDesc}

要求：
1. 返回一个 JSON 数组，数组长度为 ${count}，每个元素是一个对象，key 为字段的 name，value 为对应的模拟值
2. 只返回 JSON，不要包含任何其他文字或 markdown 标记
3. 数据要符合成都环境检测行业常见业务场景（如机构、地址、电话等格式）
4. select 类型请给出合理的选项值
5. 坐标、区域等专业字段可给示例格式
6. 多条数据之间要有差异，避免完全重复
7. 每次都要重新生成，不要使用相同的值`;

	const completion = await openai.chat.completions.create({
		model: 'deepseek-chat',
		messages: [{ role: 'user', content: prompt }],
		temperature: 0.7,
	});

	const content = completion.choices[0].message.content?.trim() || '[]';
	const jsonStr = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
	const result = JSON.parse(jsonStr);
	return Array.isArray(result) ? result : [result];
}
