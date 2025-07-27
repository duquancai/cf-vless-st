import { connect } from 'cloudflare:sockets';

///////////////配置区块////////////////////////
const 哎呀呀这是我的ID啊 = "123456"; //实际上这是你的订阅路径，支持任意大小写字母和数字，[域名/ID]进入订阅页面
const 哎呀呀这是我的VL密钥 = "ae27a15c-cbcc-4dc6-bb51-5a90cc0a62a8"; //这是真实的UUID，通用订阅会进行验证，建议修改为自己的规范化UUID
const 隐藏订阅 = false; //选择是否隐藏订阅页面，false不隐藏，true隐藏，当然隐藏后自己也无法订阅，因为配置固定，适合自己订阅后就隐藏，防止被爬订阅，并且可以到下方添加嘲讽语^_^
const 嘲讽语 = "哎呀你找到了我，但是我就是不给你看，气不气，嘿嘿嘿"; //隐藏订阅后，真实的订阅页面就会显示这段话，想写啥写啥

let 我的优选 = [
  '\u0075\u0073\u0061\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d',
  '\u006d\u0079\u0061\u006e\u006d\u0061\u0072\u002e\u0076\u0069\u0073\u0061\u002e\u0063\u006f\u006d:8443',
  '\u0077\u0077\u0077\u002e\u0073\u0068\u006f\u0070\u0069\u0066\u0079\u002e\u0063\u006f\u006d:2053',
  '\u0077\u0077\u0077\u002e\u0069\u0070\u0067\u0065\u0074\u002e\u006e\u0065\u0074:2083',
  '\u006d\u0061\u006c\u0061\u0079\u0073\u0069\u0061\u002e\u0063\u006f\u006d:2087',
  '\u0063\u006c\u006f\u0075\u0064\u0066\u006c\u0061\u0072\u0065\u002e\u0039\u006a\u0079\u002e\u0063\u0063:2096'
];
//格式127.0.0.1:443#US@notls或[2606:4700:3030:0:4563:5696:a36f:cdc5]:2096#US，如果#US不填则使用统一名称，如果@notls不填则默认使用TLS，每行一个，如果不填任何节点会生成一个默认自身域名的小黄云节点

let 启用反代功能 = true; //选择是否启用反代功能【总开关】，false，true，现在你可以自由的选择是否启用反代功能了
let 反代IP = 'ProxyIP.Vultr.CMLiussss.net'; //反代IP或域名，反代IP端口一般情况下不用填写，如果你非要用非标反代的话，可以填'ts.hpc.tw:443'这样
const 我的节点名字 = '天书9.0'; //自己的节点名字【统一名称】
let 伪装网页 = ''; //填入伪装网页，格式'www.youku.com'，建议用小站伪装，比较靠谱

///////////////网页入口/////////////
export default {
  async fetch(访问请求, env) {
    const 读取我的请求标头 = 访问请求.headers.get('Upgrade');
    const url = new URL(访问请求.url);
    if (!读取我的请求标头 || 读取我的请求标头 !== 'websocket') {
      switch (url.pathname) {
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
      return await 升级WS请求(访问请求);
    }
  }
};

/////////脚本主要架构/////////////////
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
  const 替换字符 = 还原混淆字符.replace(/-/g, '+').replace(/_/g, '/');
  const 解密数据 = atob(替换字符);
  const 解密_你_个_丁咚_咙_咚呛 = Uint8Array.from(解密数据, (c) => c.charCodeAt(0));
  return 解密_你_个_丁咚_咙_咚呛.buffer;
}

//第二步，解读VL协议数据，创建TCP握手
async function 解析VL标头(VL数据, WS接口) {
  let TCP接口;
  if (验证VL的密钥(new Uint8Array(VL数据.slice(1, 17))) !== 哎呀呀这是我的VL密钥) {
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
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      访问地址 = ipv6.join(':');
      break;
    default:
      return new Response('无效的访问地址', { status: 400 });
  }
  const 写入初始数据 = VL数据.slice(地址信息索引 + 地址长度);
  try {
    TCP接口 = connect({ hostname: 访问地址, port: 访问端口 });
    await TCP接口.opened;
  } catch {
    if (启用反代功能) {
      let [反代IP地址, 反代IP端口] = 反代IP.split(':');
      TCP接口 = connect({ hostname: 反代IP地址, port: 反代IP端口 || 访问端口 });
    }
  }
  try {
    await TCP接口.opened;
  } catch {
    return new Response('连接握手失败', { status: 400 });
  }
  建立传输管道(WS接口, TCP接口, 写入初始数据); //建立WS接口与TCP接口的传输管道
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

//第三步，创建客户端WS-CF-目标的传输通道并监听状态
async function 建立传输管道(WS接口, TCP接口, 写入初始数据) {
  WS接口.accept(); //打开WS接口连接通道
  WS接口.send(new Uint8Array([0, 0]).buffer); //向客户端发送WS接口初始化消息
  const 传输数据 = TCP接口.writable.getWriter(); //打开TCP接口写入通道
  const 读取数据 = TCP接口.readable.getReader(); //打开TCP接口读取通道
  if (写入初始数据) {
    await 传输数据.write(写入初始数据); //向TCP接口推送标头中提取的初始访问数据
  }
  const 推送WS消息 = (WS消息) => {
    传输数据.write(WS消息.data);
  };
  WS接口.addEventListener('message', 推送WS消息); //监听客户端WS接口后续数据，推送给TCP接口
  while (true) {
    const { value: 返回数据, done: 流结束 } = await 读取数据.read();
    if (流结束 || !返回数据) break;
    if (返回数据.length > 0) {
      WS接口.send(返回数据);
    }
  }
  WS接口.removeEventListener('message', 推送WS消息); //移除WS消息监听器
}

/////////////////订阅页面/////////////////
let 转码 = 'vl', 转码2 = 'ess', 符号 = '://';
function 给我通用配置文件(hostName) {
  if (我的优选.length === 0) {
    我的优选 = [`${hostName}:443`];
  }
  return 我的优选.map(获取优选 => {
    const [主内容, tls] = 获取优选.split("@");
    const [地址端口, 节点名字 = 我的节点名字] = 主内容.split("#");
    const 拆分地址端口 = 地址端口.split(":");
    const 端口 = 拆分地址端口.length > 1 ? Number(拆分地址端口.pop()) : 443;
    const 地址 = 拆分地址端口.join(":");
    const TLS开关 = tls === 'notls' ? 'security=none' : 'security=tls';
    return `${转码}${转码2}${符号}${哎呀呀这是我的VL密钥}@${地址}:${端口}?encryption=none&${TLS开关}&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=%2F%3Fed%3D2560#${节点名字}`;
  }).join("\n");
}