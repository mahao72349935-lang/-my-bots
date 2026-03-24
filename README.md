# my-bots 后端分层说明（给前端同学）

本项目是 **Express + TypeScript** 的本地服务，用 **路由（routes）→ 控制器（controllers）→ 服务（services）** 分层。若你**主要用 Vue 3**，可先看下面 **「与 Vue 3 的对照」**，再读分层说明与新增接口步骤。

---

## 1. 三层分别放什么？和前端怎么对应？

| 层级 | 目录 | 职责 | 前端类比（Vue 3） |
|------|------|------|-------------------|
| **Routes** | `src/routes/` | 只负责：**URL + HTTP 方法** 对应到哪个处理函数；不写业务逻辑。 | 像 **Vue Router**：`path` → 渲染哪个视图；这里是 **path + method → 哪个 Controller 函数**。 |
| **Controllers** | `src/controllers/` | **接 HTTP**：从 `req` 取参数（`body` / `query` / `params`），做**入参校验**，调用 Service，用 `res.json()` / `res.status()` **返回给前端**。 | 像 **`<script setup>` 里直接写的异步处理函数**：拿到表单/`ref` 的值 → 校验 → 调「仓库或 API 封装」→ 再更新界面；**不要写长篇 Playwright 细节**。 |
| **Services** | `src/services/` | **纯业务 / 副作用**：打开浏览器、调数据库、调第三方 API、复杂计算等。**不出现** `req` / `res`。 | 像 **`src/api/*.ts` 里纯函数**，或 **Pinia action** 里「不碰路由、只做事」的那一段；多个页面/插件都可以复用。 |

### 1.1 与 Vue 3 的一一对应（方便你建立直觉）

| 后端 | Vue 3 里你更熟的概念 |
|------|----------------------|
| `routes` + `app.use('/api', …)` | **Vue Router** 的 `routes` 数组：`path` 决定进哪条链路（这里是进哪个 handler）。 |
| `controller` 里的 `req.body` / `req.query` | 页面里 **`ref` / `reactive` 收集的表单数据**，或路由 **`route.query`**，在提交时传给「后端」的那一包。 |
| `controller` 里的 `res.json({ success, message })` | 你在前端 **`await res.json()`** 后拿到的对象，再决定是否 `ElMessage`、是否改 `ref`。 |
| `service` | **与 UI 无关**：等同你把逻辑从 `.vue` 里抽到 **`useXxx` composable 的「纯逻辑部分」**，或 Pinia 里 **`actions` 调用的底层函数**（但不包含 `res`）。 |
| 本仓库的 `src/components/FormHandler.ts` | **不是** Vue 组件；是 **Playwright 操作页面的 TS 模块**，名字容易误会，可理解为「自动化脚本里的工具模块」。 |

一句话：

- **「接口」**在工程里通常指：**浏览器或插件访问的地址**（例如 `POST http://localhost:3000/api/run-playwright`）。  
- **这条路由挂在哪**：在 **`routes`** 里注册。  
- **谁解析前端传来的 JSON、谁决定返回 400/200**：**`controllers`**。  
- **谁执行自动化、谁处理复杂流程**：**`services`**。

当前项目里还有：

- `src/components/FormHandler.ts`：可复用的页面操作（填表），被 Service 调用，不是 HTTP 层。  
- `src/utils/`：与 HTTP 无关的小工具（如 `normalizeMockData`）。  
- `src/config/`：端口等配置。

---

## 2. 请求是怎么流进这三层的？

以现有 `POST /api/run-playwright` 为例：

1. **`src/app.ts`**：`app.use('/api', automationRouter)` → 所有 `automation` 路由前缀带 `/api`。  
2. **`src/routes/automation.ts`**：`router.post('/run-playwright', runPlaywright)` → 完整路径为 **`/api/run-playwright`**。  
3. **`runPlaywright`** 定义在 **`src/controllers/AutoFillController.ts`**：读 `req.body`，校验后调用 **`runAutoFill`**（在 **`src/services/AutoFillService.ts`**）。  
4. Service 里跑 Playwright，**不直接**操作 `res`。

数据流简图：

```text
前端 / 插件
    → HTTP 请求
    → app.ts（挂载 /api）
    → routes（匹配路径与方法）
    → controller（req → 校验 → 调 service → res）
    → service（业务逻辑）
```

---

## 3. 新增一个接口时怎么做？（接参数 → 处理 → 返回）

假设你要加：**`POST /api/hello`**，body 为 `{ "name": string }`，返回 `{ "message": string }`。

### 步骤 1：写 Service（业务与可测逻辑）

