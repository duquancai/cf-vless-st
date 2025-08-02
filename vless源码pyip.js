import { connect } from "cloudflare:sockets";
const mywoID = "123456";
const userID = "ef3dcc57-6689-48e4-b3f9-2a62d88c730a";
let myyouxuan = [
	'\u0075\u0073\u0061\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d',
	'\u006d\u0079\u0061\u006e\u006d\u0061\u0072\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d:8443',
	'\u0077\u0077\u0077\u002e\u0073\u0068\u006f\u0070\u0069\u0066\u0079\u002e\u0063\u006f\u006d:2053',
	'\u0077\u0077\u0077\u002e\u0069\u0070\u0067\u0065\u0074\u002e\u006e\u0065\u0074:2083',
	'\u006d\u0061\u006c\u0061\u0079\u0073\u0069\u0061\u002e\u0063\u006f\u006d:2087',
	'\u0077\u0077\u0077\u002e\u0076\u0069\u0073\u0061\u0073\u006f\u0075\u0074\u0068\u0065\u0061\u0073\u0074\u0065\u0075\u0072\u006f\u0070\u0065\u002e\u0063\u006f\u006d:2096'
];
const mypyIPz = 'ProxyIP.Vultr.CMLiussss.net';

export default {
	async fetch(request) {
		const upgradeHeader = request.headers.get("Upgrade");
		const url = new URL(request.url);

		try {
			if (!upgradeHeader || upgradeHeader !== "websocket") {
				if (url.pathname === `/${mywoID}/${zhuanma}${zhuanma2}`) {
					const tongyong = gettongyongconfig(request.headers.get('Host'));
					return new Response(`${tongyong}`, {
						status: 200,
						headers: { "Content-Type": "text/plain;charset=utf-8" }
					});
				} else {
					url.hostname = '';
					url.protocol = 'https:';
					request = new Request(url, request);
					return fetch(request);
				}
			}
			return await handle\u0076\u006c\u0065\u0073\u0073WebSocket(request, url);
		} catch (err) {
			let e = err;
			return new Response(e.toString());
		}
	},
};
//WebSocket 写入数据流
async function handle\u0076\u006c\u0065\u0073\u0073WebSocket(request, url) {
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
			const result = parse\u0076\u006c\u0065\u0073\u0073Header(chunk, userID);
			if (result.hasError) {
				throw new Error(result.message);
			}
			const \u0076\u006c\u0065\u0073\u0073RespHeader = new Uint8Array([result.\u0076\u006c\u0065\u0073\u0073Version[0], 0]);
			const rawClientData = chunk.slice(result.rawDataIndex);
			async function connectAndWrite(address, port) {
				const tcpSocket = await connect({
					hostname: address,
					port: port
				});
				remoteSocket = tcpSocket;
				const writer = tcpSocket.writable.getWriter();
				await writer.write(rawClientData);
				writer.releaseLock();
				return tcpSocket;
			}
			async function retry() {
				try {
					const tempurl = url.pathname + url.search;
					const tmp_ip = tempurl.split("pyip=")[1];
					const proxyIP = tmp_ip || mypyIPz;
					const tcpSocket = await connect({
						hostname: proxyIP,
						port: result.portRemote
					});
					remoteSocket = tcpSocket;
					const writer = tcpSocket.writable.getWriter();
					await writer.write(rawClientData);
					writer.releaseLock();
					tcpSocket.closed.catch(error => {
						console.error('连接关闭错误:', error);
					}).finally(() => {
						if (serverWS.readyState === 1) {
							serverWS.close(1000, '连接已关闭');
						}
					});
					pipeRemoteToWebSocket(tcpSocket, serverWS, \u0076\u006c\u0065\u0073\u0073RespHeader, null);
				} catch (err) {
					console.error('连接失败:', err);
					serverWS.close(1011, '连接失败: ' + err.message);
				}
			}
			try {
				const tcpSocket = await connectAndWrite(result.addressRemote, result.portRemote);
				pipeRemoteToWebSocket(tcpSocket, serverWS, \u0076\u006c\u0065\u0073\u0073RespHeader, retry);
			} catch (err) {
				console.error('连接失败:', err);
				serverWS.close(1011, '连接失败');
			}
		},
		close() {
			if (remoteSocket) {
				closeSocket(remoteSocket);
			}
		}
	})).catch(err => {
		console.error('WebSocket 错误:', err);
		closeSocket(remoteSocket);
		serverWS.close(1011, '内部错误');
	});
	return new Response(null, {
		status: 101,
		webSocket: clientWS,
	});
}
//WebSocket 读取数据流
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
				}
			}
		}
	});
}
//VLESS 解析数据流
function parse\u0076\u006c\u0065\u0073\u0073Header(buffer, userID) {
	if (buffer.byteLength < 24) {
		return { hasError: true, message: '无效的头部长度' };
	}
	const view = new DataView(buffer);
	const version = new Uint8Array(buffer.slice(0, 1));
	const uuid = formatUUID(new Uint8Array(buffer.slice(1, 17)));
	if (uuid !== userID) {
		return { hasError: true, message: '无效的用户' };
	}
	const optionsLength = view.getUint8(17);
	const command = view.getUint8(18 + optionsLength);
	if (command === 1) {
	} else {
		return { hasError: true, message: '不支持的命令,仅支持TCP(01)' };
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
		case 2: // 域名
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
			return { hasError: true, message: '不支持的地址类型' };
	}
	return {
		hasError: false,
		addressRemote: address,
		portRemote: port,
		rawDataIndex: offset,
		\u0076\u006c\u0065\u0073\u0073Version: version,
	};
}
//send 发送数据流
function pipeRemoteToWebSocket(remoteSocket, ws, \u0076\u006c\u0065\u0073\u0073Header, retry = null) {
	let headerSent = false;
	let hasIncomingData = false;
	remoteSocket.readable.pipeTo(new WritableStream({
		write(chunk) {
			hasIncomingData = true;
			if (ws.readyState === 1) {
				if (!headerSent) {
					const combined = new Uint8Array(\u0076\u006c\u0065\u0073\u0073Header.byteLength + chunk.byteLength);
					combined.set(new Uint8Array(\u0076\u006c\u0065\u0073\u0073Header), 0);
					combined.set(new Uint8Array(chunk), \u0076\u006c\u0065\u0073\u0073Header.byteLength);
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
				ws.close(1000, '正常关闭');
			}
		},
		abort() {
			closeSocket(remoteSocket);
		}
	})).catch(err => {
		console.error('数据转发错误:', err);
		closeSocket(remoteSocket);
		if (ws.readyState === 1) {
			ws.close(1011, '数据传输错误');
		}
	});
}

function closeSocket(socket) {
	if (socket) {
		try {
			socket.close();
		} catch (e) {
		}
	}
}
//工具函数
function formatUUID(bytes) {
	const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
/////////////////订阅页面/////////////////
let zhuanma = 'vl', zhuanma2 = 'ess', fuhao = '://';
function gettongyongconfig(hostName) {
	if (myyouxuan.length === 0) {
		myyouxuan = [`${hostName}:443`];
	}
	return myyouxuan.map(getyouxuan => {
		const [zhuleirong, tls] = getyouxuan.split("@");
		const [adressdizhi, nodename = 'ts9-enhance'] = zhuleirong.split("#");
		const splitadress = adressdizhi.split(":");
		const mypost = splitadress.length > 1 ? Number(splitadress.pop()) : 443;
		const hedaress = splitadress.join(":");
		const TLSonoff = tls === 'notls' ? 'security=none' : 'security=tls';
		return `${zhuanma}${zhuanma2}${fuhao}${userID}@${hedaress}:${mypost}?encryption=none&${TLSonoff}&sni=${hostName}&type=ws&host=${hostName}&path=%2F%3Fed%3D2560#${nodename}`;
	}).join("\n");
}