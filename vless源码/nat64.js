async function getNat64ProxyIP(domain, nat64Prefix) {
  let parts
  nat64Prefix = nat64Prefix.slice(1, -1);
  if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    parts = domain.split('.');
  } else if (domain.includes(':')) {
    return domain;
  } else {
    const dnsQuery = await fetch(`https://1.1.1.1/dns-query?name=${domain}&type=A`, {
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
const res = await getNat64ProxyIP('104.16.0.0', '[2602:fc59:b0:64::]');
console.log(res);