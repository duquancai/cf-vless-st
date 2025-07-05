

//订阅地址：https://域名/UUID/vless

import { connect } from 'cloudflare:sockets';

const config = {
  id: '123abc',
  uuid: '3ad36a60-f126-4b5d-a252-c6455c218ebc',//部署时请更新
  node: 'cloudflare.9jy.cc',
  enableProxy: true,
  proxyIP: 'ProxyIP.US.CMLiussss.net:443',//无法访问cf网站时更新
  nodeName: '天书系列tg稳定版'
};

const decoder = new TextDecoder();
const uuidCache = new Map();
const vlessConfigCache = new Map();
const failedIPMap = new Map();

const MAX_FAIL = 5;
const FAIL_WINDOW_MS = 60 * 1000;
// 心跳间隔时间（毫秒）
const HEARTBEAT_INTERVAL = 15000;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const upgrade = request.headers.get('Upgrade');

    if (upgrade !== 'websocket') {
      if (url.pathname === `/${config.uuid}/vless`) {
        return new Response(generateVlessConfig(request.headers.get('Host')), {
          status: 200,
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
      }
      return new Response('Expected WebSocket', { status: 400 });
    }

    const protocol = request.headers.get('sec-websocket-protocol');
    const data = decodeBase64(protocol);

    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const fails = failedIPMap.get(clientIP) || [];
    const recentFails = fails.filter(ts => now - ts < FAIL_WINDOW_MS);
    if (recentFails.length >= MAX_FAIL) {
      return new Response('Too many failed attempts', { status: 429 });
    }

    if (!verifyUUID(new Uint8Array(data, 1, 16))) {
      recentFails.push(now);
      failedIPMap.set(clientIP, recentFails);
      return new Response('Invalid UUID', { status: 403 });
    }

    const { 0: client, 1: server } = new WebSocketPair();
    if (server.accept) server.accept();

    try {
      const { tcpSocket, initialData } = await parseVlessHeader(data);
      proxyPipeline(server, tcpSocket, initialData);
      return new Response(null, { status: 101, webSocket: client });
    } catch (e) {
      server.close();
      return new Response('Connection failed', { status: 500 });
    }
  }
};

function decodeBase64(str) {
  let base64 = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    base64 += (c === '-') ? '+' : (c === '_') ? '/' : c;
  }
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
}

function verifyUUID(bytes) {
  const uuidStr = config.uuid;
  if (!uuidCache.has(uuidStr)) {
    const hex = uuidStr.replace(/-/g, '');
    const bin = new Uint8Array(16);
    for (let i = 0; i < 16; i++) bin[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    uuidCache.set(uuidStr, bin);
  }
  const expected = uuidCache.get(uuidStr);
  if (bytes.length !== expected.length) return false;
  for (let i = 0; i < bytes.length; i++) if (bytes[i] !== expected[i]) return false;
  return true;
}

async function parseVlessHeader(data) {
  const view = new DataView(data);
  const dataU8 = new Uint8Array(data);
  const optLen = dataU8[17];
  const portOffset = 18 + optLen + 1;
  const port = view.getUint16(portOffset);
  const type = dataU8[portOffset + 2];
  let offset = portOffset + 3;
  let address = '';

  if (type === 1) {
    address = Array.from(new Uint8Array(data, offset, 4)).join('.');
    offset += 4;
  } else if (type === 2) {
    const len = dataU8[offset];
    address = decoder.decode(new Uint8Array(data, offset + 1, len));
    offset += len + 1;
  } else {
    const ipv6 = [];
    for (let i = 0; i < 8; i++) ipv6.push(view.getUint16(offset + i * 2).toString(16));
    address = ipv6.join(':');
    offset += 16;
  }

  const initialData = new Uint8Array(data, offset);

  async function tryConnect(host, port, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const socket = connect({ hostname: host, port });
        await socket.opened;
        return socket;
      } catch (e) {
        if (attempt === maxRetries) throw e;
        await new Promise(res => setTimeout(res, 100));
      }
    }
  }

  try {
    return {
      tcpSocket: await tryConnect(address, port),
      initialData
    };
  } catch {
    if (config.enableProxy && config.proxyIP) {
      const [ip, p] = config.proxyIP.split(':');
      return {
        tcpSocket: await tryConnect(ip, Number(p) || port),
        initialData
      };
    }
    throw new Error('Both direct and proxy failed');
  }
}

async function proxyPipeline(ws, tcp, initialData) {
  // 发送初始响应
  ws.send(new Uint8Array([0, 0]));

  const writer = tcp.writable.getWriter();
  const reader = tcp.readable.getReader();

  if (initialData) await writer.write(initialData);

  // 设置心跳定时器，定期发送心跳消息
  const heartbeatInterval = setInterval(() => {
    try {
      ws.send(new Uint8Array([0xFF, 0xFF])); // 发送心跳包
    } catch (e) {
      console.error('心跳发送失败:', e.message);
      clearInterval(heartbeatInterval);
      ws.close();
    }
  }, HEARTBEAT_INTERVAL);

  // 设置空闲超时为心跳间隔的2倍
  const idleTimer = setTimeout(() => {
    clearInterval(heartbeatInterval);
    ws.close();
  }, HEARTBEAT_INTERVAL * 2); // 30秒

  // 处理 WebSocket 消息
  ws.addEventListener('message', async e => {
    clearTimeout(idleTimer); // 收到消息时重置空闲计时器
    const chunk = e.data instanceof Blob ? new Uint8Array(await e.data.arrayBuffer()) : e.data;
    // 检查是否为心跳包
    if (chunk instanceof Uint8Array && chunk[0] === 0xFF && chunk[1] === 0xFF) {
      return; // 忽略心跳包
    }
    await writer.write(chunk);
  });

  // 事件驱动的读循环
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      ws.send(value);
    }
  } finally {
    clearInterval(heartbeatInterval); // 清理心跳
    ws.close();
    reader.cancel().catch(() => {});
    writer.releaseLock();
    tcp.close();
    clearTimeout(idleTimer);
  }
}

function generateVlessConfig(host) {
  if (vlessConfigCache.has(host)) return vlessConfigCache.get(host);
  const configStr = btoa(`vless://${config.uuid}@${config.node}:443?encryption=none&security=tls&sni=${host}&type=ws&host=${host}&path=${encodeURIComponent('/?ed=2560')}#${encodeURIComponent(config.nodeName)}`);
  vlessConfigCache.set(host, configStr);
  return configStr;
} 