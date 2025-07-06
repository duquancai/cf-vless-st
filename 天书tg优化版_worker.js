//订阅地址：https://域名/ID/vless 
import { connect } from 'cloudflare:sockets';

const config = {
  id: '123adu',
  uuid: 'b2975c29-dceb-4b68-93f8-f3fd06c7828d',
  node: 'ns5.cloudflare.com',
  enableProxy: true,
  proxyIP: 'ProxyIP.US.CMLiussss.net:443',
  nodeName: '天书系列tg优化版'
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const upgrade = request.headers.get('Upgrade');
    if (upgrade !== 'websocket') {
      if (url.pathname === `/${config.id}/vless`) {
        return new Response(generateVlessConfig(request.headers.get('Host')), {
          status: 200,
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
      }
      return new Response('Expected WebSocket', { status: 400 });
    }
    const protocol = request.headers.get('sec-websocket-protocol');
    const data = decodeBase64(protocol);
  
    if (verifyUUID(new Uint8Array(data.slice(1, 17))) !== config.uuid) {
      return new Response('Invalid UUID', { status: 403 });
    }
 
    const { 0: client, 1: server } = new WebSocketPair();
    server.accept();
    try {
      const { tcpSocket, initialData } = await parseVlessHeader(data);
      proxyPipeline(server, tcpSocket, initialData);
      return new Response(null, { status: 101, webSocket: client });
    } catch {
      server.close(); 
      return new Response('Connection failed', { status: 500 });
    }
  }
};
function decodeBase64(str) {
  return Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)).buffer;
}
function verifyUUID(bytes) {
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
async function parseVlessHeader(data) {
  const view = new DataView(data);
  const optLen = new Uint8Array(data)[17];
  const portOffset = 18 + optLen + 1;
  const port = view.getUint16(portOffset);
  const type = new Uint8Array(data)[portOffset + 2];
  let offset = portOffset + 3;
  let address = '';
  if (type === 1) {
    address = Array.from(new Uint8Array(data.slice(offset, offset + 4))).join('.');
    offset += 4;
  } else if (type === 2) {
    const len = new Uint8Array(data)[offset];
    address = new TextDecoder().decode(data.slice(offset + 1, offset + 1 + len));
    offset += len + 1;
  } else {
    const ipv6 = [];
    for (let i = 0; i < 8; i++) ipv6.push(view.getUint16(offset + i * 2).toString(16));
    address = ipv6.join(':');
    offset += 16;
  }
  const initialData = data.slice(offset);
  async function tryConnect(host, port) {
    const socket = connect({ hostname: host, port });
    await socket.opened;
    return socket;
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
  ws.send(new Uint8Array([0, 0]));
  let closed = false;
  const closeAll = async () => {
    if (closed) return;
    closed = true;
    try { await reader.cancel(); } catch {}
    writer.releaseLock();
    tcp.close();
    ws.close();
  };
  const writer = tcp.writable.getWriter();
  const reader = tcp.readable.getReader();
  if (initialData) {
    await writer.write(initialData).catch(() => {});
    writer.releaseLock();
  }
  ws.addEventListener('message', e => {
    const w = tcp.writable.getWriter();
    w.write(e.data).catch(() => {});
    w.releaseLock();
  });
  ws.addEventListener('close', closeAll);
  ws.addEventListener('error', closeAll);
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      ws.send(value);
    }
  } catch {}
  finally {
    await closeAll();
  }
}
function generateVlessConfig(host) {
  return btoa(`vless://${config.uuid}@${config.node}:443?encryption=none&security=tls&sni=${host}&type=ws&host=${host}&path=${encodeURIComponent('/?ed=2560')}#${encodeURIComponent(config.nodeName)}`);
}