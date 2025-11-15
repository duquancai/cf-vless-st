/*
纯手搓节点使用说明如下：
    一、本程序预设：
      1、FIXED_UUID = "6965d115-0236-44fd-b0ca-eefa7872c98e"（强烈建议部署时更换）
    二、v2rayN客户端的单节点路径设置代理ip，通过代理客户端路径传递
      1、socks5或者http代理所有网站(即：全局代理),格式：s5all=xxx或者httpall=xxx,二者任选其一
      2、socks5代理cf相关的网站，非cf相关的网站走直连,格式：socks5=xxx或者socks5://xxx
      3、http代理cf相关的网站，非cf相关的网站走直连,格式：http=xxx或者http://xxx
      4、proxyip代理cf相关的网站，非cf相关的网站走直连,格式：pyip=xxx或者proxyip=xxx
      5、如果path路径不设置留空，cf相关的网站无法访问
      以上五种任选其一即可
    注意：
      1、workers、pages、snippets都可以部署，纯手搓443系6个端口节点vless+ws+tls
      2、snippets部署的，william的proxyip域名"不支持"
*/
import { connect } from "cloudflare:sockets";
const FIXED_UUID = "6965d115-0236-44fd-b0ca-eefa7872c98e";
const MAX_PENDING = 2097152, KEEPALIVE = 15000, STALL_TIMEOUT = 8000, MAX_STALL = 12, MAX_RECONNECT = 24;

export default {
    async fetch(request) {
        const upgradeHeader = request.headers.get('Upgrade');
        if (!upgradeHeader || upgradeHeader !== 'websocket') {
            return new Response('Hello World!', { status: 200 });
        } else {
            const { 0: client, 1: server } = new WebSocketPair();
            server.accept();
            handleConnection(server, request);
            return new Response(null, { status: 101, webSocket: client });
        }
    }
};

class Pool {
    constructor() {
        this.buf = new ArrayBuffer(16384);
        this.ptr = 0;
        this.pool = [];
        this.max = 8;
        this.large = false;
    }
    alloc = s => {
        if (s <= 4096 && s <= 16384 - this.ptr) {
            const v = new Uint8Array(this.buf, this.ptr, s);
            this.ptr += s;
            return v;
        }
        const r = this.pool.pop();
        if (r && r.byteLength >= s) return new Uint8Array(r.buffer, 0, s);
        return new Uint8Array(s);
    };
    free = b => {
        if (b.buffer === this.buf) {
            this.ptr = Math.max(0, this.ptr - b.length);
            return;
        }
        if (this.pool.length < this.max && b.byteLength >= 1024) this.pool.push(b);
    };
    enableLarge = () => { this.large = true; };
    reset = () => { this.ptr = 0; this.pool.length = 0; this.large = false; };
}

