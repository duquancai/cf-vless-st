/*
纯手搓节点使用说明如下：
    一、本程序预设：
      1、USER_KEY=ef3dcc57-6689-48e4-b3f9-2a62d88c730a（强烈建议部署时更换）
      2、ENABLE_FLOW_CONTROL=false（预设关闭,根据使用情况选择开启或关闭）
        开启使用控流可降低CPU超时的概率，提升连接稳定性，适合轻度使用，日常使用应该绰绰有余
      3、FLOW_CHUNK_SIZE = 64; 单位字节，相当于分片大小
    二、v2rayN客户端的单节点路径设置代理ip，通过代理客户端路径传递
      1、socks5或者http代理所有网站(即：全局代理),格式：s5all=xxx或者httpall=xxx,二者任选其一
      2、socks5代理cf相关的网站，非cf相关的网站走直连,格式：socks5=xxx或者socks5://xxx
      3、http代理cf相关的网站，非cf相关的网站走直连,格式：http=xxx或者http://xxx
      4、proxyip代理cf相关的网站，非cf相关的网站走直连,格式：pyip=xxx或者proxyip=xxx
      5、nat64代理cf相关的网站，非cf相关的网站走直连,格式：nat64pf=[2602:fc59:b0:64::]
      6、如果path路径不设置留空，cf相关的网站无法访问
      以上六种任选其一即可
    注意：
      1、workers、pages、snippets都可以部署，纯手搓443系6个端口节点vless+ws+tls
      2、snippets部署的，nat64及william的proxyip域名"不支持"
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
      startTransferPipeline(server, new URL(request.url)).catch(e => console.error('pipeline error', e));
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
      const portIndex = binBuffer[17] + 19;
      const destPort = new DataView(binBuffer.buffer, portIndex, 2).getUint16(0);
      if (destPort === 53) { // handle DNS-over-TCP tunneled queries
        const dnsQuery = binBuffer.slice(portIndex + 9);
        const dohResponse = await fetch('https://dns.google/dns-query', {
          method: 'POST',
          headers: { 'content-type': 'application/dns-message' },
          body: dnsQuery
        })
        const dohArray = await dohResponse.arrayBuffer();
        const lenHeader = new Uint8Array([(dohArray.byteLength >> 8) & 0xff, dohArray.byteLength & 0xff]);
        ws.send(await new Blob([lenHeader, dohArray]));
        return;
      }
      let addrIndex = portIndex + 2;
      addrType = binBuffer[addrIndex++];
      switch (addrType) {
        case 1:
          addrLen = 4;
          destHost = binBuffer.slice(addrIndex, addrIndex + addrLen).join('.');
          break;
        case 2:
          addrLen = binBuffer[addrIndex];
          addrIndex++;
          const domain = new TextDecoder().decode(binBuffer.slice(addrIndex, addrIndex + addrLen));
          destHost = domain;
          break;
        case 3:
          addrLen = 16;
          const ipv6 = [];
          const readIPv6 = new DataView(binBuffer.buffer, addrIndex, 16);
          for (let i = 0; i < 8; i++) ipv6.push(readIPv6.getUint16(i * 2).toString(16).padStart(4, '0'));
          destHost = ipv6.join(':').replace(/(^|:)0+(\w)/g, '$1$2');
          break;
        default:
          throw new Error('Invalid destination address');
      }
      const socksAllMatch = tempPath.match(/(http|s5)all\s*=\s*([^&]+(?:\d+)?)/i);
      if (socksAllMatch != null && socksAllMatch[1] === 's5') {
        tcpConn = await createSocks5Connection(addrType, destHost, destPort, socksAllMatch[2]);
      } else if (socksAllMatch != null && socksAllMatch[1] === 'http') {
        tcpConn = await httpConnect(destHost, destPort, socksAllMatch[2]);
      } else {
        try {
          tcpConn = connect({ hostname: addrType === 3 ? `[${destHost}]` : destHost, port: destPort });
          await tcpConn.opened;
        } catch {
          const pyipMatch = tempPath.match(/p(?:rox)?yip\s*=\s*([^&]+(?:\d+)?)/i)?.[1];
          const nat64Match = tempPath.match(/nat64pf\s*=\s*([^&]+(?:\d+)?)/i)?.[1];
          const httpMatch = tempPath.match(/http\s*(?:=|(?::\/\/))\s*([^&]+(?:\d+)?)/i)?.[1];
          if (pyipMatch) {
            const [proxyHost, proxyPort] = await parseHostPort(pyipMatch);
            tcpConn = connect({ hostname: proxyHost, port: proxyPort });
          } else if (nat64Match) {
            const nat64IP = await getNat64ProxyIP(destHost, nat64Match);
            tcpConn = connect({ hostname: nat64IP, port: destPort });
          } else if (httpMatch) {
            tcpConn = await httpConnect(destHost, destPort, httpMatch);
          }
          else {
            const socksMatch = tempPath.match(/socks5\s*(?:=|(?::\/\/))\s*([^&]+(?:\d+)?)/i)?.[1];
            if (socksMatch) {
              tcpConn = await createSocks5Connection(addrType, destHost, destPort, socksMatch);
            } else {
              console.error('Connection failed: No proxy method specified');
            }
          }
        }
      }
      await tcpConn.opened;
      writer = tcpConn.writable.getWriter();
      reader = tcpConn.readable.getReader();
      const initialPayload = binBuffer.slice(addrIndex + addrLen);
      if (initialPayload) await writer.write(initialPayload);
      startBackPipe().catch(e => console.error('pipe error', e));
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
    const [latter, former] = socks5Spec.split(/@?([\d\[\]a-z.:]+(?::\d+)?)$/i);
    let [username, password] = latter.split(':');
    if (!password) { password = '' };
    const [host, port] = await parseHostPort(former);
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
        convertedHost = new Uint8Array(
          [4, ...destHost.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]
        );
        break;
      default:
        console.log(`invalid addressType is ${addrType}`);
        return;
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

async function httpConnect(addressRemote, portRemote, httpSpec) {
  const [latter, former] = httpSpec.split(/@?([\d\[\]a-z.:]+(?::\d+)?)$/i);
  let [username, password] = latter.split(':');
  if (!password) { password = '' };
  const [hostname, port] = await parseHostPort(former);
  const sock = await connect({
    hostname: hostname,
    port: port
  });
  let connectRequest = `CONNECT ${addressRemote}:${portRemote} HTTP/1.1\r\n`;
  connectRequest += `Host: ${addressRemote}:${portRemote}\r\n`;
  if (username && password) {
    const authString = `${username}:${password}`;
    const base64Auth = btoa(authString);
    connectRequest += `Proxy-Authorization: Basic ${base64Auth}\r\n`;
  }
  connectRequest += `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n`;
  connectRequest += `Proxy-Connection: Keep-Alive\r\n`;
  connectRequest += `Connection: Keep-Alive\r\n`;
  connectRequest += `\r\n`;
  try {
    const writer = sock.writable.getWriter();
    await writer.write(new TextEncoder().encode(connectRequest));
    writer.releaseLock();
  } catch (err) {
    console.error('The HTTP CONNECT request failed to send:', err);
    throw new Error(`The HTTP CONNECT request failed to send: ${err.message}`);
  }
  const reader = sock.readable.getReader();
  let respText = '';
  let connected = false;
  let responseBuffer = new Uint8Array(0);
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.error('HTTP proxy connection interrupted');
        throw new Error('HTTP proxy connection interrupted');
      }
      const newBuffer = new Uint8Array(responseBuffer.length + value.length);
      newBuffer.set(responseBuffer);
      newBuffer.set(value, responseBuffer.length);
      responseBuffer = newBuffer;
      respText = new TextDecoder().decode(responseBuffer);
      if (respText.includes('\r\n\r\n')) {
        const headersEndPos = respText.indexOf('\r\n\r\n') + 4;
        const headers = respText.substring(0, headersEndPos);
        if (headers.startsWith('HTTP/1.1 200') || headers.startsWith('HTTP/1.0 200')) {
          connected = true;
          if (headersEndPos < responseBuffer.length) {
            const remainingData = responseBuffer.slice(headersEndPos);
            const dataStream = new ReadableStream({
              start(controller) {
                controller.enqueue(remainingData);
              }
            });
            const { readable, writable } = new TransformStream();
            dataStream.pipeTo(writable).catch(err => console.error('Error processing remaining data:', err));
            // @ts-ignore
            sock.readable = readable;
          }
        } else {
          const errorMsg = `HTTP proxy connection failed: ${headers.split('\r\n')[0]}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        break;
      }
    }
  } catch (err) {
    reader.releaseLock();
    throw new Error(`Failed to process HTTP proxy response: ${err.message}`);
  }
  reader.releaseLock();
  if (!connected) {
    throw new Error('HTTP proxy connection failed: No successful response received');
  }
  return sock;
}

async function getNat64ProxyIP(remoteAddress, nat64Prefix) {
  let parts
  nat64Prefix = nat64Prefix.slice(1, -1);
  if (/^\d+\.\d+\.\d+\.\d+$/.test(remoteAddress)) {
    parts = remoteAddress.split('.');
  } else if (remoteAddress.includes(':')) {
    return remoteAddress;
  } else {
    const dnsQuery = await fetch(`https://1.1.1.1/dns-query?name=${remoteAddress}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    const dnsResult = await dnsQuery.json();
    const aRecord = dnsResult.Answer.find(record => record.type === 1);
    if (!aRecord) return;
    parts = aRecord.data.split('.');
  }
  const hex = parts.map(part => {
    const num = parseInt(part, 10);
    return num.toString(16).padStart(2, '0');
  });
  return `[${nat64Prefix}${hex[0]}${hex[1]}:${hex[2]}${hex[3]}]`;
}

async function parseHostPort(hostSeg) {
  let host, ipv6, port;
  if (/\.william/i.test(hostSeg)) {
    const williamResult = await (async function (william) {
      try {
        const response = await fetch(`https://1.1.1.1/dns-query?name=${william}&type=TXT`, { headers: { 'Accept': 'application/dns-json' } });
        if (!response.ok) return null;
        const data = await response.json();
        const txtRecords = (data.Answer || []).filter(record => record.type === 16).map(record => record.data);
        if (txtRecords.length === 0) return null;
        let txtData = txtRecords[0];
        if (txtData.startsWith('"') && txtData.endsWith('"')) txtData = txtData.slice(1, -1);
        const prefixes = txtData.replace(/\\010/g, ',').replace(/\n/g, ',').split(',').map(s => s.trim()).filter(Boolean);
        if (prefixes.length === 0) return null;
        return prefixes[Math.floor(Math.random() * prefixes.length)];
      } catch (error) {
        console.error('Failed to resolve ProxyIP:', error);
        return null;
      }
    })(hostSeg);
    hostSeg = williamResult || hostSeg;
  }
  if (hostSeg.startsWith('[') && hostSeg.includes(']')) {
    [ipv6, port = 443] = hostSeg.split(']:');
    host = ipv6.endsWith(']') ? `${ipv6}` : `${ipv6}]`;
  } else {
    [host, port = 443] = hostSeg.split(/[:,;]/);
  }
  return [host, Number(port)];
}