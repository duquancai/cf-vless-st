/*
纯手搓节点使用说明如下：
	一、本程序预设：
	  1、userID=f1a50f1c-e751-4d62-83aa-926a7ae32955（强烈建议部署时更换）
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
import { connect } from "cloudflare:sockets";

const userID = "f1a50f1c-e751-4d62-83aa-926a7ae32955";

function createWebSocketReadableStream(ws, earlyDataHeader) {
	return new ReadableStream({
		start(controller) {
			ws.addEventListener('message', event => {
				controller.enqueue(event.data);
			});
			ws.addEventListener('close', () => {
				controller.close();
			});
			ws.addEventListener('error', err => {
				controller.error(err);
			});
			if (earlyDataHeader) {
				try {
					const decoded = atob(earlyDataHeader.replace(/-/g, '+').replace(/_/g, '/'));
					const data = Uint8Array.from(decoded, c => c.charCodeAt(0));
					controller.enqueue(data.buffer);
				} catch (e) {
					console.error("Error decoding early data:", e);
					controller.error(e);
				}
			}
		},
		cancel(reason) {
			console.log('ReadableStream cancelled', reason);
			ws.close();
		}
	});
}

function formatUUID(bytes) {
	const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function parsewaliexiHeader(buffer, userID) {
	if (buffer.byteLength < 24) {
		return { hasError: true, message: 'Invalid header length' };
	}
	const view = new DataView(buffer);
	const version = new Uint8Array(buffer.slice(0, 1));
	const uuid = formatUUID(new Uint8Array(buffer.slice(1, 17)));
	if (uuid !== userID) {
		return { hasError: true, message: 'Invalid user' };
	}
	const optionsLength = view.getUint8(17);
	const command = view.getUint8(18 + optionsLength);
	if (command === 1) {
	} else {
		return { hasError: true, message: 'Unsupported command, only TCP(01) is supported' };
	}
	let offset = 19 + optionsLength;
	const port = view.getUint16(offset);
	offset += 2;
	const addressType = view.getUint8(offset++);
	let address = '';
	switch (addressType) {
		case 1: // IPv4
			address = Array.from(new Uint8Array(buffer.slice(offset, offset + 4))).join('.');
			offset += 4;
			break;
		case 2: // Domain name
			const domainLength = view.getUint8(offset++);
			address = new TextDecoder().decode(buffer.slice(offset, offset + domainLength));
			offset += domainLength;
			break;
		case 3: // IPv6
			const ipv6 = [];
			for (let i = 0; i < 8; i++) {
				ipv6.push(view.getUint16(offset).toString(16).padStart(4, '0'));
				offset += 2;
			}
			address = ipv6.join(':').replace(/(^|:)0+(\w)/g, '$1$2');
			break;
		default:
			return { hasError: true, message: 'Unsupported address type' };
	}
	return {
		hasError: false,
		remoteAddress: address,
		addressType,
		remotePort: port,
		rawDataIndex: offset,
		waliexiVersion: version,
	};
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

function closeSocket(socket) {
	socket?.close();
}

async function socks5Connect(addressType, addressRemote, portRemote, parsedSocks5Addr) {
	const [latter, former] = parsedSocks5Addr.split(/@?([\d\[\]a-z.:]+(?::\d+)?)$/i);
	let [username, password] = latter.split(':');
	if (!password) { password = '' };
	let [hostname, port] = former.split(/:((?:\d+)?)$/i);
	if (!port) { port = '443' };
	const socket = connect({
		hostname,
		port,
	});
	const socksGreeting = new Uint8Array([5, 2, 0, 2]);
	const writer = socket.writable.getWriter();
	await writer.write(socksGreeting);
	console.log('sent socks greeting');
	const reader = socket.readable.getReader();
	const encoder = new TextEncoder();
	let res = (await reader.read()).value;
	if (res[0] !== 0x05) {
		console.log(`socks server version error: ${res[0]} expected: 5`);
		return;
	}
	if (res[1] === 0xff) {
		console.log("no acceptable methods");
		return;
	}
	if (res[1] === 0x02) {
		console.log("socks server needs auth");
		if (!username || !password) {
			console.log("please provide username/password");
			return;
		}
		const authRequest = new Uint8Array([
			1,
			username.length,
			...encoder.encode(username),
			password.length,
			...encoder.encode(password)
		]);
		await writer.write(authRequest);
		res = (await reader.read()).value;
		if (res[0] !== 0x01 || res[1] !== 0x00) {
			console.log("fail to auth socks server");
			return;
		}
	}
	let DSTADDR;
	switch (addressType) {
		case 1:
			DSTADDR = new Uint8Array(
				[1, ...addressRemote.split('.').map(Number)]
			);
			break;
		case 2:
			DSTADDR = new Uint8Array(
				[3, addressRemote.length, ...encoder.encode(addressRemote)]
			);
			break;
		case 3:
			DSTADDR = new Uint8Array(
				[4, ...addressRemote.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]
			);
			break;
		default:
			console.log(`invalid addressType is ${addressType}`);
			return;
	}
	const socksRequest = new Uint8Array([5, 1, 0, ...DSTADDR, portRemote >> 8, portRemote & 0xff]);
	await writer.write(socksRequest);
	console.log('sent socks request');
	res = (await reader.read()).value;
	if (res[1] === 0x00) {
		console.log("socks connection opened");
	} else {
		console.log("fail to open socks connection");
		return;
	}
	writer.releaseLock();
	reader.releaseLock();
	return socket;
}

async function pipeRemoteToWebSocket(remoteSocket, ws, waliexiHeader, retry = null) {
	let headerSent = false;
	let hasIncomingData = false;
	remoteSocket.readable.pipeTo(new WritableStream({
		write(chunk) {
			hasIncomingData = true;
			if (ws.readyState === 1) {
				if (!headerSent) {
					const combined = new Uint8Array(waliexiHeader.byteLength + chunk.byteLength);
					combined.set(new Uint8Array(waliexiHeader), 0);
					combined.set(new Uint8Array(chunk), waliexiHeader.byteLength);
					ws.send(combined.buffer);
					headerSent = true;
				} else {
					ws.send(chunk);
				}
			}
		},
		close() {
			if (!hasIncomingData && retry) {
				retry();
				return;
			}
			if (ws.readyState === 1) {
				ws.close(1000, 'Normal closure');
			}
		},
		abort() {
			closeSocket(remoteSocket);
		}
	})).catch(err => {
		console.error('Data forwarding error:', err);
		closeSocket(remoteSocket);
		if (ws.readyState === 1) {
			ws.close(1011, 'Data transmission error');
		}
	});
}

async function handlewaliexiWebSocket(request, url) {
	const tempurl = decodeURIComponent(url.pathname + url.search);
	const wsPair = new WebSocketPair();
	const [clientWS, serverWS] = Object.values(wsPair);
	serverWS.accept();
	const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';
	const wsReadable = createWebSocketReadableStream(serverWS, earlyDataHeader);
	let remoteSocket = null;
	wsReadable.pipeTo(new WritableStream({
		async write(chunk) {
			if (remoteSocket) {
				const writer = remoteSocket.writable.getWriter();
				await writer.write(chunk);
				writer.releaseLock();
				return;
			}
			const result = parsewaliexiHeader(chunk, userID);
			if (result.hasError) {
				throw new Error(result.message);
			}
			const waliexiRespHeader = new Uint8Array([result.waliexiVersion[0], 0]);
			const rawClientData = chunk.slice(result.rawDataIndex);
			async function connectAndWrite(address, port) {
				let tcpSocket;
				const enableSocksAll = tempurl.match(/(http|s5)all\s*=\s*([^&]+(?:\d+)?)/i);
				if (enableSocksAll != null && enableSocksAll[1] === 's5') {
					tcpSocket = await socks5Connect(result.addressType, result.remoteAddress, result.remotePort, enableSocksAll[2]);
				} else if (enableSocksAll != null && enableSocksAll[1] === 'http') {
					tcpSocket = await httpConnect(result.remoteAddress, result.remotePort, enableSocksAll[2]);
				} else {
					tcpSocket = await connect({ hostname: result.addressType === 3 ? `[${address}]` : address, port: port });
				}
				remoteSocket = tcpSocket;
				const writer = tcpSocket.writable.getWriter();
				await writer.write(rawClientData);
				writer.releaseLock();
				return tcpSocket;
			}
			async function retry() {
				try {
					let tcpSocket;
					const enableSocks = tempurl.match(/socks5\s*(?:=|(?::\/\/))\s*([^&]+(?:\d+)?)/i)?.[1];
					const nat64Prefix = tempurl.match(/nat64pf\s*=\s*([^&]+)/i)?.[1];
					const httpPIP = tempurl.match(/http\s*(?:=|(?::\/\/))\s*([^&]+(?:\d+)?)/i)?.[1];
					if (enableSocks) {
						tcpSocket = await socks5Connect(result.addressType, result.remoteAddress, result.remotePort, enableSocks);
					} else if (httpPIP) {
						tcpSocket = await httpConnect(result.remoteAddress, result.remotePort, httpPIP);
					} else if (nat64Prefix) {
						const nat64Address = await getNat64ProxyIP(result.remoteAddress, nat64Prefix);
						tcpSocket = await connect({ hostname: nat64Address, port: result.remotePort });
					}
					else {
						const tmp_ips = tempurl.match(/p(?:rox)?yip\s*=\s*([^&]+(?:\d+)?)/i)?.[1];
						if (tmp_ips) {
							const [latterip, formerport] = await parseHostPort(tmp_ips);
							tcpSocket = await connect({ hostname: latterip, port: Number(formerport) || result.remotePort });
						} else {
							console.error('Connection failed: No proxy method specified');
						}
					}
					remoteSocket = tcpSocket;
					const writer = tcpSocket.writable.getWriter();
					await writer.write(rawClientData);
					writer.releaseLock();
					tcpSocket.closed.catch(error => {
						console.error('Connection closed with error:', error);
					}).finally(() => {
						if (serverWS.readyState === 1) {
							serverWS.close(1000, 'Connection closed');
						}
					});
					pipeRemoteToWebSocket(tcpSocket, serverWS, waliexiRespHeader, null);
				} catch (err) {
					console.error('Connection failed:', err);
					serverWS.close(1011, 'Connection failed: ' + err.message);
				}
			}
			try {
				const tcpSocket = await connectAndWrite(result.remoteAddress, result.remotePort);
				pipeRemoteToWebSocket(tcpSocket, serverWS, waliexiRespHeader, retry);
			} catch (err) {
				console.error('Connection failed:', err);
				serverWS.close(1011, 'Connection failed');
			}
		},
		close() {
			if (remoteSocket) {
				closeSocket(remoteSocket);
			}
		}
	})).catch(err => {
		console.error('WebSocket error:', err);
		closeSocket(remoteSocket);
		serverWS.close(1011, 'Internal error');
	});
	return new Response(null, {
		status: 101,
		webSocket: clientWS,
	});
}

export default {
	async fetch(request) {
		const upgradeHeader = request.headers.get("Upgrade");
		try {
			if (!upgradeHeader || upgradeHeader !== "websocket") {
				return new Response('Hello World!');
			}
			return await handlewaliexiWebSocket(request, new URL(request.url));
		} catch (err) {
			return new Response(err.toString());
		}
	},
};