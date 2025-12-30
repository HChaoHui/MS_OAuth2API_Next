## 项目介绍

搞这个项目主要是因为之前的 `MS_OAuth2API` 代码质量有点问题，维护起来越来越麻烦。  
所以在它的基础上做了优化，修复了一些bug，提升了代码质量和可维护性，这就是 `MS_OAuth2API_Next` 啦。  
有任何问题或建议，欢迎在项目仓库中提交 `issue`。  
或联系我: [z@unix.xin](mailto:z@unix.xin)  
体验地址: [https://mon.unix.xin/](https://mon.unix.xin/)


### 版本说明
- `MS_OAuth2API_Next` 只用来部署在服务器上
- `MS_OAuth2API` 后续只针对于 Vercel 版本更新

### 维护计划
- 要是微软更新了 OAuth2 的规则，`MS_OAuth2API` 的 Vercel 版本会同步维护
- 服务器版本的功能更新和bug修复，都会在 `MS_OAuth2API_Next` 里进行

下面是 `MS_OAuth2API_Next` 的一些功能和优势：

- 自动判断使用graph协议还是imap协议
    - graph协议: 微软的新协议，支持更多的功能，比如获取邮件附件、发送邮件等
    - imap协议: 微软的旧协议，支持的功能比较少
- 支持redis缓存，避免重复请求微软服务器，提高响应速度
- 支持传入proxy代理，防止服务器IP受限
    - 支持socks5代理(格式: `socks5://username:password@ip:port`)
    - 支持http代理(格式: `http://ip:port`)
    - 查询代理是否使用成功，可以通过`/api/test-proxy`接口，通过返回的IP是否与代理IP一致来判断
    - 支持默认代理池, 可以在API不传入代理的情况下，使用默认代理池中的代理（TODO 待实现）
- 支持邮箱验证，两种方式(TODO 待实现)
    - 规则验证(通过判断邮箱格式)
    - 精确验证(需要配合数据库，判断邮箱是否存在)
- 配套使用页面 + 客户端
    - 支持邮箱导入
    - 支持邮箱验证
    - 支持邮箱清空
    - 支持邮件查看
- 支持Docker部署(TODO 待实现)

### 使用说明
- 部署流程
    - 克隆项目到服务器 ` git clone https://github.com/HChaoHui/MS_OAuth2API_Next`
    - 进入项目目录 `cd MS_OAuth2API_Next`
    - 安装依赖 `npm install`
    - 配置环境变量 见`.env`
    - 启动项目 `npm run start`
    - 配套资源文件在 `web/MS_OAuth2API_Next_Web` 目录下，如需自定义，修改后打包即可，项目会读取`web/MS_OAuth2API_Next_Web/dist`目录下的文件
    - 修改请保留作者信息，谢谢

- Redis 配置
    - `USE_REDIS` 为 `1` 时，开启 Redis 缓存
    - `USE_REDIS` 为 `0` 时，关闭 Redis 缓存
    - `REDIS_HOST` 为 Redis 服务器地址
    - `REDIS_PORT` 为 Redis 服务器端口

## 📚 API 文档

### 获取最新的一封邮件

- **方法**: `GET/POST`
- **URL**: `/api/mail-new`
- **描述**: 获取最新的一封邮件。
- **参数说明**:
  - `refresh_token` (必填): 用于身份验证的 refresh_token。
  - `client_id` (必填): 客户端 ID。
  - `email` (必填): 邮箱地址。
  - `mailbox` (必填): 邮箱文件夹，支持的值为 `INBOX` 或 `Junk`。
  - `socks5` (可选): socks5 代理地址，格式为 `socks5://username:password@ip:port`。
  - `http` (可选): http 代理地址，格式为 `http://ip:port`。

### 获取全部邮件

- **方法**: `GET/POST`
- **URL**: `/api/mail-all`
- **描述**: 获取全部邮件。
- **参数说明**:
  - `refresh_token` (必填): 用于身份验证的 refresh_token。
  - `client_id` (必填): 客户端 ID。
  - `email` (必填): 邮箱地址。
  - `mailbox` (必填): 邮箱文件夹，支持的值为 `INBOX` 或 `Junk`。
  - `socks5` (可选): socks5 代理地址，格式为 `socks5://username:password@ip:port`。
  - `http` (可选): http 代理地址，格式为 `http://ip:port`。

### 清空收件箱

- **方法**: `GET/POST`
- **URL**: `/api/process-mailbox`
- **描述**: 清空收件箱。
- **参数说明**:
  - `refresh_token` (必填): 用于身份验证的 refresh_token。
  - `client_id` (必填): 客户端 ID。
  - `email` (必填): 邮箱地址。
  - `mailbox` (必填): 邮箱文件夹，支持的值为 `INBOX` 或 `Junk`。
  - `socks5` (可选): socks5 代理地址，格式为 `socks5://username:password@ip:port`。
  - `http` (可选): http 代理地址，格式为 `http://ip:port`。

### 代理测试

- **方法**: `GET/POST`
- **URL**: `/api/test-proxy`
- **描述**: 测试代理是否生效。
- **参数说明**:
  - `refresh_token` (必填): `任意字符串即可`。
  - `client_id` (必填): `任意字符串即可`。
  - `email` (必填): `任意字符串即可`。
  - `mailbox` (必填): `任意字符串即可`。
  - `socks5` (可选): socks5 代理地址，格式为 `socks5://username:password@ip:port`。
  - `http` (可选): http 代理地址，格式为 `http://ip:port`。