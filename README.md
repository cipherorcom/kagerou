# Kagerou - 二级域名分发系统

基于 Docker 的现代化域名管理系统，支持 Cloudflare、阿里云等多个 DNS 服务商，提供简洁的 Web 管理界面。

## ✨ 功能特性

### 🔐 用户系统
- **用户认证**: 注册/登录系统，支持邀请码
- **权限管理**: 普通用户和管理员角色
- **个人资料**: 用户可自助修改个人信息和密码
- **配额管理**: 灵活的域名配额控制

### 🌐 DNS 管理
- **多 Provider 支持**: Cloudflare、阿里云 DNS
- **DNS 账号管理**: 管理员可添加多个 DNS 服务商账号
- **可用域名**: 管理员从 DNS 账号中选择域名供用户使用
- **凭证加密**: AES-256-GCM 加密存储 DNS 凭证

### 📊 域名记录管理
- **完整 CRUD**: 创建、查看、编辑、删除域名记录
- **多记录类型**: 支持 A、AAAA、CNAME 记录
- **实时同步**: 直接操作 DNS 服务商 API
- **状态管理**: 域名记录状态跟踪

### �️ 安全与限制
- **子域名黑名单**: 禁止创建系统保留域名（admin、api、www 等）
- **API 限流**: 可配置的登录和注册限流
- **数据加密**: 敏感数据 AES 加密存储
- **JWT 认证**: 安全的用户会话管理

### 🎨 管理功能
- **用户管理**: 管理员可管理用户账号、配额、权限
- **邀请码系统**: 支持邀请码注册控制
- **系统设置**: 灵活的系统参数配置
- **操作日志**: 完整的 API 操作日志记录

## 🚀 快速开始

Kagerou 提供预构建的 Docker 镜像，部署极其简单：

### 1. 下载配置文件

```bash
# 下载 docker-compose.yml
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/docker-compose.yml

# 下载环境变量模板
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/.env.docker
```

### 2. 配置环境变量

```bash
cp .env.docker .env
# 编辑 .env 文件，修改密钥和密码（重要！）
```

**重要配置项：**
```env
# 数据库密码（必须修改）
POSTGRES_PASSWORD=your-strong-password

# JWT 密钥（必须修改，至少32字符）
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# 加密密钥（必须修改，恰好32字符）
ENCRYPTION_KEY=your-exactly-32-character-key!!

# API 地址（如果使用域名部署需要修改）
NEXT_PUBLIC_API_URL=http://localhost/api
```

### 3. 启动服务

```bash
# 拉取最新镜像并启动
docker-compose pull
docker-compose up -d
```

**如果遇到 Docker Hub 认证问题：**

Docker Hub 现在对匿名拉取有限制，如果看到 "UNAUTHORIZED" 错误，可以：

**方案 1: 登录 Docker Hub**
```bash
docker login
# 输入你的 Docker Hub 用户名和密码
docker-compose pull
docker-compose up -d
```

**方案 2: 使用镜像源（推荐）**
```bash
# 下载镜像源配置
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/docker-compose.mirror.yml

# 使用镜像源构建
docker-compose -f docker-compose.mirror.yml up --build -d
```

**方案 3: 本地构建**
```bash
# 下载本地构建配置
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/docker-compose.build.yml

# 本地构建并启动
docker-compose -f docker-compose.build.yml up --build -d
```

### 4. 访问应用

- 🌐 **网站**: http://localhost
- 💚 **健康检查**: http://localhost/health

### 5. 创建管理员账号

访问 `http://localhost/create-admin` 创建第一个管理员账号。

**注意**: 
- 优先使用预构建镜像 `ghcr.io/cipherorcom/kagerou:latest`
- 如果网络问题无法拉取镜像，使用本地构建版本
- 首次启动会自动处理数据库初始化
- 生产环境请务必修改 `.env` 中的默认密钥

## 📁 系统架构

### 技术栈
- **后端**: Fastify + TypeScript
- **前端**: Next.js 14 + Tailwind CSS
- **数据库**: PostgreSQL + Prisma ORM
- **DNS SDK**: Cloudflare SDK、阿里云 DNS SDK
- **部署**: Docker 单镜像架构

### 单镜像架构
```
Internet → Nginx (Port 80) → API (Port 3001)
                           → Web (Port 3000)
```

**优势：**
- 🎯 简化部署，只需管理一个应用容器
- 🚀 内置 Nginx 反向代理和负载均衡
- 📦 更小的资源占用和更好的性能
- 🔧 统一的日志和监控

## 📊 数据库架构

### 核心表结构
- **users** - 用户表（支持普通用户和管理员角色）
- **dns_providers** - DNS 服务商表（Cloudflare、阿里云等）
- **dns_accounts** - DNS 账号表（管理员创建的 DNS 服务商账号）
- **available_domains** - 可用域名表（管理员从 DNS 账号中添加的可用根域名）
- **domains** - 域名记录表（用户创建的子域名记录）
- **blocked_subdomains** - 禁用子域名表（管理员禁用的子域名）
- **system_settings** - 系统设置表
- **invite_codes** - 邀请码表
- **api_keys** - API 密钥表（预留功能）
- **api_logs** - API 日志表

### 权限模型

**管理员权限：**
- 管理 DNS Provider（查看、启用/禁用）
- 管理 DNS 账号（创建、编辑、删除）
- 管理可用域名（从 DNS 账号中添加域名供用户使用）
- 管理禁用子域名（设置不允许用户创建的子域名）
- 管理用户（查看、修改配额、启用/禁用、提升/降级权限）
- 管理邀请码（创建、编辑、删除）
- 系统设置（配额、限流、注册控制等）
- 查看所有域名记录和系统日志

