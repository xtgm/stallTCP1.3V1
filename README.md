# StallTCP1.32V2 节点订阅管理面板 (D1 数据库增强版)

**这是一个基于 Cloudflare Workers / Snippets 的高级节点订阅管理与分发系统。**

## 目录

- [项目介绍](#-项目介绍)
- [代码版本说明](#-代码版本说明)
- [界面预览](#️-界面预览)
- [懒人使用指南](#-懒人使用指南)
- [环境变量配置](#️-环境变量配置---部署必看)
  - [基础核心配置](#-基础核心配置)
  - [安全与通知配置](#️-安全与通知配置)
  - [节点来源配置](#-节点来源配置)
  - [界面链接配置](#-界面链接配置-可选)
  - [订阅转换配置](#-订阅转换配置-可选)
  - [绑定变量 (D1/KV)](#-绑定变量-d1kv)
  - [多值配置详细使用说明](#-多值配置详细使用说明)
- [D1 数据库配置](#-d1-数据库配置-推荐---性能更强)
- [KV 命名空间配置](#️-kv-命名空间配置-可选---兼容模式)
- [部署指南](#-部署指南)
  - [方式一：Worker / Pages 代码版](#方式一worker--pages-代码版-_workerjs)
  - [方式二：Snippets 代码版](#方式二snippets-代码版-snippetsjs)
- [安全增强配置](#️-安全增强配置)
- [功能特性详解](#-功能特性详解)
  - [重大更新 (Worker 版)](#-重大更新-worker-版)
  - [核心逻辑更新](#-核心逻辑更新)
  - [核心功能](#-核心功能)
  - [智能客户端识别与自动转换](#-智能客户端识别与自动转换)
  - [节点生成规则详解](#-节点生成规则详解)
- [SOCKS5/HTTP 代理配置详解](#-socks5http-代理配置详解)
- [UI 特性说明](#-ui-特性说明)
- [登录与安全](#-登录与安全)
- [白名单管理](#️-白名单管理)
- [动态配置](#️-动态配置)
- [自定义页面标题使用方法](#-自定义页面标题使用方法)
- [主题切换说明](#-主题切换说明)
- [动态 UUID 功能说明](#-动态-uuid-功能说明)
- [Cloudflare 统计功能说明](#-cloudflare-统计功能说明)
- [访问日志与统计详解](#-访问日志与统计详解)
  - [系统内部 API 接口](#-系统内部-api-接口flag-参数)
  - [订阅链接参数说明](#-订阅链接参数说明)
  - [默认配置链接](#-默认配置链接)
- [常见问题 FAQ](#-常见问题-faq)
- [特别感谢与致谢](#-特别感谢与致谢)
- [免责声明](#️-免责声明)

**源代码来自于AK的strllTCP1.32**

它集成了 **自适应订阅生成**、**优选IP自动负载均衡**、**智能白名单**、**Telegram 实时通知** 以及 **可视化的后台管理面板**。

**新增全局http** 、**全局socks5** 、**替换1.32核心逻辑、传输流**

---

## 📖 项目介绍

> **🌟 核心特性：**
> *   **无状态部署**：无需服务器，完全依托 Cloudflare 免费生态 (Workers + D1 + Pages)。
> *   **极致安全**：采用 **会话级强制登录** 机制，杜绝后台"闪屏"泄露；新增 **HTTP 安全响应头** (X-Frame-Options 等)，防止点击劫持攻击。
> *   **智能防死循环**：内置递归保护机制，防止因配置错误导致 Worker 自我请求炸库。
> *   **可视化管理**：后台直接管理白名单 IP、TG 通知配置、Cloudflare 统计配置，无需反复修改代码。
> *   **🆕 动态配置热更新**：支持在面板中直接修改并保存 TG Bot Token、Cloudflare API、优选 IP 库等关键配置（写入 D1/KV），无需重新部署代码。
> *   **🆕 白名单可视化管理**：支持在后台添加/删除允许访问的 IP (IPv4/IPv6)，配置后即时生效，防止未授权访问。
> *   **🆕 修改SUB跟远程在线编辑** ADD ADDAPI ADDCSV 跟上游SUB 两者只能二选一 使用上游SUB 远程编辑本地不生效，使用远程本地编辑 SUB禁止加任何数据【包括环境变量跟硬编码】目前 SUB我默认为空
> *   **🆕 修改ADD ADDAPI ADDCSV三合一共存体** 前置条件 没有设置SUB订阅器情况下可用 设置了SUB之后不可用

**配置优先级：环境变量 > D1数据库 > KV空间 > 本地硬编码**

### ⚙️ 配置加载优先级详解

系统采用四级配置加载机制，确保灵活性和安全性：

**优先级顺序（从高到低）：**
1. **环境变量 (Cloudflare Workers Variables)** - 最高优先级，适合敏感配置
2. **D1 数据库 (config 表)** - 后台保存的配置，支持热更新
3. **KV 存储空间** - 降级方案，兼容模式
4. **代码硬编码** - 默认值，最低优先级

**实际应用示例：**
- 如果同时设置了环境变量 `PROXYIP` 和后台配置的 ProxyIP，系统会使用环境变量的值
- 如果删除环境变量，系统会自动降级使用 D1 数据库中的配置
- 如果 D1 和 KV 都未配置，使用代码中的默认值
- 环境变量适合存储密钥等敏感信息，后台配置适合频繁修改的参数

---

## 📂 代码版本说明

本项目包含两套代码，请根据您的部署方式选择：

*   **Worker / Pages 部署 (推荐)**：请使用 **`_worker.js`** 代码。
    *   *UI 特效：高级毛玻璃风格*
    *   *新增特性：支持 D1 数据库高速读写、后台动态配置、强制安全登录*
*   **Snippets 部署**：请使用 **`snippets.js`** 代码。 【也支持worker部署】
    *   *UI 特效：紫色渐变风格*

---

## 🖼️ 界面预览

**Worker全新界面 / Snippets界面：**

<img width="1914" height="915" alt="image" src="https://github.com/user-attachments/assets/16f1042d-008a-4bf0-bfa5-a26eb5ceee69" />
<img width="1920" height="916" alt="image" src="https://github.com/user-attachments/assets/c066513e-27aa-4a8d-a4a1-61d377b74142" />
<img width="1920" height="911" alt="image" src="https://github.com/user-attachments/assets/b2fc6d97-3ba3-461b-9056-48db24b6e6ee" />
<img width="1916" height="912" alt="image" src="https://github.com/user-attachments/assets/f87c1b8a-6f80-4bbd-9aa1-717bb120301d" />
<img width="1913" height="906" alt="image" src="https://github.com/user-attachments/assets/592442d4-9f60-49ab-b42c-dc097e8fa35f" />
<img width="1914" height="913" alt="image" src="https://github.com/user-attachments/assets/56a879cf-d331-44dc-a5bd-5ba2a078432c" />
<img width="1920" height="919" alt="image" src="https://github.com/user-attachments/assets/912adef1-0b76-428b-8700-afee562611ce" />

---

## 🚀 懒人使用指南

> * **Snippets代码**：所有数据都需要在代码顶部【用户配置区域】进行修改
> * **Worker代码**：环境变量第一优先级，第二优先级为代码硬编码【在用户配置区域进行修改】
> * **默认使用SUB订阅器为优先**：有的人喜欢本地ADD那些花里花俏，有的人喜欢SUB，自己改
> * **默认什么都不改就是默认的**：我写入了支持proxyip作为节点，所以即便是默认值也依旧有一个节点使用
> * **所有教程都在github写了说明**：我希望你认真查看每一处

### 📚 图文教程

**stallTCPV2图文教程【与V1没有任何区别】：**

[stallTCPV1图文后台版](https://lh.hilh0923.hidns.co/lh/stallTCP1-3V1)

### 🖥️ 后台管理使用说明

访问 `https://worker你的域名` 自动跳转登录页。

---

## ⚙️ 环境变量配置 (Variables) - **🔥 部署必看**

**优先级顺序：环境变量 (Env) > D1 数据库 (后台保存) > KV 空间 > 代码默认配置**

> **推荐直接在 Cloudflare 后台 `Settings` -> `Variables` 中设置以下变量。**
>
> **如果不使用环境变量，请在代码中最顶端修改好用户配置区域**

### 🧱 基础核心配置

| 变量名 | 必填 | 说明 | 示例 | 支持多值 |
| :--- | :---: | :--- | :--- | :---: |
| **`UUID`** | ✅ | **主 UUID** (用户ID)，客户端连接凭证 | `06b65903-406d-4a41-8463-6fd5c0ee7798` | ❌ |
| **`KEY`** | 可选 | **动态 UUID 密钥** (启用后自动生成时效性 UUID)<br>*与 `UUID_REFRESH` 配合使用，增强安全性* | `my-secret-key-2024` | ❌ |
| **`UUID_REFRESH`** | 可选 | **UUID 刷新周期** (秒)，默认 86400 (24小时)<br>*需配合 `KEY` 使用，定期自动更换 UUID* | `86400` | ❌ |
| **`WEB_PASSWORD`** | ✅ | **后台登录密码** (务必设置复杂密码) | `admin888` | ❌ |
| **`SUB_PASSWORD`** | ✅ | **订阅路径密码** (访问 `https://域名/密码`) | `my-secret-sub` | ❌ |
| **`PROXYIP`** | ✅ | **默认优选域名/IP** (节点连接地址)<br>**✅ 支持多个，使用英文逗号分隔，系统自动轮询** | `cf.090227.xyz` 或<br>`ip1.com,ip2.com,ip3.net` | ✅ |
| **`SUB_DOMAIN`** | ✅ | **真实订阅源** (上游优选订阅生成器地址)<br>*自动清洗 `https://` 和尾部 `/`*<br>**✅ 支持多个，使用英文逗号分隔，自动故障切换** | `sub.cmliussss.net` 或<br>`sub1.com,sub2.com` | ✅ |
| **`SUBAPI`** | 可选 | **订阅转换后端** (用于 Sing-box/Clash 转换)<br>*自动补全 `https://`*<br>**✅ 支持多个，使用英文逗号分隔，自动故障切换** | `https://subapi.cmliussss.net` 或<br>`api1.com,api2.com` | ✅ |
| **`PS`** | 可选 | **节点备注** (自动追加到节点名称后)<br>*支持本地节点与上游订阅双重生效* | `【专线】` | ❌ |
| **`LOGIN_PAGE_TITLE`** | 可选 | **登录页面标题** (浏览器标签页显示的标题) | `Worker Login` | ❌ |
| **`DASHBOARD_TITLE`** | 可选 | **后台管理页面标题** (浏览器标签页显示的标题) | `烈火控制台 · Glass LH` | ❌ |
| **`DLS`** | 可选 | **ADDCSV 速度下限筛选阈值** (单位 KB/s)<br>*低于此速度的节点会被过滤，默认 5000* | `5000` | ❌ |

### 🛡️ 安全与通知配置

| 变量名 | 说明 | 示例 | 支持多值 |
| :--- | :--- | :--- | :---: |
| `TG_BOT_TOKEN` | **Telegram 机器人 Token** (后台也可配置) | `123456:ABC-DEF...` | ❌ |
| `TG_CHAT_ID` | **Telegram 用户 ID** (后台也可配置) | `123456789` | ❌ |
| `CF_ID` | Cloudflare Account ID (用于统计) | `e06...` | ❌ |
| `CF_TOKEN` | Cloudflare API Token (用于统计) | `Go...` | ❌ |
| `CF_EMAIL` | Cloudflare Email (Global Key 模式) | `user@example.com` | ❌ |
| `CF_KEY` | Cloudflare Global API Key | `868...` | ❌ |
| `WL_IP` | **静态白名单 IP** (免检，视为管理员)<br>**✅ 支持多个，使用英文逗号分隔** | `1.2.3.4` 或<br>`1.1.1.1,2.2.2.2` | ✅ |

### 🌍 节点来源配置

| 变量名 | 说明 | 格式说明 | 支持多值 |
| :--- | :--- | :--- | :---: |
| `ADD` | **本地优选 IP 列表** | 每行一个 IP，格式：`IP:端口#节点名称`<br>示例：`1.1.1.1:443#美国节点` | ✅ (换行分隔) |
| `ADDAPI` | **远程 TXT 优选列表** | 填入 URL，内容格式同 ADD (一行一个 IP)<br>**✅ 支持多个 URL，换行分隔** | ✅ (换行分隔) |
| `ADDCSV` | **远程 CSV 优选列表** | 填入 URL，支持高级节点信息导入<br>**✅ 支持多个 URL，换行分隔**<br>*配合 `DLS` 变量可过滤低速节点* | ✅ (换行分隔) |

### 🎨 界面链接配置 (可选)

| 变量名 | 说明 | 默认值 | 支持多值 |
| :--- | :--- | :--- | :---: |
| `TG_GROUP_URL` | **登录页交流群链接** | `https://t.me/zyssadmin` | ❌ |
| `SITE_URL` | **登录页网站链接** | `https://123.com/` | ❌ |
| `GITHUB_URL` | **登录页项目链接** | `https://github.com/xtgm/stallTCP1.3V1` | ❌ |
| `PROXY_CHECK_URL` | **后台 ProxyIP 检测跳转地址** | `https://kaic.hidns.co/` | ❌ |

### 📋 订阅转换配置 (可选)

| 变量名 | 说明 | 默认值 | 支持多值 |
| :--- | :--- | :--- | :---: |
| `CLASH_CONFIG` | **Clash 配置模板 URL** | ACL4SSR_Online_Full_MultiMode.ini | ❌ |
| `SINGBOX_CONFIG_V12` | **Sing-box v1.12.x 配置模板 URL** | sinspired/sub-store-template/1.12.x | ❌ |

### 🔗 绑定变量 (D1/KV)

| 变量名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `DB` | D1 数据库 | **D1 数据库绑定** (变量名必须为 `DB`，不可更改) |
| `LH` | KV 命名空间 | **KV 存储绑定** (变量名必须为 `LH`，不可更改) |

### 📝 多值配置详细使用说明

**以下变量支持配置多个值，实现负载均衡或故障切换功能：**

#### 1. `PROXYIP` - 多 ProxyIP 轮询负载均衡

**功能：** 系统会基于时间戳自动在多个 ProxyIP 之间轮询切换，实现负载均衡。

**格式：** 多个地址使用**英文逗号 `,`** 分隔

**示例：**
```
ProxyIP.US.CMLiussss.net,cf.090227.xyz,proxyip.example.com
```

**工作原理：**
- 系统使用 `Math.floor(Date.now() / 1000) % proxyIPs.length` 计算当前使用哪个 IP
- 每秒自动切换到下一个 IP（取模轮询）
- 所有 ProxyIP 地址会被自动 trim 去除空格

---

#### 2. `SUB_DOMAIN` - 多订阅源故障切换

**功能：** 当第一个订阅源不可用时，自动尝试下一个，实现高可用性。

**格式：** 多个域名使用**英文逗号 `,`** 分隔

**示例：**
```
sub.cmliussss.net,backup.example.com,sub3.proxy.net
```

**工作原理：**
- 系统按顺序尝试每个订阅源
- 自动清洗 `https://` 前缀和尾部 `/`
- 跳过与当前 Worker 域名相同的地址（防止死循环）
- 第一个成功响应的订阅源将被使用

---

#### 3. `SUBAPI` - 多订阅转换器故障切换

**功能：** 当第一个转换器不可用时，自动尝试下一个。

**格式：** 多个 URL 使用**英文逗号 `,`** 分隔

**示例：**
```
https://subapi.cmliussss.net,https://api.v1.mk,https://sub.xeton.dev
```

**工作原理：**
- 系统按顺序尝试每个转换 API
- 自动补全 `https://` 前缀
- 自动去除尾部 `/`
- 第一个成功响应的转换器将被使用

---

#### 4. `WL_IP` - 多白名单 IP 支持ipv4跟ipv6

**功能：** 设置多个管理员 IP，这些 IP 无需登录即可访问后台。

**格式：** 多个 IP 使用**英文逗号 `,`** 分隔

**示例：**
```
1.2.3.4,5.6.7.8,2001:db8::1
```

**说明：**
- 支持 IPv4 和 IPv6 地址
- 系统预设 IP 无法在后台删除
- 手动添加的 IP 可以在后台删除

---
#### 5. `ADD` / `ADDAPI` / `ADDCSV` - 多节点源

**功能：** 支持多行配置或多个远程 URL，所有节点会合并生成。

**ADD 格式：** 每行一个 IP，使用**换行符**分隔
```
1.1.1.1:443#美国CF
8.8.8.8:443#谷歌DNS
2606:4700:4700::1111:443#IPv6节点
```

**ADDAPI 格式：** 每行一个 URL，使用**换行符**分隔
```
https://example.com/ips.txt
https://backup.com/nodes.txt
```

**ADDCSV 格式：** 每行一个 URL，使用**换行符**分隔
```
https://example.com/优选IP.csv
https://backup.com/speed-test.csv
```

**ADDCSV 高级功能 - DLS 速度筛选：**
- CSV 文件格式：`IP,端口,TLS,数据中心,地区,城市,网络延迟,下载速度`
- 配合 `DLS` 环境变量设置速度下限（单位 KB/s）
- 下载速度低于 `DLS` 值的节点会被自动过滤
- 默认阈值为 5000 KB/s

---

### 🔄 环境变量配置完整示例

**Cloudflare Workers 环境变量设置示例：**

```plaintext
# 基础配置
UUID = 06b65903-406d-4a41-8463-6fd5c0ee7798
WEB_PASSWORD = MySecurePassword123
SUB_PASSWORD = my-sub-path

# 多 ProxyIP 轮询（逗号分隔）
PROXYIP = ProxyIP.US.CMLiussss.net,cf.090227.xyz,cdn.example.com

# 多订阅源故障切换（逗号分隔）
SUB_DOMAIN = sub.cmliussss.net,backup.sub.com

# 多转换器故障切换（逗号分隔）
SUBAPI = https://subapi.cmliussss.net,https://api.v1.mk

# 多白名单 IP（逗号分隔）
WL_IP = 192.168.1.1,10.0.0.1

# TG 通知
TG_BOT_TOKEN = 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TG_CHAT_ID = 987654321

# CF 统计
CF_ID = your-account-id
CF_TOKEN = your-api-token

# 节点备注
PS = 【专线】

# ADDCSV 速度筛选阈值
DLS = 3000
```


---

## 💾 D1 数据库配置 (推荐 - 性能更强)

**本版本支持 Cloudflare D1 (SQLite) 数据库，推荐使用以获得最佳体验。**

1.  **创建数据库**：
    *   在 Cloudflare 左侧菜单选择 **Workers & Pages** -> **D1**。
    *   点击 **创建数据库**，命名为 `sub_db` (或其他你喜欢的名字)。

2.  **初始化表结构 (必做)**：
    *   进入刚才创建的数据库，点击 **控制台 (Console)** 标签。
    *   复制以下 SQL 代码粘贴到控制台并点击 **Execute (执行)**：
```      
CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS whitelist (ip TEXT PRIMARY KEY, created_at INTEGER);
CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, time TEXT, ip TEXT, region TEXT, action TEXT);
CREATE TABLE IF NOT EXISTS stats (date TEXT PRIMARY KEY, count INTEGER DEFAULT 0);
```

3.  **绑定变量**：
    *   回到你的 Worker 项目设置。
    *   点击 **设置** -> **变量** -> **D1 数据库绑定**。
    *   变量名称：**`DB`** (必须大写，不能改名)。
    *   选择刚才创建的数据库。
    *   **保存并部署**。

---

## 🗄️ KV 命名空间配置 (可选 - 兼容模式)

**如果您不想配置 D1，系统支持自动降级使用 KV 存储配置和白名单。**

1.  在 Cloudflare 左侧菜单选择 **Workers & Pages** -> **KV**。
2.  点击 **创建命名空间 (Create a Namespace)**，命名为 `BLACKLIST`（或任意名称）。
3.  回到你的 Worker/Pages/Snippet 项目设置页：
    *   **Workers/Pages**：`设置` -> `变量` -> `KV 命名空间绑定`。
4.  点击 **添加绑定**：
    *   **变量名称 (Variable name)**: `LH` (⚠️必须填这个，不能改)
    *   **KV 命名空间**: 选择你刚才创建的空间。
5.  **保存并重新部署**。

---

## 🚀 部署指南

### 方式一：Worker / Pages 代码版 (`_worker.js`)

**适用场景：Cloudflare Workers 或 Cloudflare Pages**

#### A. Cloudflare Workers 部署 (最简单)
1.  登录 Cloudflare Dashboard。
2.  找到 **计算 (Workers & Pages)** -> **概述**。
3.  选择 **从 Hello World! 开始**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/2b80a97b-ee57-42a8-be1a-8180254f54dc" />
4.  输入任意名称，点击 **部署**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/b26217ed-d17c-465d-bcbd-b232ab5a4fd0" />
5.  在 Workers 列表找到刚部署的项目，点击 **编辑代码**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/a7f0c75a-56c3-467b-a07f-d37cafb8dd6c" />
6.  **清空**原有代码，将项目中的 **`_worker.js`** 内容完整复制粘贴进去。
7.  点击右上角 **保存并部署**。

#### B. Cloudflare Pages 部署

**注意：修改任何内容都需要重新上传一次代码**

1.  登录 Cloudflare -> **Workers 和 Pages**。
    <img width="600" alt="image" src="https://github.com/user-attachments/assets/75c41546-cc6a-4a2f-9fa5-3632f0d89104" />
2.  点击 **创建应用程序**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/6ddd7c84-4a4f-4ddc-bd41-f2d550139999" />
3.  点击下方的 **Get started** 跳转到 Pages 界面。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/f5fdaa8d-d86a-471e-93de-9107db440443" />

**方法 1：GitHub 自动同步 (推荐)**
1.  选择 **连接到 Git**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/8932221a-6480-491d-baf9-a26fc67a852b" />
2.  选择你 Fork 的 GitHub 仓库。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/2518c4e5-8503-4b4c-80f9-6ca06dfb0df9" />
3.  **特别注意**：后续修改内容要在 GitHub 上的 `_worker.js` 进行修改，之后会自动同步到 Pages。
4.  点击 **开始设置**，然后 **保存并部署**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/1c215f82-98fc-42d0-aed5-2bd032e3b859" />

**方法 2：直接上传**
1.  选择 **上传资产**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/5f823410-7308-4425-9e77-a66646235e00" />
2.  输入项目名称，点击创建。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/c10dc676-a06a-4a6b-bc62-f24239f454b0" />
3.  上传包含 `_worker.js` 的 **Zip 压缩包** 或 **文件夹**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/5dec9d85-9fcb-4b95-89c6-a7d8c57be661" />
4.  点击 **部署站点**。

---

### 方式二：Snippets 代码版 (`snippets.js`)

**适用场景：已有域名托管在 Cloudflare，想利用 Snippets 功能**

1.  进入 Cloudflare Dashboard，点击你的**域名**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/2483c2b7-3bb2-4cac-bdd6-38f8b31f4329" />
2.  在左侧菜单找到 **规则 (Rules)** -> **Snippets**，点击 **创建片段**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/9059a47d-77da-4ba4-82cc-03e8a8638c0f" />
3.  输入片段名称。
4.  将项目中的 **`snippets.js`** 内容完整复制粘贴进去。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/f163e9ef-989b-4645-8ebc-eadf755f4b23" />
5.  **设置触发规则**：
    *   选择 **自定义规则**。
    *   字段：`主机名 (Hostname)`
    *   运算符：`等于 (equals)`
    *   值：你的子域名 (例如 `sub.yourdomain.com`)
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/1f858efe-a6ce-4bf6-8d62-0bfc462ef2b3" />
6.  点击 **创建片段** 保存。
7.  **配置 DNS (重要)**：
    *   前往 **DNS** 设置页，添加一条 **A 记录**。
    *   **名称**：填写上面设置的子域名 (例如 `sub`)。
    *   **IPv4 地址**：`192.0.2.1` (保留地址，仅作占位用)。
    *   **代理状态**：必须开启 **小黄云 (Proxied)**。
    <img width="600" alt="image" src="https://github.com/user-attachments/assets/f88ad346-30aa-41ef-9f7c-deb2453afbfe" />

---

## 🛡️ 安全增强配置

###  🤖 开启机器人战斗模式 (Bot Fight Mode)

*   **路径**: Cloudflare Dashboard -> 域名 -> Security (安全性) -> 设置 (Settings)。
    <img width="1591" height="383" alt="image" src="https://github.com/user-attachments/assets/34fbcf37-502f-43b8-963a-628d30e4066a" />
    <img width="257" height="207" alt="image" src="https://github.com/user-attachments/assets/1eaad26e-35fd-4b3a-bd6d-fd544c410d09" />
*   **操作**: 在安全性设置页面的下方找到 **"自动程序攻击模式" (Bot Fight Mode)**，开启开关。
    <img width="979" height="722" alt="image" src="https://github.com/user-attachments/assets/b8bc895f-abc3-4e83-b548-0ab85f82d0b0" />
*   **作用**: 自动拦截已知的恶意爬虫和脚本小子，减少垃圾流量。

### 🛡️ 内置爬虫拦截机制

系统内置智能爬虫识别，自动拦截以下 User-Agent：

**拦截列表：**
- `spider` - 搜索引擎爬虫
- `bot` - 机器人
- `python` - Python 脚本
- `scrapy` - Scrapy 爬虫框架
- `curl` - 命令行工具
- `wget` - 下载工具

**拦截行为：**
- 返回 `404 Not Found`，不记录日志
- 不发送 TG 通知，避免刷屏
- 节省 Worker 请求配额

**注意事项：**
- 如果您使用 `curl` 或 Python 脚本测试订阅链接，可能会被拦截
- 建议使用浏览器或代理客户端进行测试
- 如需调试，可临时注释代码中的 UA 检测逻辑

---

## ✨ 功能特性详解

### 🆕 重大更新 (Worker 版)

*   **🗄️ D1 数据库支持**：完美支持 Cloudflare D1 (SQLite)，日志记录更全，统计更准，无 KV 写入限制。
*   **🎨 全新玻璃态 UI 设计**：
    *   **星空背景特效**：200+ 闪烁星星 + 8 颗真实流星雨动画，营造沉浸式视觉体验。
    *   **玻璃碎片动画**：6 个动态浮动的毛玻璃碎片，增强科技感。
    *   **双主题切换**：支持深色星空主题和浅色天空主题，一键切换。
    *   **幻彩渐变文字**：Logo 和菜单栏采用动态渐变 + 霓虹发光效果。
    *   **3D 旋转球体统计**：首页请求统计采用 3D 圆环球体设计，数字自适应大小防止溢出。
    *   **响应式布局**：完美适配桌面（1080p/2K/4K）、平板（iPad/iPad Pro）、手机（iPhone SE/标准/Plus）全平台。
    *   **侧边栏导航**：左侧固定侧边栏 + 右上角工具栏，操作更便捷。
*   **🎯 自定义页面标题**：
    *   支持通过环境变量 `LOGIN_PAGE_TITLE` 和 `DASHBOARD_TITLE` 自定义登录页和后台页面的浏览器标签标题。
    *   优先级：环境变量 > D1 数据库 > KV 存储 > 代码默认值。
*   **🔐 强制安全登录 (防闪屏)**：
    *   采用 **会话级** 验证机制。
    *   **防闪屏修复**：后台页面默认隐藏，只有鉴权通过后才显示，杜绝加载瞬间的数据泄露。
    *   **自动退出**：关闭浏览器或标签页即自动退出登录，每次进入后台均需重新验证。
    *   **XSS 防御**：新增 HTTP 响应头 (X-Frame-Options, X-Content-Type-Options) 策略，防止管理面板被恶意嵌入。
*   **🛡️ 白名单机制**：
    *   **自动记录**：登录成功的管理员 IP 会自动加入临时白名单。
    *   **可视化管理**：后台可手动添加/删除白名单 IP，支持 IPv4/IPv6，确保只有授权设备能访问后台接口。
*   **🤖 智能通知系统**：
    *   **静默模式**：自动过滤爬虫扫描，只有管理员登录或操作时才发送通知，告别刷屏。
    *   **UA 拦截**：自动拦截 `bot`, `spider`, `python`, `curl` 等常见爬虫 User-Agent。
*   **💡 状态指示灯**：后台直观显示 TG 推送和 CF 统计的配置状态（绿灯/红灯）。

### 🔄 核心逻辑更新

> * **新增socks5全局 https全局代理**
> * **替换stallTCP1.32核心逻辑，其他不变。**
> * **更新传输效果更加，解决telegram加载图上传图卡顿问题。**
> * **优化YouTube传输性能更强。**
> * **🆕 SOCKS5/HTTP 代理连接**
> * **🆕 全局和局部代理切换**
> * **🆕 IPv6 完整支持**
> * **🆕 智能连接重试机制**
> * **🆕 自适应传输模式**
> * **🆕 代理认证支持**

**核心逻辑调整：实现了 "二选一互斥" 逻辑。**
> * 优先级判定：代码会先检查 SUB_DOMAIN（无论是环境变量还是硬编码）。
> * 情况A（有上游）：如果 SUB_DOMAIN 存在且不为空，只执行上游订阅逻辑。完全忽略本地的 ADD/ADDAPI/ADDCSV。
> * 情况B（无上游）：只有当 SUB_DOMAIN 被清空（删除环境变量 + 代码留空）时，才会降级去执行本地 ADD 节点的生成逻辑。
> * Base64 识别保留：无论走哪条路，都会经过 Base64 客户端识别（Clash/Singbox 自动转换），保持自适应功能。

### 📱 核心功能

*   **🚀 自适应订阅**：自动识别以下客户端并返回对应格式：
    *   **支持列表**：Clash, Sing-box, Mihomo, Flclash, V2rayNG, Surge, Quantumult X, Shadowrocket, Loon, Hiddify 全平台主流客户端等。
*   **🌍 优选 IP 支持**：支持环境变量。支持在线编辑
*   **📊 可视化后台**：
    *   直接在后台修改和保存 TG/CF/优选IP 配置（优先于硬编码，无需重新部署）。
    *   查看 Cloudflare 今日 API 请求量。
    *   查看最近 50 条访问日志（从 D1/KV 读取）。
    *   集成 ProxyIP 连通性检测。

### 🎯 智能客户端识别与自动转换

系统会根据 User-Agent 自动识别客户端类型并返回对应格式：

**自动转换规则：**
- **Clash/Meta 客户端**：自动调用订阅转换 API，返回 Clash 配置
- **Sing-box 客户端**：自动调用订阅转换 API，返回 Sing-box 配置（v1.12.x）
- **其他客户端**（V2rayNG、Shadowrocket 等）：返回标准 Base64 编码的节点列表

**支持的配置模板：**
- **Clash 配置**：`ACL4SSR_Online_Full_MultiMode.ini`
- **Sing-box v1.12.x**：最新模板（默认使用）
- **Sing-box v1.11.x**：兼容模板（代码中已定义）

**识别的客户端列表：**
- Mihomo, Flclash, Clash, Meta, Stash
- Sing-box, Singbox, SFI, Box
- V2rayN, V2ray Core
- Surge
- Quantumult X
- Shadowrocket
- Loon
- Hiddify, Happ

**工作流程：**
1. 用户访问快速订阅链接（`/订阅密码`）
2. 系统检测 User-Agent 判断客户端类型
3. 如果是 Clash/Sing-box，自动调用转换 API
4. 如果是其他客户端，返回 Base64 编码的节点列表
5. 支持追加 `PS` 备注到所有节点名称

### 📡 节点生成规则详解

**默认节点生成：**
- 如果未配置 `ADD`/`ADDAPI`/`ADDCSV`，系统会生成一个默认节点
- 默认节点使用 `PROXYIP` 作为连接地址
- 节点名称格式：`Worker - Default` 或 `${PS} - Default`

**自定义节点格式：**
- **ADD 格式**：`IP:端口#节点名称`（一行一个）
  ```
  1.1.1.1:443#美国节点
  8.8.8.8:443#香港节点
  ```
- **ADDAPI 格式**：远程 TXT 文件 URL，内容格式同 ADD
  ```
  https://example.com/ips.txt
  ```
- **ADDCSV 格式**：远程 CSV 文件 URL，只读取第一列（IP:端口）
  ```
  https://example.com/优选IP.csv
  ```

**节点备注（PS）功能：**
- 如果设置了 `PS` 环境变量，会自动追加到所有节点名称后面
- 支持本地节点和上游订阅双重生效
- 示例：`PS=【专线】` → 节点名称变为 `美国节点 【专线】`

**节点优先级：**
1. 如果配置了 `SUB_DOMAIN`（上游订阅），忽略本地节点配置
2. 如果未配置 `SUB_DOMAIN`，按顺序读取 ADD → ADDAPI → ADDCSV
3. 三种方式可以同时使用，节点会合并生成

---

## 🔧 SOCKS5/HTTP 代理配置详解

### 1. 完整代理支持
- **SOCKS5 代理**：支持用户名/密码认证
- **HTTP 代理**：支持 CONNECT 方法和 Basic 认证
- **全局代理**：整个 Worker 走代理（格式：`socks5://user:pass@host:port`）
- **局部代理**：单个连接走代理（格式：`/s5=user:pass@host:port`）

### 2. 高级地址解析
- **IPv4 支持**：标准 IPv4 地址解析
- **IPv6 支持**：完整 IPv6 地址解析（包括 `[::1]:443` 格式）
- **域名解析**：支持域名和端口组合
- **Base64 认证**：支持 Base64 编码的用户名密码

### 3. 智能连接处理
- **自适应模式**：根据网络状况自动调整传输策略
- **缓冲模式**：小数据包批量发送，减少延迟
- **直连模式**：大数据包直接发送，提高吞吐量
- **智能重连**：带评分系统的指数退避重连机制

### 4. 代理配置格式

#### 全局代理（整个 Worker）
```
socks5://user:pass@proxy.example.com:1080
socks://user:pass@proxy.example.com:1080
http://user:pass@proxy.example.com:8080
```

#### 局部代理（单个连接）
```
/s5=user:pass@proxy.example.com:1080
/socks5=user:pass@proxy.example.com:1080
/http=user:pass@proxy.example.com:8080
/s5=base64encoded@proxy.example.com:1080
```

#### ProxyIP（优选 IP）
```
/proxyip=1.1.1.1:443
/ip=8.8.8.8:443
/proxyip=[2606:4700:4700::1111]:443
```

### 5. 性能优化

**自适应传输模式**
- **缓冲模式**：吞吐量 < 8MB/s 或平均包大小 < 4KB
- **直连模式**：吞吐量 > 16MB/s 且平均包大小 > 12KB
- **自适应模式**：介于两者之间，动态调整

**智能重连机制**
- 基于评分系统（0.1 - 1.0）
- 指数退避算法（50ms - 3000ms）
- 随机抖动避免雷鸣群效应
- 最大重连次数：24 次

**内存池优化**
- 16KB 预分配缓冲区
- 对象复用池（最多 8 个）
- 自动释放和重置

### 6. 安全特性

**代理认证**
- SOCKS5 用户名/密码认证
- HTTP Basic 认证
- Base64 编码支持

**连接保护**
- 最大待发送数据：2MB
- 连接超时检测：8 秒
- 最大停滞次数：12 次
- Keep-alive 心跳：15 秒

---

### 🎨 UI 特性说明

**登录页面：**
*   **星空背景**：200 颗动态闪烁星星，营造沉浸式夜空效果。
*   **流星雨特效**：8 颗流星以真实轨迹划过屏幕，循环播放。
*   **玻璃碎片**：6 个毛玻璃碎片缓慢浮动，增强科技感。
*   **自定义标题**：可通过环境变量 `LOGIN_PAGE_TITLE` 修改浏览器标签页标题。

**后台管理页面：**
*   **侧边栏导航**：左侧固定侧边栏，包含 Logo 和 5 个主菜单（控制台、订阅、白名单、自定义节点、日志）。
*   **右上角工具栏**：包含主题切换、TG 通知配置、CF 统计配置、退出登录 4 个按钮。
*   **双主题模式**：
    *   **深色主题**：深蓝星空背景 + 幻彩渐变文字 + 霓虹发光效果。
    *   **浅色主题**：天空蓝渐变背景 + 深色文字 + 柔和视觉效果。
*   **3D 球体统计**：首页采用 3 层旋转圆环球体展示今日请求数，数字自适应大小防止溢出。
*   **响应式设计**：完美适配所有设备（桌面/平板/手机），支持 50%-200% 缩放。
*   **自定义标题**：可通过环境变量 `DASHBOARD_TITLE` 修改浏览器标签页标题。

### 🔐 登录与安全

*   **🔒 强制安全登录**：
    *   **会话级验证**：关闭浏览器标签页或刷新页面（视缓存策略而定）会自动退出登录。
    *   **未设置密码保护**：如果未设置 `WEB_PASSWORD`，系统会强制显示登录页且无法进入，防止后台裸奔。
    *   **防闪屏机制**：页面默认隐藏，验证通过后才显示内容，杜绝数据泄露。

### 🔐 会话管理机制详解

**登录流程：**
1. 用户在登录页输入密码
2. 系统设置 Cookie：`auth=密码`（路径：`/`，SameSite=Lax）
3. 同时在 `sessionStorage` 中设置 `is_active=1` 标记
4. 页面加载时检查 `sessionStorage`，如果不存在则清除 Cookie

**自动退出触发条件：**
- 关闭浏览器标签页（sessionStorage 被清除）
- 刷新页面时 sessionStorage 不存在
- 手动点击右上角退出按钮
- Cookie 过期或被清除

**安全特性：**
- Cookie 使用 `SameSite=Lax` 防止 CSRF 攻击
- 页面默认隐藏（`display:none; opacity:0`），验证通过后才显示
- 所有敏感操作（白名单管理、配置保存）需要验证 Cookie 或白名单 IP
- 登录成功的 IP 自动加入临时白名单，下次访问无需重复登录

**防闪屏实现：**
```javascript
// 页面默认隐藏
body { display: none; opacity: 0; }

// 验证通过后显示
body.loaded { display: block; opacity: 1; }
```

**会话保持机制：**
- 只要不关闭标签页，sessionStorage 会一直保持
- 刷新页面时会检查 sessionStorage，存在则保持登录状态
- 关闭标签页后重新打开，需要重新登录

---

### 🛡️ 白名单管理

*   **查看**: 点击 "刷新" 按钮查看当前数据库中的白名单 IP。
*   **添加**: 输入 IP 地址点击 "添加白名单" 即可，无需重启。
*   **删除**: 点击列表右侧的 "删除" 按钮。
*   *注：系统内置的白名单 IP (环境变量 `ADMIN_IP` 或 `WL_IP`) 无法在后台删除。*

### ⚙️ 动态配置

*   **保存配置**: 在 "🛠️ 优选 IP 与 远程配置" 或 Telegram/CF 弹窗中修改内容后，点击保存。
*   数据将写入 D1/KV，优先级高于代码中的默认值。
*   **检测**: 支持检测 ProxyIP 可用性，支持测试订阅链接连通性。

### 🎯 自定义页面标题使用方法

**方法 1：通过环境变量设置（推荐）**

在 Cloudflare Workers 后台 `设置` -> `变量` 中添加：

```
LOGIN_PAGE_TITLE = 我的专属登录页
DASHBOARD_TITLE = 我的管理控制台
```

**方法 2：通过 D1 数据库设置**

在 D1 数据库控制台执行：

```sql
INSERT INTO config (key, value) VALUES ('LOGIN_PAGE_TITLE', '我的专属登录页');
INSERT INTO config (key, value) VALUES ('DASHBOARD_TITLE', '我的管理控制台');
```

**方法 3：通过 KV 存储设置**

在 KV 命名空间中添加键值对：
- 键：`LOGIN_PAGE_TITLE`，值：`我的专属登录页`
- 键：`DASHBOARD_TITLE`，值：`我的管理控制台`

**方法 4：修改代码默认值**

在代码顶部用户配置区域修改：

```javascript
const LOGIN_PAGE_TITLE = "我的专属登录页";
const DASHBOARD_TITLE = "我的管理控制台";
```

**优先级：环境变量 > D1 数据库 > KV 存储 > 代码默认值**

### 🎨 主题切换说明

*   点击右上角 **🌗** 按钮即可在深色/浅色主题间切换。
*   **深色主题**：适合夜间使用，星空背景 + 幻彩文字。
*   **浅色主题**：适合白天使用，天空蓝背景 + 深色文字，护眼不刺眼。
*   主题设置保存在浏览器本地，下次访问自动应用。

---

## 🔐 动态 UUID 功能说明

**动态 UUID 是一项高级安全特性，可定期自动更换客户端连接凭证，防止 UUID 泄露后长期被滥用。**

### 启用方法

在 Cloudflare Workers 后台 `设置` -> `变量` 中添加：

```
KEY = my-secret-key-2024
UUID_REFRESH = 86400
```

### 工作原理

*   系统使用 `KEY` 和当前时间戳生成动态 UUID（SHA-256 哈希）。
*   每隔 `UUID_REFRESH` 秒（默认 86400 秒 = 24 小时），UUID 自动更换。
*   客户端需要在 UUID 过期前更新订阅，获取新的 UUID。

### 注意事项

*   **启用后，原有的 `UUID` 环境变量将被忽略**，系统完全使用动态生成的 UUID。
*   **客户端必须定期更新订阅**（建议设置自动更新间隔 < `UUID_REFRESH` 值）。
*   **不建议设置过短的刷新周期**（< 3600 秒），可能导致客户端频繁断线。
*   **`KEY` 值务必保密**，泄露后攻击者可计算出所有历史和未来的 UUID。

### 适用场景

*   **高安全需求**：需要定期轮换凭证的企业或个人用户。
*   **防止滥用**：UUID 不慎泄露后，可通过更换 `KEY` 立即失效所有旧 UUID。
*   **多用户管理**：为不同用户分配不同 `KEY`，实现独立的 UUID 轮换策略。

### 禁用方法

删除 `KEY` 环境变量，系统将恢复使用静态 `UUID`。

---

## 📊 Cloudflare 统计功能说明

**系统支持两种统计方式查询今日请求数：**

### 方式 1：Cloudflare API 统计（推荐）

*   **优势**：数据最准确，包含 Workers 和 Pages 的所有请求。
*   **配置方法**：
    *   **方案 A**：使用 Account ID + API Token（推荐）
        ```
        CF_ID = your-account-id
        CF_TOKEN = your-api-token
        ```
    *   **方案 B**：使用 Email + Global API Key
        ```
        CF_EMAIL = your@email.com
        CF_KEY = your-global-api-key
        ```
*   **权限要求**：API Token 需要 `Account Analytics:Read` 权限。
*   **查询范围**：自动查询当日 00:00 UTC 至当前时间的所有请求。

### 方式 2：D1 内部统计（备用）

*   **优势**：无需配置 API，自动累加。
*   **局限**：仅统计经过 Worker 处理的请求，不包括 CDN 缓存命中的请求。
*   **存储位置**：D1 数据库 `stats` 表，按日期分组。
*   **自动清理**：无自动清理机制，需手动维护。

### 后台显示逻辑

*   **优先显示 API 统计**：如果配置了 CF API 凭证且验证通过，显示 API 查询结果（标注 "API"）。
*   **降级显示 D1 统计**：如果未配置或 API 查询失败，显示 D1 内部统计（标注 "Internal"）。

---

## 📝 访问日志与统计详解

### 访问日志功能

**系统自动记录所有关键操作，帮助管理员监控访问情况。**

#### 记录内容

*   **时间戳**：北京时间（Asia/Shanghai 时区）
*   **访问者 IP**：客户端真实 IP（通过 `cf-connecting-ip` 获取）
*   **地理位置**：城市 + 国家代码（通过 Cloudflare 提供的 `r.cf.city` 和 `r.cf.country`）
*   **操作类型**：
    *   `登录后台`：管理员成功登录后台管理面板
    *   `订阅更新`：客户端访问快速订阅路径（`/订阅密码`）
    *   `常规订阅`：客户端访问标准订阅接口（`/sub?uuid=...`）

#### 存储方式

*   **优先级 1**：D1 数据库 `logs` 表（推荐）
    *   表结构：`id, time, ip, region, action`
    *   自动清理：保留最新 1000 条记录
*   **优先级 2**：KV 存储 `ACCESS_LOGS` 键（降级方案）
    *   格式：纯文本，每行一条记录，用 `|` 分隔字段

#### 后台查看

*   进入 "📋 日志" 面板查看最近 50 条记录
*   支持手动刷新和自动刷新（每 5 秒）
*   日志按时间倒序排列（最新的在最上方）

### 每日统计功能

**系统自动统计每日访问量，支持跨日查询。**

#### 统计逻辑

*   每次访问（包括登录、订阅更新、常规订阅）自动累加计数
*   按日期分组存储（格式：`YYYY-MM-DD`）
*   使用 D1 数据库 `stats` 表的 `INSERT ... ON CONFLICT` 语法实现原子性累加

#### 数据结构

```sql
CREATE TABLE stats (
    date TEXT PRIMARY KEY,      -- 日期（YYYY-MM-DD）
    count INTEGER DEFAULT 0     -- 当日请求数
);
```

#### 查询方式

*   **后台首页**：3D 球体实时显示今日请求数
*   **API 查询**：访问 `?flag=stats` 获取 JSON 格式统计数据
*   **Cloudflare API**：如果配置了 CF 凭证，优先显示 API 统计（更准确）

### 🔗 系统内部 API 接口（Flag 参数）

系统提供了一系列内部 API 接口，通过 `?flag=xxx` 参数调用：

**统计与查询接口：**
- `?flag=stats` - 获取统计数据（JSON 格式）
  - 返回：今日请求数、当前 IP、地理位置、存储状态
- `?flag=get_logs` - 获取访问日志（需登录）
  - 返回：最近 50 条日志记录
- `?flag=get_whitelist` - 获取白名单列表（需登录）
  - 返回：所有白名单 IP 及类型（系统/手动）

**配置管理接口：**
- `?flag=add_whitelist` - 添加白名单 IP（POST，需登录）
  - 参数：`{"ip": "1.2.3.4"}`
- `?flag=del_whitelist` - 删除白名单 IP（POST，需登录）
  - 参数：`{"ip": "1.2.3.4"}`
- `?flag=save_config` - 保存配置到 D1/KV（POST，需登录）
  - 参数：`{"KEY": "VALUE", ...}`

**验证接口：**
- `?flag=validate_tg` - 验证 TG 配置（POST）
  - 参数：`{"TG_BOT_TOKEN": "xxx", "TG_CHAT_ID": "xxx"}`
  - 会发送测试消息到 Telegram
- `?flag=validate_cf` - 验证 CF 配置（POST）
  - 参数：`{"CF_ID": "xxx", "CF_TOKEN": "xxx", ...}`
  - 返回验证结果和请求统计

**日志记录接口：**
- `?flag=log_proxy_check` - 记录 ProxyIP 检测日志
- `?flag=log_sub_test` - 记录订阅测试日志
- `?flag=github` - 记录 GitHub 项目点击

**使用示例：**
```javascript
// 获取统计数据
fetch('https://your-worker.com?flag=stats')
  .then(res => res.json())
  .then(data => console.log(data));

// 添加白名单
fetch('https://your-worker.com?flag=add_whitelist', {
  method: 'POST',
  body: JSON.stringify({ip: '1.2.3.4'})
});
```

### 🔗 订阅链接参数说明

**快速订阅路径：**
- `https://域名/订阅密码` - 快速订阅（自动识别客户端）
- `https://域名/订阅密码?proxyip=1.1.1.1:443` - 指定优选 IP

**标准订阅接口：**
- `https://域名/sub?uuid=xxx` - 基础订阅
- `https://域名/sub?uuid=xxx&proxyip=1.1.1.1:443` - 指定优选 IP
- `https://域名/sub?uuid=xxx&path=/proxyip=1.1.1.1:443` - 路径中指定优选 IP

**支持的参数：**
- `uuid` - 用户 UUID（必填）
- `proxyip` - 优选 IP 地址
- `path` - WebSocket 路径（可包含 proxyip）
- `encryption` - 加密方式（默认 none）
- `security` - 传输安全（默认 tls）
- `sni` - SNI 域名
- `alpn` - ALPN 协议（默认 h3）
- `fp` - 指纹（默认 random）
- `allowInsecure` - 允许不安全连接（默认 1）
- `type` - 传输类型（默认 ws）
- `host` - Host 头

### 🔗 默认配置链接

系统使用以下默认配置链接，可在代码中修改：

**订阅转换配置：**
- **Clash 配置模板**：
  ```
  https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_Full_MultiMode.ini
  ```
- **Sing-box v1.12.x 模板**：
  ```
  https://raw.githubusercontent.com/sinspired/sub-store-template/main/1.12.x/sing-box.json
  ```
- **Sing-box v1.11.x 模板**（兼容）：
  ```
  https://raw.githubusercontent.com/sinspired/sub-store-template/main/1.11.x/sing-box.json
  ```

**外部服务链接：**
- **ProxyIP 检测网站**：`https://kaic.hidns.co/`
- **TG 交流群**：`https://t.me/zyssadmin`
- **TG 频道**：`https://t.me/cloudflareorg`

**修改方法：**
在代码顶部用户配置区域找到以下常量并修改：
```javascript
const CLASH_CONFIG = "你的Clash配置URL";
const SINGBOX_CONFIG_V12 = "你的Singbox配置URL";
const PROXY_CHECK_URL = "你的检测网站URL";
```

---

## 🔧 常见问题 FAQ

### Q1: 动态 UUID 和静态 UUID 有什么区别？

*   **静态 UUID**：固定不变，配置一次永久有效，适合个人使用。
*   **动态 UUID**：定期自动更换（默认 24 小时），需要客户端定期更新订阅，适合高安全需求场景。

### Q2: 为什么后台显示的请求数和实际不符？

*   **D1 内部统计**：只统计经过 Worker 处理的请求，不包括 CDN 缓存命中的请求。
*   **Cloudflare API 统计**：包含所有请求（Workers + Pages + 缓存），数据更准确，建议配置 CF API 凭证。

### Q3: 白名单 IP 无法删除怎么办？

*   **系统预设 IP**（来自环境变量或硬编码）无法在后台删除，需要修改环境变量或代码。
*   **后台配置 IP**（手动添加）可以随时删除。

### Q4: TG 通知配置后没有收到消息？

*   检查 Bot Token 和 Chat ID 是否正确。
*   使用后台 "验证" 功能测试配置有效性。
*   确认 Bot 已启动（向 Bot 发送 `/start` 命令）。
*   检查是否被 Telegram 限流（短时间内发送过多消息）。

### Q5: Cloudflare API 统计配置后显示 "验证失败"？

*   **方案 A**：确认 Account ID 和 API Token 正确，Token 需要 `Account Analytics:Read` 权限。
*   **方案 B**：确认 Email 和 Global API Key 正确。
*   检查 API Token 是否过期或被撤销。

### Q6: 订阅链接无法访问或返回空内容？

*   检查 `SUB_PASSWORD` 是否正确（区分大小写）。
*   检查 `SUB_DOMAIN` 配置是否正确（上游订阅源地址）。
*   如果使用本地 ADD 节点，确保 `SUB_DOMAIN` 为空或未配置。
*   查看后台日志，确认是否有错误记录。

### Q7: 如何切换使用上游订阅或本地节点？

*   **使用上游订阅**：配置 `SUB_DOMAIN` 环境变量，系统会忽略 ADD/ADDAPI/ADDCSV。
*   **使用本地节点**：清空 `SUB_DOMAIN`（删除环境变量或留空），配置 ADD/ADDAPI/ADDCSV。
*   **两者互斥**：不能同时生效，优先使用上游订阅。

### Q8: D1 数据库和 KV 存储有什么区别？

*   **D1 数据库**：关系型数据库（SQLite），支持复杂查询，性能更好，推荐使用。
*   **KV 存储**：键值存储，简单易用，适合存储少量配置数据，作为 D1 的降级方案。
*   **优先级**：系统优先使用 D1，如果未绑定则降级使用 KV。

### Q9: 如何备份和恢复配置？

*   **环境变量**：在 Cloudflare 后台导出环境变量配置。
*   **D1 数据库**：使用 D1 控制台导出 SQL 数据（`SELECT * FROM config/whitelist/logs/stats`）。
*   **KV 存储**：使用 Cloudflare API 或 Wrangler CLI 导出 KV 数据。

### Q10: 如何完全重置系统？

1. 删除所有环境变量（或恢复默认值）。
2. 清空 D1 数据库所有表：
   ```sql
   DELETE FROM config;
   DELETE FROM whitelist;
   DELETE FROM logs;
   DELETE FROM stats;
   ```
3. 清空 KV 存储所有键值对。
4. 重新部署代码。

---

## 🙏 特别感谢与致谢

**特别感谢天诚修复的所有 Bug 与新增功能：**
*   ❇️ 修复了 Cloudflare 网站不能访问的问题。
*   ❇️ 新增加了机场三字码的适配。
*   ❇️ 新增负载均衡轮询。
*   ❇️ 新增解锁 Emby 播放器。
*   ❇️ 新增了韩国节点适配。
*   ❇️ Trojan/Vless 订阅器内置 CSV 文件优化识别功能。

**相关支持与链接：**
*   **源代码作者**：[Alexandre_Kojeve](https://t.me/Alexandre_Kojeve) (致敬原版 stallTCP1.32)
*   **后台作者**：[ym94203](https://t.me/ym94203)
*   **ProxyIP 支持**：[COMLiang](https://t.me/COMLiang)
*   **Telegram 交流群**：[zyssadmin](https://t.me/zyssadmin)
*   **Cloudflare Docs**：[Support](https://developers.cloudflare.com/)

---

## ⚖️ 免责声明

**本项目仅供技术交流与学习使用，请勿用于非法用途。使用本程序产生的任何后果由使用者自行承担。**
