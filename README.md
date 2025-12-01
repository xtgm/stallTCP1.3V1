# stallTCP1.3V1  节点与订阅管理面板 (通用后台版)

**如果项目对您有帮助。请给我点亮星星star 谢谢**

**源代码来源于Alexandre_Kojeve的stallTCP1.3**

**特别说明 我只是完善了html后台管理页面**

**✅ 完美支持 Cloudflare Workers**  
**✅ 完美支持 Cloudflare Pages**  
**✅ 完美支持 Cloudflare snippets**  

**这是一个基于 Cloudflare Workers 的 VLESS 节点脚本。**

**集成了 Web 管理后台、订阅转换.**

**优选 IP 自动解析（支持 .netlib 异步解析）以及 Clash/Sing-box 配置生成功能。**

**修复全平台所有兼容性问题 修复ios系统shadowrocket以及quantumult x兼容性问题**

<img width="1905" height="919" alt="image" src="https://github.com/user-attachments/assets/e43db73f-4d8d-41a3-ab43-61555c8c984b" />

-----------------------------------------------------------------------------------------------------------------

-----------------------------------------------------------------------------------------------------------------

# 特别感谢天诚修复的所有bug功能

❇️修复了cloudflare网站不能访问的问题                                                                                                                     

❇️新增加了机场三字码的适配                                                                                                                       

❇️新增负载均衡轮询

❇️新增解锁Emby播放器

❇️新增了韩国节点适配

❇️Tojan订阅器内置CSV文件优化识别功能                                                                                          

❇️Vless订阅器内置CSV文件优化识别功能



------------------------------------------------------------------------------------------------------------------



## 📞 支持
- **源代码作者** ：https://t.me/Alexandre_Kojeve
- **proxyip支持** ：https://t.me/COMLiang
- **Telegram群组**: https://t.me/zyssadmin
- **telegram作者**：https://t.me/ym94203
- **Cloudflare Docs支持**: https://developers.cloudflare.com/

 🙏致敬原版作者：  Alexandre_Kojeve

 ⚠️ 后台作者：    ym94203
 
 👥 交流群组       zyssadmin 
 
 🤖  问题反馈/ 天诚技术交流群


------------------------------------------------------------------------------------------------------------------

## ⚙️ 配置说明 (Configuration)

在 `worker.js` 代码的前几行，你需要根据需求修改以下变量：

## 🟣 用户配置区域
// =============================================================================

const UUID = "你的UUID";                 // 必填：建议使用 UUID Generator 生成

const WEB_PASSWORD = "你的后台密码";       // 必填：访问网页后台的密码

const SUB_PASSWORD = "sub";             // 选填：快速订阅路径，访问 https://域名/sub 即可

const DEFAULT_PROXY_IP = "tw.sni2025.netlib.re"; // 默认优选 IP 或域名

const DEFAULT_SUB_DOMAIN = "sub.cmliussss.net";  // 真实订阅源（用于聚合）


-----------------------------------------------------------------------------------------------------------------



-----------------------------------------------------------------------------------------------------------------

## ✨ 主要功能

- **🚀 VLESS 协议支持**：基于 `cloudflare:sockets`，实现高性能代理。
- **🛡️ 专属管理后台**：内置 Web 界面，可查看配置、复制订阅、检测 IP。
- **🔄 订阅聚合与转换**：支持抓取远程订阅源，并自动替换为 Worker 的节点信息。
- **⚡ 优选 IP 增强**：
  - 内置常用优选 IP 列表。 可自行修改自定义优选IP
  - **特色功能**：支持 `.netlib` 域名的异步 DoH 解析，自动获取动态优选 IP。
- **🔗 多客户端支持**：自动识别 User-Agent，为 Clash、Meta、Stash 等客户端生成专属配置。
- **🔐 安全认证**：支持自定义 UUID 和后台管理密码。

## 🛠️ 部署指南

------------------------------------------------------------------------


## 🚀 快速开始

--- **worker部署**（小白最优选择）
部署 CF Worker：

登录你的cloudflare
找到计算和AI里的Workers 和 Pages：
选择从 Hello World! 开始：

<img width="1264" height="602" alt="image" src="https://github.com/user-attachments/assets/2b80a97b-ee57-42a8-be1a-8180254f54dc" />


输入任意的work名称之后点击部署即可

<img width="1645" height="806" alt="image" src="https://github.com/user-attachments/assets/b26217ed-d17c-465d-bcbd-b232ab5a4fd0" />


然后在cloudflare的Workers 和 Pages里面 找到你部署好的work项目 以我的项目为例： 点击编辑代码

<img width="1646" height="128" alt="image" src="https://github.com/user-attachments/assets/a7f0c75a-56c3-467b-a07f-d37cafb8dd6c" />


将 worker.js 的内容粘贴到 Worker 编辑器中并完成部署



**到这里worker部署就结束了**



---------------------------------------------------------------------

 # pages部署

**1.上传到 Cloudflare Pages** 【因为cloudflare改了UI 所以全新的方法】 

