async function getNat64ProxyIP(remoteAddress, nat64Prefix) {
  let parts
  nat64Prefix = nat64Prefix.slice(1, -1);
  if (/^\d+\.\d+\.\d+\.\d+$/.test(remoteAddress)) {
    parts = remoteAddress.split('.');
  } else if (remoteAddress.includes(':')) {
    return remoteAddress;
  } else {
    const dnsQuery = await fetch(`https://doh.090227.xyz/CMLiussss?name=${remoteAddress}&type=A`, {
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
        const response = await fetch(`https://doh.pub/dns-query?name=${william}&type=TXT`, { headers: { 'Accept': 'application/dns-json' } });
        if (!response.ok) return null;
        const data = await response.json();
        const txtRecords = (data.Answer || []).filter(record => record.type === 16).map(record => record.data);
        if (txtRecords.length === 0) return null;
        let txtData = txtRecords[0];
        if (txtData.startsWith('"') && txtData.endsWith('"')) txtData = txtData.slice(1, -1);
        const prefixes = txtData.replace(/\\010/g, ',').replace(/\n/g, ',').split(',').map(s => s.trim()).filter(Boolean);
        console.log(william, '域名绑定的ProxyIP有:', prefixes);
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

async function socks5Connect(addressRemote, portRemote, socks5Spec, addressType = 3) {
  const [latter, former] = socks5Spec.split(/@?([\d\[\]a-z.:]+(?::\d+)?)$/i);
  let [username, password] = latter.split(':');
  if (!password) { password = '' };
  const [hostname, port] = await parseHostPort(former);
  const socket = connect({ hostname, port });
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const encoder = new TextEncoder();
  // SOCKS5 握手: VER(5) + NMETHODS(2) + METHODS(0x00,0x02)
  await writer.write(new Uint8Array([5, 2, 0, 2]));
  let res = (await reader.read()).value;
  if (res[0] !== 0x05 || res[1] === 0xff) return;
  // 如果需要用户名密码认证
  if (res[1] === 0x02) {
    if (!username || !password) return;
    await writer.write(new Uint8Array([1, username.length, ...encoder.encode(username), password.length, ...encoder.encode(password)]));
    res = (await reader.read()).value;
    if (res[0] !== 0x01 || res[1] !== 0x00) return;
  }
  // 构建目标地址 (ATYP + DST.ADDR)
  const DSTADDR = addressType === 1 ? new Uint8Array([1, ...addressRemote.split('.').map(Number)])
    : addressType === 3 ? new Uint8Array([3, addressRemote.length, ...encoder.encode(addressRemote)])
      : new Uint8Array([4, ...addressRemote.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]);

  // 发送连接请求: VER(5) + CMD(1=CONNECT) + RSV(0) + DSTADDR + DST.PORT
  await writer.write(new Uint8Array([5, 1, 0, ...DSTADDR, portRemote >> 8, portRemote & 0xff]));
  res = (await reader.read()).value;
  if (res[1] !== 0x00) return;
  writer.releaseLock();
  reader.releaseLock();
  return socket;
}
// Example usage:
//const res = await getNat64ProxyIP('ip.sb', '[2602:fc59:b0:64::]');
//console.log(res, "类型:", typeof res);

const result = await parseHostPort('kr.william.ccwu.cc');
//console.log(result, "类型:", typeof result);