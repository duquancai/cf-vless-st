async function getNat64ProxyIP(domain, nat64Prefix) {
    try {
        const dnsQuery = await fetch(`https://1.1.1.1/dns-query?name=${domain}&type=A`, {
            headers: { 'Accept': 'application/dns-json' }
        });
        const dnsResult = await dnsQuery.json();
        if (dnsResult.Answer && dnsResult.Answer.length > 0) {
            const aRecord = dnsResult.Answer.find(record => record.type === 1);
            if (aRecord) {
                const ipv4Address = aRecord.data;
                const parts = ipv4Address.split('.');
                if (parts.length !== 4) { throw new Error('Invalid IPv4 address'); };
                const hex = parts.map(part => {
                    const num = parseInt(part, 10);
                    if (num < 0 || num > 255) { throw new Error('Invalid IPv4 address segment'); };
                    return num.toString(16).padStart(2, '0');
                });
                const chosenPrefix = nat64Prefix[Math.floor(Math.random() * nat64Prefix.length)];
                return `[${chosenPrefix}${hex[0]}${hex[1]}:${hex[2]}${hex[3]}]`;
            }
        }
        throw new Error('Unable to resolve domain IPv4 address');
    } catch (err) {
        throw new Error(`DNS resolution failed: ${err.message}`);
    }
}