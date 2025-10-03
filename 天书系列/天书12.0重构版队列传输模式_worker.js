import { connect } from 'cloudflare:sockets';
let 哎呀呀这是我的ID啊 = "123456"; //实际上这是你的订阅路径，支持任意大小写字母和数字，[域名/ID]进入订阅页面
let 哎呀呀这是我的VL密钥 = "f927a226-9759-4524-b9a5-7d2615796308"; //这是真实的UUID，通用订阅会进行验证，建议修改为自己的规范化UUID

let 私钥开关 = false //是否启用私钥功能，true启用，false不启用，因为私钥功能只支持clash，如果打算使用通用订阅则需关闭私钥功能
let 咦这是我的私钥哎 = ""; //这是你的私钥，提高隐秘性安全性，就算别人扫到你的域名也无法链接，再也不怕别人薅请求数了^_^

let 隐藏订阅 = false //选择是否隐藏订阅页面，false不隐藏，true隐藏，当然隐藏后自己也无法订阅，因为配置固定，适合自己订阅后就隐藏，防止被爬订阅，并且可以到下方添加嘲讽语^_^
let 嘲讽语 = "哎呀你找到了我，但是我就是不给你看，气不气，嘿嘿嘿" //隐藏订阅后，真实的订阅页面就会显示这段话，想写啥写啥

let 我的优选 = [
  '\u0075\u0073\u0061\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d',
  '\u006d\u0079\u0061\u006e\u006d\u0061\u0072\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d:8443',
  '\u0077\u0077\u0077\u002e\u0073\u0068\u006f\u0070\u0069\u0066\u0079\u002e\u0063\u006f\u006d:2053',
  '\u0077\u0077\u0077\u002e\u0069\u0070\u0067\u0065\u0074\u002e\u006e\u0065\u0074:2083',
  '\u006d\u0061\u006c\u0061\u0079\u0073\u0069\u0061\u002e\u0063\u006f\u006d:2087',
  '\u0063\u006c\u006f\u0075\u0064\u0066\u006c\u0061\u0072\u0065\u002e\u0039\u006a\u0079\u002e\u0063\u0063:2096'
] //格式127.0.0.1:443#US@notls或[2606:4700:3030:0:4563:5696:a36f:cdc5]:2096#US，如果#US不填则使用统一名称，如果@notls不填则默认使用TLS，每行一个，如果不填任何节点会生成一个默认自身域名的小黄云节点
let 我的优选TXT = [ //支持多TXT链接，可以汇聚各路大神的节点【格式相同的情况下】，方便节点恐慌症同学
  '',
] //优选TXT路径[https://ip.txt]，表达格式与上述相同，使用TXT时脚本内部填写的节点无效，二选一

let 启用反代功能 = true //选择是否启用反代功能【总开关】，false，true，现在你可以自由的选择是否启用反代功能了
let 反代IP = 'ProxyIP.Vultr.CMLiussss.net' //反代IP或域名，反代IP端口一般情况下不用填写，如果你非要用非标反代的话，可以填'ts.hpc.tw:443'这样
let 启用SOCKS5反代 = false //启用此功能true
let 我的SOCKS5账号 = '@Enkelte_notif:@Notif_Chat@115.91.26.114:2470' //格式'账号:密码@地址:端口'
let 启用NAT64反代 = false //NAT64启用true
let 我的NAT64地址 = '[2602:fc59:b0:64::]' //NAT64地址，支持带端口，示例[2001:67c:2960:6464::]:443


let 启用SOCKS5全局反代 = false //选择是否启用SOCKS5全局反代，启用后所有访问都是S5的落地【无论你客户端选什么节点】，访问路径是客户端--CF--SOCKS5，当然启用此功能后延迟=CF+SOCKS5，带宽取决于SOCKS5的带宽，不再享受CF高速和随时满带宽的待遇
let 我的节点名字 = '天书12' //自己的节点名字【统一名称】

let 启动控流机制 = false; //选择是否启动控流机制，true启动，false关闭，使用控流可提升连接稳定性，适合轻度使用，日常使用应该绰绰有余

