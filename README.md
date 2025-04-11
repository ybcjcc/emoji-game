# Emoji猜词游戏

一个基于React和Go的Emoji猜词游戏。

## 功能特点

- 三种难度模式：简单(10题)、中等(20题)、困难(30题)
- 实时排行榜
- 游戏统计
- 响应式设计

## 技术栈

- 前端：React + Ant Design
- 后端：Go + Gin
- 数据库：SQLite

## 快速开始

### 使用Docker（推荐）

1. 确保已安装Docker和Docker Compose
2. 克隆项目：
   ```bash
   git clone https://github.com/yourusername/emoji-game.git
   cd emoji-game
   ```
3. 启动服务：
   ```bash
   docker-compose up -d
   ```
4. 访问应用：http://localhost:8080

### 开发环境

#### 前端开发

1. 进入前端目录：
   ```bash
   cd frontend
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm start
   ```

#### 后端开发

1. 进入后端目录：
   ```bash
   cd backend
   ```
2. 安装依赖：
   ```bash
   go mod download
   ```
3. 启动服务器：
   ```bash
   go run main.go
   ```

## API文档

### 词语相关

- `GET /api/words/random` - 获取随机词语
- `GET /api/words/batch` - 获取批量词语
- `GET /api/words/:id` - 获取指定ID的词语

### 游戏相关

- `POST /api/game/guess` - 提交猜测
- `GET /api/statistics` - 获取游戏统计
- `GET /api/leaderboard` - 获取排行榜
- `POST /api/leaderboard` - 提交分数

## 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT 