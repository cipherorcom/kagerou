# Kagerou - 二级域名分发系统

基于 Node.js + TypeScript 全栈的多 DNS Provider 域名管理系统，支持 Cloudflare、阿里云等多个 DNS 服务商。

## ✨ 功能特性

### 核心功能
- 🔐 用户认证与授权（JWT）
- 🌐 多 DNS Provider 支持（Cloudflare、阿里云）
- 📊 用户配额管理
- 🔒 凭证 AES-256-GCM 加密存储
- 🎨 现代化 Web 管理界面
- 🚀 RESTful API
- 📦 Monorepo 架构（Turborepo）

### 前端功能
- ✅ 用户注册/登录
- ✅ 域名记录管理（创建、删除）
- ✅ DNS 账号管理（支持多个服务商）
- ✅ 实时状态更新
- ✅ 响应式设计

## 🛠 技术栈

### 后端
- **框架**: Fastify + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **DNS Providers**: Cloudflare SDK, 阿里云 DNS SDK
- **认证**: JWT + bcrypt

### 前端
- **框架**: Next.js 14 (App Router)
- **UI**: Tailwind CSS
- **状态管理**: Zustand
- **数据获取**: TanStack Query (React Query)
- **表单**: React Hook Form + Zod
- **HTTP 客户端**: Axios

## 📁 项目结构

```
kagerou/
├── apps/
│   ├── api/                    # Fastify 后端 API
│   │   ├── src/
│   │   │   ├── routes/        # API 路由（auth, domain, dns-account, provider）
│   │   │   ├── services/      # 业务逻辑层
│   │   │   ├── plugins/       # Fastify 插件（JWT 认证）
│   │   │   ├── utils/         # 工具函数（加密/解密）
│   │   │   ├── config.ts      # 配置管理
│   │   │   └── index.ts       # 应用入口
│   │   └── package.json
│   └── web/                    # Next.js 前端应用
│       ├── src/
│       │   ├── app/           # Next.js App Router 页面
│       │   │   ├── login/     # 登录页
│       │   │   ├── register/  # 注册页
│       │   │   └── dashboard/ # 管理后台
│       │   ├── lib/           # API 客户端
│       │   ├── store/         # Zustand 状态管理
│       │   └── components/    # React 组件
│       └── package.json
├── packages/
│   ├── database/              # Prisma ORM
│   │   ├── prisma/
│   │   │   └── schema.prisma  # 数据库模型定义
│   │   └── src/
│   │       └── index.ts       # Prisma Client 导出
│   └── dns-providers/         # DNS Provider 抽象层
│       └── src/
│           ├── providers/     # 各服务商实现
│           │   ├── cloudflare.ts
│           │   └── aliyun.ts
│           ├── types.ts       # TypeScript 类型定义
│           ├── factory.ts     # Provider 工厂
│           └── index.ts
├── scripts/
│   └── seed-providers.ts      # 数据库初始化脚本
├── docker-compose.yml         # PostgreSQL + Redis
├── turbo.json                 # Turborepo 配置
└── package.json               # 根 package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 2. 启动数据库

```bash
docker-compose up -d
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，修改以下配置：
# - JWT_SECRET: 修改为随机字符串（生产环境必须修改）
# - ENCRYPTION_KEY: 必须是 32 字符（生产环境必须修改）
# - REDIS_PASSWORD: Redis 密码（生产环境必须修改）
```

### 4. 初始化数据库

```bash
# 一键初始化（推荐）
npm run db:setup

# 或者分步执行：
npm run db:generate  # 生成 Prisma Client（自动同步环境变量和安装依赖）
npm run db:migrate   # 运行数据库迁移
npm run db:seed      # 初始化 DNS Provider 数据
```

### 5. 启动开发服务器

```bash
npm run dev
```

- 后端 API: `http://localhost:3001`
- 前端界面: `http://localhost:3000`

## 🎨 界面预览

### 功能页面
- **首页** (`/`) - 自动跳转到登录或仪表板
- **登录** (`/login`) - 用户登录界面
- **注册** (`/register`) - 用户注册界面
- **域名管理** (`/dashboard`) - 域名记录列表和创建
- **DNS 账号** (`/dashboard/accounts`) - DNS 服务商账号管理

