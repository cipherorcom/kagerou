# Docker 部署指南

Kagerou 提供预构建的 Docker 镜像，部署极其简单。用户无需构建镜像，直接使用我们提供的稳定版本即可。

## 🚀 快速开始

### 方式一：直接下载配置文件（推荐）

```bash
# 创建项目目录
mkdir kagerou && cd kagerou

# 下载配置文件
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/cipherorcom/kagerou/main/.env.docker

# 配置环境变量
cp .env.docker .env
# 编辑 .env 文件，修改密钥和密码

# 启动服务
docker-compose pull
docker-compose up -d
```

### 方式二：从 GitHub Releases 下载

```bash
# 下载最新发布版本
curl -L -O https://github.com/cipherorcom/kagerou/releases/latest/download/docker-compose.yml
curl -L -O https://github.com/cipherorcom/kagerou/releases/latest/download/.env.docker

# 配置环境变量
cp .env.docker .env
# 编辑 .env 文件

# 启动服务
docker-compose up -d
```

## 📋 架构说明

### 单镜像架构

Kagerou 采用单镜像设计，包含：

- **Nginx**: 反向代理和静态文件服务
- **Node.js API**: Fastify 后端服务 (内部端口 3001)
- **Next.js Web**: 前端应用 (内部端口 3000)
- **PM2**: 进程管理器，管理 API 和 Web 服务

**优势：**
- 🎯 简化部署，只需管理一个应用容器
- 🚀 内置负载均衡和反向代理
- 📦 更小的资源占用
- 🔧 统一的日志和监控
- 🛡️ 更好的安全性（内部服务不暴露端口）

### 服务架构

```
Internet → Nginx (Port 80) → API (Port 3001)
                           → Web (Port 3000)
```

## 🔧 常用命令

### 基本操作

```bash
# 拉取最新镜像
docker-compose pull

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

### 版本管理

```bash
# 更新到最新版本
docker-compose pull
docker-compose up -d

# 使用特定版本（修改 docker-compose.yml 中的镜像标签）
# 将 ghcr.io/cipherorcom/kagerou:latest 改为 ghcr.io/cipherorcom/kagerou:v1.0.0
docker-compose up -d
```

### 应用管理

```bash
# 进入应用容器
docker-compose exec app sh

# 查看 PM2 进程状态
docker-compose exec app su kagerou -c "pm2 status"

# 重启应用进程
docker-compose exec app su kagerou -c "pm2 restart all"

# 查看 PM2 日志
docker-compose exec app su kagerou -c "pm2 logs"

# 查看 Nginx 状态
docker-compose exec app nginx -t
```

### 数据库管理

```bash
# 连接数据库
docker-compose exec postgres psql -U kagerou -d kagerou

# 重新初始化数据库结构
docker-compose exec app su kagerou -c "cd /app/packages/database && npx prisma db push"

# 重新初始化基础数据
docker-compose exec app su kagerou -c "cd /app && node scripts/init-database.js"

# 备份数据库
docker-compose exec postgres pg_dump -U kagerou kagerou > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U kagerou kagerou < backup.sql
```

## 🌍 环境配置

### 环境变量

创建 `.env` 文件：

```bash
cp .env.docker .env
```

主要配置项：

```env
# 数据库配置
POSTGRES_USER=kagerou
POSTGRES_PASSWORD=your-strong-password
POSTGRES_DB=kagerou

# 安全密钥（生产环境必须修改！）
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
ENCRYPTION_KEY=your-exactly-32-character-key!!

# 应用端口
APP_PORT=80

# API 地址
NEXT_PUBLIC_API_URL=http://localhost/api
```

### 生产环境配置

1. **修改默认密码和密钥**
   ```bash
   # 生成强密钥
   openssl rand -base64 32  # JWT_SECRET
   openssl rand -base64 24  # ENCRYPTION_KEY (32字符)
   ```

2. **配置域名**
   ```env
   NEXT_PUBLIC_API_URL=https://your-domain.com/api
   ```

3. **使用 HTTPS**
   - 配置 SSL 证书
   - 修改 Nginx 配置

## 🔒 安全建议

### 生产环境安全

1. **修改默认凭证**
   - 数据库密码
   - JWT 密钥
   - 加密密钥

2. **网络安全**
   - 不要暴露数据库端口 (5432)
   - 使用防火墙限制访问
   - 配置 HTTPS

3. **容器安全**
   - 定期更新镜像
   - 使用非 root 用户运行应用
   - 限制容器资源

### SSL/HTTPS 配置

如需配置 HTTPS，可以：

1. **使用反向代理**（推荐）
   - Nginx Proxy Manager
   - Traefik
   - Cloudflare

2. **修改容器配置**
   - 挂载 SSL 证书
   - 修改 Nginx 配置

## 📊 监控和日志

### 健康检查

```bash
# 检查应用健康状态
curl http://localhost/health

# 查看容器健康状态
docker-compose ps
```

### 日志管理

```bash
# 查看所有日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看应用日志
docker-compose logs app

# 查看数据库日志
docker-compose logs postgres

# 限制日志行数
docker-compose logs --tail=100 app
```

### PM2 监控

```bash
# 查看进程状态
docker-compose exec app su kagerou -c "pm2 status"

# 查看进程监控
docker-compose exec app su kagerou -c "pm2 monit"

# 查看进程日志
docker-compose exec app su kagerou -c "pm2 logs"
```

## 🔄 数据备份和恢复

### 数据库备份

```bash
# 创建备份
docker-compose exec postgres pg_dump -U kagerou kagerou > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
docker-compose exec -T postgres psql -U kagerou kagerou < backup.sql
```

### 数据卷备份

```bash
# 备份数据卷
docker run --rm -v kagerou_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v kagerou_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## 🚨 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :80
   lsof -i :5432
   
   # 修改端口
   APP_PORT=8080 docker-compose up -d
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose exec postgres pg_isready -U kagerou
   
   # 查看数据库日志
   docker-compose logs postgres
   ```

3. **应用启动失败**
   ```bash
   # 查看应用日志
   docker-compose logs app
   
   # 检查 PM2 状态
   docker-compose exec app su kagerou -c "pm2 status"
   ```

4. **Nginx 配置错误**
   ```bash
   # 测试 Nginx 配置
   docker-compose exec app nginx -t
   
   # 重新加载 Nginx
   docker-compose exec app nginx -s reload
   ```

### 重置环境

```bash
# 完全重置（删除所有数据）
docker-compose down -v
docker system prune -a

# 重新启动
docker-compose pull
docker-compose up -d
```

## 📈 性能优化

### 生产环境优化

1. **资源限制**
   ```yaml
   services:
     app:
       deploy:
         resources:
           limits:
             cpus: '1.0'
             memory: 1G
           reservations:
             cpus: '0.5'
             memory: 512M
   ```

2. **缓存优化**
   - 启用 Nginx 缓存
   - 配置 CDN
   - 优化静态资源

3. **数据库优化**
   - 配置连接池
   - 优化查询
   - 定期维护

### 扩展部署

如需扩展，可以：

1. **水平扩展**
   ```bash
   docker-compose up --scale app=3 -d
   ```

2. **负载均衡**
   - 使用外部负载均衡器
   - 配置多个实例

## 🔗 相关链接

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [PM2 文档](https://pm2.keymetrics.io/docs/)
- [Nginx 文档](https://nginx.org/en/docs/)
- [GitHub Actions 指南](./GITHUB_ACTIONS.md)