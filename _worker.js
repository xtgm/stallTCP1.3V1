import { connect } from 'cloudflare:sockets';

// =============================================================================
// 🟣 用户配置区域 (优先读取环境变量)
// =============================================================================
const UUID = "06b65903-406d-4a41-8463-6fd5c0ee7798"; 

// 1. 后台管理密码
const WEB_PASSWORD = ""; 
// 2. 快速订阅密码
const SUB_PASSWORD = ""; 

// 3. 默认配置
const DEFAULT_PROXY_IP = "ProxyIP.Oracle.cmliussss.net"; 
const DEFAULT_SUB_DOMAIN = "sub.cmliussss.net"; 

// 群组+检测站
const TG_GROUP_URL = "https://t.me/zyssadmin";   
const TG_CHANNEL_URL = "https://t.me/cloudflareorg"; 
const PROXY_CHECK_URL = "https://kaic.hidns.co/"; 

const DEFAULT_CONVERTER = "https://subapi.cmliussss.net"; 
const CLASH_CONFIG = "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_Full_MultiMode.ini"; 

// Sing-box 配置
const SINGBOX_CONFIG_V12 = "https://raw.githubusercontent.com/sinspired/sub-store-template/main/1.12.x/sing-box.json"; 
const SINGBOX_CONFIG_V11 = "https://raw.githubusercontent.com/sinspired/sub-store-template/main/1.11.x/sing-box.json"; 

// TG配置 (默认值)
const TG_BOT_TOKEN = ""; 
const TG_CHAT_ID = ""; 

const DEFAULT_CUSTOM_IPS = `173.245.58.127#CF官方优选
8.39.125.176#CF官方优选
172.64.228.106#CF官方优选
198.41.223.138#CF官方优选
104.19.61.220#CF官方优选
104.18.44.31#CF官方优选
104.19.37.177#CF官方优选
104.19.37.36#CF官方优选
162.159.38.199#CF官方优选
172.67.69.193#CF官方优选
108.162.198.41#CF官方优选
8.35.211.134#CF官方优选
173.245.58.201#CF官方优选
172.67.71.105#CF官方优选
162.159.37.12#CF官方优选
104.18.33.144#CF官方优选`;

// =============================================================================
// ⚡️ 核心逻辑区
// =============================================================================
const RUNTIME_WHITELIST = new Set();
const IP_HISTORY = new Map(); 