**普通用户权限：**
- 查看可用域名列表
- 在可用域名下创建子域名记录（受禁用子域名限制）
- 管理自己的域名记录（查看、编辑、删除）
- 管理个人资料（修改姓名、密码）

## 🎨 界面预览

### 用户功能
- **首页** (`/`) - 自动跳转到登录或仪表板
- **登录** (`/login`) - 用户登录界面
- **注册** (`/register`) - 用户注册界面
- **域名管理** (`/dashboard`) - 域名记录列表和创建
- **个人资料** (`/dashboard/profile`) - 个人信息和密码管理

### 管理员功能
- **管理后台** (`/admin`) - 管理员仪表板
- **用户管理** (`/admin/users`) - 用户账号管理
- **DNS 账号** (`/admin/dns-accounts`) - DNS 服务商账号管理
- **可用域名** (`/admin/available-domains`) - 可用域名管理
- **禁用子域名** (`/admin/blocked-subdomains`) - 子域名黑名单管理
- **邀请码** (`/admin/invite-codes`) - 邀请码管理
- **系统设置** (`/admin/settings`) - 系统参数配置

## 🚀 部署方式

### 使用预构建镜像（推荐）

Kagerou 提供预构建的 Docker 镜像，无需本地构建：

```bash
# 下载配置文件
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/.env.docker

# 配置环境变量
cp .env.docker .env
# 编辑 .env 文件修改密钥

# 启动服务
docker-compose pull
docker-compose up -d
```

**预构建镜像优势：**
- 🚀 无需本地构建，启动更快
- 🎯 经过测试的稳定版本
- � 自动更新到最新版本
- 🔧 统一的生产环境

**可用镜像：**
- `ghcr.io/cipherorcom/kagerou:latest` - 最新稳定版
- `ghcr.io/cipherorcom/kagerou:v1.0.0` - 特定版本

### 版本管理

```bash
# 使用特定版本
docker-compose pull
docker-compose up -d

# 更新到最新版本
docker-compose pull
docker-compose up -d
```

详细配置请查看 [DOCKER.md](./DOCKER.md) 和 [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md)。

## 🔧 管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新到最新版本
docker-compose pull
docker-compose up -d
```

### 应用管理

```bash
# 进入应用容器
docker-compose exec app sh

# 查看应用进程状态
docker-compose exec app su kagerou -c "pm2 status"

# 重启应用进程
docker-compose exec app su kagerou -c "pm2 restart all"
```

### 数据库管理

```bash
# 连接数据库
docker-compose exec postgres psql -U kagerou -d kagerou

# 备份数据库
docker-compose exec postgres pg_dump -U kagerou kagerou > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U kagerou kagerou < backup.sql
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
7. 使用预构建镜像进行部署

## 🚀 生产部署

### 环境变量配置

生产环境需要配置以下环境变量（统一在根目录 `.env` 文件）：

```bash
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/dbname"

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
# 下载配置文件
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/.env.docker

# 配置环境变量
cp .env.docker .env
# 编辑 .env 文件，修改生产环境密钥

# 启动服务
docker-compose pull
docker-compose up -d
```

## 📝 常见问题

### 1. 数据库连接失败
```bash
# 检查 Docker 容器状态
docker-compose ps

# 查看日志
docker-compose logs postgres
```

### 2. 数据库初始化失败
```bash
# 进入应用容器
docker-compose exec app sh

# 重新初始化数据库
cd /app/packages/database && npx prisma db push
cd /app && node scripts/init-database.js
```

### 3. 前端无法连接后端
检查 `.env` 中的 `NEXT_PUBLIC_API_URL` 是否正确。

### 4. DNS 记录创建失败
- 检查 DNS 账号凭证是否正确
- 确认域名已在 DNS 服务商处添加
- 查看后端日志获取详细错误信息

### 5. 无法拉取 Docker 镜像 / Docker Hub 认证问题

如果遇到 "UNAUTHORIZED" 或 "authentication required" 错误：

**方案 1: 登录 Docker Hub**
```bash
docker login
# 输入你的 Docker Hub 用户名和密码
docker-compose pull && docker-compose up -d
```

**方案 2: 使用镜像源（推荐，无需登录）**
```bash
# 使用阿里云镜像源
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/docker-compose.mirror.yml
docker-compose -f docker-compose.mirror.yml up --build -d
```

**方案 3: 本地构建**
```bash
# 使用本地构建版本
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/docker-compose.build.yml
docker-compose -f docker-compose.build.yml up --build -d
```

### 6. 本地构建失败
如果本地构建遇到问题：

```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose -f docker-compose.build.yml build --no-cache
```

## 🚀 CI/CD 和镜像发布

项目使用 GitHub Actions 自动构建和发布 Docker 镜像：

### 自动化工作流
- **测试**: 每次推送和 PR 时运行测试
- **构建**: 自动构建并推送 Docker 镜像到 GHCR
- **发布**: 推送版本标签时创建 GitHub Release

### 发布新版本
```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions 会自动：
# 1. 构建 Docker 镜像
# 2. 推送到 GitHub Container Registry
# 3. 创建 GitHub Release
# 4. 上传部署文件
```

### 使用预构建镜像
```bash
# 拉取最新镜像
docker pull ghcr.io/cipherorcom/kagerou:latest

# 使用脚本快速部署
docker-compose pull && docker-compose up -d
```

详细的 CI/CD 配置请查看 [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md)。

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