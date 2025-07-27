//nat64自动填充proxyip，无需且不支持proxyip设置
import { connect } from "cloudflare:sockets";
const WS_READY_STATE_OPEN = 1;
let userID = "91945301-bd9f-4f77-b831-268def6b749d";//记住：在CF中部署一定要修改这个UUID
let pathlj = "";
pathlj = encodeURIComponent(pathlj);
const cn_hostnames = [''];
let CDNIP = '\u0077\u0077\u0077\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d\u002e\u0073\u0067';

//http_ip
let IP1 = '\u0077\u0077\u0077\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d';
let IP2 = '\u0066\u0072\u0065\u0065\u0079\u0078\u002e\u0063\u006c\u006f\u0075\u0064\u0066\u006c\u0061\u0072\u0065\u0038\u0038\u002e\u0065\u0075\u002e\u006f\u0072\u0067';
let IP3 = '\u0061\u0066\u0072\u0069\u0063\u0061\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d';
let IP4 = '\u0063\u0064\u006e\u002e\u0074\u007a\u0070\u0072\u006f\u002e\u0078\u0079\u007a';
let IP5 = '\u0077\u0077\u0077\u002e\u0076\u0069\u0073\u0061\u0065\u0075\u0072\u006f\u0070\u0065\u002e\u0061\u0074';
let IP6 = '\u0077\u0077\u0077\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d\u002e\u006d\u0074';
let IP7 = '\u006a\u0061\u0070\u0061\u006e\u002e\u0063\u006f\u006d';

// https_ip
let IP8 = '\u0075\u0073\u0061\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d';
let IP9 = '\u006d\u0079\u0061\u006e\u006d\u0061\u0072\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d';
let IP10 = '\u0077\u0077\u0077\u002e\u0073\u0068\u006f\u0070\u0069\u0066\u0079\u002e\u0063\u006f\u006d';
let IP11 = '\u0077\u0077\u0077\u002e\u0069\u0070\u0067\u0065\u0074\u002e\u006e\u0065\u0074';
let IP12 = '\u006d\u0061\u006c\u0061\u0079\u0073\u0069\u0061\u002e\u0063\u006f\u006d';
let IP13 = '\u0063\u006c\u006f\u0075\u0064\u0066\u006c\u0061\u0072\u0065\u002e\u0039\u006a\u0079\u002e\u0063\u0063';

// http_port
let PT1 = '80';
let PT2 = '8080';
let PT3 = '8880';
let PT4 = '2052';
let PT5 = '2082';
let PT6 = '2086';
let PT7 = '2095';

// https_port
let PT8 = '443';
let PT9 = '8443';
let PT10 = '2053';
let PT11 = '2083';
let PT12 = '2087';
let PT13 = '2096';

