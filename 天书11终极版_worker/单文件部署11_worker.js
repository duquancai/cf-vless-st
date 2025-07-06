//1、天书版11.0重构版带控流模式，在10的基础上做了一些简化整合而已，并没有什么特别，给大家多一个选择，建议pages部署
//2、支持反代开关，私钥开关，订阅隐藏开关功能，clash私钥防止被薅请求数
//4、支持SOCKS5，支持S5全局反代，SOCKS5和原始反代只能二选一，SOCKS5握手过程较为繁杂，建议有高速稳定SOCKS5的人使用
//5、可能支持的环境变量名【SOCKS5】账号，【SOCKS5OPEN】开关S5反代true或false，【SOCKS5GLOBAL】全局S5反代落地true或false，【PROXYIP】反代IP，到相关代码段落看看先【100行左右】！！！
//6、不用在意脚本内那些奇怪的变量名，根据后面注释的备注去改，大概也就配置区块看一下备注就行，clash配置在底部，懂的可以根据自身需求修改
//7、纯手搓配置，去除任何API外链，直接改好了部署就行，这样安全性史无前例
//8、通用订阅不支持私钥功能，使用通用订阅需关闭私钥功能再订阅节点，CF不支持自身1.1.1.1的DNS解析，如果无法连通可以检查客户端DNS设置
//9、由于本人仅使用openclash和clash meta，其他平台软件均未测试，请自行测试研究，要是不能用就算了，不负责改进，继续概不负责^_^
//10、由于本人纯菜，很多代码解释都是根据自己的理解瞎编的，专业的无视就好，单纯为了帮助小白理解代码大致原理^_^
//11、重要！！！请大家不要发大群，要是因为传播广泛被封了本人技术有限没有能力进行修复
import { connect } from 'cloudflare:sockets';
//////////////////////////////////////////////////////////////////////////配置区块////////////////////////////////////////////////////////////////////////
let 哎呀呀这是我的ID啊 = "123456"; //实际上这是你的订阅路径，支持任意大小写字母和数字，[域名/ID]进入订阅页面
let 哎呀呀这是我的VL密钥 = "ae12b13c-cacc-1ea6-bb51-5a70cc0a72a8"; //这是真实的UUID，通用订阅会进行验证，建议修改为自己的规范化UUID

let 私钥开关 = false //是否启用私钥功能，true启用，false不启用，因为私钥功能只支持clash，如果打算使用通用订阅则需关闭私钥功能
let 咦这是我的私钥哎 = ""; //这是你的私钥，提高隐秘性安全性，就算别人扫到你的域名也无法链接，再也不怕别人薅请求数了^_^

let 隐藏订阅 = false //选择是否隐藏订阅页面，false不隐藏，true隐藏，当然隐藏后自己也无法订阅，因为配置固定，适合自己订阅后就隐藏，防止被爬订阅，并且可以到下方添加嘲讽语^_^
let 嘲讽语 = "哎呀你找到了我，但是我就是不给你看，气不气，嘿嘿嘿" //隐藏订阅后，真实的订阅页面就会显示这段话，想写啥写啥

let 我的优选 = [
  //'www.visa.com',
] //格式127.0.0.1:443#US@notls或[2606:4700:3030:0:4563:5696:a36f:cdc5]:2096#US，如果#US不填则使用统一名称，如果@notls不填则默认使用TLS，每行一个，如果不填任何节点会生成一个默认自身域名的小黄云节点
let 我的优选TXT =[ //支持多TXT链接，可以汇聚各路大神的节点【格式相同的情况下】，方便节点恐慌症同学
  '',
] //优选TXT路径[https://ip.txt]，表达格式与上述相同，使用TXT时脚本内部填写的节点无效，二选一

let 启用反代功能 = true //选择是否启用反代功能【总开关】，false，true，现在你可以自由的选择是否启用反代功能了
let 反代IP = 'fdip.houyitfg.asia' //反代IP或域名，反代IP端口一般情况下不用填写，如果你非要用非标反代的话，可以填'ts.hpc.tw:443'这样