新建 `src/services/HelloService.ts`（文件名按业务起名即可）：

```ts
export async function buildGreeting(name: string): Promise<string> {
	const trimmed = (name || '').trim();
	if (!trimmed) {
		throw new Error('name 不能为空');
	}
	return `你好，${trimmed}`;
}
```

原则：**只接收普通参数、返回数据或抛错**；不要在这里写 `req` / `res`。

### 步骤 2：写 Controller（HTTP 门面）

新建 `src/controllers/HelloController.ts`：

```ts
import type { Request, Response } from 'express';
import { buildGreeting } from '../services/HelloService';

export async function sayHello(req: Request, res: Response): Promise<void> {
	const name = req.body?.name;

	try {
		const message = await buildGreeting(typeof name === 'string' ? name : '');
		res.json({ success: true, message });
	} catch (err: any) {
		res.status(400).json({
			success: false,
			message: err?.message || '请求无效',
		});
	}
}
```

原则：从 **`req.body` / `req.query` / `req.params`** 取数；缺参、类型不对在这里 **`res.status(400)`**；成功用 **`res.json(...)`**。

### 步骤 3：在 Routes 里注册路径

在 `src/routes/automation.ts`（或新建 `src/routes/hello.ts` 再在 `app.ts` 里 `app.use`）增加一行：

```ts
import { sayHello } from '../controllers/HelloController';

router.post('/hello', sayHello);
```

则完整地址为：**`POST /api/hello`**（因为 `app` 已挂载 `/api`）。

### 步骤 4：前端怎么调（Vue 3 示例）

在 **Vue 3 + `<script setup>`** 里，把「点按钮 → 调本地 my-bots」写成下面这样即可（与你在页面里调其它后端 API 一样，只是 `baseURL` 指向本机）：

```vue
<script setup lang="ts">
import { ref } from 'vue';
// 若用 Element Plus：import { ElMessage } from 'element-plus';

const name = ref('张三');
const loading = ref(false);

const BOT_BASE = 'http://localhost:3000'; // 或 vite 代理后的 '/api' 前缀，见下文

async function onSubmit() {
	loading.value = true;
	try {
		const res = await fetch(`${BOT_BASE}/api/hello`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: name.value }),
		});
		const data = await res.json();
		if (!res.ok) {
			// ElMessage.error(data.message ?? '请求失败');
			console.error(data);
			return;
		}
		// ElMessage.success(data.message);
		console.log(data.message);
	} finally {
		loading.value = false;
	}
}
</script>
```

更推荐：把 `fetch` 封到 **`src/api/bot.ts`**（或 composable **`useBotApi`**）里，`.vue` 只负责绑定 `ref` 和触发调用，这样和后端 **`service` 抽一层** 的思路一致。

**开发时跨域**：本仓库已在 `app.ts` 使用 `cors()`，一般可直接写全路径 `http://localhost:3000`。若你希望前端只写 **`/api/hello`**，可在 **Vite** 的 `vite.config.ts` 里配置 `server.proxy`，把 `/api` 代理到 `http://localhost:3000`（注意避免与你自己后端的 `/api` 冲突，可改用 `/local-bot` 之类前缀并在 `app.use` 里对应修改）。

---

## 4. 什么时候可以只写 Controller、不写 Service？

- 逻辑只有两三行（例如直接转发、固定 JSON），可以暂时全写在 Controller。  
- 一旦逻辑变长、需要复用或要写单元测试，就**抽到 Service**。

---

## 5. 与本项目现有接口的差异提示

当前 `AutoFillController` / `FilterDeleteController` 里存在：**先 `res.json` 成功，再 `await` 长时间任务**。这是历史行为，用于插件不长时间挂起等待；若你新加的接口是**普通 CRUD**，更常见的写法是：**等业务执行完再 `res.json`**，避免客户端以为成功但后端其实还在跑。

---

## 6. 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm run start:bot` | 启动本地服务（默认端口见 `src/config/index.ts`，可用环境变量 `PORT`） |
| `pnpm run typecheck` | TypeScript 检查（不生成文件） |

---

## 7. 目录速查

```text
src/
  main.ts              # 启动监听端口
  app.ts               # Express 实例、中间件、挂载路由
  config/              # 配置
  routes/              # 路径 → Controller
  controllers/         # req/res、校验、调用 Service、返回 JSON
  services/            # 业务逻辑（无 req/res）
  components/          # 本项目：Playwright 页面操作复用
  utils/               # 工具函数
  types/               # 类型导出（可选）
```

有新增接口时，按 **Service（可选）→ Controller → Routes** 顺序加文件最不容易乱。
