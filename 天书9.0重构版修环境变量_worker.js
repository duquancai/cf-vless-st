import { connect } from 'cloudflare:sockets';
//////////////////////////////////////////////////////////////////////////配置区块////////////////////////////////////////////////////////////////////////
let 哎呀呀这是我的ID啊 = "123456"; //实际上这是你的订阅路径，支持任意大小写字母和数字，[域名/ID]进入订阅页面
let 哎呀呀这是我的VL密钥 = "ae27a15c-cbcc-4dc6-bb51-5a90cc0a62a8"; //这是真实的UUID，通用订阅会进行验证，建议修改为自己的规范化UUID

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
let 我的优选TXT = '' //优选TXT路径[https://ip.txt]，表达格式与上述相同，使用TXT时脚本内部填写的节点无效，二选一

let 启用反代功能 = true //选择是否启用反代功能【总开关】，false，true，现在你可以自由的选择是否启用反代功能了
let 反代IP = 'ProxyIP.Vultr.CMLiussss.net' //反代IP或域名，反代IP端口一般情况下不用填写，如果你非要用非标反代的话，可以填'ts.hpc.tw:443'这样

let 启用SOCKS5反代 = false //如果启用此功能，原始反代将失效
let 启用SOCKS5全局反代 = false //选择是否启用SOCKS5全局反代，启用后所有访问都是S5的落地【无论你客户端选什么节点】，访问路径是客户端--CF--SOCKS5，当然启用此功能后延迟=CF+SOCKS5，带宽取决于SOCKS5的带宽，不再享受CF高速和随时满带宽的待遇
let 我的SOCKS5账号 = '' //格式'账号:密码@地址:端口'

let 我的节点名字 = '天书9.0' //自己的节点名字【统一名称】

