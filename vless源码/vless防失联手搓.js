//v2rayN客户端手搓,路径（path）pyip=xxx手搓（不手搓路径，打不开cf网站而已）
///pyip=xxx（proxyip代理cf网站，非cf网站走直连）
import { connect } from "cloudflare:sockets";
const cn_hostnames = [''];
const userID = "ef3dcc57-6689-48e4-b3f9-2a62d88c730a";
export default {
	async fetch(request) {
		const upgradeHeader = request.headers.get("Upgrade");
		const url = new URL(request.url);
		try {
			if (!upgradeHeader || upgradeHeader !== "websocket") {
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
				newHeaders.set("referer", "https://www.google.com/search?q=ygkkk");
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
			return await handlewaliexiWebSocket(request, url);
		} catch (err) {
			let e = err;
			return new Response(e.toString());
		}
	},
};

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
					const tmp_ips = tempurl.match(/pyip\s*=\s*([^&]+(?::\d+)?)/i);
					const tmp_ip = tmp_ips ? decodeURIComponent(tmp_ips[1]) : null;
					if (tmp_ip) {
						const [latterip, formerport] = tmp_ip.split(/:?(\d{0,5})$/);
						tcpSocket = await connect({
							hostname: latterip,
							port: Number(formerport) || result.portRemote
						});
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

function closeSocket(socket) {
	socket?.close();
}

function formatUUID(bytes) {
	const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}