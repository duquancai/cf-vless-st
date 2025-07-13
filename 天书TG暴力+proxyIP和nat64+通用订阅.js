// 订阅地址：http://域名/订阅路径
import { connect } from 'cloudflare:sockets';

// 订阅配置参数
let 哎呀呀这是我的VL密钥 = '06d7531c-87f1-445a-adc8-1933878e30b1'; // UUID及订阅路径
let 我的优选 = [
  'freeyx.cloudflare88.eu.org:443#Japan丨节点',
];
let 我的优选TXT = [
  // 'https://raw.githubusercontent.com/shulng/shulng/refs/heads/main/ip.txt', // 测试地址
  // 'https://raw.githubusercontent.com/cmliu/CFcdnVmess2sub/main/addressesapi.txt', // 测试地址
];
let 我的proxyIP = 'ProxyIP.Vultr.CMLiussss.net';
//let 我的NAT64 = '2602:fc59:11:64::';
let 我的NAT64 = '2001:67c:2960:6464::';

let 我的节点名字 = '天书TG暴力下载';
let 通 = 'vl', 用 = 'ess', 符号 = '://';

// 主请求处理函数：处理HTTP请求和WebSocket升级
export default {
  async fetch(访问请求, env) {
    const 升级标头 = 访问请求.headers.get('Upgrade');
    const 请求URL = new URL(访问请求.url);
    if (!升级标头 || 升级标头 !== 'websocket') {
      switch (请求URL.pathname) {
        case `/${哎呀呀这是我的VL密钥}`:
          return new Response(生成订阅页面(哎呀呀这是我的VL密钥, 访问请求.headers.get('Host')), {
            status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' }
          });
        case `/${哎呀呀这是我的VL密钥}/${通}${用}`: {
          const 节点列表 = await 获取合并节点列表();
          return new Response(生成通用配置文件(访问请求.headers.get('Host'), 节点列表), {
            status: 200, headers: { 'Content-Type': 'text/plain;charset=utf-8' }
          });
        }
        default:
          return new Response('Hello World!', { status: 200 });
      }
    }

    // 处理WebSocket连接请求
    const 加密协议 = 访问请求.headers.get('sec-websocket-protocol');
    const 解密数据 = 使用Base64解码(加密协议);
    if (验证VL密钥(new Uint8Array(解密数据.slice(1, 17))) !== 哎呀呀这是我的VL密钥) {
      return new Response('无效的UUID', { status: 403 });
    }
    const { TCP套接字, 初始数据 } = await 解析VL协议头(解密数据);
    return await 升级WebSocket请求(访问请求, TCP套接字, 初始数据);
  }
};

// 合并静态节点和TXT节点
async function 获取合并节点列表() {
  if (!我的优选TXT || 我的优选TXT.length === 0) return 我的优选;
  const 所有节点 = [...我的优选];
  for (const 链接 of 我的优选TXT) {
    try {
      const 响应 = await fetch(链接);
      const 文本内容 = await 响应.text();
      const 节点列表 = 文本内容.split('\n').map(行 => 行.trim()).filter(行 => 行);
      所有节点.push(...节点列表);
    } catch { }
  }
  return 所有节点;
}

// 将IPv4地址转换为NAT64格式的IPv6地址
function 转换到NAT64的IPv6(IPv4地址) {
  const 地址段 = IPv4地址.split('.');
  if (地址段.length !== 4) throw new Error('无效的IPv4地址');
  const 十六进制段 = 地址段.map(段 => Number(段).toString(16).padStart(2, '0'));
  return `[${我的NAT64}${十六进制段[0]}${十六进制段[1]}:${十六进制段[2]}${十六进制段[3]}]`;
}

// 通过DNS查询获取域名的NAT64地址
async function 获取IPv6代理地址(域名) {
  const DNS响应 = await fetch(`https://1.1.1.1/dns-query?name=${域名}&type=A`, {
    headers: { 'Accept': 'application/dns-json' }
  });
  const DNS数据 = await DNS响应.json();
  const 解析记录 = DNS数据.Answer?.find(记录 => 记录.type === 1);
  if (!解析记录) throw new Error('无法解析域名的IPv4地址');
  return 转换到NAT64的IPv6(解析记录.data);
}

// 升级HTTP请求到WebSocket连接
async function 升级WebSocket请求(访问请求, TCP套接字, 初始数据) {
  const [客户端, 服务端] = new WebSocketPair();
  服务端.accept();
  建立数据传输管道(服务端, TCP套接字, 初始数据);
  return new Response(null, { status: 101, webSocket: 客户端 });
}

// Base64解码处理
function 使用Base64解码(字符串) {
  字符串 = 字符串.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(字符串), 字符 => 字符.charCodeAt(0)).buffer;
}

