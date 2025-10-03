/*
天书13（修改）手搓节点使用说明如下：
  一、本程序预设：
    1、USER_KEY=ef3dcc57-6689-48e4-b3f9-2a62d88c730a（强烈建议部署时更换）;
    2、ENABLE_FLOW_CONTROL=false（预设关闭,根据使用情况选择开启或关闭）;
      开启使用控流可降低CPU超时的概率，提升连接稳定性，适合轻度使用，日常使用应该绰绰有余
    3、FLOW_CHUNK_SIZE = 64; 单位字节，相当于分片大小
  二、v2rayN客户端的单节点路径设置代理ip，通过代理客户端路径传递
    1、socks5代理所有网站,格式：s5all=xxx
    2、socks5代理cf相关的网站，非cf相关的网站走直连,格式：socks5=xxx或者socks5://xxx
    3、proxyip代理cf相关的网站，非cf相关的网站走直连,格式：pyip=xxx或者proxyip=xxx
    三种任选其一，如果不设置留空，cf相关的网站无法访问;
  注意：workers、pages、snippets都可以部署，部署完后手搓443系6个端口节点veless+ws+tls
*/
import { connect } from 'cloudflare:sockets';
const USER_KEY = 'ef3dcc57-6689-48e4-b3f9-2a62d88c730a';
const ENABLE_FLOW_CONTROL = false;
const FLOW_CHUNK_SIZE = 64;

export default {
  async fetch(request) {
    if (request.headers.get('Upgrade') === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair());
      server.accept();
      server.send(new Uint8Array([0, 0]));
      await startTransferPipeline(server, new URL(request.url));
      return new Response(null, { status: 101, webSocket: client });
    } else {
      return new Response('Hello World!', { status: 200 });
    }
  }
};

