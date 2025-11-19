/*
纯手搓节点使用说明如下：
    一、本程序预设：
      1、PASSWORD=abc（强烈建议部署时更换）
        注意：v2rayN客户端密码、路径与部署的保持一致！
    二、v2rayN客户端的单节点路径设置代理ip，通过代理客户端路径传递
      1、socks5代理全局,格式：abc/socks5=xxx
      2、http代理全局,格式：abc/http=xxx
      3、proxyip代理cf相关的网站，非cf相关的网站走直连,格式：abc/proxyip=xxx
      4、路径只填写abc，走直连，cf相关的网站打不开，格式：abc
      以上四种任选其一即可
    注意：
      1、workers、pages、snippets都可以部署，纯手搓443系6个端口节点ss+ws+tls
      2、snippets部署的，william的proxyip域名"不支持"
*/

import { connect } from 'cloudflare:sockets';
const PASSWORD = 'abc';

function closeSocketQuietly(socket) {
    try {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CLOSING) {
            socket.close();
        }
    } catch (error) { }
}

function base64ToArray(b64Str) {
    if (!b64Str) return { error: null };
    try {
        const binaryString = atob(b64Str.replace(/-/g, '+').replace(/_/g, '/'));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return { earlyData: bytes.buffer, error: null };
    } catch (error) {
        return { error };
    }
}

async function parsePryAddress(serverStr) {
    let host, ipv6, port;
    if (/\.william/i.test(serverStr)) {
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
        })(serverStr);
        serverStr = williamResult || serverStr;
    }
    if (serverStr.startsWith('[') && serverStr.includes(']')) {
        [ipv6, port = 443] = serverStr.split(']:');
        host = ipv6.endsWith(']') ? `${ipv6}` : `${ipv6}]`;
    } else {
        [host, port = 443] = serverStr.split(/[:,;]/);
    }
    return [host, +port];
}

export default {
    async fetch(request) {
        try {
            const url = new URL(request.url);
            const pathname = url.pathname;
            if (!pathname.startsWith('/' + PASSWORD)) {
                return new Response('Unauthorized', { status: 401 });
            }
            if (request.headers.get('Upgrade') === 'websocket') {
                return await handleSSRequest(request, url);
            }
            return new Response('Not Found', { status: 404 });
        } catch (err) {
            return new Response('Internal Server Error', { status: 500 });
        }
    },
};

async function handleSSRequest(request, crulledUrl) {
    const wssPair = new WebSocketPair();
    const [clientSock, serverSock] = Object.values(wssPair);
    serverSock.accept();
    let remoteConnWrapper = { socket: null };
    const earlyData = request.headers.get('sec-websocket-protocol') || '';
    const readable = makeReadableStr(serverSock, earlyData);
    readable.pipeTo(new WritableStream({
        async write(chunk) {
            if (remoteConnWrapper.socket) {
                const writer = remoteConnWrapper.socket.writable.getWriter();
                await writer.write(chunk);
                writer.releaseLock();
                return;
            }
            const { hasError, addressType, port, hostname, rawIndex } = parseSSPacketHeader(chunk);
            if (hasError) throw new Error('Error Type:' + addressType);
            const rawData = chunk.slice(rawIndex);
            await forwardataTCP(hostname, port, rawData, serverSock, null, remoteConnWrapper, crulledUrl);
        },
    })).catch((err) => {
        // console.error('Readable pipe error:', err);
    });
    return new Response(null, { status: 101, webSocket: clientSock });
}

function parseSSPacketHeader(chunk) {
    if (chunk.byteLength < 7) return { hasError: true, message: 'Invalid data' };
    try {
        const view = new Uint8Array(chunk);
        const addressType = view[0];
        let addrIdx = 1, addrLen = 0, addrValIdx = addrIdx, hostname = '';

        switch (addressType) {
            case 1: // IPv4
                addrLen = 4;
                hostname = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + addrLen)).join('.');
                addrValIdx += addrLen;
                break;
            case 3: // Domain
                addrLen = view[addrIdx];
                addrValIdx += 1;
                hostname = new TextDecoder().decode(chunk.slice(addrValIdx, addrValIdx + addrLen));
                addrValIdx += addrLen;
                break;
            case 4: // IPv6
                addrLen = 16;
                const ipv6 = [];
                const ipv6View = new DataView(chunk.slice(addrValIdx, addrValIdx + addrLen));
                for (let i = 0; i < 8; i++) ipv6.push(ipv6View.getUint16(i * 2).toString(16));
                hostname = ipv6.join(':');
                addrValIdx += addrLen;
                break;
            default:
                return { hasError: true, message: `Invalid address type: ${addressType}` };
        }
        if (!hostname) return { hasError: true, message: `Invalid address: ${addressType}` };
        const port = new DataView(chunk.slice(addrValIdx, addrValIdx + 2)).getUint16(0);
        return { hasError: false, addressType, port, hostname, rawIndex: addrValIdx + 2 };
    } catch (e) {
        return { hasError: true, message: 'Failed to parse SS packet header' };
    }
}

