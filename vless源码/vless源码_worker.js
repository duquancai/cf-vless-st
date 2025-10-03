/*
使用说明如下：
	一、本程序预设：
		1、uuid=ef3dcc57-6689-48e4-b3f9-2a62d88c730a（强烈建议部署时更换）;
		2、proxyip=ProxyIP.US.CMLiussss.net（如有必要请自行更换）;
		3、preferred80系（如有必要请自行更换）;
		4、preferred443系（如有必要请自行更换）;
	二、v2rayN客户端订阅链接：https://你的域名/setPathPreferred 注意cf的workers域名需要通过代理更新订阅
	三、v2rayN客户端的单节点路径设置（只是本单节点生效），其余节点按照预设的proxyip代理cf网站，非cf走直连
		1、/socks5=xxx（socks5代理cf网站，非cf网站走直连）;
		2、/pyip=xxx（pyip代理cf网站，非cf网站走直连）;
		两种任选其一，如果不设置单节点路径参数，预设的proxyip代理cf网站，非cf走直连
*/

import { connect } from "cloudflare:sockets";

const userID = "ef3dcc57-6689-48e4-b3f9-2a62d88c730a";
const myProxyIP = 'ProxyIP.US.CMLiussss.net';
const myPreferred443list = [
	'\u0075\u0073\u0061\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d',
	'\u006d\u0079\u0061\u006e\u006d\u0061\u0072\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d:8443',
	'\u0077\u0077\u0077\u002e\u0073\u0068\u006f\u0070\u0069\u0066\u0079\u002e\u0063\u006f\u006d:2053',
	'\u0077\u0077\u0077\u002e\u0069\u0070\u0067\u0065\u0074\u002e\u006e\u0065\u0074:2083',
	'\u006d\u0061\u006c\u0061\u0079\u0073\u0069\u0061\u002e\u0063\u006f\u006d:2087',
	'\u0077\u0077\u0077\u002e\u0076\u0069\u0073\u0061\u0073\u006f\u0075\u0074\u0068\u0065\u0061\u0073\u0074\u0065\u0075\u0072\u006f\u0070\u0065\u002e\u0063\u006f\u006d:2096'
];
const myPreferred80list = [
	'\u0077\u0077\u0077\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d',
	'\u0066\u0072\u0065\u0065\u0079\u0078\u002e\u0063\u006c\u006f\u0075\u0064\u0066\u006c\u0061\u0072\u0065\u0038\u0038\u002e\u0065\u0075\u002e\u006f\u0072\u0067:8080',
	'\u0061\u0066\u0072\u0069\u0063\u0061\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d:8880',
	'\u0063\u0064\u006e\u002e\u0074\u007a\u0070\u0072\u006f\u002e\u0078\u0079\u007a:2052',
	'\u0077\u0077\u0077\u002e\u0076\u0069\u0073\u0061\u0065\u0075\u0072\u006f\u0070\u0065\u002e\u0061\u0074:2082',
	'\u0077\u0077\u0077\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d\u002e\u006d\u0074:2086',
	'\u006a\u0061\u0070\u0061\u006e\u002e\u0063\u006f\u006d:2095'
];

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
		addressRemote: address,
		addressType,
		portRemote: port,
		rawDataIndex: offset,
		waliexiVersion: version,
	};
}

function closeSocket(socket) {
	socket?.close();
}