**特别注意 修改的内容要在github上的  worker.js  进行修改之后会同步cloudflare pages项目**

1.登录 Cloudflare  找到计算AI-找到worker和pages
<img width="414" height="193" alt="image" src="https://github.com/user-attachments/assets/75c41546-cc6a-4a2f-9fa5-3632f0d89104" />
点击创建应用程序
<img width="1494" height="188" alt="image" src="https://github.com/user-attachments/assets/6ddd7c84-4a4f-4ddc-bd41-f2d550139999" />
点击下方的Get started 跳转到pages界面
<img width="1294" height="601" alt="image" src="https://github.com/user-attachments/assets/f5fdaa8d-d86a-471e-93de-9107db440443" />
选择第一个github 
<img width="1281" height="475" alt="image" src="https://github.com/user-attachments/assets/8932221a-6480-491d-baf9-a26fc67a852b" />
选择好的绑定好的github账号 如果没有绑定你需要自己绑定 然后选择好你fork的项目
<img width="1318" height="606" alt="image" src="https://github.com/user-attachments/assets/2518c4e5-8503-4b4c-80f9-6ca06dfb0df9" />
点击开始设置

写好项目名称【自己写】
写好项目名称之后 点击保存并部署
<img width="1113" height="870" alt="image" src="https://github.com/user-attachments/assets/1c215f82-98fc-42d0-aed5-2bd032e3b859" />

这样pages github部署方法就完成了

----------------------------------------------------------------------------------------------------------------------------------

**2.pages 上传方法** 

**【注意 修改任何内容都需要重新上传一次文件夹或者是压缩包zip】**

1.登录 Cloudflare  找到计算AI-找到worker和pages
<img width="414" height="193" alt="image" src="https://github.com/user-attachments/assets/75c41546-cc6a-4a2f-9fa5-3632f0d89104" />
点击创建应用程序
<img width="1494" height="188" alt="image" src="https://github.com/user-attachments/assets/6ddd7c84-4a4f-4ddc-bd41-f2d550139999" />
点击下方的Get started 跳转到pages界面
<img width="1294" height="601" alt="image" src="https://github.com/user-attachments/assets/f5fdaa8d-d86a-471e-93de-9107db440443" />
选择第二个
<img width="1288" height="509" alt="image" src="https://github.com/user-attachments/assets/5f823410-7308-4425-9e77-a66646235e00" />
输入项目名称 点击创建项目
<img width="1396" height="690" alt="image" src="https://github.com/user-attachments/assets/c10dc676-a06a-4a6b-bc62-f24239f454b0" />

**上传文件 【可上传zip包】 【可上传文件夹】**

<img width="1330" height="667" alt="image" src="https://github.com/user-attachments/assets/5dec9d85-9fcb-4b95-89c6-a7d8c57be661" />

**点击部署站点 完成**



----------------------------------------------------------------------

# cloudflare snip部署 【有snippets的必看】

点击自己的域名进入

<img width="1565" height="202" alt="image" src="https://github.com/user-attachments/assets/2483c2b7-3bb2-4cac-bdd6-38f8b31f4329" />

找到规则-snippets 点击创建片段

<img width="1652" height="716" alt="image" src="https://github.com/user-attachments/assets/9059a47d-77da-4ba4-82cc-03e8a8638c0f" />

输入片段名称【自己决定】

<img width="1920" height="878" alt="image" src="https://github.com/user-attachments/assets/f163e9ef-989b-4645-8ebc-eadf755f4b23" />

找到我项目的worker.js代码 打开它 复制代码 粘贴到snippets

选择片段规则-自定义规则

字段为主机名 运算符为等于 值为你的子域名+你的域名

例如：123为子域名 321.com为你的CF托管域名 

<img width="1920" height="914" alt="image" src="https://github.com/user-attachments/assets/1f858efe-a6ce-4bf6-8d62-0bfc462ef2b3" />

点击完成 保存更改

弹出修改 创建DNNS记录 

选择创建新代理DNS记录

类型为A 名称为你的子域名 ipv4 为192.0.2.1


<img width="640" height="459" alt="image" src="https://github.com/user-attachments/assets/f88ad346-30aa-41ef-9f7c-deb2453afbfe" />


snippets部署结束


------------------------------------------------------------------------

### 方法二：通过 GitHub Actions 部署（进阶）

*如果你熟悉 Wrangler CLI，可以直接 clone 本仓库并使用 `npx wrangler deploy`。*


------------------------------------------------------------------------------


# ⚖️ 免责声明

**本项目仅供技术交流与学习使用，请勿用于非法用途。使用本程序产生的任何后果由使用者自行承担。**


# 🙏 致谢

**基于 Cloudflare Workers 平台**

**感谢开源社区提供的优选 IP 思路**

**致谢Alexandre Kojève做的TCP流媒体优化**

**致谢天诚大佬COMLiang做的proxyip**

**感谢天诚交流群各位群友支持**