async function connect2Socks5(proxyConfig, targetHost, targetPort, initialData) {
    const [latter, former] = proxyConfig.split(/@?([\d\[\]a-z.:]+(?::\d+)?)$/i);
    let [username, password] = latter.split(':');
    if (!password) { password = '' };
    const [host, port] = await parsePryAddress(former);
    const socket = connect({ hostname: host, port: port });
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    try {
        const authMethods = username && password ?
            new Uint8Array([0x05, 0x02, 0x00, 0x02]) :
            new Uint8Array([0x05, 0x01, 0x00]);
        await writer.write(authMethods);
        const methodResponse = await reader.read();
        if (methodResponse.done || methodResponse.value.byteLength < 2) {
            throw new Error('S5 method selection failed');
        }
        const selectedMethod = new Uint8Array(methodResponse.value)[1];
        if (selectedMethod === 0x02) {
            if (!username || !password) {
                throw new Error('S5 requires authentication');
            }
            const userBytes = new TextEncoder().encode(username);
            const passBytes = new TextEncoder().encode(password);
            const authPacket = new Uint8Array(3 + userBytes.length + passBytes.length);
            authPacket[0] = 0x01;
            authPacket[1] = userBytes.length;
            authPacket.set(userBytes, 2);
            authPacket[2 + userBytes.length] = passBytes.length;
            authPacket.set(passBytes, 3 + userBytes.length);
            await writer.write(authPacket);
            const authResponse = await reader.read();
            if (authResponse.done || new Uint8Array(authResponse.value)[1] !== 0x00) {
                throw new Error('S5 authentication failed');
            }
        } else if (selectedMethod !== 0x00) {
            throw new Error(`S5 unsupported auth method: ${selectedMethod}`);
        }
        const hostBytes = new TextEncoder().encode(targetHost);
        const connectPacket = new Uint8Array(7 + hostBytes.length);
        connectPacket[0] = 0x05;
        connectPacket[1] = 0x01;
        connectPacket[2] = 0x00;
        connectPacket[3] = 0x03;
        connectPacket[4] = hostBytes.length;
        connectPacket.set(hostBytes, 5);
        new DataView(connectPacket.buffer).setUint16(5 + hostBytes.length, targetPort, false);
        await writer.write(connectPacket);
        const connectResponse = await reader.read();
        if (connectResponse.done || new Uint8Array(connectResponse.value)[1] !== 0x00) {
            throw new Error('S5 connection failed');
        }
        await writer.write(initialData);
        writer.releaseLock();
        reader.releaseLock();
        return socket;
    } catch (error) {
        writer.releaseLock();
        reader.releaseLock();
        throw error;
    }
}