let DOH服务器列表 = [ // DOH地址，基本上已经涵盖市面上所有通用地址了，一般无需修改
  // 国际通用
  "https://1.1.1.1/dns-query",                // Cloudflare IP
  "https://cloudflare-dns.com/dns-query",     // Cloudflare 主域名
  "https://dns.google/resolve",               // Google 公共 DNS
];
/////////////////////网页入口////////////////////////////////
export default {
  async fetch(访问请求, env) {
    const 读取我的请求标头 = 访问请求.headers.get('Upgrade');
    const url = new URL(访问请求.url);
    if (!读取我的请求标头 || 读取我的请求标头 !== 'websocket') {
      if (我的优选TXT) {
        const 链接数组 = Array.isArray(我的优选TXT) ? 我的优选TXT : [我的优选TXT];
        const 所有节点 = [];
        for (const 链接 of 链接数组) {
          try {
            const 响应 = await fetch(链接);
            const 文本 = await 响应.text();
            const 节点 = 文本.split('\n').map(line => line.trim()).filter(line => line);
            所有节点.push(...节点);
          } catch (e) {
            console.warn(`无法获取或解析链接: ${链接}`, e);
          }
        }
        if (所有节点.length > 0) {
          我的优选 = 所有节点;
        }
      }
      switch (url.pathname) {
        case `/${哎呀呀这是我的ID啊}`: {
          if (隐藏订阅) {
            return new Response(`${嘲讽语}`, { status: 200 });
          } else {
            const 订阅页面 = 给我订阅页面(哎呀呀这是我的ID啊, 访问请求.headers.get('Host'));
            return new Response(`${订阅页面}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
          }
        }
        case `/${哎呀呀这是我的ID啊}/${转码}${转码2}`: {
          if (隐藏订阅) {
            return new Response(`${嘲讽语}`, { status: 200 });
          } else {
            const 通用配置文件 = 给我通用配置文件(访问请求.headers.get('Host'));
            return new Response(`${通用配置文件}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
          }
        }
        case `/${哎呀呀这是我的ID啊}/${小猫}${咪}`: {
          if (隐藏订阅) {
            return new Response(`${嘲讽语}`, { status: 200 });
          } else {
            const 小猫咪配置文件 = 给我小猫咪配置文件(访问请求.headers.get('Host'));
            return new Response(`${小猫咪配置文件}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
          }
        }
        default:
          return new Response('Hello World!', { status: 200 });
      }
    } else if (读取我的请求标头 === 'websocket') {
      //这是读取环境变量的函数，由于本人并不使用，也没去测试是否有隐藏bug，懂的人可自行尝试
      const 读取环境变量 = (name, fallback, env) => {
        const raw = import.meta?.env?.[name] ?? env?.[name];
        if (raw === undefined || raw === null || raw === '') return fallback;
        if (typeof raw === 'string') {
          const trimmed = raw.trim();
          if (trimmed === 'true') return true;
          if (trimmed === 'false') return false;
          if (trimmed.includes('\n')) {
            return trimmed.split('\n').map(item => item.trim()).filter(Boolean);
          }
          if (!isNaN(trimmed) && trimmed !== '') return Number(trimmed);
          return trimmed;
        }
        return raw;
      };
      反代IP = 读取环境变量('PROXYIP', 反代IP, env);
      我的NAT64地址 = 读取环境变量('NAT64', 我的NAT64地址, env)
      我的SOCKS5账号 = 读取环境变量('SOCKS5', 我的SOCKS5账号, env);
      启用SOCKS5反代 = 读取环境变量('SOCKS5OPEN', 启用SOCKS5反代, env);
      启用SOCKS5全局反代 = 读取环境变量('SOCKS5GLOBAL', 启用SOCKS5全局反代, env);
      if (私钥开关) {
        const 验证我的私钥 = 访问请求.headers.get('my-key')
        if (验证我的私钥 === 咦这是我的私钥哎) {
          return await 升级WS请求(访问请求, url);
        }
      } else {
        return await 升级WS请求(访问请求, url);
      }
    }
  }
};
/////////////////////////////脚本主要架构//////////////////////////////
//第一步，读取和构建基础访问结构
async function 升级WS请求(访问请求, 路径url) {
  const 创建WS接口 = new WebSocketPair();
  const [客户端, WS接口] = Object.values(创建WS接口);
  const 读取WS数据头 = 访问请求.headers.get('sec-websocket-protocol'); //读取访问标头中的WS通信数据
  const 转换二进制数据 = 转换WS数据头为二进制数据(读取WS数据头); //解码目标访问数据，传递给TCP握手进程
  await 解析VL标头(转换二进制数据, WS接口, 路径url); //解析VL数据并进行TCP握手
  return new Response(null, { status: 101, webSocket: 客户端 }); //一切准备就绪后，回复客户端WS连接升级成功
}
function 转换WS数据头为二进制数据(WS数据头) {
  const base64URL转换为标准base64 = WS数据头.replace(/-/g, '+').replace(/_/g, '/');
  const 解码base64 = atob(base64URL转换为标准base64);
  const 转换为二进制数组 = Uint8Array.from(解码base64, c => c.charCodeAt(0));
  return 转换为二进制数组;
}
//第二步，解读VL协议数据，创建TCP握手
async function 解析VL标头(二进制数据, WS接口, 路径url) {
  let 识别地址类型, 地址信息索引, 访问地址, 地址长度, TCP接口
  try {
    if (!私钥开关 && 验证VL的密钥(二进制数据.slice(1, 17)) !== 哎呀呀这是我的VL密钥) throw new Error('UUID验证失败');
    const 获取数据定位 = 二进制数据[17];
    const 提取端口索引 = 18 + 获取数据定位 + 1;
    const 访问端口 = new DataView(二进制数据.buffer, 提取端口索引, 2).getUint16(0);
    if (访问端口 === 53) throw new Error('拒绝DNS连接')
    const 提取地址索引 = 提取端口索引 + 2;
    识别地址类型 = 二进制数据[提取地址索引];
    地址信息索引 = 提取地址索引 + 1;
    switch (识别地址类型) {
      case 1:
        地址长度 = 4;
        访问地址 = 二进制数据.slice(地址信息索引, 地址信息索引 + 地址长度).join('.');
        break;
      case 2:
        地址长度 = 二进制数据[地址信息索引];
        地址信息索引 += 1;
        const 访问域名 = new TextDecoder().decode(二进制数据.slice(地址信息索引, 地址信息索引 + 地址长度));
        访问地址 = await 查询最快IP(访问域名);
        if (访问地址 !== 访问域名) 识别地址类型 = 访问地址.includes(':') ? 3 : 1;
        break;
      case 3:
        地址长度 = 16;
        const ipv6 = [];
        const 读取IPV6地址 = new DataView(二进制数据.buffer, 地址信息索引, 16);
        for (let i = 0; i < 8; i++) ipv6.push(读取IPV6地址.getUint16(i * 2).toString(16));
        访问地址 = ipv6.join(':');
        break;
      default:
        throw new Error('无效的访问地址');
    }
    if (启用SOCKS5全局反代) {
      TCP接口 = await 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口, 我的SOCKS5账号);
    } else {
      try {
        TCP接口 = connect({ hostname: 访问地址, port: 访问端口 });
        await TCP接口.opened;
      } catch {
        try {
          //支持v2rayN代理客户端设置路径单节点SOCKS5代理设置
          //格式要求：/?ed=2560&SOCKS5=[用户名:密码@]IP地址[:端口号]
          const 路径参数 = 路径url.pathname + 路径url.search;
          const SOCKS5匹配 = 路径参数.split(/SOCKS5=/i)[1];
          const 匹配过来的SOCKS5 = decodeURIComponent(SOCKS5匹配);
          TCP接口 = await 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口, 匹配过来的SOCKS5.trim());
        } catch {
          if (启用反代功能) {
            let [反代IP地址, 反代IP端口] = 解析地址端口(反代IP);
            TCP接口 = connect({ hostname: 反代IP地址, port: 反代IP端口 });
          } else if (启用SOCKS5反代) {
            TCP接口 = await 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口, 我的SOCKS5账号);
          } else {
            if (启用NAT64反代 && 识别地址类型 === 1) {
              const [NAT64地址, NAT64端口] = 解析地址端口(我的NAT64地址);
              const 转换NAT64地址 = 转换到NAT64的IPv6(访问地址, NAT64地址)
              TCP接口 = connect({ hostname: 转换NAT64地址, port: NAT64端口 });
            }
          }
        }

      }
    }
    await TCP接口.opened;
    const 传输数据 = TCP接口.writable.getWriter();
    const 读取数据 = TCP接口.readable.getReader();
    await 传输数据.write(二进制数据.slice(地址信息索引 + 地址长度));
    建立传输管道(传输数据, 读取数据, WS接口); //建立WS接口与TCP接口的传输管道
  } catch (e) {
    return new Response(`连接握手失败: ${e}`, { status: 500 });
  }
}
function 验证VL的密钥(字节数组, 起始位置 = 0) {
  const 十六进制表 = Array.from({ length: 256 }, (_, 值) =>
    (值 + 256).toString(16).slice(1)
  );
  const 分段结构 = [4, 2, 2, 2, 6];
  let 当前索引 = 起始位置;
  const 格式化UUID = 分段结构
    .map(段长度 =>
      Array.from({ length: 段长度 }, () => 十六进制表[字节数组[当前索引++]]).join('')
    )
    .join('-')
    .toLowerCase();
  return 格式化UUID;
}
async function 查询最快IP(访问域名) {
  const 构造请求 = (type) =>
    DOH服务器列表.map(DOH =>
      fetch(`${DOH}?name=${访问域名}&type=${type}`, {
        headers: { 'Accept': 'application/dns-json' }
      }).then(res => res.json())
        .then(json => {
          const ip = json.Answer?.find(r => r.type === (type === 'A' ? 1 : 28))?.data;
          if (ip) return ip;
          return Promise.reject(`无 ${type} 记录`);
        })
        .catch(err => Promise.reject(`${DOH} ${type} 请求失败: ${err}`))
    );
  try {
    return await Promise.any(构造请求('A'));
  } catch {
    return 访问域名;
  }
}
function 解析地址端口(地址段) {
  let 地址, 端口;
  if (地址段.startsWith('[')) {
    [地址, 端口 = 443] = 地址段.slice(1, -1).split(']:');
  } else {
    [地址, 端口 = 443] = 地址段.split(':')
  }
  return [地址, 端口];
}
function 转换到NAT64的IPv6(IPv4地址, NAT64地址) {
  const 地址段 = IPv4地址.split('.');
  if (地址段.length !== 4) throw new Error('无效的IPv4地址');
  const 十六进制段 = 地址段.map(part => {
    const num = parseInt(part, 10);
    if (num < 0 || num > 255) {
      throw new Error('无效的IPv4地址段');
    }
    return num.toString(16).padStart(2, '0');
  });
  return `[${NAT64地址}${十六进制段[0]}${十六进制段[1]}:${十六进制段[2]}${十六进制段[3]}]`;
}
//第三步，创建客户端WS-CF-目标的传输通道并监听状态
async function 建立传输管道(传输数据, 读取数据, WS接口, 传输队列 = Promise.resolve(), 字节计数 = 0, 累计传输字节数 = 0, 已结束 = false) {
  WS接口.accept();
  WS接口.send(new Uint8Array([0, 0]));
  WS接口.addEventListener('message', event => 传输队列 = 传输队列.then(async () => {
    const WS数据 = new Uint8Array(event.data);
    await 传输数据.write(WS数据);
    累计传输字节数 += WS数据.length;
  }).catch());
  while (true) {
    const { done: 流结束, value: 返回数据 } = await 读取数据.read();
    if (流结束) { 已结束 = true; break; }
    if (!返回数据 || 返回数据.length === 0) continue;
    传输队列 = 传输队列.then(() => WS接口.send(返回数据)).catch();
    累计传输字节数 += 返回数据.length;
    if (启动控流机制 && (累计传输字节数 - 字节计数) > 2 * 1024 * 1024 && 返回数据.length < 4096) {
      传输队列 = 传输队列.then(async () => await new Promise(resolve => setTimeout(resolve, 200))).catch();
      字节计数 = 累计传输字节数;
    }
  }
}
//////////////////////////////////SOCKS5部分/////////////////////////////////////
async function 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口, SOCKS5账号) {
  let 转换访问地址, 传输数据, 读取数据;
  const { 账号, 密码, 地址, 端口 } = await 获取SOCKS5账号(SOCKS5账号);
  const SOCKS5接口 = connect({ hostname: 地址, port: 端口 });
  try {
    await SOCKS5接口.opened;
    传输数据 = SOCKS5接口.writable.getWriter();
    读取数据 = SOCKS5接口.readable.getReader();
    const 转换数组 = new TextEncoder(); //把文本内容转换为字节数组，如账号，密码，域名，方便与S5建立连接
    const 构建S5认证 = new Uint8Array([5, 2, 0, 2]); //构建认证信息,支持无认证和用户名/密码认证
    await 传输数据.write(构建S5认证); //发送认证信息，确认目标是否需要用户名密码认证
    const 读取认证要求 = (await 读取数据.read()).value;
    if (读取认证要求[1] === 0x02) { //检查是否需要用户名/密码认证
      if (!账号 || !密码) {
        throw new Error(`未配置账号密码`);
      }
      const 构建账号密码包 = new Uint8Array([1, 账号.length, ...转换数组.encode(账号), 密码.length, ...转换数组.encode(密码)]); //构建账号密码数据包，把字符转换为字节数组
      await 传输数据.write(构建账号密码包); //发送账号密码认证信息
      const 读取账号密码认证结果 = (await 读取数据.read()).value;
      if (读取账号密码认证结果[0] !== 0x01 || 读取账号密码认证结果[1] !== 0x00) { //检查账号密码认证结果，认证失败则退出
        throw new Error(`账号密码错误`);
      }
    }
    switch (识别地址类型) {
      case 1: // IPv4
        转换访问地址 = new Uint8Array([1, ...访问地址.split('.').map(Number)]);
        break;
      case 2: // 域名
        转换访问地址 = new Uint8Array([3, 访问地址.length, ...转换数组.encode(访问地址)]);
        break;
      case 3: // IPv6
        转换访问地址 = new Uint8Array([4, ...访问地址.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]);
        break;
    }
    const 构建转换后的访问地址 = new Uint8Array([5, 1, 0, ...转换访问地址, 访问端口 >> 8, 访问端口 & 0xff]); //构建转换好的地址消息
    await 传输数据.write(构建转换后的访问地址); //发送转换后的地址
    const 检查返回响应 = (await 读取数据.read()).value;
    if (检查返回响应[0] !== 0x05 || 检查返回响应[1] !== 0x00) {
      throw new Error(`目标地址连接失败，访问地址: ${访问地址}，地址类型: ${识别地址类型}`);
    }
    传输数据.releaseLock();
    读取数据.releaseLock();
    return SOCKS5接口;
  } catch (e) {
    传输数据.releaseLock();
    读取数据.releaseLock();
    SOCKS5接口.close();
    throw new Error(`SOCKS5握手失败: ${e}`);
  }
}

async function 获取SOCKS5账号(SOCKS5) {
  const [账号段, 地址段] = SOCKS5.split(/@?([\d\[\]a-f.:]+(?::\d+)?)$/im);
  let [账号, 密码] = 账号段.split(':');
  if (!密码) { 密码 = '' };
  let [地址, 端口] = 地址段.split(/:((?:\d+)?)$/im);
  if (!端口) { 端口 = '443' };
  return { 账号, 密码, 地址, 端口 };
}
/////////////////////////////////////////订阅页面//////////////////////////////
let 转码 = 'vl', 转码2 = 'ess', 符号 = '://', 小猫 = 'cla', 咪 = 'sh', 我的私钥;
if (私钥开关) {
  我的私钥 = `my-key: ${咦这是我的私钥哎}`
} else {
  我的私钥 = ""
}
function 给我订阅页面(哎呀呀这是我的ID啊, hostName) {
  return `
1、本worker的私钥功能只支持${小猫}${咪}，仅open${小猫}${咪}和${小猫}${咪} meta测试过，其他${小猫}${咪}类软件自行测试
2、若使用通用订阅请关闭私钥功能
3、其他需求自行研究
通用的：https${符号}${hostName}/${哎呀呀这是我的ID啊}/${转码}${转码2}
猫咪的：https${符号}${hostName}/${哎呀呀这是我的ID啊}/${小猫}${咪}
`;
}
function 给我通用配置文件(hostName) {
  我的优选.push(`${hostName}:443#备用节点`)
  if (私钥开关) {
    return `请先关闭私钥功能`
  } else {
    return 我的优选.map(获取优选 => {
      const [主内容, tls] = 获取优选.split("@");
      const [地址端口, 节点名字 = 我的节点名字] = 主内容.split("#");
      const 拆分地址端口 = 地址端口.split(":");
      const 端口 = 拆分地址端口.length > 1 ? Number(拆分地址端口.pop()) : 443;
      const 地址 = 拆分地址端口.join(":");
      const TLS开关 = tls === 'notls' ? 'security=none' : 'security=tls';
      return `${转码}${转码2}${符号}${哎呀呀这是我的VL密钥}@${地址}:${端口}?encryption=none&${TLS开关}&sni=${hostName}&type=ws&host=${hostName}&path=%2F%3Fed%3D2560#${节点名字}`;
    }).join("\n");
  }
}
function 给我小猫咪配置文件(hostName) {
  我的优选.push(`${hostName}:443#备用节点`)
  function 生成节点(节点输入列表, hostName) {
    const 节点配置列表 = [];
    const 节点名称列表 = [];
    const 负载均衡节点名称列表 = [];
    for (const 获取优选 of 节点输入列表) {
      const [主内容, tls] = 获取优选.split("@");
      const [地址端口, 节点名字 = "默认节点"] = 主内容.split("#");
      const 拆分地址端口 = 地址端口.split(":");
      const 端口 = 拆分地址端口.length > 1 ? Number(拆分地址端口.pop()) : 443;
      const 地址 = 拆分地址端口.join(":").replace(/^\[(.+)\]$/, '$1');
      const TLS开关 = tls === "notls" ? "false" : "true";
      const 名称 = `${节点名字}-${地址}-${端口}`;
      节点配置列表.push(`- name: ${名称}
  type: ${转码}${转码2}
  server: ${地址}
  port: ${端口}
  uuid: ${哎呀呀这是我的VL密钥}
  udp: false
  tls: ${TLS开关}
  sni: ${hostName}
  network: ws
  ws-opts:
    path: "/?ed=2560"
    headers:
      Host: ${hostName}
      ${我的私钥}`);
      节点名称列表.push(`    - ${名称}`);
      if (名称.includes("负载均衡")) {
        负载均衡节点名称列表.push(`    - ${名称}`);
      }
    }
    let 负载均衡配置 = "";
    let 负载均衡组名 = "负载均衡";
    if (负载均衡节点名称列表.length > 0) {
      负载均衡配置 = `- name: ${负载均衡组名}
  type: load-balance
  strategy: round-robin #负载均衡配置，round-robin正常轮询，consistent-hashing散列轮询
  url: http://www.gstatic.com/generate_204
  interval: 60 #自动测试间隔
  proxies:
${负载均衡节点名称列表.join("\n")}`;
    }
    return {
      节点配置列表,
      节点名称列表,
      负载均衡配置,
      负载均衡组名: 负载均衡节点名称列表.length > 0 ? 负载均衡组名 : null,
    };
  }
  const { 节点配置列表, 节点名称列表, 负载均衡配置, 负载均衡组名 } = 生成节点(我的优选, hostName);
  const 生成节点配置 = 节点配置列表.join("\n");
  const 选择组 = `- name: 🚀 节点选择
  type: select
  proxies:
    - 自动选择
${负载均衡组名 ? `    - ${负载均衡组名}` : ""}
${节点名称列表.join("\n")}`;
  const 自动选择组 = `- name: 自动选择
  type: url-test
  url: http://www.gstatic.com/generate_204
  interval: 60 #自动测试间隔
  tolerance: 30
  proxies:
${负载均衡组名 ? `    - ${负载均衡组名}` : ""}
${节点名称列表.join("\n")}`;
  return `
# DNS原则上已经不需要了，保留只是为了防止可能的客户端兼容性问题
dns:
  nameserver:
    - 180.76.76.76
    - 2400:da00::6666
  fallback:
    - 8.8.8.8
    - 2001:4860:4860::8888
proxies:
${生成节点配置}
proxy-groups:
${选择组}
${自动选择组}
${负载均衡配置 || ""}
- name: 漏网之鱼
  type: select
  proxies:
    - DIRECT
    - 🚀 节点选择
rules:
# 本人自用规则，不一定适合所有人所有客户端，如客户端因规则问题无法订阅就删除对应规则吧，每个人都有自己习惯的规则，自行研究哦
# 策略规则，建议使用meta内核，部分规则需打开${小猫}${咪} mate的使用geoip dat版数据库，比如TG规则就需要，或者自定义geoip的规则订阅
# 这是geoip的规则订阅链接，https://cdn.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb
- GEOSITE,category-ads,REJECT #简单广告过滤规则，要增加规则数可使用category-ads-all
- GEOSITE,cn,DIRECT #国内域名直连规则
- GEOIP,CN,DIRECT,no-resolve #国内IP直连规则
- GEOSITE,cloudflare,🚀 节点选择 #CF域名规则
- GEOIP,CLOUDFLARE,🚀 节点选择,no-resolve #CFIP规则
- GEOSITE,gfw,🚀 节点选择 #GFW域名规则
- GEOSITE,google,🚀 节点选择 #GOOGLE域名规则
- GEOIP,GOOGLE,🚀 节点选择,no-resolve #GOOGLE IP规则
- GEOSITE,netflix,🚀 节点选择 #奈飞域名规则
- GEOIP,NETFLIX,🚀 节点选择,no-resolve #奈飞IP规则
- GEOSITE,telegram,🚀 节点选择 #TG域名规则
- GEOIP,TELEGRAM,🚀 节点选择,no-resolve #TG IP规则
- GEOSITE,openai,🚀 节点选择 #GPT规则
- MATCH,漏网之鱼
`
}