function handleConnection(ws, request) {
    const url = new URL(request.url);
    const tempPath = decodeURIComponent(url.pathname + url.search);
    const pool = new Pool();
    let socket, writer, reader, info;
    let isFirstMsg = true, bytesReceived = 0, stallCount = 0, reconnectCount = 0;
    let lastData = Date.now();
    const timers = {};
    const dataBuffer = [];
    let dataBufferBytes = 0;
    const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";
    let isConnecting = false, isReading = false;
    let score = 1.0, lastCheck = Date.now(), lastRxBytes = 0, successCount = 0, failCount = 0;
    let stats = { total: 0, count: 0, bigChunks: 0, window: 0, timestamp: Date.now() };
    let mode = 'adaptive', avgSize = 0, throughputs = [];
    const updateMode = size => {
        stats.total += size;
        stats.count++;
        if (size > 8192) stats.bigChunks++;
        avgSize = avgSize * 0.9 + size * 0.1;
        const now = Date.now();
        if (now - stats.timestamp > 1000) {
            const rate = stats.window;
            throughputs.push(rate);
            if (throughputs.length > 5) throughputs.shift();
            stats.window = size;
            stats.timestamp = now;
            const avg = throughputs.reduce((a, b) => a + b, 0) / throughputs.length;
            if (stats.count >= 20) {
                if (avg > 20971520 && avgSize > 16384) {
                    if (mode !== 'buffered') {
                        mode = 'buffered';
                        pool.enableLarge();
                    }
                } else if (avg < 10485760 || avgSize < 8192) {
                    if (mode !== 'direct') mode = 'direct';
                } else {
                    if (mode !== 'adaptive') mode = 'adaptive';
                }
            }
        } else {
            stats.window += size;
        }
    };
    async function handleVossHandshake(data) {
        const bytes = new Uint8Array(data);
        ws.send(new Uint8Array([bytes[0], 0]));
        if (Array.from(bytes.slice(1, 17)).map(n => n.toString(16).padStart(2, '0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') !== FIXED_UUID) throw new Error('Auth failed');
        const offset1 = 18 + bytes[17] + 1;
        const port = (bytes[offset1] << 8) | bytes[offset1 + 1];
        const addrType = bytes[offset1 + 2];
        const offset2 = offset1 + 3;
        const addressType = addrType === 3 ? 4 : addrType === 2 ? 3 : 1;
        const { host, length } = parseAddress(bytes, offset2, addressType);
        const payload = bytes.slice(length);
        if (host.includes(atob('c3BlZWQuY2xvdWRmbGFyZS5jb20='))) throw new Error('Access');
        const sock = await createConnection(addressType, host, port);
        await sock.opened;
        const w = sock.writable.getWriter();
        if (payload.length) await w.write(payload);
        return { socket: sock, writer: w, reader: sock.readable.getReader(), info: { host, port } };
    }

    async function createConnection(addressType, host, port) {
        let sock;
        const socksAllMatch = tempPath.match(/(http|s5)all\s*=\s*([^&]+(?:\d+)?)/i);
        if (socksAllMatch != null && socksAllMatch[1] === 's5') {
            sock = await socks5Connect(host, port, socksAllMatch[2], addressType);
        } else if (socksAllMatch != null && socksAllMatch[1] === 'http') {
            sock = await httpConnect(host, port, socksAllMatch[2]);
        } else {
            try {
                sock = connect({ hostname: host, port });
                await sock.opened;
            } catch {
                const pyipMatch = tempPath.match(/p(?:rox)?yip\s*=\s*([^&]+(?:\d+)?)/i)?.[1];
                const socksMatch = tempPath.match(/socks5\s*(?:=|(?::\/\/))\s*([^&]+(?:\d+)?)/i)?.[1];
                const httpMatch = tempPath.match(/http\s*(?:=|(?::\/\/))\s*([^&]+(?:\d+)?)/i)?.[1];
                if (socksMatch) {
                    sock = await socks5Connect(host, port, socksMatch, addressType);
                } else if (httpMatch) {
                    sock = await httpConnect(host, port, httpMatch);
                } else if (pyipMatch) {
                    const [proxyIpAddress, proxyIpPort] = await parseHostPort(pyipMatch);
                    try {
                        sock = connect({ hostname: proxyIpAddress, port: proxyIpPort });
                    } catch {
                        sock = connect({ hostname: atob('UFJPWFlJUC50cDEuMDkwMjI3Lnh5eg=='), port: 1 });
                    }
                }
            }
        }
        return sock;
    }

    async function readLoop() {
        if (isReading) return;
        isReading = true;
        let batch = [], batchSize = 0, batchTimer = null;
        const flush = () => {
            if (!batchSize) return;
            const merged = new Uint8Array(batchSize);
            let pos = 0;
            for (const chunk of batch) {
                merged.set(chunk, pos);
                pos += chunk.length;
            }
            if (ws.readyState === 1) ws.send(merged);
            batch = [];
            batchSize = 0;
            if (batchTimer) {
                clearTimeout(batchTimer);
                batchTimer = null;
            }
        };
        try {
            while (true) {
                if (dataBufferBytes > MAX_PENDING) {
                    await new Promise(res => setTimeout(res, 100));
                    continue;
                }
                const { done, value } = await reader.read();
                if (value?.length) {
                    bytesReceived += value.length;
                    lastData = Date.now();
                    stallCount = 0;
                    updateMode(value.length);
                    const now = Date.now();
                    if (now - lastCheck > 5000) {
                        const elapsed = now - lastCheck;
                        const bytes = bytesReceived - lastRxBytes;
                        const throughput = bytes / elapsed;

                        if (throughput > 500) score = Math.min(1.0, score + 0.05);
                        else if (throughput < 50) score = Math.max(0.1, score - 0.05);

                        lastCheck = now;
                        lastRxBytes = bytesReceived;
                    }
                    if (mode === 'buffered') {
                        if (value.length < 32768) {
                            batch.push(value);
                            batchSize += value.length;
                            if (batchSize >= 131072) flush();
                            else if (!batchTimer) batchTimer = setTimeout(flush, avgSize > 16384 ? 5 : 20);
                        } else {
                            flush();
                            if (ws.readyState === 1) ws.send(value);
                        }
                    } else if (mode === 'adaptive') {
                        if (value.length < 4096) {
                            batch.push(value);
                            batchSize += value.length;
                            if (batchSize >= 32768) flush();
                            else if (!batchTimer) batchTimer = setTimeout(flush, 15);
                        } else {
                            flush();
                            if (ws.readyState === 1) ws.send(value);
                        }
                    } else {
                        flush();
                        if (ws.readyState === 1) ws.send(value);
                    }
                }
                if (done) {
                    flush();
                    isReading = false;
                    reconnect();
                    break;
                }
            }
        } catch (err) {
            flush();
            if (batchTimer) clearTimeout(batchTimer);
            isReading = false;
            failCount++;
            reconnect();
        }
    }

    async function reconnect() {
        if (!info || ws.readyState !== 1) {
            cleanup();
            ws.close(1011, 'Invalid.');
            return;
        }
        if (reconnectCount >= MAX_RECONNECT) {
            cleanup();
            ws.close(1011, 'Max reconnect.');
            return;
        }
        if (score < 0.3 && reconnectCount > 5 && Math.random() > 0.6) {
            cleanup();
            ws.close(1011, 'Poor network.');
            return;
        }
        if (isConnecting) return;
        reconnectCount++;
        let delay = Math.min(50 * Math.pow(1.5, reconnectCount - 1), 3000);
        delay *= (1.5 - score * 0.5);
        delay += (Math.random() - 0.5) * delay * 0.2;
        delay = Math.max(50, Math.floor(delay));
        console.log(`Reconnecting (attempt ${reconnectCount})...`);
        try {
            cleanupSocket();
            if (dataBufferBytes > MAX_PENDING * 2) {
                while (dataBufferBytes > MAX_PENDING && dataBuffer.length > 5) {
                    const drop = dataBuffer.shift();
                    dataBufferBytes -= drop.length;
                    pool.free(drop);
                }
            }
            await new Promise(res => setTimeout(res, delay));
            isConnecting = true;
            socket = connect({ hostname: info.host, port: info.port });
            await socket.opened;

            writer = socket.writable.getWriter();
            reader = socket.readable.getReader();
            const buffersToSend = dataBuffer.splice(0, 10);
            for (const buf of buffersToSend) {
                await writer.write(buf);
                dataBufferBytes -= buf.length;
                pool.free(buf);
            }
            isConnecting = false;
            reconnectCount = 0;
            score = Math.min(1.0, score + 0.15);
            successCount++;
            stallCount = 0;
            lastData = Date.now();
            readLoop();
        } catch (err) {
            isConnecting = false;
            failCount++;
            score = Math.max(0.1, score - 0.2);
            if (reconnectCount < MAX_RECONNECT && ws.readyState === 1) setTimeout(reconnect, 500);
            else {
                cleanup();
                ws.close(1011, 'Exhausted.');
            }
        }
    }

    function startTimers() {
        timers.keepalive = setInterval(async () => {
            if (!isConnecting && writer && Date.now() - lastData > KEEPALIVE) {
                try {
                    await writer.write(new Uint8Array(0));
                    lastData = Date.now();
                } catch (e) {
                    reconnect();
                }
            }
        }, KEEPALIVE / 3);
        timers.health = setInterval(() => {
            if (!isConnecting && stats.total > 0 && Date.now() - lastData > STALL_TIMEOUT) {
                stallCount++;
                if (stallCount >= MAX_STALL) {
                    if (reconnectCount < MAX_RECONNECT) {
                        stallCount = 0;
                        reconnect();
                    } else {
                        cleanup();
                        ws.close(1011, 'Stall.');
                    }
                }
            }
        }, STALL_TIMEOUT / 2);
    }

    function cleanupSocket() {
        isReading = false;
        try {
            writer?.releaseLock();
            reader?.releaseLock();
            socket?.close();
        } catch { }
    }

    function cleanup() {
        Object.values(timers).forEach(clearInterval);
        cleanupSocket();
        while (dataBuffer.length) pool.free(dataBuffer.shift());
        dataBufferBytes = 0;
        stats = { total: 0, count: 0, bigChunks: 0, window: 0, timestamp: Date.now() };
        mode = 'direct';
        avgSize = 0;
        throughputs = [];
        pool.reset();
    }

    function processEarlyData(earlyDataHeader) {
        if (!earlyDataHeader) return null;
        try {
            const base64Str = earlyDataHeader.replace(/-/g, "+").replace(/_/g, "/");
            const decode = atob(base64Str);
            const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
            return arryBuffer;
        } catch (error) {
            return null;
        }
    }

    ws.addEventListener('message', async evt => {
        try {
            if (isFirstMsg) {
                isFirstMsg = false;
                let firstData = evt.data;
                const earlyData = processEarlyData(earlyDataHeader);
                if (earlyData) {
                    const combined = new Uint8Array(earlyData.length + firstData.byteLength);
                    combined.set(earlyData);
                    combined.set(new Uint8Array(firstData), earlyData.length);
                    firstData = combined.buffer;
                }
                const result = await handleVossHandshake(firstData);
                if (result) {
                    ({ socket, writer, reader, info } = result);
                    startTimers();
                    readLoop();
                }
            } else {
                lastData = Date.now();
                if (!writer) {
                    const buf = pool.alloc(evt.data.byteLength);
                    buf.set(new Uint8Array(evt.data));
                    dataBuffer.push(buf);
                    dataBufferBytes += buf.length;
                } else {
                    await writer.write(evt.data);
                }
            }
        } catch (err) {
            cleanup();
            ws.close(1006, 'Error.');
        }
    });
    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
}

function parseAddress(bytes, offset, addrType) {
    let host, length, endOffset;
    switch (addrType) {
        case 1: // IPv4
            length = 4;
            host = Array.from(bytes.slice(offset, offset + length)).join('.');
            endOffset = offset + length;
            break;
        case 3: // Domain name
            length = bytes[offset];
            host = new TextDecoder().decode(bytes.slice(offset + 1, offset + 1 + length));
            endOffset = offset + 1 + length;
            break;
        case 4: // IPv6
            length = 16;
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(((bytes[offset + i * 2] << 8) | bytes[offset + i * 2 + 1]).toString(16));
            }
            host = ipv6.join(':');
            endOffset = offset + length;
            break;
        default:
            throw new Error(`Invalid address type: ${addrType}`);
    }
    return { host, length: endOffset };
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

async function socks5Connect(addressRemote, portRemote, socks5Spec, addressType = 3) {
    const [latter, former] = socks5Spec.split(/@?([\d\[\]a-z.:]+(?::\d+)?)$/i);
    let [username, password] = latter.split(':');
    if (!password) { password = '' };
    const [hostname, port] = await parseHostPort(former);
    const socket = connect({ hostname, port });
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    const encoder = new TextEncoder();
    await writer.write(new Uint8Array([5, 2, 0, 2]));
    let res = (await reader.read()).value;
    if (res[0] !== 0x05 || res[1] === 0xff) return;
    if (res[1] === 0x02) {
        if (!username || !password) return;
        await writer.write(new Uint8Array([1, username.length, ...encoder.encode(username), password.length, ...encoder.encode(password)]));
        res = (await reader.read()).value;
        if (res[0] !== 0x01 || res[1] !== 0x00) return;
    }
    const DSTADDR = addressType === 1 ? new Uint8Array([1, ...addressRemote.split('.').map(Number)])
        : addressType === 3 ? new Uint8Array([3, addressRemote.length, ...encoder.encode(addressRemote)])
            : new Uint8Array([4, ...addressRemote.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]);
    await writer.write(new Uint8Array([5, 1, 0, ...DSTADDR, portRemote >> 8, portRemote & 0xff]));
    res = (await reader.read()).value;
    if (res[1] !== 0x00) return;
    writer.releaseLock();
    reader.releaseLock();
    return socket;
}

async function httpConnect(addressRemote, portRemote, httpSpec) {
    const [latter, former] = httpSpec.split(/@?([\d\[\]a-z.:]+(?::\d+)?)$/i);
    let [username, password] = latter.split(':');
    if (!password) { password = '' };
    const [hostname, port] = await parseHostPort(former);
    const sock = await connect({ hostname, port });
    const authHeader = username && password ? `Proxy-Authorization: Basic ${btoa(`${username}:${password}`)}\r\n` : '';
    const connectRequest = `CONNECT ${addressRemote}:${portRemote} HTTP/1.1\r\n` +
        `Host: ${addressRemote}:${portRemote}\r\n` +
        authHeader +
        `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n` +
        `Proxy-Connection: Keep-Alive\r\n` +
        `Connection: Keep-Alive\r\n\r\n`;
    const writer = sock.writable.getWriter();
    try {
        await writer.write(new TextEncoder().encode(connectRequest));
    } catch (err) {
        throw new Error(`Failed to send HTTP CONNECT request: ${err.message}`);
    } finally {
        writer.releaseLock();
    }
    const reader = sock.readable.getReader();
    let responseBuffer = new Uint8Array(0);
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) throw new Error('HTTP connection interrupted');
            const newBuffer = new Uint8Array(responseBuffer.length + value.length);
            newBuffer.set(responseBuffer);
            newBuffer.set(value, responseBuffer.length);
            responseBuffer = newBuffer;
            const respText = new TextDecoder().decode(responseBuffer);
            if (respText.includes('\r\n\r\n')) {
                const headersEndPos = respText.indexOf('\r\n\r\n') + 4;
                const headers = respText.substring(0, headersEndPos);
                if (!headers.startsWith('HTTP/1.1 200') && !headers.startsWith('HTTP/1.0 200')) {
                    throw new Error(`HTTP connection failed: ${headers.split('\r\n')[0]}`);
                }
                if (headersEndPos < responseBuffer.length) {
                    const remainingData = responseBuffer.slice(headersEndPos);
                    const { readable, writable } = new TransformStream();
                    new ReadableStream({
                        start(controller) {
                            controller.enqueue(remainingData);
                        }
                    }).pipeTo(writable).catch(() => { });
                    // @ts-ignore
                    sock.readable = readable;
                }
                break;
            }
        }
    } catch (err) {
        throw new Error(`HTTP proxy connection failed: ${err.message}`);
    } finally {
        reader.releaseLock();
    }
    return sock;
}