async function socks5Connect(addressType, addressRemote, portRemote, parsedSocks5Addr) {
	const { username, password, hostname, port } = parsedSocks5Addr;
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

function socks5AddressParser(address) {
	const [latter, former] = address.split(/@?([\d\[\]a-z.:]+(?::\d+)?)$/im);
	let [username, password] = latter.split(':');
	if (!password) { password = '' };
	let [hostname, port] = former.split(/:((?:\d+)?)$/im);
	if (!port) { port = '443' };
	return { username, password, hostname, port };
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

function getTongYongConfig(hostName) {
	if (/workers\.dev$/.test(hostName)) {
		if (myPreferred80list.length === 0) { myPreferred80list.push(`${hostName}:80`); };
		return myPreferred80list.map((element, index) => {
			const nodeName = `cf-80系-${index + 1}`;
			const splitAdressArr = element.split(":");
			const myPort = splitAdressArr.length > 1 ? Number(splitAdressArr.pop()) : 80;
			const mainDomain = splitAdressArr.join(":");
			return `\u0076\u006c\u0065\u0073\u0073\u003a\u002f\u002f${userID}@${mainDomain}:${myPort}?encryption=none&security=none&type=ws&host=${hostName}&path=%2F%3Fed%3D2560#${nodeName}`;
		}).join("\n");
	} else {
		if (myPreferred443list.length === 0) { myPreferred443list.push(`${hostName}:443`); };
		return myPreferred443list.map((element, index) => {
			const nodeName = `cf-443系-${index + 1}`;
			const splitAdressArr = element.split(":");
			const myPort = splitAdressArr.length > 1 ? Number(splitAdressArr.pop()) : 443;
			const mainDomain = splitAdressArr.join(":");
			return `\u0076\u006c\u0065\u0073\u0073\u003a\u002f\u002f${userID}@${mainDomain}:${myPort}?encryption=none&security=tls&sni=${hostName}&type=ws&host=${hostName}&path=%2F%3Fed%3D2560#${nodeName}`;
		}).join("\n");
	}
}

async function handlewaliexiWebSocket(request, url) {
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
				tcpSocket = connect({
					hostname: address,
					port: port,
				});
				remoteSocket = tcpSocket;
				const writer = tcpSocket.writable.getWriter();
				await writer.write(rawClientData);
				writer.releaseLock();
				return tcpSocket;
			}
			async function retry() {
				try {
					let tcpSocket;
					const tempurl = url.pathname + url.search;
					const enableSocks = tempurl.match(/socks5\s*=\s*([^&]+(?::\d+)?)/i);
					const enableSock = enableSocks ? decodeURIComponent(enableSocks[1]) : null;
					if (enableSock) {
						const Socksip = socks5AddressParser(enableSock);
						tcpSocket = await socks5Connect(result.addressType, result.addressRemote, result.portRemote, Socksip);
					} else {
						const tmp_ips = tempurl.match(/pyip\s*=\s*([^&]+(?::\d+)?)/i);
						const tmp_ip = tmp_ips ? decodeURIComponent(tmp_ips[1]) : null;
						if (tmp_ip) {
							const [latterip, formerport] = tmp_ip.split(/:?(\d{0,5})$/);
							tcpSocket = await connect({
								hostname: latterip,
								port: Number(formerport) || result.portRemote
							});
						} else {
							tcpSocket = await connect({
								hostname: myProxyIP,
								port: result.portRemote
							});
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
					await pipeRemoteToWebSocket(tcpSocket, serverWS, waliexiRespHeader, null);
				} catch (err) {
					console.error('Connection failed:', err);
					serverWS.close(1011, 'Connection failed: ' + err.message);
				}
			}
			try {
				const tcpSocket = await connectAndWrite(result.addressRemote, result.portRemote);
				await pipeRemoteToWebSocket(tcpSocket, serverWS, waliexiRespHeader, retry);
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
		const url = new URL(request.url);
		try {
			if (!upgradeHeader || upgradeHeader !== "websocket") {
				if (url.pathname === `/setPathPreferred`) {
					const tongyong = getTongYongConfig(request.headers.get('Host'));
					return new Response(`${tongyong}`, {
						status: 200,
						headers: { "Content-Type": "text/plain;charset=utf-8" }
					});
				} else {
					const cn_hostnames = [''];
					if (cn_hostnames.includes('')) {
						return new Response(JSON.stringify(request.cf, null, 4), {
							status: 200,
							headers: {
								"Content-Type": "application/json;charset=utf-8",
							},
						});
					}
					const randomHostname = cn_hostnames[Math.floor(Math.random() * cn_hostnames.length)];
					const newHeaders = new Headers(request.headers);
					newHeaders.set("cf-connecting-ip", "1.2.3.4");
					newHeaders.set("x-forwarded-for", "1.2.3.4");
					newHeaders.set("x-real-ip", "1.2.3.4");
					newHeaders.set("referer", "https://www.google.com/");
					newHeaders.set("x-random-id", crypto.randomUUID());
					newHeaders.set("User-Agent", 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0');
					const proxyUrl = "https://" + randomHostname + url.pathname + url.search;
					let modifiedRequest = new Request(proxyUrl, {
						method: request.method,
						headers: newHeaders,
						body: request.body,
						redirect: "manual",
					});
					const proxyResponse = await fetch(modifiedRequest, { redirect: "manual" });
					if ([301, 302].includes(proxyResponse.status)) {
						return new Response(`Redirects to ${randomHostname} are not allowed.`, {
							status: 403,
							statusText: "Forbidden",
						});
					}
					return proxyResponse;
				}
			}
			return await handlewaliexiWebSocket(request, url);
		} catch (err) {
			return new Response(err.toString());
		}
	},
};