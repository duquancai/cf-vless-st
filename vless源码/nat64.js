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
// Example usage:
const res = await getNat64ProxyIP('104.16.0.0', '[2602:fc59:b0:64::]');
console.log(res);

async function 解析地址端口(proxyIP) {
  if (proxyIP.includes('.william')) {
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
        console.error('解析ProxyIP失败:', error);
        return null;
      }
    })(proxyIP);
    proxyIP = williamResult;
  }
  return proxyIP;
}