async function connect2Http(proxyConfig, targetHost, targetPort, initialData) {
    const [latter, former] = proxyConfig.split(/@?([\d\[\]a-z.:]+(?::\d+)?)$/i);
    let [username, password] = latter.split(':');
    if (!password) { password = '' };
    const [host, port] = await parsePryAddress(former);
    const socket = connect({ hostname: host, port: port });
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    try {
        let connectRequest = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n`;
        connectRequest += `Host: ${targetHost}:${targetPort}\r\n`;

        if (username && password) {
            const auth = btoa(`${username}:${password}`);
            connectRequest += `Proxy-Authorization: Basic ${auth}\r\n`;
        }
        connectRequest += `User-Agent: Mozilla/5.0\r\n`;
        connectRequest += `Connection: keep-alive\r\n`;
        connectRequest += '\r\n';
        await writer.write(new TextEncoder().encode(connectRequest));
        let responseBuffer = new Uint8Array(0);
        let headerEndIndex = -1;
        let bytesRead = 0;
        const maxHeaderSize = 8192;
        while (headerEndIndex === -1 && bytesRead < maxHeaderSize) {
            const { done, value } = await reader.read();
            if (done) {
                throw new Error('Connection closed before receiving HTTP response');
            }
            const newBuffer = new Uint8Array(responseBuffer.length + value.length);
            newBuffer.set(responseBuffer);
            newBuffer.set(value, responseBuffer.length);
            responseBuffer = newBuffer;
            bytesRead = responseBuffer.length;

            for (let i = 0; i < responseBuffer.length - 3; i++) {
                if (responseBuffer[i] === 0x0d && responseBuffer[i + 1] === 0x0a &&
                    responseBuffer[i + 2] === 0x0d && responseBuffer[i + 3] === 0x0a) {
                    headerEndIndex = i + 4;
                    break;
                }
            }
        }
        if (headerEndIndex === -1) {
            throw new Error('Invalid HTTP response');
        }
        const headerText = new TextDecoder().decode(responseBuffer.slice(0, headerEndIndex));
        const statusLine = headerText.split('\r\n')[0];
        const statusMatch = statusLine.match(/HTTP\/\d\.\d\s+(\d+)/);
        if (!statusMatch) {
            throw new Error(`Invalid response: ${statusLine}`);
        }
        const statusCode = parseInt(statusMatch[1]);
        if (statusCode < 200 || statusCode >= 300) {
            throw new Error(`Connection failed: ${statusLine}`);
        }
        console.log('HTTP connection established for Shadowsocks');
        await writer.write(initialData);
        writer.releaseLock();
        reader.releaseLock();
        return socket;
    } catch (error) {
        try {
            writer.releaseLock();
        } catch (e) { }
        try {
            reader.releaseLock();
        } catch (e) { }
        try {
            socket.close();
        } catch (e) { }
        throw error;
    }
}

async function forwardataTCP(host, portNum, rawData, ws, respHeader, remoteConnWrapper, crulledUrl) {
    const customProxyIP = decodeURIComponent(crulledUrl.pathname + crulledUrl.search);
    async function connectDirect(address, port, data) {
        const remoteSock = connect({ hostname: address, port: port });
        const writer = remoteSock.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        return remoteSock;
    }
    const proxyConfig = customProxyIP.match(/(http|socks5)\s*=\s*([^&]+(?:\d+)?)/i);
    let pyipMatch = customProxyIP.match(/proxyip\s*=\s*([^&]+(?:\d+)?)/i);
    let proxyConfigCrull = null;
    let shouldUseProxy = false;
    if (proxyConfig) {
        shouldUseProxy = true;
    } else if (!proxyConfig) {
        proxyConfigCrull = await parsePryAddress(pyipMatch ? pyipMatch[1] : '');
    } else {
        proxyConfigCrull = await parsePryAddress(pyipMatch ? pyipMatch[1] : '');
        if (proxyConfig[1] === 'socks5' || proxyConfig[1] === 'http') {
            shouldUseProxy = true;
        }
    }

    async function connecttoPry() {
        let newSocket;
        if (proxyConfig != null && proxyConfig[1].toLowerCase() === 'socks5') {
            newSocket = await connect2Socks5(proxyConfig[2], host, portNum, rawData);
        } else if (proxyConfig != null && proxyConfig[1].toLowerCase() === 'http') {
            newSocket = await connect2Http(proxyConfig[2], host, portNum, rawData);
        } else {
            newSocket = await connectDirect(proxyConfigCrull[0], proxyConfigCrull[1], rawData);
        }
        remoteConnWrapper.socket = newSocket;
        newSocket.closed.catch(() => { }).finally(() => closeSocketQuietly(ws));
        connectStreams(newSocket, ws, respHeader, null);
    }
    if (shouldUseProxy) {
        try {
            await connecttoPry();
        } catch (err) {
            throw err;
        }
    } else {
        try {
            const initialSocket = await connectDirect(host, portNum, rawData);
            remoteConnWrapper.socket = initialSocket;
            connectStreams(initialSocket, ws, respHeader, connecttoPry);
        } catch (err) {
            await connecttoPry();
        }
    }
}

function makeReadableStr(socket, earlyDataHeader) {
    let cancelled = false;
    return new ReadableStream({
        start(controller) {
            socket.addEventListener('message', (event) => {
                if (!cancelled) controller.enqueue(event.data);
            });
            socket.addEventListener('close', () => {
                if (!cancelled) {
                    closeSocketQuietly(socket);
                    controller.close();
                }
            });
            socket.addEventListener('error', (err) => controller.error(err));
            const { earlyData, error } = base64ToArray(earlyDataHeader);
            if (error) controller.error(error);
            else if (earlyData) controller.enqueue(earlyData);
        },
        cancel() {
            cancelled = true;
            closeSocketQuietly(socket);
        }
    });
}

async function connectStreams(remoteSocket, webSocket, headerData, retryFunc) {
    let header = headerData, hasData = false;
    await remoteSocket.readable.pipeTo(
        new WritableStream({
            async write(chunk, controller) {
                hasData = true;
                if (webSocket.readyState !== WebSocket.OPEN) controller.error('ws.readyState is not open');
                if (header) {
                    const response = new Uint8Array(header.length + chunk.byteLength);
                    response.set(header, 0);
                    response.set(chunk, header.length);
                    webSocket.send(response.buffer);
                    header = null;
                } else {
                    webSocket.send(chunk);
                }
            },
            abort() { },
        })
    ).catch((err) => {
        closeSocketQuietly(webSocket);
    });
    if (!hasData && retryFunc) {
        await retryFunc();
    }
}