### 主要功能流程
1. 注册账号 → 登录系统
2. 添加 DNS 账号（配置 Cloudflare 或阿里云凭证）
3. 创建域名记录（选择 DNS 账号、输入子域名和记录值）
4. 管理域名（查看、删除）

## 📡 API 文档

### 认证

#### 注册
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

#### 登录
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### DNS 账号管理

#### 添加 DNS 账号
```bash
POST /api/dns-accounts
Authorization: Bearer <token>
Content-Type: application/json

# Cloudflare
{
  "providerId": "<cloudflare-provider-id>",
  "credentials": {
    "apiToken": "your-cloudflare-api-token"
  },
  "isDefault": true
}

# 阿里云
{
  "providerId": "<aliyun-provider-id>",
  "credentials": {
    "accessKeyId": "your-access-key-id",
    "accessKeySecret": "your-access-key-secret"
  }
}
```

#### 查看 DNS 账号列表
```bash
GET /api/dns-accounts
Authorization: Bearer <token>
```

### 域名管理

#### 创建域名记录
```bash
POST /api/domains
Authorization: Bearer <token>
Content-Type: application/json

{
  "dnsAccountId": "<dns-account-id>",
  "subdomain": "test.example.com",
  "recordType": "A",
  "value": "1.2.3.4",
  "ttl": 300
}
```

#### 查看域名列表
```bash
GET /api/domains
Authorization: Bearer <token>
```

#### 更新域名记录
```bash
PATCH /api/domains/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "5.6.7.8",
  "ttl": 600
}
```

#### 删除域名记录
```bash
DELETE /api/domains/:id
Authorization: Bearer <token>
```

## 🔌 DNS Provider 扩展

系统采用适配器模式，添加新的 DNS Provider 非常简单：

### 步骤 1: 创建 Provider 类

在 `packages/dns-providers/src/providers/` 创建新文件，例如 `tencent.ts`：

```typescript
import { DNSProvider, DNSRecord, DNSProviderCredentials } from '../types';

export class TencentProvider implements DNSProvider {
  name = 'tencent';
  private client: any;

  constructor(credentials: DNSProviderCredentials) {
    // 初始化腾讯云 SDK
    this.client = new TencentCloudSDK(credentials);
  }

  async createRecord(domain: string, record: DNSRecord): Promise<DNSRecord> {
    // 实现创建记录逻辑
    const result = await this.client.createRecord(/* ... */);
    return {
      id: result.recordId,
      name: record.name,
      type: record.type,
      value: record.value,
      ttl: record.ttl,
    };
  }

  async updateRecord(domain: string, recordId: string, record: Partial<DNSRecord>): Promise<DNSRecord> {
    // 实现更新逻辑
  }

  async deleteRecord(domain: string, recordId: string): Promise<void> {
    // 实现删除逻辑
  }

  async getRecord(domain: string, recordId: string): Promise<DNSRecord> {
    // 实现获取逻辑
  }

  async listRecords(domain: string, type?: string): Promise<DNSRecord[]> {
    // 实现列表逻辑
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.client.testConnection();
      return true;
    } catch {
      return false;
    }
  }
}
```

### 步骤 2: 注册到工厂

在 `packages/dns-providers/src/factory.ts` 中添加：

```typescript
import { TencentProvider } from './providers/tencent';

export class DNSProviderFactory {
  static create(config: DNSProviderConfig): DNSProvider {
    switch (config.type.toLowerCase()) {
      case 'cloudflare':
        return new CloudflareProvider(config.credentials);
      case 'aliyun':
        return new AliyunProvider(config.credentials);
      case 'tencent':  // 新增
        return new TencentProvider(config.credentials);
      default:
        throw new Error(`Unsupported DNS provider: ${config.type}`);
    }
  }
}
```

### 步骤 3: 添加数据库记录

运行数据库初始化或手动添加：

```sql
INSERT INTO dns_providers (name, display_name, is_active, config_schema)
VALUES (
  'tencent',
  '腾讯云 DNSPod',
  true,
  '{"type":"object","required":["secretId","secretKey"],"properties":{"secretId":{"type":"string"},"secretKey":{"type":"string"}}}'
);
```

完成！新的 Provider 即可在前端界面中使用。