let 启用SOCKS5反代 = false //如果启用此功能，原始反代将失效
let 启用SOCKS5全局反代 = false //选择是否启用SOCKS5全局反代，启用后所有访问都是S5的落地【无论你客户端选什么节点】，访问路径是客户端--CF--SOCKS5，当然启用此功能后延迟=CF+SOCKS5，带宽取决于SOCKS5的带宽，不再享受CF高速和随时满带宽的待遇
let 我的SOCKS5账号 = 'admin:admin@52.71.4.197:1080' //格式'账号:密码@地址:端口'

let 我的节点名字 = '天书11' //自己的节点名字【统一名称】
//////////////////////////////////////////////////////////////////////////流控配置////////////////////////////////////////////////////////////////////////
//控流机制通过主动控制传输速度，达到稳定性目的，弊端就是限制带宽，喜欢大带宽的关闭即可，高端玩家可自行到相关函数细调参数^_^
//重要！！！控流模式仅作者本人根据自身网络环境调试而来，不保证所有网络效果，高手可自行到相关代码区块调参，普通玩家觉得不好用的话关掉控流机制就行，也已经很好用了^_^
//由于我设置了读取超时主动断开逻辑【为了给其他请求让出资源】，特地开发了一个保活名单功能，针对一些服务类或聊天类APP可自定义保活目标，在底部有一个可以自行维护的保活域名名单
let 启动控流机制 = false; //选择是否启动控流机制，true启动，false关闭，使用控流可提升连接稳定性，适合轻度使用，日常使用应该绰绰有余
//////////////////////////////////////////////////////////////////////////网页入口////////////////////////////////////////////////////////////////////////
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
          const 订阅页面 = 给我订阅页面(哎呀呀这是我的ID啊, 访问请求.headers.get('Host'));
          return new Response(`${订阅页面}`, {
            status: 200,
            headers: { "Content-Type": "text/plain;charset=utf-8" }
          });
        }
        case `/${哎呀呀这是我的ID啊}/${转码}${转码2}`: {
          if (隐藏订阅) {
            return new Response (`${嘲讽语}`, {
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
            return new Response (`${嘲讽语}`, {
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
          return new Response('Hello World!', { status: 200 });
      }
    } else if (读取我的请求标头 === 'websocket'){
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
  解析VL标头(解密数据, WS接口); //解析VL数据并进行TCP握手
  return new Response(null, { status: 101, webSocket: 客户端 }); //一切准备就绪后，回复客户端WS连接升级成功
}
function 使用64位加解密(还原混淆字符) {
  还原混淆字符 = 还原混淆字符.replace(/-/g, '+').replace(/_/g, '/');
  const 解密数据 = atob(还原混淆字符);
  const 解密_你_个_丁咚_咙_咚呛 = Uint8Array.from(解密数据, (c) => c.charCodeAt(0));
  return 解密_你_个_丁咚_咙_咚呛.buffer;
}
//第二步，解读VL协议数据，创建TCP握手
let 访问地址, 访问端口;
async function 解析VL标头(VL数据, WS接口, TCP接口) {
  if (!私钥开关 && 验证VL的密钥(new Uint8Array(VL数据.slice(1, 17))) !== 哎呀呀这是我的VL密钥) {
    return new Response('连接验证失败', { status: 400 });
  }
  const 获取数据定位 = new Uint8Array(VL数据)[17];
  const 提取端口索引 = 18 + 获取数据定位 + 1;
  const 建立端口缓存 = VL数据.slice(提取端口索引, 提取端口索引 + 2);
  访问端口 = new DataView(建立端口缓存).getUint16(0);
  const 提取地址索引 = 提取端口索引 + 2;
  const 建立地址缓存 = new Uint8Array(VL数据.slice(提取地址索引, 提取地址索引 + 1));
  const 识别地址类型 = 建立地址缓存[0];
  let 地址长度 = 0;
  let 地址信息索引 = 提取地址索引 + 1;
  switch (识别地址类型) {
    case 1:
      地址长度 = 4;
      访问地址 = new Uint8Array( VL数据.slice(地址信息索引, 地址信息索引 + 地址长度) ).join('.');
      break;
    case 2:
      地址长度 = new Uint8Array( VL数据.slice(地址信息索引, 地址信息索引 + 1) )[0];
      地址信息索引 += 1;
      访问地址 = new TextDecoder().decode( VL数据.slice(地址信息索引, 地址信息索引 + 地址长度) );
      break;
    case 3:
      地址长度 = 16;
      const dataView = new DataView( VL数据.slice(地址信息索引, 地址信息索引 + 地址长度) );
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
async function 建立传输管道(WS接口, TCP接口, 写入初始数据, 写入队列 = Promise.resolve(), 回写队列 = Promise.resolve()) {
  let 连接开始时间 = performance.now();
  let 累计接收字节数 = 0;
  let 异常结束 = false;
  let 结束原因;
  let 已清理资源 = false;
  const 总数据阶梯延迟 = [
    { size: 1 * 1024 *1024, delay: 320 },
    { size: 50 * 1024 *1024, delay: 340 },
    { size: 100 * 1024 *1024, delay: 360 },
    { size: 200 * 1024 *1024, delay: 400 },
  ];
  function 获取当前总延迟() {
    return (总数据阶梯延迟.slice().reverse().find(({ size }) => 累计接收字节数 >= size) ?? { delay: 300 }).delay;
  }
  WS接口.accept();
  WS接口.send(new Uint8Array([0, 0]));
  const 传输数据 = TCP接口.writable.getWriter();
  const 读取数据 = TCP接口.readable.getReader();
  if (写入初始数据) 写入队列 = 写入队列.then(() => 传输数据.write(写入初始数据)).catch(); //向TCP接口推送标头中提取的初始访问数据
  WS接口.addEventListener('message', event => 写入队列 = 写入队列.then(() => 传输数据.write(event.data)).catch());
  启动回传();
  async function 启动回传() {
    let 字节计数 = 0;
    try {
      while (!已清理资源) {
        const { done: 流结束, value: 返回数据 } = await 带超时读取(读取数据);
        if (流结束) {
          await 清理资源();
          break;
        }
        if (返回数据.length > 0) {
          累计接收字节数 += 返回数据.length;
          回写队列 = 回写队列.then(() => WS接口.send(返回数据)).catch();
          if (启动控流机制 && (累计接收字节数 - 字节计数) > 4*1024*1024) {
              console.log(`稍等一会，当前接收数据: ${格式化字节(累计接收字节数)}，当前运行时间: ${格式化时间(performance.now() - 连接开始时间)}`);
              await new Promise(resolve => setTimeout(resolve, 获取当前总延迟() + 500));
              字节计数 = 累计接收字节数;
          }
        }
      }
    } catch (err) {
      异常结束 = true;
      结束原因 = err?.stack || String(err);
      await 清理资源();
    }
  }
  async function 带超时读取(读取数据, 超时 = 5000) {
    return new Promise(async (resolve, reject) => {
      const 超时设置 = setInterval(async () => {
        if (匹配地址(访问地址, 保活域名名单)) {
          console.log(`双端保活: ${访问地址}，当前传输时间: ${格式化时间(performance.now() - 连接开始时间)}`);
          写入队列 = 写入队列.then(() => 传输数据.write(new Uint8Array(0))).catch(); //实际上并没有发送任何数据，因为任何实际发送数据的行为都会被TCP目标视为非法强制断开，这个功能只是告诉CF“我还在使用”
          回写队列 = 回写队列.then(() => WS接口.send(new Uint8Array(0))).catch();
        } else if (启动控流机制) {
          clearInterval(超时设置);
          reject(new Error ('读取超时'))
        }
      }, 超时);
      await 读取数据.read()
        .then(结果 => {
          clearInterval(超时设置);
          resolve({ ...结果});
        })
        .catch(e => {
          clearInterval(超时设置);
          reject(e);
        });
    });
  }
  async function 清理资源() {
    if (已清理资源) return;
    已清理资源 = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      if (异常结束) {
        console.log(`${访问地址}因【${结束原因}】断开，总接收数据: ${格式化字节(累计接收字节数)}，总传输时间: ${格式化时间(performance.now() - 连接开始时间)}`);
      } else {
        console.log(`${访问地址}传输完毕，总接收数据: ${格式化字节(累计接收字节数)}，总传输时间: ${格式化时间(performance.now() - 连接开始时间)}`);
      }
      WS接口.close(1000);
      await TCP接口.close?.();
    } catch {};
  }
  function 格式化字节(数据字节, 保留位数 = 2) {
    const 单位 = ['B', 'KB', 'MB', 'GB', 'TB'];
    let 指数 = 0;
    let 数值 = 数据字节;
    while (数值 >= 1024 && 指数 < 单位.length - 1) {
      数值 /= 1024;
      指数++;
    }
    return `${数值.toFixed(保留位数)} ${单位[指数]}`;
  }
  function 格式化时间(毫秒数) {
    const 总毫秒 = 毫秒数;
    const 小时 = Math.floor(总毫秒 / (3600 * 1000));
    const 分钟 = Math.floor((总毫秒 % (3600 * 1000)) / (60 * 1000));
    const 秒 = Math.floor((总毫秒 % (60 * 1000)) / 1000);
    const 毫秒 = 总毫秒 % 1000;
    return `${小时.toString().padStart(2, '0')}:${分钟.toString().padStart(2, '0')}:${秒.toString().padStart(2, '0')}.${毫秒.toString().padStart(3, '0')}`;
  }
  function 匹配地址(地址, 域名名单) {
    const 是IPv4 = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/.test(地址);
    const 是IPv6 = /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9]))$/.test(地址);
    if (是IPv4 || 是IPv6) return true;
    return 域名名单.some(规则 => 匹配域名(地址, 规则));
  }
  function 匹配域名(地址, 通配规则) {
    if (通配规则.startsWith('*.')) {
      const 根域 = 通配规则.slice(2);
      return (
        地址 === 根域 || // 匹配主域
        地址.endsWith('.' + 根域) // 匹配子域
      );
    }
    return 地址 === 通配规则;
  }
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
    const 构建账号密码包 = new Uint8Array([ 1, 账号.length, ...转换数组.encode(账号), 密码.length, ...转换数组.encode(密码) ]); //构建账号密码数据包，把字符转换为字节数组
    await 传输数据.write(构建账号密码包); //发送账号密码认证信息
    const 读取账号密码认证结果 = (await 读取数据.read()).value;
    if (读取账号密码认证结果[0] !== 0x01 || 读取账号密码认证结果[1] !== 0x00) { //检查账号密码认证结果，认证失败则退出
      return 关闭接口并退出();
    }
  }
  switch (识别地址类型) {
    case 1: // IPv4
      转换访问地址 = new Uint8Array( [1, ...访问地址.split('.').map(Number)] );
      break;
    case 2: // 域名
      转换访问地址 = new Uint8Array( [3, 访问地址.length, ...转换数组.encode(访问地址)] );
      break;
    case 3: // IPv6
      转换访问地址 = new Uint8Array( [4, ...访问地址.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])] );
      break;
    default:
      return 关闭接口并退出();
  }
  const 构建转换后的访问地址 = new Uint8Array([ 5, 1, 0, ...转换访问地址, 访问端口 >> 8, 访问端口 & 0xff ]); //构建转换好的地址消息
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
我的优选.push(`${hostName}:443#备用节点`)
if (私钥开关) {
  return `请先关闭私钥功能`
}else {
  return 我的优选.map(获取优选 => {
    const [主内容,tls] = 获取优选.split("@");
    const [地址端口, 节点名字 = 我的节点名字] = 主内容.split("#");
    const 拆分地址端口 = 地址端口.split(":");
    const 端口 =拆分地址端口.length > 1 ? Number(拆分地址端口.pop()) : 443;
    const 地址 = 拆分地址端口.join(":");
    const TLS开关 = tls === 'notls' ? 'security=none' : 'security=tls';
    return `${转码}${转码2}${符号}${哎呀呀这是我的VL密钥}@${地址}:${端口}?encryption=none&${TLS开关}&sni=${hostName}&type=ws&host=${hostName}&path=%2F%3Fed%3D2560#${节点名字}`;
  }).join("\n");
}
}
function 给我小猫咪配置文件(hostName) {
我的优选.push(`${hostName}:443#备用节点`)
const 生成节点 = (我的优选) => {
  return 我的优选.map(获取优选 => {
    const [主内容,tls] = 获取优选.split("@");
    const [地址端口, 节点名字 = 我的节点名字] = 主内容.split("#");
    const 拆分地址端口 = 地址端口.split(":");
    const 端口 =拆分地址端口.length > 1 ? Number(拆分地址端口.pop()) : 443;
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
////////////////////////////////////////////////////////////////////////保活域名名单//////////////////////////////////////////////////////////////////////
const 保活域名名单 = [ // 由于大部分聊天都是通过IP进行传输，所以已经通配了所有IP类型的保活逻辑，以下是针对域名的保活
  '*.chatgpt.com',
  '*.openai.com',
  '*.apis.google.com',
  '*.mtalk.google.com',
  '*.wns.windows.com',
  '*.alive.github.com',
  // '*.googlevideo.com', // YouTube 视频内容分发域名，大流量服务

  // Firebase / FCM
  '*.firebaseio.com',
  '*.googleapis.com',
  '*.fcm.googleapis.com',
  '*.firebaseinstallations.googleapis.com',
  '*.googleusercontent.com',

  // Telegram
  '*.t.me', 't.me',
  '*.telegram.org',
  '*.telegram.me',
  '*.telegra.ph',
  '*.cdn-telegram.org', // 含图片/语音等 CDN 资源，可能中等流量

  // Twitch
  '*.twitch.tv',         // Twitch 主站，大流量直播视频
  '*.ttvnw.net',         // Twitch 视频/直播 CDN，极高流量
  '*.jtvnw.net',         // Twitch 用户视频封面等，可能中等流量
  '*.ext-twitch.tv',
  '*.api.twitch.tv',
  '*.twitchcdn.net',     // Twitch 静态资源 CDN，大流量服务

  // Discord
  '*.discord.com',
  '*.discordapp.com',
  '*.discord.media', // 包含图像/音频上传，可能中等流量
  '*.discord.gg',

  // WhatsApp
  '*.whatsapp.net',
  '*.whatsapp.com',
  'web.whatsapp.com',

  // Signal
  '*.signal.org',
  '*.whispersystems.org',

  // Facebook Messenger
  '*.facebook.com',
  '*.messenger.com',
  // '*.fbcdn.net',         // Facebook 静态资源 CDN，含图像/视频等

  // Instagram (消息和直播)
  '*.instagram.com',
  // '*.cdninstagram.com',  // Instagram 图片/视频 CDN，大流量服务

  // Twitter / X (消息与Spaces)
  '*.twitter.com',
  // '*.twimg.com',         // Twitter 图片/视频 CDN，大流量服务

  // Line
  '*.line.me',
  '*.line-scdn.net', // 部分资源为音频、图像，可能中等流量

  // WeChat 国际版 (WeChat Work/海外小程序)
  '*.wechat.com',
  '*.wechatapp.com',
  '*.wx.qq.com',

  // TikTok / Douyin (直播/短消息)
  // '*.tiktok.com',        // 主站视频播放/直播，大流量服务
  // '*.muscdn.com',        // 字节系 CDN，含视频静态资源，大流量
  '*.byteoversea.com',

  // Zoom (实时通话、会议)
  '*.zoom.us',
  '*.zoom.com',

  // Microsoft Teams / Outlook 通知
  '*.teams.microsoft.com',
  '*.skype.com',
  '*.outlook.com',
  '*.office.com',

  // Slack
  '*.slack.com',
  '*.slack-edge.com', // 含文件上传 CDN，可能中等流量

  // Apple Push / iMessage
  '*.push.apple.com',
  '*.icloud.com',
  '*.imessage.com',

  // Snapchat
  '*.snapchat.com',
  // '*.sc-cdn.net',        // Snapchat CDN 图片/视频流，大流量服务

  // Reddit Chat
  '*.reddit.com',
  // '*.redditmedia.com',   // Reddit 图像/视频 CDN，大流量服务

  // Clubhouse
  '*.clubhouseapi.com',

  // Threads
  '*.threads.net',
];