let 伪装网页 = '' //填入伪装网页，格式'www.youku.com'，建议用小站伪装，比较靠谱
//////////////////////////////////////////////////////////////////////////网页入口////////////////////////////////////////////////////////////////////////
export default {
  async fetch(访问请求, env) {
    const 读取我的请求标头 = 访问请求.headers.get('Upgrade');
    const url = new URL(访问请求.url);
    if (!读取我的请求标头 || 读取我的请求标头 !== 'websocket') {
      if (我的优选TXT) {
        const 读取优选文本 = await fetch(我的优选TXT);
        const 转换优选文本 = await 读取优选文本.text();
        const 优选节点 = 转换优选文本.split('\n').map(line => line.trim()).filter(line => line);
        我的优选 = 优选节点 || 我的优选
      }
      switch (url.pathname) {
        case `/${哎呀呀这是我的ID啊}`: {
          const 订阅页面 = 给我订阅页面(哎呀呀这是我的ID啊, 访问请求.headers.get('Host'));
          return new Response(`${订阅页面}`, {
            status: 200,
            headers: { "Content-Type": "text/plain;charset=utf-8" }
          });
        }
        case `/${哎呀呀这是我的ID啊}/${转码}${转码2}`: {
          if (隐藏订阅) {
            return new Response(`${嘲讽语}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
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
            return new Response(`${嘲讽语}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
          } else {
            const 小猫咪配置文件 = 给我小猫咪配置文件(访问请求.headers.get('Host'));
            return new Response(`${小猫咪配置文件}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
          }
        }
        default:
          url.hostname = 伪装网页;
          url.protocol = 'https:';
          访问请求 = new Request(url, 访问请求);
          return fetch(访问请求);
      }
    } else if (读取我的请求标头 === 'websocket') {
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
      我的SOCKS5账号 = 读取环境变量('SOCKS5', 我的SOCKS5账号, env);
      启用SOCKS5反代 = 读取环境变量('SOCKS5OPEN', 启用SOCKS5反代, env);
      启用SOCKS5全局反代 = 读取环境变量('SOCKS5GLOBAL', 启用SOCKS5全局反代, env);
      if (私钥开关) {
        const 验证我的私钥 = 访问请求.headers.get('my-key')
        if (验证我的私钥 === 咦这是我的私钥哎) {
          return await 升级WS请求(访问请求);
        }
      } else {
        return await 升级WS请求(访问请求);
      }
    }
  }
};
////////////////////////////////////////////////////////////////////////脚本主要架构//////////////////////////////////////////////////////////////////////
//第一步，读取和构建基础访问结构
async function 升级WS请求(访问请求) {
  const 创建WS接口 = new WebSocketPair();
  const [客户端, WS接口] = Object.values(创建WS接口);
  const 读取我的加密访问内容数据头 = 访问请求.headers.get('sec-websocket-protocol'); //读取访问标头中的WS通信数据
  const 解密数据 = 使用64位加解密(读取我的加密访问内容数据头); //解密目标访问数据，传递给TCP握手进程
  await 解析VL标头(解密数据, WS接口); //解析VL数据并进行TCP握手
  return new Response(null, { status: 101, webSocket: 客户端 }); //一切准备就绪后，回复客户端WS连接升级成功
}
function 使用64位加解密(还原混淆字符) {
  还原混淆字符 = 还原混淆字符.replace(/-/g, '+').replace(/_/g, '/');
  const 解密数据 = atob(还原混淆字符);
  const 解密_你_个_丁咚_咙_咚呛 = Uint8Array.from(解密数据, (c) => c.charCodeAt(0));
  return 解密_你_个_丁咚_咙_咚呛.buffer;
}
//第二步，解读VL协议数据，创建TCP握手
async function 解析VL标头(VL数据, WS接口, TCP接口) {
  if (!私钥开关 && 验证VL的密钥(new Uint8Array(VL数据.slice(1, 17))) !== 哎呀呀这是我的VL密钥) {
    return new Response('连接验证失败', { status: 400 });
  }
  const 获取数据定位 = new Uint8Array(VL数据)[17];
  const 提取端口索引 = 18 + 获取数据定位 + 1;
  const 建立端口缓存 = VL数据.slice(提取端口索引, 提取端口索引 + 2);
  const 访问端口 = new DataView(建立端口缓存).getUint16(0);
  const 提取地址索引 = 提取端口索引 + 2;
  const 建立地址缓存 = new Uint8Array(VL数据.slice(提取地址索引, 提取地址索引 + 1));
  const 识别地址类型 = 建立地址缓存[0];
  let 地址长度 = 0;
  let 访问地址 = '';
  let 地址信息索引 = 提取地址索引 + 1;
  switch (识别地址类型) {
    case 1:
      地址长度 = 4;
      访问地址 = new Uint8Array(VL数据.slice(地址信息索引, 地址信息索引 + 地址长度)).join('.');
      break;
    case 2:
      地址长度 = new Uint8Array(VL数据.slice(地址信息索引, 地址信息索引 + 1))[0];
      地址信息索引 += 1;
      访问地址 = new TextDecoder().decode(VL数据.slice(地址信息索引, 地址信息索引 + 地址长度));
      break;
    case 3:
      地址长度 = 16;
      const dataView = new DataView(VL数据.slice(地址信息索引, 地址信息索引 + 地址长度));
      const ipv6 = [];
      for (let i = 0; i < 8; i++) { ipv6.push(dataView.getUint16(i * 2).toString(16)); }
      访问地址 = ipv6.join(':');
      break;
    default:
      return new Response('无效的访问地址', { status: 400 });
  }
  const 写入初始数据 = VL数据.slice(地址信息索引 + 地址长度);
  if (启用反代功能 && 启用SOCKS5反代 && 启用SOCKS5全局反代) {
    TCP接口 = await 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口);
  } else {
    try {
      TCP接口 = connect({ hostname: 访问地址, port: 访问端口 });
      await TCP接口.opened;
    } catch {
      if (启用反代功能) {
        if (启用SOCKS5反代) {
          TCP接口 = await 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口);
        } else {
          let [反代IP地址, 反代IP端口] = 反代IP.split(':');
          TCP接口 = connect({ hostname: 反代IP地址, port: 反代IP端口 || 访问端口 });
        }
      }
    }
  }
  try {
    await TCP接口.opened;
  } catch {
    return new Response('连接握手失败', { status: 400 });
  }
  建立传输管道(WS接口, TCP接口, 写入初始数据); //建立WS接口与TCP接口的传输管道
}
function 验证VL的密钥(arr, offset = 0) {
  const uuid = (转换密钥格式[arr[offset + 0]] + 转换密钥格式[arr[offset + 1]] + 转换密钥格式[arr[offset + 2]] + 转换密钥格式[arr[offset + 3]] + "-" + 转换密钥格式[arr[offset + 4]] + 转换密钥格式[arr[offset + 5]] + "-" + 转换密钥格式[arr[offset + 6]] + 转换密钥格式[arr[offset + 7]] + "-" + 转换密钥格式[arr[offset + 8]] + 转换密钥格式[arr[offset + 9]] + "-" + 转换密钥格式[arr[offset + 10]] + 转换密钥格式[arr[offset + 11]] + 转换密钥格式[arr[offset + 12]] + 转换密钥格式[arr[offset + 13]] + 转换密钥格式[arr[offset + 14]] + 转换密钥格式[arr[offset + 15]]).toLowerCase();
  return uuid;
}
const 转换密钥格式 = [];
for (let i = 0; i < 256; ++i) { 转换密钥格式.push((i + 256).toString(16).slice(1)); }
//第三步，创建客户端WS-CF-目标的传输通道并监听状态
async function 建立传输管道(WS接口, TCP接口, 写入初始数据) {
  WS接口.accept(); //打开WS接口连接通道
  WS接口.send(new Uint8Array([0, 0]).buffer); //向客户端发送WS接口初始化消息
  const 传输数据 = TCP接口.writable.getWriter(); //打开TCP接口写入通道
  const 读取数据 = TCP接口.readable.getReader(); //打开TCP接口读取通道
  if (写入初始数据) 传输数据.write(写入初始数据); //向TCP接口推送标头中提取的初始访问数据
  WS接口.addEventListener('message', 推送WS消息); //监听客户端WS接口后续数据，推送给TCP接口
  async function 推送WS消息(WS消息) { 传输数据.write(WS消息.data); }
  while (true) {
    const { value: 返回数据, done: 流结束 } = await 读取数据.read();
    if (流结束 || !返回数据) break;
    if (返回数据.length > 0) WS接口.send(返回数据);
  }
  WS接口.removeEventListener('message', 推送WS消息); //移除WS消息监听器
}
//////////////////////////////////////////////////////////////////////////SOCKS5部分//////////////////////////////////////////////////////////////////////
async function 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口, 转换访问地址) {
  const { 账号, 密码, 地址, 端口 } = await 获取SOCKS5账号(我的SOCKS5账号);
  const SOCKS5接口 = connect({ hostname: 地址, port: 端口 });
  try {
    await SOCKS5接口.opened;
  } catch {
    return new Response('SOCKS5未连通', { status: 400 });
  }
  const 传输数据 = SOCKS5接口.writable.getWriter();
  const 读取数据 = SOCKS5接口.readable.getReader();
  const 转换数组 = new TextEncoder(); //把文本内容转换为字节数组，如账号，密码，域名，方便与S5建立连接
  const 构建S5认证 = new Uint8Array([5, 2, 0, 2]); //构建认证信息,支持无认证和用户名/密码认证
  await 传输数据.write(构建S5认证); //发送认证信息，确认目标是否需要用户名密码认证
  const 读取认证要求 = (await 读取数据.read()).value;
  if (读取认证要求[1] === 0x02) { //检查是否需要用户名/密码认证
    if (!账号 || !密码) {
      return 关闭接口并退出();
    }
    const 构建账号密码包 = new Uint8Array([1, 账号.length, ...转换数组.encode(账号), 密码.length, ...转换数组.encode(密码)]); //构建账号密码数据包，把字符转换为字节数组
    await 传输数据.write(构建账号密码包); //发送账号密码认证信息
    const 读取账号密码认证结果 = (await 读取数据.read()).value;
    if (读取账号密码认证结果[0] !== 0x01 || 读取账号密码认证结果[1] !== 0x00) { //检查账号密码认证结果，认证失败则退出
      return 关闭接口并退出();
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
    default:
      return 关闭接口并退出();
  }
  const 构建转换后的访问地址 = new Uint8Array([5, 1, 0, ...转换访问地址, 访问端口 >> 8, 访问端口 & 0xff]); //构建转换好的地址消息
  await 传输数据.write(构建转换后的访问地址); //发送转换后的地址
  const 检查返回响应 = (await 读取数据.read()).value;
  if (检查返回响应[0] !== 0x05 || 检查返回响应[1] !== 0x00) {
    return 关闭接口并退出();
  }
  传输数据.releaseLock();
  读取数据.releaseLock();
  return SOCKS5接口;
  function 关闭接口并退出() {
    传输数据.releaseLock();
    读取数据.releaseLock();
    SOCKS5接口.close();
    return new Response('SOCKS5握手失败', { status: 400 });
  }
}
async function 获取SOCKS5账号(SOCKS5) {
  const [账号段, 地址段] = SOCKS5.split("@");
  const [账号, 密码] = [账号段.slice(0, 账号段.lastIndexOf(":")), 账号段.slice(账号段.lastIndexOf(":") + 1)];
  const [地址, 端口] = [地址段.slice(0, 地址段.lastIndexOf(":")), 地址段.slice(地址段.lastIndexOf(":") + 1)];
  return { 账号, 密码, 地址, 端口 };
}
//////////////////////////////////////////////////////////////////////////订阅页面////////////////////////////////////////////////////////////////////////
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
  if (我的优选.length === 0) {
    我的优选 = [`${hostName}:443`]
  }
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
  if (我的优选.length === 0) {
    我的优选 = [`${hostName}:443`]
  }
  const 生成节点 = (我的优选) => {
    return 我的优选.map(获取优选 => {
      const [主内容, tls] = 获取优选.split("@");
      const [地址端口, 节点名字 = 我的节点名字] = 主内容.split("#");
      const 拆分地址端口 = 地址端口.split(":");
      const 端口 = 拆分地址端口.length > 1 ? Number(拆分地址端口.pop()) : 443;
      const 地址 = 拆分地址端口.join(":").replace(/^\[(.+)\]$/, '$1');
      const TLS开关 = tls === 'notls' ? 'false' : 'true';
      return {
        nodeConfig: `- name: ${节点名字}-${地址}-${端口}
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
      ${我的私钥}`,
        proxyConfig: `    - ${节点名字}-${地址}-${端口}`
      };
    });
  };
  const 节点配置 = 生成节点(我的优选).map(node => node.nodeConfig).join("\n");
  const 代理配置 = 生成节点(我的优选).map(node => node.proxyConfig).join("\n");
  return `
dns:
  nameserver:
    - 180.76.76.76
    - 2400:da00::6666
  fallback:
    - 8.8.8.8
    - 2001:4860:4860::8888
proxies:
${节点配置}
proxy-groups:
- name: 🚀 节点选择
  type: select
  proxies:
    - 自动选择
${代理配置}
- name: 自动选择
  type: url-test
  url: http://www.gstatic.com/generate_204
  interval: 60 #测试间隔
  tolerance: 30
  proxies:
${代理配置}
- name: 漏网之鱼
  type: select
  proxies:
    - DIRECT
    - 🚀 节点选择
rules: # 本人自用规则，不一定适合所有人所有客户端，如客户端因规则问题无法订阅就删除对应规则吧，每个人都有自己习惯的规则，自行研究哦
# 策略规则，建议使用meta内核，部分规则需打开${小猫}${咪} mate的使用geoip dat版数据库，比如TG规则就需要，或者自定义geoip的规则订阅
# 这是geoip的规则订阅链接，https://cdn.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb
# - GEOSITE,category-ads-all,REJECT #简单广告过滤规则，要增加规则数可使用category-ads-all
- GEOSITE,cn,DIRECT #国内域名直连规则
- GEOIP,CN,DIRECT,no-resolve #国内IP直连规则
- GEOSITE,cloudflare,DIRECT #CF域名直连规则
- GEOIP,CLOUDFLARE,DIRECT,no-resolve #CFIP直连规则
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