async function startTransferPipeline(ws, url) {
  let addrType, destHost, addrLen, tcpConn, firstPacket = false, firstPacketReady = null, writer, reader, sendQueue = Promise.resolve();
  const tempPath = decodeURIComponent(url.pathname + url.search);
  try {
    ws.addEventListener('message', async event => {
      if (!firstPacket) {
        firstPacket = true;
        firstPacketReady = parseFirstPacket(event.data);
        sendQueue = sendQueue.then(() => firstPacketReady).catch(() => { });
      } else {
        sendQueue = sendQueue.then(async () => await writer.write(event.data)).catch(() => { });
      }
    });
    async function parseFirstPacket(firstData) {
      const binBuffer = new Uint8Array(firstData);
      const formatVLKey = (a, i = 0) => [...a.slice(i, i + 16)].map(b => b.toString(16).padStart(2, '0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
      if (formatVLKey(binBuffer.slice(1, 17)) !== USER_KEY) throw new Error('UUID verification failed');
      const portIndex = 18 + binBuffer[17] + 1;
      const destPort = new DataView(binBuffer.buffer, portIndex, 2).getUint16(0);
      if (destPort === 53) { // handle DNS-over-TCP tunneled queries
        const dnsQuery = binBuffer.slice(portIndex + 9);
        const dohResponse = await fetch('https://1.1.1.1/dns-query', {
          method: 'POST',
          headers: { 'content-type': 'application/dns-message' },
          body: dnsQuery
        })
        const dohArray = await dohResponse.arrayBuffer();
        const lenHeader = new Uint8Array([(dohArray.byteLength >> 8) & 0xff, dohArray.byteLength & 0xff]);
        ws.send(await new Blob([lenHeader, dohArray]));
        return;
      }
      const addrIndex = portIndex + 2;
      addrType = binBuffer[addrIndex];
      let addrInfoIndex = addrIndex + 1;
      switch (addrType) {
        case 1:
          addrLen = 4;
          destHost = binBuffer.slice(addrInfoIndex, addrInfoIndex + addrLen).join('.');
          break;
        case 2:
          addrLen = binBuffer[addrInfoIndex];
          addrInfoIndex += 1;
          const domain = new TextDecoder().decode(binBuffer.slice(addrInfoIndex, addrInfoIndex + addrLen));
          destHost = domain;
          break;
        case 3:
          addrLen = 16;
          const ipv6 = [];
          const readIPv6 = new DataView(binBuffer.buffer, addrInfoIndex, 16);
          for (let i = 0; i < 8; i++) ipv6.push(readIPv6.getUint16(i * 2).toString(16));
          destHost = ipv6.join(':');
          break;
        default:
          throw new Error('Invalid destination address');
      }
      const socksAllMatch = tempPath.match(/s5all\s*=\s*([^&]+(?:\d+)?)/i);
      const socksAllMatchSpec = socksAllMatch ? socksAllMatch[1] : null;
      if (socksAllMatchSpec) {
        tcpConn = await createSocks5Connection(addrType, destHost, destPort, socksAllMatchSpec);
      } else {
        try {
          if (addrType === 3) {
            const ipv6Host = `[${destHost}]`;
            tcpConn = connect({ hostname: ipv6Host, port: destPort });
          } else {
            tcpConn = connect({ hostname: destHost, port: destPort });
          }
          await tcpConn.opened;
        } catch {
          const pyipMatch = tempPath.match(/p(?:rox)?yip\s*=\s*([^&]+(?:\d+)?)/i);
          const pyipSpec = pyipMatch ? pyipMatch[1] : null;
          if (pyipSpec) {
            const [proxyHost, proxyPort] = parseHostPort(pyipSpec);
            tcpConn = connect({ hostname: proxyHost, port: proxyPort });
          } else {
            const socksMatch = tempPath.match(/socks5\s*(?:=|(?::\/\/))\s*([^&]+(?:\d+)?)/i);
            const socksSpec = socksMatch ? socksMatch[1] : null;
            if (socksSpec) {
              tcpConn = await createSocks5Connection(addrType, destHost, destPort, socksSpec);
            } else {
              console.error('Connection failed: No proxy method specified');
            }
          }
        }
      }
      await tcpConn.opened;
      writer = tcpConn.writable.getWriter();
      reader = tcpConn.readable.getReader();
      const initialPayload = binBuffer.slice(addrInfoIndex + addrLen);
      if (initialPayload) await writer.write(initialPayload);
      startBackPipe();
      return;
    }
    async function startBackPipe() {
      while (true) {
        const { done: streamEnd, value: returnData } = await reader.read();
        if (returnData && returnData.length > 0) {
          if (ENABLE_FLOW_CONTROL) {
            let offset = 0;
            while (offset < returnData.length) {
              const chunk = returnData.slice(offset, offset + FLOW_CHUNK_SIZE);
              sendQueue = sendQueue.then(() => ws.send(chunk)).catch(() => { });
              offset += FLOW_CHUNK_SIZE;
            }
          } else {
            sendQueue = sendQueue.then(() => ws.send(returnData)).catch(() => { });
          }
        }
        if (streamEnd) break;
      }
    }
  } catch (e) {
    return new Response(`Handshake failed: ${e}`, { status: 500 });
  }
}

async function createSocks5Connection(addrType, destHost, destPort, socks5Spec) {
  let socks5Conn, convertedHost, writer, reader;
  try {
    const { username, password, host, port } = getSocks5Account(socks5Spec);
    socks5Conn = connect({ hostname: host, port: port });
    await socks5Conn.opened;
    writer = socks5Conn.writable.getWriter();
    reader = socks5Conn.readable.getReader();
    const encoder = new TextEncoder();
    const authReq = new Uint8Array([5, 2, 0, 2]);
    await writer.write(authReq);
    const authResp = (await reader.read()).value;
    if (authResp[1] === 0x02) {
      if (!username || !password) {
        throw new Error(`missing username or password`);
      }
      const userPassPacket = new Uint8Array([1, username.length, ...encoder.encode(username), password.length, ...encoder.encode(password)]);
      await writer.write(userPassPacket);
      const userPassResp = (await reader.read()).value;
      if (userPassResp[0] !== 0x01 || userPassResp[1] !== 0x00) {
        throw new Error(`username/password error`);
      }
    }
    switch (addrType) {
      case 1:
        convertedHost = new Uint8Array([1, ...destHost.split('.').map(Number)]);
        break;
      case 2:
        convertedHost = new Uint8Array([3, destHost.length, ...encoder.encode(destHost)]);
        break;
      case 3:
        convertedHost = toSocks5IPv6(destHost);
        function toSocks5IPv6(original) {
          const trim = original.startsWith('[') && original.endsWith(']') ? original.slice(1, -1) : original;
          const parts = trim.split('::');
          const prefix = parts[0] ? parts[0].split(':').filter(Boolean) : [];
          const suffix = parts[1] ? parts[1].split(':').filter(Boolean) : [];
          const fillCount = 8 - (prefix.length + suffix.length);
          if (fillCount < 0) throw new Error('invalid ipv6');
          const full = [...prefix, ...Array(fillCount).fill('0'), ...suffix];
          const bytes = full.flatMap(field => {
            const val = parseInt(field || '0', 16);
            return [(val >> 8) & 0xff, val & 0xff];
          });
          return new Uint8Array([0x04, ...bytes]);
        }
        break;
    }
    const buildReq = new Uint8Array([5, 1, 0, ...convertedHost, destPort >> 8, destPort & 0xff]);
    await writer.write(buildReq);
    const checkResp = (await reader.read()).value;
    if (checkResp[0] !== 0x05 || checkResp[1] !== 0x00) {
      throw new Error(`target connection failed, destHost: ${destHost}, addrType: ${addrType}`);
    }
    writer.releaseLock();
    reader.releaseLock();
    return socks5Conn;
  } catch {
    console.log('SOCKS5 account failed')
  }
  writer?.releaseLock();
  reader?.releaseLock();
  await socks5Conn?.close();
  throw new Error(`SOCKS5 account failed`);
}

function getSocks5Account(spec) {
  const [latter, former] = spec.split(/@?([\d\[\]a-z.:]+(?::\d+)?)$/i);
  let [username, password] = latter.split(':');
  if (!password) { password = '' };
  const [host, port] = parseHostPort(former);
  return { username, password, host, port };
}

function parseHostPort(hostSeg) {
  let host, ipv6, port;
  if (hostSeg.startsWith('[') && hostSeg.includes(']')) {
    [ipv6, port = 443] = hostSeg.split(']:');
    host = ipv6.endsWith(']') ? `${ipv6}` : `${ipv6}]`;
  } else {
    [host, port = 443] = hostSeg.split(':');
  }
  return [host, Number(port)];
}