## 部署

### 使用 Docker

```bash
# 构建
docker build -t kagerou-api ./apps/api

# 运行
docker run -p 3001:3001 --env-file .env kagerou-api
```

### 云平台部署

- **Railway**: 直接连接 GitHub 仓库
- **Render**: 支持 Monorepo 部署
- **Vercel**: 适合 Serverless 部署

## 🔧 开发命令

```bash
# 开发
npm run dev          # 启动所有开发服务器（前端 + 后端）
npm run build        # 构建所有包

# 数据库（推荐使用 db:setup 一键初始化）
npm run db:setup     # 一键初始化数据库（generate + migrate + seed）
npm run db:env       # 同步环境变量到 Prisma
npm run db:generate  # 生成 Prisma Client（自动同步环境变量和安装依赖）
npm run db:migrate   # 运行数据库迁移（自动同步环境变量）
npm run db:studio    # 打开 Prisma Studio（可视化数据库管理）
npm run db:seed      # 初始化 DNS Provider 数据（使用 Node.js 脚本）

# 单独启动
cd apps/api && npm run dev    # 仅启动后端
cd apps/web && npm run dev    # 仅启动前端
```

## 🔐 安全说明

### 凭证加密
- DNS 服务商凭证使用 AES-256-GCM 加密存储
- 加密密钥通过环境变量 `ENCRYPTION_KEY` 配置（必须 32 字符）
- JWT Token 用于用户认证，密钥通过 `JWT_SECRET` 配置

### 生产环境建议
1. 修改所有默认密钥（JWT_SECRET, ENCRYPTION_KEY）
2. 使用强密码策略
3. 启用 HTTPS
4. 配置 CORS 白名单
5. 添加 API 限流
6. 定期备份数据库

## 🚀 生产部署

### 环境变量配置

生产环境需要配置以下环境变量（统一在根目录 `.env` 文件）：

```bash
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Redis (with authentication)
REDIS_URL="redis://:your_redis_password@host:6379/0"
REDIS_PASSWORD="your_redis_password"
REDIS_DB="0"

# 安全密钥（必须修改！）
JWT_SECRET="your-production-jwt-secret-min-32-chars-random-string"
ENCRYPTION_KEY="your-production-32-char-key!!"

# 服务器
PORT=3001

# 前端 API 地址
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"

# 环境
NODE_ENV="production"
```

**安全提示：**
- `JWT_SECRET` 和 `ENCRYPTION_KEY` 必须使用强随机字符串
- `ENCRYPTION_KEY` 必须恰好 32 字符
- 生产环境务必修改所有默认密码
- 不要将 `.env` 文件提交到版本控制

### Docker 部署

```bash
# 构建后端镜像
docker build -t kagerou-api -f apps/api/Dockerfile .

# 运行
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  --name kagerou-api \
  kagerou-api
```

### 云平台部署

#### Vercel (前端)
1. 连接 GitHub 仓库
2. 设置 Root Directory: `apps/web`
3. 配置环境变量: `NEXT_PUBLIC_API_URL`
4. 部署

#### Railway (后端 + 数据库)
1. 连接 GitHub 仓库
2. 添加 PostgreSQL 和 Redis 服务
3. 配置环境变量
4. 设置 Root Directory: `apps/api`
5. 部署

## 📝 常见问题

### 1. 数据库连接失败
```bash
# 检查 Docker 容器状态
docker-compose ps

# 查看日志
docker-compose logs postgres
```

### 2. Prisma 迁移失败
```bash
# 重置数据库（会删除所有数据）
cd packages/database
npx prisma migrate reset

# 重新迁移
npx prisma migrate dev
```

### 3. 前端无法连接后端
检查 `apps/web/.env` 中的 `NEXT_PUBLIC_API_URL` 是否正确。

### 4. DNS 记录创建失败
- 检查 DNS 账号凭证是否正确
- 确认域名已在 DNS 服务商处添加
- 查看后端日志获取详细错误信息

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

## 🔗 相关链接

- [Cloudflare API 文档](https://developers.cloudflare.com/api/)
- [阿里云 DNS API 文档](https://help.aliyun.com/document_detail/29739.html)
- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [Fastify 文档](https://fastify.dev/)
