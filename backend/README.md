# 猫猫本地后端

## 启动

```powershell
cd backend
npm install
$env:MAOMAO_EMAIL = "demo@example.com"
$env:MAOMAO_PASSWORD = "change-me"
npm start
```

访问 `http://127.0.0.1:8080/`。默认静态资源来自上级目录的 `pulled-frontend/`。

## 账号流程

- 注册沿用参考页面的昵称、邮箱、密码三项，不要求邮件验证码；项目未配置邮件服务。
- 注册成功后自动建立登录会话。邮箱统一转为小写，重复邮箱会被拒绝。
- 密码使用 Node.js `scrypt` 加盐哈希保存，不会以明文写入账号文件。
- 账号和基础资料默认持久化到 `backend/data/accounts.json`。可通过 `MAOMAO_ACCOUNT_FILE` 指定其他存储路径。
- `MAOMAO_EMAIL` / `MAOMAO_PASSWORD` 配置的本地演示账号仍可登录；默认值仅用于本机开发。

## 技能数据

- `skill-catalog.js` 由参考站前端 bundle 生成：`python backend/tools/gen-skill-catalog.py`（需要同级目录有 `pulled-frontend/`）。不要手改，下次生成会覆盖。
- `battle-skills.js` 是战斗技能引擎：选技能/目标、数值求值、状态挂载与回合结算，另有参考站里写在控制流中的少数技能（驱散、惩戒、识破魔法、群体沉默…）的手写实现。

## 其他限制

这不是原站完整后端。账号可跨重启保留，但游戏进度、会话仍为内存数据；前端构建产物无法恢复原始数据库、邮件验证、定时任务、战斗结算、经济系统及全部 Socket.IO 业务规则。生产使用前需要接入正式数据库、持久化会话、CSRF/限流及实际邮件服务。