// 解析VLESS协议头部信息
async function 解析VL协议头(缓冲区) {
  const 字节数组 = new Uint8Array(缓冲区);
  const 地址类型索引 = 字节数组[17];
  const 端口号 = new DataView(缓冲区).getUint16(18 + 地址类型索引 + 1);
  let 偏移量 = 18 + 地址类型索引 + 4;
  let 目标主机;
  if (字节数组[偏移量 - 1] === 1) {  // IPv4地址
    目标主机 = Array.from(字节数组.slice(偏移量, 偏移量 + 4)).join('.');
    偏移量 += 4;
  } else if (字节数组[偏移量 - 1] === 2) {  // 域名
    const 域名长度 = 字节数组[偏移量];
    目标主机 = new TextDecoder().decode(字节数组.slice(偏移量 + 1, 偏移量 + 1 + 域名长度));
    偏移量 += 域名长度 + 1;
  } else {  // IPv6地址
    const IPv6视图 = new DataView(缓冲区);
    目标主机 = Array(8).fill().map((_, i) =>
      IPv6视图.getUint16(偏移量 + 2 * i).toString(16).padStart(4, '0')
    ).join(':');
    偏移量 += 16;
  }
  const 初始数据 = 缓冲区.slice(偏移量);

  // 尝试直连目标
  try {
    const 直连套接字 = await connect({ hostname: 目标主机, port: 端口号 });
    await 直连套接字.opened;
    return { TCP套接字: 直连套接字, 初始数据 };
  } catch { }

  // 使用proxyIP连接
  try {
    const [代理主机, 代理端口] = 我的proxyIP.split(':');
    const proxyIP套接字 = await connect({
      hostname: 代理主机,
      port: Number(代理端口) || 端口号
    });
    await proxyIP套接字.opened;
    return { TCP套接字: proxyIP套接字, 初始数据 };
  } catch { }
  
  // 以NAT64作代理连接
  try {
    let NAT64目标;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(目标主机)) {  // IPv4地址
      NAT64目标 = 转换到NAT64的IPv6(目标主机);
    } else if (目标主机.includes(':')) {  // IPv6地址
      throw new Error('IPv6地址无需转换');
    } else {  // 域名
      NAT64目标 = await 获取IPv6代理地址(目标主机);
    }
    const NAT64套接字 = await connect({
      hostname: NAT64目标.replace(/^["'`]+|["'`]+$/g, ''),
      port: 端口号
    });
    await NAT64套接字.opened;
    return { TCP套接字: NAT64套接字, 初始数据 };
  } catch { }
}

// 建立WebSocket与TCP套接字之间的传输
async function 建立数据传输管道(WebSocket接口, Tcp套接字, 初始数据) {
  WebSocket接口.send(new Uint8Array([0, 0]));
  const 写入器 = Tcp套接字.writable.getWriter();
  const 读取器 = Tcp套接字.readable.getReader();
  if (初始数据) {
    await 写入器.write(初始数据);
  }
  let 传输队列 = Promise.resolve();
  WebSocket接口.addEventListener('message', event => {
    传输队列 = 传输队列
      .then(async () => {
        await 写入器.write(event.data);
      })
      .catch(() => { });
  });
  try {
    while (true) {
      const { done, value } = await 读取器.read();
      if (done) break;
      传输队列 = 传输队列
        .then(() => {
          WebSocket接口.send(value);
        })
        .catch(() => { });
    }
  } finally {
    WebSocket接口.close();
    写入器.releaseLock();
    Tcp套接字.close();
  }
}

// 验证VLESS协议UUID有效性
function 验证VL密钥(字节数组) {
  return Array.from(字节数组, 字节 => 字节.toString(16).padStart(2, '0')).join('').replace(
    /(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5'
  );
}

// 生成订阅页面HTML
function 生成订阅页面(订阅ID, 主机名) {
  return `<p>天书TG订阅中心</p>
订阅链接<br>
----------------<br>
通用：https${符号}${主机名}/${订阅ID}/${通}${用}<br>
使用说明<br>
----------------<br>
1. 通用订阅：支持V2RayN、Shadowrocket等客户端<br>
`;
}

// 解析节点配置项
function 解析节点项(节点项, 节点计数, 默认节点名) {
  const [主要部分, TLS标志] = 节点项.split('@');
  let [地址端口, 节点名称 = 默认节点名] = 主要部分.split('#');
  if (节点计数[节点名称] === undefined) 节点计数[节点名称] = 0;
  else 节点名称 = `${节点名称}-${++节点计数[节点名称]}`;
  const 分割数组 = 地址端口.split(':');
  const 端口号 = 分割数组.length > 1 ? Number(分割数组.pop()) : 443;
  const 主机地址 = 分割数组.join(':');
  return { 主机地址, 端口号, 节点名称, TLS标志 };
}

// 生成通用订阅配置
function 生成通用配置文件(主机名, 节点列表) {
  if (节点列表.length === 0) 节点列表.push(`${主机名}:443#备用节点`);
  const 节点计数 = {};
  return 节点列表.map(节点项 => {
    const { 主机地址, 端口号, 节点名称, TLS标志 } = 解析节点项(节点项, 节点计数, 我的节点名字);
    const 安全选项 = TLS标志 === 'notls' ? 'security=none' : 'security=tls';
    return `${通}${用}${符号}${哎呀呀这是我的VL密钥}@${主机地址}:${端口号}?` +
      `encryption=none&${安全选项}&sni=${主机名}&type=ws&host=${主机名}&path=%2F%3Fed%3D2560#${节点名称}`;
  }).join('\n');
}