const MAX_PENDING=2097152,KEEPALIVE=15000,STALL_TO=8000,MAX_STALL=12,MAX_RECONN=24;
const buildUUID=(a,i)=>[...a.slice(i,i+16)].map(n=>n.toString(16).padStart(2,'0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/,'$1-$2-$3-$4-$5');
const extractAddr=b=>{
    // [修复] 增加边界检查，防止1101错误
    if(b.length < 18) throw new Error('Packet too short');
    const len = b[17];
    if(b.length < 18 + len + 1) throw new Error('Packet incomplete');
    
    const o=18+len+1,p=(b[o]<<8)|b[o+1],t=b[o+2];let l,h,O=o+3;
    switch(t){
        case 1:l=4;h=b.slice(O,O+l).join('.');break;
        case 2:l=b[O++];h=new TextDecoder().decode(b.slice(O,O+l));break;
        case 3:l=16;h=`[${[...Array(8)].map((_,i)=>((b[O+i*2]<<8)|b[O+i*2+1]).toString(16)).join(':')}]`;break;
        default:throw new Error('Addr type error');
    }
    return{host:h,port:p,payload:b.slice(O+l)}
};

async function resolveNetlib(n){try{const r=await fetch(`https://1.1.1.1/dns-query?name=${n}&type=TXT`,{headers:{'Accept':'application/dns-json'}});if(!r.ok)return null;const d=await r.json(),t=(d.Answer||[]).filter(x=>x.type===16).map(x=>x.data);if(!t.length)return null;let D=t[0].replace(/^"|"$/g,'');const p=D.replace(/\\010|\n/g,',').split(',').map(s=>s.trim()).filter(Boolean);return p.length?p[Math.floor(Math.random()*p.length)]:null}catch{return null}}
async function parseIP(p){p=p.toLowerCase();if(p.includes('.netlib')){const n=await resolveNetlib(p);p=n||p}let a=p,o=443;if(p.includes('.tp')){const m=p.match(/\.tp(\d+)/);if(m)o=parseInt(m[1],10);return[a,o]}if(p.includes(']:')){const s=p.split(']:');a=s[0]+']';o=parseInt(s[1],10)||o}else if(p.includes(':')&&!p.startsWith('[')){const i=p.lastIndexOf(':');a=p.slice(0,i);o=parseInt(p.slice(i+1),10)||o}return[a,o]}

class Pool{constructor(){this.b=new ArrayBuffer(16384);this.p=0;this.l=[];this.m=8}alloc(s){if(s<=4096&&s<=16384-this.p){const v=new Uint8Array(this.b,this.p,s);this.p+=s;return v}const r=this.l.pop();return r&&r.byteLength>=s?new Uint8Array(r.buffer,0,s):new Uint8Array(s)}free(b){if(b.buffer===this.b)this.p=Math.max(0,this.p-b.length);else if(this.l.length<this.m&&b.byteLength>=1024)this.l.push(b)}reset(){this.p=0;this.l=[]}}

function genNodes(h,u,p){
    let l = DEFAULT_CUSTOM_IPS.replace(/[,;]/g, '\n').split('\n').filter(line => line.trim() !== "");
    for (let i = l.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [l[i], l[j]] = [l[j], l[i]];
    }
    const P=p?`/proxyip=${p.trim()}`:"/",E=encodeURIComponent(P);
    const PT='v'+'l'+'e'+'s'+'s';
    return l.map(L=>{
        const[a,n]=L.split('#'),I=a.trim(),N=n?n.trim():'Worker-Node';
        let i=I,pt="443";
        if(I.includes(':')&&!I.includes('[')){const s=I.split(':');i=s[0];pt=s[1]}
        return`${PT}://${u}@${i}:${pt}?encryption=none&security=tls&sni=${h}&alpn=h3&fp=random&allowInsecure=1&type=ws&host=${h}&path=${E}#${encodeURIComponent(N)}`
    }).join('\n');
}

async function sendTgMsg(token, chat_id, ctx, title, r, detail = "") {
  if (!token || !chat_id) return;
  try {
    const url = new URL(r.url);
    const ip = r.headers.get('cf-connecting-ip') || 'Unknown';
    const ua = r.headers.get('User-Agent') || 'Unknown';
    const city = r.cf?.city || 'Unknown';
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const safe = (str) => (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const text = `<b>📡 ${safe(title)}</b>\n\n` + `<b>🕒 时间:</b> <code>${time}</code>\n` + `<b>🌍 IP:</b> <code>${safe(ip)} (${safe(city)})</code>\n` + `<b>🔗 域名:</b> <code>${safe(url.hostname)}</code>\n` + `<b>🛣️ 路径:</b> <code>${safe(url.pathname)}</code>\n` + `<b>📱 客户端:</b> <code>${safe(ua)}</code>\n` + (detail ? `<b>ℹ️ 详情:</b> ${safe(detail)}` : "");
    const params = { chat_id: chat_id, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
    const promise = fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }).catch(e => console.error("TG Send Error:", e));
    if(ctx && ctx.waitUntil) ctx.waitUntil(promise);
    return promise;
  } catch(e) { console.error("TG Setup Error:", e); }
}

export default {
  async fetch(r, env, ctx) { 
    try {
      const MY_UUID = env.UUID || UUID;
      const MY_PROXYIP = env.PROXYIP || DEFAULT_PROXY_IP;
      const MY_SUB_DOMAIN = env.SUB_DOMAIN || DEFAULT_SUB_DOMAIN;
      const MY_SUB_PASSWORD = env.SUB_PASSWORD || SUB_PASSWORD;
      const MY_WEB_PASSWORD = env.WEB_PASSWORD || WEB_PASSWORD;
      const MY_TG_TOKEN = env.TG_BOT_TOKEN || TG_BOT_TOKEN;
      const MY_TG_ID = env.TG_CHAT_ID || TG_CHAT_ID;
      const MY_TG_GROUP = env.TG_GROUP_URL || TG_GROUP_URL;
      const MY_TG_CHANNEL = env.TG_CHANNEL_URL || TG_CHANNEL_URL;

      const url = new URL(r.url);
      const host = url.hostname; 
      const UA = (r.headers.get('User-Agent') || "").toLowerCase();
      const ip = r.headers.get('cf-connecting-ip') || 'Unknown';
      const isWhite = RUNTIME_WHITELIST.has(ip); 

      if (url.pathname === '/favicon.ico') return new Response(null, { status: 404 });

      // 🔄 功能接口: 处理前端的特殊请求
      const flag = url.searchParams.get('flag');
      if (flag) {
          if (flag === 'github') {
              await sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, "🌟 用户点击了烈火项目", r, "来源: 登录页面直达链接");
              return new Response(null, { status: 204 });
          } else if (flag === 'checkproxy') {
              const checkIp = url.searchParams.get('ip') || "未填写";
              const title = isWhite ? "🔍 管理员点击了检测站" : "🔍 用户点击了检测站";
              await sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, title, r, `检测IP: ${checkIp}`);
              return new Response(null, { status: 204 });
          } else if (flag === 'test_tg') {
              // 测试 TG 消息
              const token = url.searchParams.get('token');
              const id = url.searchParams.get('id');
              if(token && id) {
                  await sendTgMsg(token, id, ctx, "✅ 通知测试成功", r, "您的 Telegram Bot 配置正确");
                  return new Response(JSON.stringify({ok: true}), { status: 200 });
              }
              return new Response(JSON.stringify({ok: false}), { status: 400 });
          } else if (flag === 'get_cf_stats') {
              // 📊 获取 CF 统计数据 (后端代理，解决CORS)
              const cfEmail = r.headers.get('X-CF-Email');
              const cfKey = r.headers.get('X-CF-Key');
              const cfAcc = r.headers.get('X-CF-Acc');
              if (!cfEmail || !cfKey || !cfAcc) return new Response("Missing Credentials", { status: 400 });

              const now = new Date();
              const start = new Date(now); start.setDate(start.getDate() - 1); // 过去24h
              const query = `
                query {
                  viewer {
                    accounts(filter: {accountTag: "${cfAcc}"}) {
                      workersInvocationsAdaptive(limit: 10, filter: {
                        datetime_geq: "${start.toISOString()}",
                        datetime_leq: "${now.toISOString()}"
                      }) {
                        sum { requests }
                      }
                    }
                  }
                }
              `;
              const cfReq = await fetch("https://api.cloudflare.com/client/v4/graphql", {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                      "X-Auth-Email": cfEmail,
                      "X-Auth-Key": cfKey
                  },
                  body: JSON.stringify({ query })
              });
              return new Response(cfReq.body, { status: cfReq.status, headers: { 'Content-Type': 'application/json' } });
          } else if (flag === 'net_test') {
              // 🌐 网络连通性测试 (后端代理)
              const target = url.searchParams.get('url');
              if(!target) return new Response("Missing URL", {status: 400});
              const start = Date.now();
              try {
                  await fetch(target, { method: 'HEAD', redirect: 'follow' });
                  return new Response(JSON.stringify({ ok: true, ms: Date.now() - start }), { status: 200 });
              } catch(e) {
                  return new Response(JSON.stringify({ ok: false, ms: 0 }), { status: 200 });
              }
          }
      }

      // 1. 快速订阅接口
      if (MY_SUB_PASSWORD && url.pathname === `/${MY_SUB_PASSWORD}`) {
          const K_CLASH = 'c'+'l'+'a'+'s'+'h';
          const K_SB = 's'+'i'+'n'+'g'+'-'+'b'+'o'+'x';
          const K_VR = 'v'+'2'+'r'+'a'+'y';
          
          const isClash = UA.includes(K_CLASH) || UA.includes('meta') || UA.includes('stash');
          const isSingbox = UA.includes(K_SB) || UA.includes('singbox') || UA.includes('sfi') || UA.includes('box') || UA.includes('karing') || UA.includes('neko');
          const isV2ray = UA.includes(K_VR);
          const isConverter = UA.includes("subconverter") || UA.includes("sub-one-proxy");
          const isFlagged = url.searchParams.has('flag');
          const now = Date.now();

          if (!isFlagged) {
             let clientName = "浏览器/未知";
             let notifTitle = isWhite ? "🔬 管理员测试订阅" : "🌍 用户访问订阅";
             if (isSingbox) { clientName = "Sing-box"; notifTitle = "🔄 用户订阅更新"; }
             else if (isClash) { clientName = "Clash"; notifTitle = "🔄 用户订阅更新"; }
             else if(d) { clientName=atob("djJyYXlORw=="); notifTitle="🔄 用户进行了订阅更新"; }  
             else if (isConverter) { clientName = "API转换"; notifTitle = "🔄 用户订阅更新"; }

             const p = sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, notifTitle, r, `客户端: ${clientName}`);
             if(ctx && ctx.waitUntil) ctx.waitUntil(p);
          }

          if (isSingbox && !isFlagged) {
              const requestProxyIp = url.searchParams.get('proxyip');
              let selfUrl = `https://${host}/${MY_SUB_PASSWORD}?flag=true`;
              if (requestProxyIp) selfUrl += `&proxyip=${encodeURIComponent(requestProxyIp)}`;
              let targetConfig = SINGBOX_CONFIG_V12;
              try {
                  const controller = new AbortController();
                  setTimeout(() => controller.abort(), 2000);
                  const checkV12 = await fetch(SINGBOX_CONFIG_V12, { method: 'HEAD', signal: controller.signal });
                  if (checkV12.status !== 200) targetConfig = SINGBOX_CONFIG_V11;
              } catch (e) { targetConfig = SINGBOX_CONFIG_V11; }
              const converterUrl = `${DEFAULT_CONVERTER}/sub?target=singbox&url=${encodeURIComponent(selfUrl)}&config=${encodeURIComponent(targetConfig)}&emoji=true&list=false&sort=false&fdn=false&scv=false&_t=${now}`;
              const subRes = await fetch(converterUrl);
              const newHeaders = new Headers(subRes.headers);
              newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');
              return new Response(subRes.body, { status: 200, headers: newHeaders });
          }

          if (isClash && !isFlagged) {
              const requestProxyIp = url.searchParams.get('proxyip');
              let selfUrl = `https://${host}/${MY_SUB_PASSWORD}?flag=true`;
              if (requestProxyIp) selfUrl += `&proxyip=${encodeURIComponent(requestProxyIp)}`;
              const converterUrl = `${DEFAULT_CONVERTER}/sub?target=clash&url=${encodeURIComponent(selfUrl)}&config=${encodeURIComponent(CLASH_CONFIG)}&emoji=true&list=false&tfo=false&scv=false&fdn=false&sort=false&_t=${now}`;
              const subRes = await fetch(converterUrl);
              const newHeaders = new Headers(subRes.headers);
              newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');
              return new Response(subRes.body, { status: 200, headers: newHeaders });
          }

          let upstream = MY_SUB_DOMAIN.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
          if (!upstream) upstream = host;
          let reqProxyIp = url.searchParams.get('proxyip');
          if (!reqProxyIp && MY_PROXYIP && MY_PROXYIP.trim() !== "") reqProxyIp = MY_PROXYIP;
          let targetPath = "/";
          if (reqProxyIp && reqProxyIp.trim() !== "") targetPath = `/proxyip=${reqProxyIp.trim()}`;
          const params = new URLSearchParams();
          params.append("uuid", MY_UUID);
          params.append("host", upstream);
          params.append("sni", upstream);
          params.append("path", targetPath); 
          params.append("type", "ws");
          params.append("encryption", "none");
          params.append("security", "tls");
          params.append("alpn", "h3");
          params.append("fp", "random");
          params.append("allowInsecure", "1");
          const upstreamUrl = `https://${upstream}/sub?${params.toString()}`;
          try {
              const response = await fetch(upstreamUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
              if (response.ok) {
                  const text = await response.text();
                  try {
                      let content = atob(text.trim());
                      content = content.replace(/path=[^&#]*/g, `path=${encodeURIComponent(targetPath)}`);
                      content = content.replace(/host=[^&]*/g, `host=${host}`);
                      content = content.replace(/sni=[^&]*/g, `sni=${host}`);
                      return new Response(btoa(content), { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
                  } catch (e) { return new Response(text, { status: 200 }); }
              }
          } catch (e) {}
          const fallbackList = genNodes(host, MY_UUID, reqProxyIp);
          return new Response(btoa(unescape(encodeURIComponent(fallbackList))), { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      // 2. 常规订阅
      if (url.pathname === '/sub') {
          const requestUUID = url.searchParams.get('uuid');
          if (requestUUID !== MY_UUID) return new Response('Invalid UUID', { status: 403 });
          let pathParam = url.searchParams.get('path');
          let proxyIp = "";
          if (pathParam && pathParam.includes('/proxyip=')) proxyIp = pathParam.split('/proxyip=')[1];
          else if (pathParam === null) proxyIp = MY_PROXYIP;
          const listText = genNodes(host, MY_UUID, proxyIp);
          const p = sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, "常规订阅访问 (/sub)", r);
          if(ctx && ctx.waitUntil) ctx.waitUntil(p);
          return new Response(btoa(unescape(encodeURIComponent(listText))), { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      // 3. 面板逻辑
      if (r.headers.get('Upgrade') !== 'websocket') {
          const noCacheHeaders = {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0'
          };

          if (MY_WEB_PASSWORD && MY_WEB_PASSWORD.trim().length > 0) {
              const cookie = r.headers.get('Cookie') || "";
              const match = cookie.match(/auth=([^;]+)/);
              const userAuth = match ? match[1] : null;

              if (userAuth !== MY_WEB_PASSWORD) {
                  if (userAuth) {
                      await sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, "🚨 后台登录失败", r, `尝试密码: ${userAuth} (错误)`);
                      return new Response(loginPage(true, MY_TG_GROUP, MY_TG_CHANNEL), { status: 200, headers: noCacheHeaders });
                  } else {
                      const visitTitle = isWhite ? "👀 管理员正在登录后台" : "👋 后台登录页访问";
                      const visitDetail = isWhite ? `IP: ${ip} (白名单)\n状态: 准备登录` : "等待验证";
                      await sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, visitTitle, r, visitDetail);
                      return new Response(loginPage(false, MY_TG_GROUP, MY_TG_CHANNEL), { status: 200, headers: noCacheHeaders });
                  }
              }
          }
          
          RUNTIME_WHITELIST.add(ip);
          await sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, "✅ 后台登录成功", r, "进入管理面板");
          return new Response(dashPage(url.hostname, MY_UUID, MY_PROXYIP, MY_SUB_PASSWORD, MY_TG_TOKEN, MY_TG_ID, MY_TG_GROUP), { status: 200, headers: noCacheHeaders });
      }
      
      let proxyIPConfig = null;
      if (url.pathname.includes('/proxyip=')) {
        try {
          const proxyParam = url.pathname.split('/proxyip=')[1].split('/')[0];
          const [address, port] = await parseIP(proxyParam); 
          proxyIPConfig = { address, port: +port }; 
        } catch (e) { console.error(e); }
      }
      const { 0: c, 1: s } = new WebSocketPair(); s.accept(); 
      handle(s, proxyIPConfig, MY_UUID); 
      return new Response(null, { status: 101, webSocket: c });
    } catch (err) {
      return new Response(err.toString(), { status: 500 });
    }
  }
};

const handle = (ws, pc, currentUUID) => {
  const pool = new Pool();
  let s, w, r, inf, fst = true, rx = 0, stl = 0, cnt = 0, lact = Date.now(), con = false, rd = false, wt = false, tm = {}, pd = [], pb = 0, scr = 1.0, lck = Date.now(), lrx = 0, md = 'buf', asz = 0, tp = [], st = { t: 0, c: 0, ts: Date.now() };
  const upd = sz => {
    st.t += sz; st.c++; asz = asz * 0.9 + sz * 0.1; const n = Date.now();
    if (n - st.ts > 1000) { const rt = st.t; tp.push(rt); if (tp.length > 5) tp.shift(); st.t = 0; st.ts = n; const av = tp.reduce((a, b) => a + b, 0) / tp.length; if (st.c >= 20) { if (av > 2e7 && asz > 16384) md = 'dir'; else if (av < 1e7 || asz < 8192) md = 'buf'; else md = 'adp' } }
  };
  const rdL = async () => {
    if (rd) return; rd = true; let b = [], bz = 0, tm = null;
    const fl = () => { if (!bz) return; const m = new Uint8Array(bz); let p = 0; for (const x of b) { m.set(x, p); p += x.length } if (ws.readyState === 1) ws.send(m); b = []; bz = 0; if (tm) clearTimeout(tm); tm = null };
    try {
      while (1) {
        if (pb > MAX_PENDING) { await new Promise(r => setTimeout(r, 100)); continue }
        const { done, value: v } = await r.read();
        if (v?.length) {
          rx += v.length; lact = Date.now(); stl = 0; upd(v.length); const n = Date.now();
          if (n - lck > 5000) { const el = n - lck, by = rx - lrx, r = by / el; if (r > 500) scr = Math.min(1, scr + 0.05); else if (r < 50) scr = Math.max(0.1, scr - 0.05); lck = n; lrx = rx }
          if (md === 'buf') { if (v.length < 32768) { b.push(v); bz += v.length; if (bz >= 131072) fl(); else if (!tm) tm = setTimeout(fl, asz > 16384 ? 5 : 20) } else { fl(); if (ws.readyState === 1) ws.send(v) } } else { fl(); if (ws.readyState === 1) ws.send(v) }
        }
        if (done) { fl(); rd = false; rcn(); break }
      }
    } catch { fl(); rd = false; rcn() }
  };
  const wtL = async () => { if (wt) return; wt = true; try { while (wt) { if (!w) { await new Promise(r => setTimeout(r, 100)); continue } if (!pd.length) { await new Promise(r => setTimeout(r, 20)); continue } const b = pd.shift(); await w.write(b); pb -= b.length; pool.free(b) } } catch { wt = false } };
  const est = async () => { try { s = await cn(); w = s.writable.getWriter(); r = s.readable.getReader(); con = false; cnt = 0; scr = Math.min(1, scr + 0.15); lact = Date.now(); rdL(); wtL() } catch { con = false; scr = Math.max(0.1, scr - 0.2); rcn() } };
  const cn = async () => { const m = ['direct']; if (pc) m.push('proxy'); let err; for (const x of m) { try { const o = (x === 'direct') ? { hostname: inf.host, port: inf.port } : { hostname: pc.address, port: pc.port }; const sk = connect(o); await sk.opened; return sk } catch (e) { err = e } } throw err };
  const rcn = async () => { if (!inf || ws.readyState !== 1) { cln(); ws.close(); return } if (cnt >= MAX_RECONN) { cln(); ws.close(); return } if (con) return; cnt++; let d = Math.min(50 * Math.pow(1.5, cnt - 1), 3000) * (1.5 - scr * 0.5); d = Math.max(50, Math.floor(d)); try { csk(); if (pb > MAX_PENDING * 2) while (pb > MAX_PENDING && pd.length > 5) { const k = pd.shift(); pb -= k.length; pool.free(k) } await new Promise(r => setTimeout(r, d)); con = true; s = await cn(); w = s.writable.getWriter(); r = s.readable.getReader(); con = false; cnt = 0; scr = Math.min(1, scr + 0.15); stl = 0; lact = Date.now(); rdL(); wtL() } catch { con = false; scr = Math.max(0.1, scr - 0.2); if (cnt < MAX_RECONN && ws.readyState === 1) setTimeout(rcn, 500); else { cln(); ws.close() } } };
  const stT = () => { tm.ka = setInterval(async () => { if (!con && w && Date.now() - lact > KEEPALIVE) try { await w.write(new Uint8Array(0)); lact = Date.now() } catch { rcn() } }, 5000); tm.hc = setInterval(() => { if (!con && st.t > 0 && Date.now() - lact > STALL_TO) { stl++; if (stl >= MAX_STALL) { if (cnt < MAX_RECONN) { stl = 0; rcn() } else { cln(); ws.close() } } } }, 4000) };
  const csk = () => { rd = false; wt = false; try { w?.releaseLock(); r?.releaseLock(); s?.close() } catch { } }; const cln = () => { Object.values(tm).forEach(clearInterval); csk(); while (pd.length) pool.free(pd.shift()); pb = 0; st = { t: 0, c: 0, ts: Date.now() }; md = 'buf'; asz = 0; tp = []; pool.reset() };
  ws.addEventListener('message', async e => { try { if (fst) { fst = false; const b = new Uint8Array(e.data); if (buildUUID(b, 1).toLowerCase() !== currentUUID.toLowerCase()) throw 0; ws.send(new Uint8Array([0, 0])); const { host, port, payload } = extractAddr(b); inf = { host, port }; con = true; if (payload.length) { const z = pool.alloc(payload.length); z.set(payload); pd.push(z); pb += z.length } stT(); est() } else { lact = Date.now(); if (pb > MAX_PENDING * 2) return; const z = pool.alloc(e.data.byteLength); z.set(new Uint8Array(e.data)); pd.push(z); pb += z.length } } catch { cln(); ws.close() } }); ws.addEventListener('close', cln); ws.addEventListener('error', cln)
};

function loginPage(isError, tgGroup, tgChannel){
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Worker Login</title>
<style>
body { background: linear-gradient(45deg, #1cb5e0 0%, #000851 100%); color: white; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
.glass-box { background: rgba(255, 255, 255, 0.1); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 40px; border-radius: 16px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); text-align: center; width: 320px; }
h2 { margin-top: 0; margin-bottom: 20px; font-weight: 600; letter-spacing: 1px; }
input { width: 100%; padding: 14px; margin-bottom: 20px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.3); background: rgba(0, 0, 0, 0.2); color: white; box-sizing: border-box; text-align: center; font-size: 1rem; outline: none; transition: 0.3s; }
input:focus { background: rgba(0, 0, 0, 0.4); border-color: #a29bfe; }
button { width: 100%; padding: 12px; border-radius: 8px; border: none; background: linear-gradient(90deg, #a29bfe, #6c5ce7); color: white; font-weight: bold; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); transition: 0.2s; }
button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); }
.social-links { margin-top: 25px; display: flex; justify-content: center; gap: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; flex-wrap: wrap; }
.social-links a { color: #e2e8f0; text-decoration: none; font-size: 0.9rem; padding: 8px 16px; background: rgba(0, 0, 0, 0.2); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.15); transition: 0.2s; display: flex; align-items: center; gap: 5px; }
.social-links a:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-2px); border-color: #a29bfe; }
.error-msg { background: rgba(231, 76, 60, 0.3); border: 1px solid rgba(231, 76, 60, 0.5); color: #ff7675; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 0.9rem; display: ${isError ? "block" : "none"}; }
</style>
</head>
<body>
<div class="glass-box">
  <h2>🔒 禁止进入</h2>
  <div class="error-msg">⚠️ 密码错误，请重试</div>
  <input type="password" id="pwd" placeholder="请输入密码" autofocus onkeypress="if(event.keyCode===13)verify()">
  <button onclick="verify()">解锁后台</button>
  <div class="social-links">
    <a href="javascript:void(0)" onclick="gh()">🔥 烈火项目直达</a>
    <a href="${tgChannel}" target="_blank">📢 天诚频道组</a>
    <a href="${tgGroup}" target="_blank">✈️ 天诚交流群</a>
  </div>
</div>
<script>
function gh(){fetch("?flag=github&t="+Date.now(),{keepalive:!0});window.open("https://github.com/xtgm/stallTCP1.3V1","_blank")}
function verify(){
  const p=document.getElementById("pwd").value;
  const d=new Date;
  d.setTime(d.getTime()+6048e5);
  document.cookie="auth="+p+";expires="+d.toUTCString()+";path=/";
  location.reload();
}
</script>
</body>
</html>`;
}

function dashPage(host, uuid, proxyip, subpass, tgtoken, tgid, tgGroup){
    const shortUrl = subpass ? `https://${host}/${subpass}` : `https://${host}/`;
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Worker 管理面板</title>
<style>
:root { --dark-bg: #1a1a2e; --card-bg: rgba(22, 33, 62, 0.9); --glass: rgba(255, 255, 255, 0.05); --border: rgba(255, 255, 255, 0.1); --accent: #0f3460; --text: #e94560; --highlight: #4ecca3; }
body { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; min-height: 100vh; display: flex; justify-content: center; box-sizing: border-box; }
.container { max-width: 900px; width: 100%; display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--card-bg); backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: 16px; padding: 20px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 20px; }
.header h1 { margin: 0; font-size: 1.4rem; color: #fff; display: flex; align-items: center; gap: 10px; }
.btn-group { display: flex; gap: 8px; }
.btn-icon { background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: #fff; width: 36px; height: 36px; cursor: pointer; transition: .2s; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.btn-icon:hover { background: var(--highlight); color: #000; }
.grid-cols { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media(min-width: 768px) { .grid-cols { grid-template-columns: repeat(2, 1fr); } }
.holo-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; position: relative; }
.progress-ring__circle { transition: stroke-dashoffset 0.35s; transform: rotate(-90deg); transform-origin: 50% 50%; }
.holo-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.holo-val { font-size: 2rem; font-weight: bold; color: var(--highlight); }
.holo-label { font-size: 0.8rem; color: #aaa; }
.cyber-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.cyber-item { background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between; }
.cyber-label { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #ddd; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #555; box-shadow: 0 0 5px #555; transition: .3s; }
.status-dot.ok { background: #00b894; box-shadow: 0 0 8px #00b894; }
.status-dot.err { background: #ff7675; box-shadow: 0 0 8px #ff7675; }
.cyber-val { font-family: monospace; color: var(--highlight); }
.field { margin-bottom: 15px; }
.label { display: block; font-size: 0.85rem; color: #bbb; margin-bottom: 6px; }
.input-group { display: flex; gap: 10px; }
input[type="text"], input[type="password"] { width: 100%; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border); color: #fff; padding: 10px; border-radius: 6px; outline: none; transition: .2s; }
input:focus { border-color: var(--highlight); background: rgba(0,0,0,0.5); }
.btn { background: var(--accent); color: white; border: 1px solid var(--border); padding: 10px 16px; border-radius: 6px; cursor: pointer; transition: .2s; font-size: 0.9rem; }
.btn:hover { background: #16213e; border-color: var(--highlight); }
.btn-primary { background: linear-gradient(90deg, #4ecca3, #2c3e50); border: none; font-weight: bold; }
.btn-danger { background: #e94560; border: none; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); display: none; justify-content: center; align-items: center; z-index: 100; opacity: 0; transition: opacity .3s; }
.modal-overlay.active { display: flex; opacity: 1; }
.modal-box { background: #1a1a2e; width: 90%; max-width: 500px; border-radius: 16px; border: 1px solid var(--highlight); box-shadow: 0 0 20px rgba(78, 204, 163, 0.2); padding: 25px; transform: scale(0.9); transition: transform .3s; }
.modal-overlay.active .modal-box { transform: scale(1); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
.tabs { display: flex; gap: 10px; margin-bottom: 20px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 8px; }
.tab { flex: 1; text-align: center; padding: 8px; cursor: pointer; border-radius: 6px; color: #888; transition: .2s; }
.tab.active { background: var(--highlight); color: #000; font-weight: bold; }
.tab-content { display: none; }
.tab-content.active { display: block; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
.toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: var(--highlight); color: #000; padding: 10px 24px; border-radius: 30px; opacity: 0; transition: .3s; pointer-events: none; font-weight: bold; z-index: 200; }
.toast.show { opacity: 1; bottom: 50px; }
textarea { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: #ccc; padding: 10px; border-radius: 6px; min-height: 100px; resize: vertical; }
</style>
</head>
<body>

<div class="container">
  <div class="card">
    <div class="header">
      <h1>⚡ Worker 控制台</h1>
      <div class="btn-group">
        <button class="btn-icon" onclick="openSettings()" title="设置">⚙️</button>
        <button class="btn-icon" onclick="window.open('${tgGroup}')" title="群组">✈️</button>
        <button class="btn-icon" onclick="logout()" title="退出" style="color:#ff6b6b">⏻</button>
      </div>
    </div>
    <div class="grid-cols">
      <div style="background: rgba(0,0,0,0.2); border-radius:12px; border:1px dashed var(--border);">
        <div class="holo-container">
          <svg class="progress-ring" width="120" height="120">
            <circle class="progress-ring__circle" stroke="var(--border)" stroke-width="8" fill="transparent" r="52" cx="60" cy="60"/>
            <circle id="ring-val" class="progress-ring__circle" stroke="var(--highlight)" stroke-width="8" stroke-linecap="round" fill="transparent" r="52" cx="60" cy="60" stroke-dasharray="326.72" stroke-dashoffset="326.72"/>
          </svg>
          <div class="holo-text">
            <div class="holo-val" id="req-count">-</div>
            <div class="holo-label">今日请求</div>
          </div>
        </div>
        <div style="text-align:center; font-size:0.8rem; color:#888; padding-bottom:10px;">Cloudflare 统计</div>
      </div>
      <div class="cyber-grid">
        <div class="cyber-item">
          <div class="cyber-label"><span class="status-dot" id="dot-cf"></span>Cloudflare API</div>
          <div class="cyber-val" id="ping-cf">--ms</div>
        </div>
        <div class="cyber-item">
          <div class="cyber-label"><span class="status-dot" id="dot-google"></span>Google (连通)</div>
          <div class="cyber-val" id="ping-google">--ms</div>
        </div>
        <div class="cyber-item">
          <div class="cyber-label">🌍 当前 IP</div>
          <div class="cyber-val" style="font-size:0.8rem">${proxyip}</div>
        </div>
        <div class="cyber-item">
          <button class="btn" style="width:100%; padding:5px;" onclick="refreshNet()">🔄 刷新状态</button>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="field">
      <span class="label" style="color:var(--highlight)">🚀 通用订阅链接 (自动识别)</span>
      <div class="input-group">
        <input type="text" id="shortSub" value="${shortUrl}" readonly onclick="this.select()">
        <button class="btn" onclick="copyId('shortSub')">复制</button>
      </div>
    </div>
    
    <div class="grid-cols" style="margin-top:15px;">
      <div class="field">
        <span class="label">订阅域名 (Host)</span>
        <input type="text" id="subBaseUrl" value="https://${host}" oninput="updateLink()">
      </div>
      <div class="field">
        <span class="label">ProxyIP (优选)</span>
        <div class="input-group">
          <input type="text" id="proxyIp" value="${proxyip}" oninput="updateLink()">
          <button class="btn" onclick="checkProxy()">检测</button>
        </div>
      </div>
    </div>

    <div id="clashSettings" style="display:none; background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; margin:15px 0;">
      <span class="label" style="color:#aaa; border-bottom:1px solid #444; display:block; margin-bottom:10px; padding-bottom:5px;">Clash 高级参数</span>
      <div class="field">
        <span class="label">转换后端</span>
        <input type="text" id="converterUrl" value="${DEFAULT_CONVERTER}" oninput="updateLink()">
      </div>
      <div class="field">
        <span class="label">配置文件 URL</span>
        <input type="text" id="configUrl" value="https://raw.githubusercontent.com/sinspired/sub-store-template/main/1.12.x/sing-box.json" oninput="updateLink()">
      </div>
    </div>

    <div class="field" style="margin-top:15px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="label">生成结果</span>
        <div class="checkbox-wrapper">
          <input type="checkbox" id="clashMode" onchange="toggleClashMode()">
          <label for="clashMode" style="font-size:0.8rem; color:var(--highlight);">启用 Clash 模式</label>
        </div>
      </div>
      <input type="text" id="resultUrl" readonly onclick="this.select()">
    </div>
    
    <div class="input-group" style="margin-top:15px;">
      <button class="btn btn-primary" style="flex:1" onclick="copyId('resultUrl')">复制最终链接</button>
      <button class="btn" onclick="window.open(document.getElementById('resultUrl').value)">测试访问</button>
    </div>
  </div>

  <div class="card">
    <span class="label">内置优选 IP 列表</span>
    <textarea readonly>${DEFAULT_CUSTOM_IPS}</textarea>
  </div>
</div>

<div class="modal-overlay" id="settingsModal">
  <div class="modal-box">
    <div class="modal-header">
      <h3>🛠️ 高级设置</h3>
      <button class="btn-icon" onclick="closeSettings()" style="width:24px;height:24px;font-size:1rem;">×</button>
    </div>
    <div class="tabs">
      <div class="tab active" onclick="switchTab('tg')">Telegram 通知</div>
      <div class="tab" onclick="switchTab('cf')">CF 统计配置</div>
    </div>
    <div id="tab-tg" class="tab-content active">
      <div class="field">
        <span class="label">Bot Token</span>
        <input type="text" id="modal-tg-token" placeholder="123456:ABC-DEF..." value="${tgtoken}">
      </div>
      <div class="field">
        <span class="label">Chat ID</span>
        <input type="text" id="modal-tg-id" placeholder="123456789" value="${tgid}">
      </div>
      <button class="btn" style="width:100%; margin-top:10px; background:#4b6cb7;" onclick="testTG()">📨 发送测试消息</button>
    </div>
    <div id="tab-cf" class="tab-content">
      <div class="field">
        <span class="label">CF Account ID</span>
        <input type="text" id="modal-cf-acc" placeholder="Cloudflare Account ID">
      </div>
      <div class="field">
        <span class="label">CF Email (Login Email)</span>
        <input type="text" id="modal-cf-email" placeholder="example@gmail.com">
      </div>
      <div class="field">
        <span class="label">Global API Key</span>
        <input type="password" id="modal-cf-key" placeholder="Global API Key (Not Token)">
      </div>
      <button class="btn" style="width:100%; margin-top:10px; background:#f39c12;" onclick="fetchCF()">📊 测试获取统计</button>
    </div>
    <div class="modal-actions">
      <button class="btn" style="background:#555;" onclick="closeSettings()">取消</button>
      <button class="btn btn-primary" onclick="saveSettings()">💾 保存配置</button>
    </div>
  </div>
</div>

<div id="toast" class="toast">已复制!</div>

<script>
let CF_CACHE = { acc: '', email: '', key: '' };
function init(){ updateLink(); loadLocalSettings(); refreshNet(); if(CF_CACHE.acc && CF_CACHE.key) fetchCF(true); }
function loadLocalSettings(){
    const stored = localStorage.getItem('cf_worker_config');
    if(stored){
        const data = JSON.parse(stored);
        CF_CACHE = data;
        document.getElementById('modal-cf-acc').value = data.acc || '';
        document.getElementById('modal-cf-email').value = data.email || '';
        document.getElementById('modal-cf-key').value = data.key || '';
    }
}
function saveSettings(){
    const acc = document.getElementById('modal-cf-acc').value.trim();
    const email = document.getElementById('modal-cf-email').value.trim();
    const key = document.getElementById('modal-cf-key').value.trim();
    localStorage.setItem('cf_worker_config', JSON.stringify({ acc, email, key }));
    CF_CACHE = { acc, email, key };
    showToast("配置已保存 (本地)");
    closeSettings();
    setTimeout(()=>fetchCF(true), 500);
}
function openSettings(){ document.getElementById('settingsModal').classList.add('active'); }
function closeSettings(){ document.getElementById('settingsModal').classList.remove('active'); }
function switchTab(t){
    document.querySelectorAll('.tab').forEach(e=>e.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(e=>e.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('tab-'+t).classList.add('active');
}
async function testTG(){
    const t = document.getElementById('modal-tg-token').value.trim();
    const i = document.getElementById('modal-tg-id').value.trim();
    if(!t || !i) return alert("请填写 Token 和 Chat ID");
    try { const r = await fetch('?flag=test_tg&token='+encodeURIComponent(t)+'&id='+encodeURIComponent(i)); const j = await r.json(); if(j.ok) alert("测试成功！请检查 TG"); else alert("测试失败"); } catch(e){ alert("请求错误"); }
}
async function fetchCF(silent=false){
    const acc = document.getElementById('modal-cf-acc').value.trim() || CF_CACHE.acc;
    const email = document.getElementById('modal-cf-email').value.trim() || CF_CACHE.email;
    const key = document.getElementById('modal-cf-key').value.trim() || CF_CACHE.key;
    if(!acc || !key) { if(!silent) alert("请先填写 Cloudflare API 信息"); return; }
    if(!silent) document.body.style.cursor = 'wait';
    try {
        const r = await fetch('?flag=get_cf_stats', { headers: { 'X-CF-Email': email, 'X-CF-Key': key, 'X-CF-Acc': acc } });
        if(r.ok){
            const data = await r.json();
            try { const reqs = data.data.viewer.accounts[0].workersInvocationsAdaptive[0].sum.requests; updateRing(reqs); if(!silent) alert("获取成功！今日请求: " + reqs); } catch(e) { updateRing(0); if(!silent) alert("数据解析失败，可能无数据或权限不足"); }
        } else { if(!silent) alert("API 请求失败: " + r.status); }
    } catch(e){ console.error(e); if(!silent) alert("网络错误"); }
    if(!silent) document.body.style.cursor = 'default';
}
function updateRing(val){
    const max = 100000;
    const circle = document.getElementById('ring-val');
    const radius = circle.r.baseVal.value;
    const circum = radius * 2 * Math.PI;
    const offset = circum - (val / max) * circum;
    circle.style.strokeDashoffset = offset;
    document.getElementById('req-count').innerText = val > 1000 ? (val/1000).toFixed(1)+'k' : val;
}
async function refreshNet(){
    const setStatus = (id, ok, ms) => { const d = document.getElementById('dot-'+id); const v = document.getElementById('ping-'+id); d.className = 'status-dot ' + (ok ? 'ok' : 'err'); v.innerText = ok ? ms + 'ms' : 'Error'; };
    fetch('?flag=net_test&url=https://www.google.com/favicon.ico').then(r=>r.json()).then(d=>{ setStatus('google', d.ok, d.ms); });
    fetch('?flag=net_test&url=https://www.cloudflare.com/favicon.ico').then(r=>r.json()).then(d=>{ setStatus('cf', d.ok, d.ms); });
}
function toggleClashMode(){ const e=document.getElementById("clashMode").checked; document.getElementById("clashSettings").style.display=e?"block":"none"; updateLink(); }
function updateLink(){
  let e=document.getElementById("subBaseUrl").value.trim();
  if(e.endsWith("/")) e=e.slice(0,-1);
  if(!e.startsWith("http")) e="https://"+e;
  const t=document.getElementById("proxyIp").value.trim();
  const s="${uuid}";
  const n=document.getElementById("clashMode").checked;
  let r="/";
  if(t) r="/proxyip="+t;
  const o=e+"/sub?uuid="+s+"&path="+encodeURIComponent(r);
  if(n){
    let c=document.getElementById("converterUrl").value.trim();
    if(c.endsWith("/")) c=c.slice(0,-1);
    const cfg=document.getElementById("configUrl").value.trim();
    let configParam = cfg ? "&config="+encodeURIComponent(cfg) : "";
    document.getElementById("resultUrl").value = c + "/sub?target=clash&url="+encodeURIComponent(o)+configParam+"&emoji=true&list=false&tfo=false&scv=false&fdn=false&sort=false";
  } else { document.getElementById("resultUrl").value = o; }
}
function copyId(e){ navigator.clipboard.writeText(document.getElementById(e).value).then(()=>showToast("已复制!")); }
function checkProxy(){
  const e=document.getElementById("proxyIp").value.trim();
  fetch("?flag=checkproxy&ip="+encodeURIComponent(e)+"&t="+Date.now(),{keepalive:!0});
  if(e){ navigator.clipboard.writeText(e).then(()=>{ alert("ProxyIP 已复制!"); window.open("${PROXY_CHECK_URL}","_blank"); }); } else { window.open("${PROXY_CHECK_URL}","_blank"); }
}
function showToast(e){ const t=document.getElementById("toast"); t.innerText=e; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2000); }
function logout(){ 
  showToast("正在退出...");
  document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
  document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
  setTimeout(() => window.location.href = "/", 300);
}
window.onload=init;
</script>
</body>
</html>`;
}
