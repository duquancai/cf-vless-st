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
// Example usage:
const res = await getNat64ProxyIP('ip.sb', '[2602:fc59:b0:64::]');
console.log(res, "类型:", typeof res);

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
const result = await parseHostPort('kr.william.ccwu.cc');
console.log(result, "类型:", typeof result);

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
    console.error('发送HTTP CONNECT请求失败:', err);
    throw new Error(`发送HTTP CONNECT请求失败: ${err.message}`);
  }
  const reader = sock.readable.getReader();
  let respText = '';
  let connected = false;
  let responseBuffer = new Uint8Array(0);
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.error('HTTP代理连接中断');
        throw new Error('HTTP代理连接中断');
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
            dataStream.pipeTo(writable).catch(err => console.error('处理剩余数据错误:', err));
            sock.readable = readable;
          }
        } else {
          const errorMsg = `HTTP代理连接失败: ${headers.split('\r\n')[0]}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        break;
      }
    }
  } catch (err) {
    reader.releaseLock();
    throw new Error(`处理HTTP代理响应失败: ${err.message}`);
  }
  reader.releaseLock();
  if (!connected) {
    throw new Error('HTTP代理连接失败: 未收到成功响应');
  }
  return sock;
}