export default {
	/**
	 * @param {any} request
	 * @param {{uuid: string, proxyip: string, cdnip: string, ip1: string, ip2: string, ip3: string, ip4: string, ip5: string, ip6: string, ip7: string, ip8: string, ip9: string, ip10: string, ip11: string, ip12: string, ip13: string, pt1: string, pt2: string, pt3: string, pt4: string, pt5: string, pt6: string, pt7: string, pt8: string, pt9: string, pt10: string, pt11: string, pt12: string, pt13: string}} env
	 * @param {any} ctx
	 * @returns {Promise<Response>}
	 */
	async fetch(request, env, ctx) {
		try {
			//环境变量覆盖
			userID = env.uuid || userID;
			CDNIP = env.cdnip || CDNIP;
			IP1 = env.ip1 || IP1;
			IP2 = env.ip2 || IP2;
			IP3 = env.ip3 || IP3;
			IP4 = env.ip4 || IP4;
			IP5 = env.ip5 || IP5;
			IP6 = env.ip6 || IP6;
			IP7 = env.ip7 || IP7;
			IP8 = env.ip8 || IP8;
			IP9 = env.ip9 || IP9;
			IP10 = env.ip10 || IP10;
			IP11 = env.ip11 || IP11;
			IP12 = env.ip12 || IP12;
			IP13 = env.ip13 || IP13;
			PT1 = env.pt1 || PT1;
			PT2 = env.pt2 || PT2;
			PT3 = env.pt3 || PT3;
			PT4 = env.pt4 || PT4;
			PT5 = env.pt5 || PT5;
			PT6 = env.pt6 || PT6;
			PT7 = env.pt7 || PT7;
			PT8 = env.pt8 || PT8;
			PT9 = env.pt9 || PT9;
			PT10 = env.pt10 || PT10;
			PT11 = env.pt11 || PT11;
			PT12 = env.pt12 || PT12;
			PT13 = env.pt13 || PT13;
			pathlj = '/' + Math.random().toString(36).substring(2, 12);
			const upgradeHeader = request.headers.get("Upgrade");
			if (!upgradeHeader || upgradeHeader !== "websocket") {
				const url = new URL(request.url);
				switch (url.pathname) {
					case `/${userID}`: {
						const \u0076\u006c\u0065\u0073\u0073Config = get\u0076\u006c\u0065\u0073\u0073Config(userID, request.headers.get("Host"));
						return new Response(`${\u0076\u006c\u0065\u0073\u0073Config}`, {
							status: 200,
							headers: {
								"Content-Type": "text/html;charset=utf-8",
							},
						});
					}
					case `/${userID}/ty`: {
						const tyConfig = gettyConfig(userID, request.headers.get('Host'));
						return new Response(`${tyConfig}`, {
							status: 200,
							headers: {
								"Content-Type": "text/plain;charset=utf-8",
							}
						});
					}

					case `/${userID}/pty`: {
						const ptyConfig = getptyConfig(userID, request.headers.get('Host'));
						return new Response(`${ptyConfig}`, {
							status: 200,
							headers: {
								"Content-Type": "text/plain;charset=utf-8",
							}
						});
					}

					default:
						// return new Response('Not found', { status: 404 });
						// For any other path, reverse proxy to 'ramdom website' and return the original response, caching it in the process
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
						newHeaders.set("referer", "https://www.google.com/search?q=edtunnel");
						newHeaders.set("x-random-id", crypto.randomUUID());
						newHeaders.set("User-Agent", randomUserAgent());
						// Use fetch to proxy the request to 15 different domains
						const proxyUrl = "https://" + randomHostname + url.pathname + url.search;
						let modifiedRequest = new Request(proxyUrl, {
							method: request.method,
							headers: newHeaders,
							body: request.body,
							redirect: "manual",
						});
						const proxyResponse = await fetch(modifiedRequest, { redirect: "manual" });
						// Check for 302 or 301 redirect status and return an error response
						if ([301, 302].includes(proxyResponse.status)) {
							return new Response(`Redirects to ${randomHostname} are not allowed.`, {
								status: 403,
								statusText: "Forbidden",
							});
						}
						// Return the response from the proxy server
						return proxyResponse;
				}
			}
			return await handle\u0076\u006c\u0065\u0073\u0073WebSocket(request);
		} catch (err) {
      /** @type {Error} */ let e = err;
			return new Response(e.toString());
		}
	},
};
//WebSocket 处理
async function handle\u0076\u006c\u0065\u0073\u0073WebSocket(request) {
	const wsPair = new WebSocketPair();
	const [clientWS, serverWS] = Object.values(wsPair);

	serverWS.accept();

	const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';
	const wsReadable = createWebSocketReadableStream(serverWS, earlyDataHeader);
	let remoteSocket = null;

	let udpStreamWrite = null;
	let isDns = false;

	wsReadable.pipeTo(new WritableStream({
		async write(chunk) {

			if (isDns && udpStreamWrite) {
				return udpStreamWrite(chunk);
			}

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

			if (result.isUDP) {
				if (result.portRemote === 53) {
					isDns = true;
					const { write } = await handleUDPOutBound(serverWS, \u0076\u006c\u0065\u0073\u0073RespHeader);
					udpStreamWrite = write;
					udpStreamWrite(rawClientData);
					return;
				} else {
					throw new Error('UDP代理仅支持DNS(端口53)');
				}
			}

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
			//工具函数ipv4->piv6
			function convertToNAT64IPv6(ipv4Address) {
				const parts = ipv4Address.split('.');
				if (parts.length !== 4) {
					throw new Error('无效的IPv4地址');
				}

				const hex = parts.map(part => {
					const num = parseInt(part, 10);
					if (num < 0 || num > 255) {
						throw new Error('无效的IPv4地址段');
					}
					return num.toString(16).padStart(2, '0');
				});
				const prefixes = ['2602:fc59:b0:64::']; //,'2a01:4f9:c010:3f02:64::'
				const chosenPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
				return `[${chosenPrefix}${hex[0]}${hex[1]}:${hex[2]}${hex[3]}]`;
			}

			async function getIPv6ProxyAddress(domain) {
				try {
					const dnsQuery = await fetch(`https://1.1.1.1/dns-query?name=${domain}&type=A`, {
						headers: {
							'Accept': 'application/dns-json'
						}
					});

					const dnsResult = await dnsQuery.json();
					if (dnsResult.Answer && dnsResult.Answer.length > 0) {
						const aRecord = dnsResult.Answer.find(record => record.type === 1);
						if (aRecord) {
							const ipv4Address = aRecord.data;
							return convertToNAT64IPv6(ipv4Address);
						}
					}
					throw new Error('无法解析域名的IPv4地址');
				} catch (err) {
					throw new Error(`DNS解析失败: ${err.message}`);
				}
			}

			async function retry() {
				try {
					const proxyIP = await getIPv6ProxyAddress(result.addressRemote);
					console.log(`尝试通过NAT64 IPv6地址 ${proxyIP} 连接...`);
					const tcpSocket = await connect({
						hostname: proxyIP,
						port: result.portRemote
					});
					remoteSocket = tcpSocket;
					const writer = tcpSocket.writable.getWriter();
					await writer.write(rawClientData);
					writer.releaseLock();

					tcpSocket.closed.catch(error => {
						console.error('NAT64 IPv6连接关闭错误:', error);
					}).finally(() => {
						if (serverWS.readyState === WS_READY_STATE_OPEN) {
							serverWS.close(1000, '连接已关闭');
						}
					});

					pipeRemoteToWebSocket(tcpSocket, serverWS, \u0076\u006c\u0065\u0073\u0073RespHeader, null);
				} catch (err) {
					console.error('NAT64 IPv6连接失败:', err);
					serverWS.close(1011, 'NAT64 IPv6连接失败: ' + err.message);
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
//VLESS 协议解析
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

	let isUDP = false;
	if (command === 1) {

	} else if (command === 2) {

		isUDP = true;
	} else {
		return { hasError: true, message: '不支持的命令，仅支持TCP(01)和UDP(02)' };
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
		isUDP
	};
}

function pipeRemoteToWebSocket(remoteSocket, ws, \u0076\u006c\u0065\u0073\u0073Header, retry = null) {
	let headerSent = false;
	let hasIncomingData = false;

	remoteSocket.readable.pipeTo(new WritableStream({
		write(chunk) {
			hasIncomingData = true;
			if (ws.readyState === WS_READY_STATE_OPEN) {
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
			if (ws.readyState === WS_READY_STATE_OPEN) {
				ws.close(1000, '正常关闭');
			}
		},
		abort() {
			closeSocket(remoteSocket);
		}
	})).catch(err => {
		console.error('数据转发错误:', err);
		closeSocket(remoteSocket);
		if (ws.readyState === WS_READY_STATE_OPEN) {
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

async function handleUDPOutBound(webSocket, \u0076\u006c\u0065\u0073\u0073ResponseHeader) {
	let is\u0076\u006c\u0065\u0073\u0073HeaderSent = false;
	const transformStream = new TransformStream({
		start(controller) {
		},
		transform(chunk, controller) {
			for (let index = 0; index < chunk.byteLength;) {
				const lengthBuffer = chunk.slice(index, index + 2);
				const udpPacketLength = new DataView(lengthBuffer).getUint16(0);
				const udpData = new Uint8Array(
					chunk.slice(index + 2, index + 2 + udpPacketLength)
				);
				index = index + 2 + udpPacketLength;
				controller.enqueue(udpData);
			}
		},
		flush(controller) {
		}
	});
	//DNS 查询处理
	transformStream.readable.pipeTo(new WritableStream({
		async write(chunk) {
			const resp = await fetch('https://1.1.1.1/dns-query',
				{
					method: 'POST',
					headers: {
						'content-type': 'application/dns-message',
					},
					body: chunk,
				})
			const dnsQueryResult = await resp.arrayBuffer();
			const udpSize = dnsQueryResult.byteLength;
			const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);

			if (webSocket.readyState === WS_READY_STATE_OPEN) {
				console.log(`DNS查询成功，DNS消息长度为 ${udpSize}`);
				if (is\u0076\u006c\u0065\u0073\u0073HeaderSent) {
					webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
				} else {
					webSocket.send(await new Blob([\u0076\u006c\u0065\u0073\u0073ResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer());
					is\u0076\u006c\u0065\u0073\u0073HeaderSent = true;
				}
			}
		}
	})).catch((error) => {
		console.error('DNS UDP处理错误:', error);
	});

	const writer = transformStream.writable.getWriter();

	return {
		write(chunk) {
			writer.write(chunk);
		}
	};
}
/**
 *配置处理
 * @param {string} userID
 * @param {string | null} hostName
 * @returns {string}
 */
function get\u0076\u006c\u0065\u0073\u0073Config(userID, hostName) {
	const w\u0076\u006c\u0065\u0073\u0073ws = `\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${CDNIP}:8880?encryption=none&security=none&type=ws&host=${hostName}&path=${pathlj}#${hostName}`;
	const p\u0076\u006c\u0065\u0073\u0073wstls = `\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${CDNIP}:8443?encryption=none&security=tls&type=ws&host=${hostName}&sni=${hostName}&fp=random&path=${pathlj}#${hostName}`;
	const note = `ProxyIP使用nat64自动生成，无需设置`;
	const ty = `https://${hostName}/${userID}/ty`
	const pty = `https://${hostName}/${userID}/pty`

	const wk\u0076\u006c\u0065\u0073\u0073share = btoa(`\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP1}:${PT1}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V1_${IP1}_${PT1}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP2}:${PT2}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V2_${IP2}_${PT2}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP3}:${PT3}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V3_${IP3}_${PT3}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP4}:${PT4}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V4_${IP4}_${PT4}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP5}:${PT5}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V5_${IP5}_${PT5}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP6}:${PT6}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V6_${IP6}_${PT6}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP7}:${PT7}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V7_${IP7}_${PT7}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP8}:${PT8}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V8_${IP8}_${PT8}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP9}:${PT9}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V9_${IP9}_${PT9}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP10}:${PT10}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V10_${IP10}_${PT10}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP11}:${PT11}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V11_${IP11}_${PT11}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP12}:${PT12}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V12_${IP12}_${PT12}\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP13}:${PT13}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V13_${IP13}_${PT13}`);



	const noteshow = note.replace(/\n/g, '<br>');
	const displayHtml = `
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
<style>
.limited-width {
    max-width: 200px;
    overflow: auto;
    word-wrap: break-word;
}
</style>
</head>
<script>
function copyToClipboard(text) {
  const input = document.createElement('textarea');
  input.style.position = 'fixed';
  input.style.opacity = 0;
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('Copy');
  document.body.removeChild(input);
  alert('已复制到剪贴板');
}
</script>
`;
	if (hostName.includes("workers.dev")) {
		return `
<br>
<br>
${displayHtml}
<body>
<div class="container">
    <div class="row">
        <div class="col-md-12">
            <h1>Cloudflare-workers/pages-\u0076\u006c\u0065\u0073\u0073代理脚本 V1.0.0</h1>
	    <hr>
            <p>${noteshow}</p>
            <hr>
	    <hr>
	    <hr>
            <br>
            <br>
            <h3>1：CF-workers-\u0076\u006c\u0065\u0073\u0073+ws节点</h3>
			<table class="table">
				<thead>
					<tr>
						<th>节点特色：</th>
						<th>单节点链接如下：</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="limited-width">关闭了TLS加密，无视域名阻断</td>
						<td class="limited-width">${w\u0076\u006c\u0065\u0073\u0073ws}</td>
						<td><button class="btn btn-primary" onclick="copyToClipboard('${w\u0076\u006c\u0065\u0073\u0073ws}')">点击复制链接</button></td>
					</tr>
				</tbody>
			</table>
            <h5>客户端参数如下：</h5>
            <ul>
                <li>客户端地址(address)：自定义的域名 或者 优选域名 或者 优选IP 或者 反代IP</li>
                <li>端口(port)：7个http端口可任意选择(80、8080、8880、2052、2082、2086、2095)，或反代IP对应端口</li>
                <li>用户ID(uuid)：${userID}</li>
                <li>传输协议(network)：ws 或者 websocket</li>
                <li>伪装域名(host)：${hostName}</li>
                <li>路径(path)：${pathlj}</li>
		<li>传输安全(TLS)：关闭</li>
            </ul>
            <hr>
			<hr>
			<hr>
            <br>
            <br>
            <h3>2：CF-workers-\u0076\u006c\u0065\u0073\u0073+ws+tls节点</h3>
			<table class="table">
				<thead>
					<tr>
						<th>节点特色：</th>
						<th>单节点链接如下：</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="limited-width">启用了TLS加密，<br>如果客户端支持分片(Fragment)功能，建议开启，防止域名阻断</td>
						<td class="limited-width">${p\u0076\u006c\u0065\u0073\u0073wstls}</td>	
						<td><button class="btn btn-primary" onclick="copyToClipboard('${p\u0076\u006c\u0065\u0073\u0073wstls}')">点击复制链接</button></td>
					</tr>
				</tbody>
			</table>
            <h5>客户端参数如下：</h5>
            <ul>
                <li>客户端地址(address)：自定义的域名 或者 优选域名 或者 优选IP 或者 反代IP</li>
                <li>端口(port)：6个https端口可任意选择(443、8443、2053、2083、2087、2096)，或反代IP对应端口</li>
                <li>用户ID(uuid)：${userID}</li>
                <li>传输协议(network)：ws 或者 websocket</li>
                <li>伪装域名(host)：${hostName}</li>
                <li>路径(path)：${pathlj}</li>
                <li>传输安全(TLS)：开启</li>
                <li>跳过证书验证(allowlnsecure)：false</li>
			</ul>
			<hr>
			<hr>
			<hr>
			<br>	
			<br>
			<h3>3：聚合通用订阅链接如下：</h3>
			<hr>
			<p>注意：<br>1、默认每个订阅链接包含TLS+非TLS共13个端口节点<br>2、当前workers域名作为订阅链接，需通过代理进行订阅更新<br>3、如使用的客户端不支持分片功能，则TLS节点不可用</p>
			<hr>


			<table class="table">
					<thead>
						<tr>
							<th>聚合通用分享链接 (可直接导入客户端)：</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><button class="btn btn-primary" onclick="copyToClipboard('${wk\u0076\u006c\u0065\u0073\u0073share}')">点击复制链接</button></td>
						</tr>
					</tbody>
				</table>


   
			<table class="table">
					<thead>
						<tr>
							<th>聚合通用订阅链接：</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="limited-width">${ty}</td>	
							<td><button class="btn btn-primary" onclick="copyToClipboard('${ty}')">点击复制链接</button></td>
						</tr>
					</tbody>
				</table>	
				<br>
        </div>
    </div>
</div>
</body>
`;
	} else {
		return `
<br>
<br>
${displayHtml}
<body>
<div class="container">
    <div class="row">
        <div class="col-md-12">
            <h1>Cloudflare-workers/pages-\u0076\u006c\u0065\u0073\u0073代理脚本 V1.0.0</h1>
			<hr>
            <p>${noteshow}</p>
            <hr>
			<hr>
			<hr>
            <br>
            <br>
            <h3>1：CF-pages/workers/自定义域-\u0076\u006c\u0065\u0073\u0073+ws+tls节点</h3>
			<table class="table">
				<thead>
					<tr>
						<th>节点特色：</th>
						<th>单节点链接如下：</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="limited-width">启用了TLS加密，<br>如果客户端支持分片(Fragment)功能，可开启，防止域名阻断</td>
						<td class="limited-width">${p\u0076\u006c\u0065\u0073\u0073wstls}</td>
						<td><button class="btn btn-primary" onclick="copyToClipboard('${p\u0076\u006c\u0065\u0073\u0073wstls}')">点击复制链接</button></td>
					</tr>
				</tbody>
			</table>
            <h5>客户端参数如下：</h5>
            <ul>
                <li>客户端地址(address)：自定义的域名 或者 优选域名 或者 优选IP 或者 反代IP</li>
                <li>端口(port)：6个https端口可任意选择(443、8443、2053、2083、2087、2096)，或反代IP对应端口</li>
                <li>用户ID(uuid)：${userID}</li>
                <li>传输协议(network)：ws 或者 websocket</li>
                <li>伪装域名(host)：${hostName}</li>
                <li>路径(path)：${pathlj}</li>
                <li>传输安全(TLS)：开启</li>
                <li>跳过证书验证(allowlnsecure)：false</li>
			</ul>
            <hr>
			<hr>
			<hr>
            <br>
            <br>
			<h3>2：聚合通用订阅链接如下：</h3>
			<hr>


			<table class="table">
					<thead>
						<tr>
							<th>聚合通用订阅链接13个节点：</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="limited-width">${ty}</td>	
							<td><button class="btn btn-primary" onclick="copyToClipboard('${ty}')">点击复制链接</button></td>
						</tr>
					</tbody>
				</table>	



			<table class="table">
					<thead>
						<tr>
							<th>聚合通用订阅链接6个TLS端口节点：</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="limited-width">${pty}</td>	
							<td><button class="btn btn-primary" onclick="copyToClipboard('${pty}')">点击复制链接</button></td>
						</tr>
					</tbody>
				</table>	
				<br>
        </div>
    </div>
</div>
</body>
`;
	}
}

function gettyConfig(userID, hostName) {
	const \u0076\u006c\u0065\u0073\u0073share = btoa(`\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP1}:${PT1}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V1\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP2}:${PT2}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V2\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP3}:${PT3}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V3\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP4}:${PT4}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V4\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP5}:${PT5}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V5\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP6}:${PT6}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V6\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP7}:${PT7}?encryption=none&security=none&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V7\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP8}:${PT8}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V8\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP9}:${PT9}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V9\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP10}:${PT10}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V10\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP11}:${PT11}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V11\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP12}:${PT12}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V12\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP13}:${PT13}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V13`);
	return `${\u0076\u006c\u0065\u0073\u0073share}`
}

function getptyConfig(userID, hostName) {
	const \u0076\u006c\u0065\u0073\u0073share = btoa(`\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP8}:${PT8}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V8\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP9}:${PT9}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V9\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP10}:${PT10}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V10\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP11}:${PT11}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V11\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP12}:${PT12}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V12\n\u0076\u006c\u0065\u0073\u0073\u003A//${userID}\u0040${IP13}:${PT13}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathlj}#CF_V13`);
	return `${\u0076\u006c\u0065\u0073\u0073share}`
}
//工具函数
function formatUUID(bytes) {
	const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function randomUserAgent() {
	const uaList = [
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114 Safari/537.36",
		"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:118.0) Gecko/20100101 Firefox/118.0"
	];
	return uaList[Math.floor(Math.random() * uaList.length)];
}