import { connect } from 'cloudflare:sockets';
//说明：抛弃了ed配置，不要设置/?ed=2560，重构全部传输逻辑，去除订阅功能，自己手戳节点，支持基础反代路径传参/proxyip=，建议pages部署
let 哎呀呀这是我的VL密钥 = "ae15a25c-cbcc-4dd6-bb51-5a70cc1a62a8"; //建议修改为自己的规范化UUID

let 启用反代功能 = true //选择是否启用反代功能【总开关】，false，true，现在你可以自由的选择是否启用反代功能了
let 反代IP = '' //反代IP或域名，反代IP端口一般情况下不用填写，如果你非要用非标反代的话，可以填'ts.hpc.tw:443'这样

let 启用NAT64反代 = false //NAT64如果启用，优先级高于S5反代和原始反代，NAT64只支持ipv4，启用则需禁用doh查询ipv6功能
let 启用NAT64全局反代 = false //选择是否启用全局NAT64功能，原理带宽与S5类似，受限于NAT64的速度
let 我的NAT64地址 = '[2602:fc59:b0:64::]' //NAT64地址，支持带端口，示例[2602:fc59:b0:64::]:443

let 启用SOCKS5反代 = false //如果启用此功能，原始反代将失效，很多S5不一定支持ipv6，启用则需禁用doh查询ipv6功能
let 启用SOCKS5全局反代 = false //选择是否启用SOCKS5全局反代，启用后所有访问都是S5的落地【无论你客户端选什么节点】，访问路径是客户端--CF--SOCKS5，当然启用此功能后延迟=CF+SOCKS5，带宽取决于SOCKS5的带宽，不再享受CF高速和随时满带宽的待遇
let 我的SOCKS5账号 = [
  '12345678:12345678@8.210.145.212:1080',
] //格式'账号:密码@地址:端口'，示例admin:admin@127.0.0.1:443或admin:admin@[IPV6]:443，支持无账号密码示例@127.0.0.1:443
//////////////////////////////////////////////////////////////////////////DOH配置/////////////////////////////////////////////////////////////////////////
let 启用DOH查询转换 = false //关闭则是原始模式
let 优先查询IPV6 = false //启用则优先查询并使用IPV6连接，大多反代可能不支持IPV6，建议关闭此功能
let 严格TTL缓存 = true //新增了脚本本地缓存，可以维持几分钟甚至几小时左右，如果启用则严格按照TTL时间进行缓存，关闭可减少频繁查询的次数，提升速度，个人视使用环境选择
let DOH服务器列表 = [ //DOH地址，基本上已经涵盖市面上所有通用地址了，一般无需修改
  // 国际通用
  //"https://1.1.1.1/dns-query",                // Cloudflare IP
  //"https://cloudflare-dns.com/dns-query",     // Cloudflare 主域名
  "https://dns.google/resolve",               // Google 公共 DNS
  //"https://dns.adguard.com/resolve",          // AdGuard 去广告 DNS

  // 国际新增推荐
  //"https://dns.nextdns.io/resolve",           // NextDNS

  // 国内兼容
  //"https://dns.alidns.com/resolve",           // 阿里公共 DNS（223.5.5.5）
  //"https://doh.pub/dns-query",                // 腾讯公共 DNS（119.29.29.29）
];
//////////////////////////////////////////////////////////////////////////流控配置////////////////////////////////////////////////////////////////////////
let 启动控流机制 = false //true启动，false关闭，使用控流可降低CPU超时的概率，提升连接稳定性，适合轻度使用，日常使用应该绰绰有余
let 传输控流大小 = 64; //单位字节，相当于分片大小
//////////////////////////////////////////////////////////////////////////主要架构////////////////////////////////////////////////////////////////////////
export default {
  async fetch(访问请求) {
    if (访问请求.headers.get('Upgrade') === 'websocket'){
      const 读取路径 = 访问请求.url.replace(/^https?:\/\/[^/]+/, '');
      反代IP = 读取路径.match(/proxyip=([^&]+)/)?.[1] || 反代IP;
      const [客户端, WS接口] = Object.values(new WebSocketPair());
      WS接口.accept();
      WS接口.send(new Uint8Array([0, 0]));
      启动传输管道(WS接口);
      return new Response(null, { status: 101, webSocket: 客户端 }); //一切准备就绪后，回复客户端WS连接升级成功
    } else {
      return new Response('Hello World!', { status: 200 });
    }
  }
};
async function 启动传输管道(WS接口) {
  let 识别地址类型, 访问地址, 地址长度, TCP接口, 首包数据 = false, 首包处理完成 = null, 传输数据, 读取数据, 传输队列 = Promise.resolve(), 开始传输时间 = performance.now();
  try {
    WS接口.addEventListener('message', async event => {
      if (!首包数据) {
        首包数据 = true;
        首包处理完成 = 解析首包数据(event.data);
        传输队列 = 传输队列.then(() => 首包处理完成).catch();
      } else {
        await 首包处理完成;
        传输队列 = 传输队列.then(async () => await 传输数据.write(event.data)).catch();
      }
    });
    async function 解析首包数据(首包数据) {
      const 二进制数据 = new Uint8Array(首包数据);
      const 验证VL的密钥 = (a, i = 0) => [...a.slice(i, i + 16)].map(b => b.toString(16).padStart(2, '0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
      if (验证VL的密钥(二进制数据.slice(1, 17)) !== 哎呀呀这是我的VL密钥) throw new Error('UUID验证失败');
      const 提取端口索引 = 18 + 二进制数据[17] + 1;
      const 访问端口 = new DataView(二进制数据.buffer, 提取端口索引, 2).getUint16(0);
      if (访问端口 === 53) { //这个处理是应对某些客户端优先强制查询dns的情况，通过加密通道udp over tcp的
        const 提取DNS查询报文 = 二进制数据.slice(提取端口索引 + 9);
        const 查询DOH结果 = await fetch('https://dns.google/dns-query', { //不是所有doh都支持二进制查询，默认的是最快的地址，想更换可以换成"https://dns.google/dns-query"
          method: 'POST',
          headers: {
            'content-type': 'application/dns-message',
          },
          body: 提取DNS查询报文
        })
        const 提取DOH结果 = await 查询DOH结果.arrayBuffer();
        const 构建长度头部 = new Uint8Array([(提取DOH结果.byteLength >> 8) & 0xff, 提取DOH结果.byteLength & 0xff]);
        WS接口.send(await new Blob([构建长度头部, 提取DOH结果]));
        return;
      }
      const 提取地址索引 = 提取端口索引 + 2;
      识别地址类型 = 二进制数据[提取地址索引];
      let 地址信息索引 = 提取地址索引 + 1;
      switch (识别地址类型) {
        case 1:
          地址长度 = 4;
          访问地址 = 二进制数据.slice(地址信息索引, 地址信息索引 + 地址长度).join('.');
          break;
        case 2:
          地址长度 = 二进制数据[地址信息索引];
          地址信息索引 += 1;
          const 访问域名 = new TextDecoder().decode(二进制数据.slice(地址信息索引, 地址信息索引 + 地址长度));
          if (启用DOH查询转换) {
            访问地址 = await 查询最快IP(访问域名);
            const 匹配结果 = 匹配地址(访问地址);
            if (匹配结果.类型 === 'ipv6') 识别地址类型 = 3;
            if (匹配结果.类型 === 'ipv4') 识别地址类型 = 1;
          } else {
            访问地址 = 访问域名;
          }
          break;
        case 3:
          地址长度 = 16;
          const ipv6 = [];
          const 读取IPV6地址 = new DataView(二进制数据.buffer, 地址信息索引, 16);
          for (let i = 0; i < 8; i++) ipv6.push(读取IPV6地址.getUint16(i * 2).toString(16));
          访问地址 = ipv6.join(':');
          break;
        default:
          throw new Error ('无效的访问地址');
      }
      if (启用反代功能 && 启用NAT64反代 && 启用NAT64全局反代 && 识别地址类型 === 1) {
        const [NAT64地址, NAT64端口] = 解析地址端口(我的NAT64地址);
        const 转换NAT64地址 = NAT64地址.slice(1, -1)
        const 拼接NAT64地址 = `[${转换NAT64地址}${访问地址.split('.').map(n=>(+n).toString(16).padStart(2,'0')).join('').replace(/(.{4})/, '$1:')}]`;
        TCP接口 = connect({ hostname: 拼接NAT64地址, port: NAT64端口 });
      } else {
        if (启用反代功能 && 启用SOCKS5反代 && 启用SOCKS5全局反代) {
          TCP接口 = await 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口);
        } else {
          try {
            if (识别地址类型 === 3) {
              const 转换IPV6地址 = `[${访问地址}]`
              TCP接口 = connect({ hostname: 转换IPV6地址, port: 访问端口 });
            } else {
              TCP接口 = connect({ hostname: 访问地址, port: 访问端口 });
            }
            await TCP接口.opened;
          } catch {
            if (启用反代功能) {
              if (启用NAT64反代 && 识别地址类型 === 1) {
                const [NAT64地址, NAT64端口] = 解析地址端口(我的NAT64地址);
                const 转换NAT64地址 = NAT64地址.slice(1, -1)
                const 拼接NAT64地址 = `[${转换NAT64地址}${访问地址.split('.').map(n=>(+n).toString(16).padStart(2,'0')).join('').replace(/(.{4})/, '$1:')}]`;
                TCP接口 = connect({ hostname: 拼接NAT64地址, port: NAT64端口 });
              } else if (启用SOCKS5反代) {
                TCP接口 = await 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口);
              } else {
                let [反代IP地址, 反代IP端口] = 解析地址端口(反代IP);
                TCP接口 = connect({ hostname: 反代IP地址, port: 反代IP端口});
              }
            }
          }
        }
      }
      await TCP接口.opened;
      传输数据 = TCP接口.writable.getWriter();
      读取数据 = TCP接口.readable.getReader();
      const 写入初始数据 = 二进制数据.slice(地址信息索引 + 地址长度)
      if(写入初始数据) await 传输数据.write(写入初始数据);
      启动回传管道();
    }
    async function 启动回传管道() {
      while (true) {
        const { done: 流结束, value: 返回数据 } = await 读取数据.read();
        if (返回数据 && 返回数据.length > 0) {
          if (启动控流机制) {
            let 分段初值 = 0
            let 分段大小 = 传输控流大小;
            while (分段初值 < 返回数据.length) {
              const 数据块 = 返回数据.slice(分段初值, 分段初值 + 分段大小);
              传输队列 = 传输队列.then(() => WS接口.send(数据块)).catch();
              分段初值 += 分段大小;
            }
          } else {
            传输队列 = 传输队列.then(() => WS接口.send(返回数据)).catch();
          }
        }
        if (流结束) break;
      }
    }
  } catch (e) {
    return new Response(`连接握手失败: ${e}`, { status: 500 });
  }
}
function 匹配地址(地址) {
  const 是IPv4 = /^(?:(?:1\d{2}|2[0-1]\d|22[0-3]|[1-9]?\d)(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){3})$/.test(地址);
  const 是IPv6 = /^(?!::(?:1)?$)(?!fe80:)(?!fc00:)(?!fd00:)(?!::ffff:)(?:[0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}|^(?!::(?:1)?$)(?!fe80:)(?!fc00:)(?!fd00:)(?!::ffff:)(?:(?:[0-9a-fA-F]{1,4}:){1,6}:|::)(?:[0-9a-fA-F]{1,4}:?){0,6}[0-9a-fA-F]{1,4}$/;
  return {
    是IP: 是IPv4 || 是IPv6,
    类型: 是IPv4 ? "ipv4" : 是IPv6 ? "ipv6" : null
  };
}
globalThis.DNS缓存记录 = globalThis.DNS缓存记录 ??= new Map();
async function 查询最快IP(访问域名) {
  let 获取dns结果, 获取dnsTTL, DOH结果;
  let 读取缓存时间 = DNS缓存记录.get('缓存保活');
  if (!读取缓存时间) DNS缓存记录.set('缓存保活', { 缓存时间: Date.now() });
  const 进程控制器 = [];
  const 开始查询时间 = Date.now();
  let 查询DNS缓存记录 = DNS缓存记录.get(访问域名);
  if (查询DNS缓存记录 && (!严格TTL缓存 || 开始查询时间 < 查询DNS缓存记录.TTL过期时间)) {
    return 查询DNS缓存记录.IP;
  }
  const 构造所有请求 = (type) => {
    const 请求列表 = [];
    const 构造DOH请求 = (type) => 
      DOH服务器列表.map(DOH => {
        const 取消控制器 = new AbortController();
        进程控制器.push(取消控制器);
        return fetch(`${DOH}?name=${访问域名}&type=${type}`, {
          method: 'POST',
          headers: { 'Accept': 'application/dns-json' },
          signal: 取消控制器.signal
        }).then(res => res.json())
          .then(json => {
            const 查询结果 = json.Answer?.filter(r => r.type === (type === 'A' ? 1 : 28)).pop();
            if (查询结果?.data) {
              return [查询结果.data, 查询结果.TTL ?? 120, DOH];
            }
            return Promise.reject(`无 ${type} 记录`);
          })
          .catch(err => Promise.reject(`${DOH} ${type} 请求失败: ${err}`));
      });
    请求列表.push(...构造DOH请求(type));
    return 请求列表;
  };
  try {
    if (优先查询IPV6) {
      try {
        [获取dns结果, 获取dnsTTL, DOH结果] = await Promise.any(构造所有请求('AAAA'));
        const 匹配结果 = 匹配地址(获取dns结果);
        if (匹配结果.类型 !== 'ipv6') throw new Error ('获取ipv6地址失败，尝试获取ipv4地址')
      } catch {
        [获取dns结果, 获取dnsTTL, DOH结果] = await Promise.any(构造所有请求('A'));
      }
    } else {
      [获取dns结果, 获取dnsTTL, DOH结果] = await Promise.any(构造所有请求('A'));
    }
    const 匹配结果 = 匹配地址(获取dns结果);
    if (!匹配结果.是IP) throw new Error ('获取IP地址失败')
    return 获取dns结果;
  } catch {
    return 访问域名;
  } finally {
    try { 进程控制器.forEach(取消控制器 => 取消控制器.abort()) } catch {};
    const 匹配结果 = 匹配地址(获取dns结果);
    if (匹配结果.是IP && 获取dnsTTL) {
      const 更新时间 = new Date(开始查询时间 + 8 * 60 * 60 * 1000)
      .toLocaleString('zh-CN', { hour12: false })
      .replace(/\//g, '-');
      const TTL过期时间 = 开始查询时间 + 获取dnsTTL * 1000;
      DNS缓存记录.set(访问域名, {
        域名: 访问域名,
        IP: 获取dns结果,
        更新时间: 更新时间,
        TTL: 获取dnsTTL,
        TTL更新时间: 开始查询时间,
        TTL过期时间: TTL过期时间,
        缓存时间: Date.now()
      });
    }
  }
}
//////////////////////////////////////////////////////////////////////////SOCKS5部分//////////////////////////////////////////////////////////////////////
async function 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口, 转换访问地址, 传输数据, 读取数据) {
  let SOCKS5接口, 账号, 密码, 地址, 端口;
  let 索引SOCKS5账号 = 0;
  我的SOCKS5账号 = Array.isArray(我的SOCKS5账号) ? 我的SOCKS5账号 : [我的SOCKS5账号];
  while (索引SOCKS5账号 < 我的SOCKS5账号.length) {
    const 提取SOCKS5账号 = 我的SOCKS5账号[索引SOCKS5账号]
    try {
      ({ 账号, 密码, 地址, 端口 } = await 获取SOCKS5账号(提取SOCKS5账号));
      SOCKS5接口 = connect({ hostname: 地址, port: 端口 });
      await SOCKS5接口.opened;
      传输数据 = SOCKS5接口.writable.getWriter();
      读取数据 = SOCKS5接口.readable.getReader();
      const 转换数组 = new TextEncoder(); //把文本内容转换为字节数组，如账号，密码，域名，方便与S5建立连接
      const 构建S5认证 = new Uint8Array([5, 2, 0, 2]); //构建认证信息,支持无认证和用户名/密码认证
      await 传输数据.write(构建S5认证); //发送认证信息，确认目标是否需要用户名密码认证
      const 读取认证要求 = (await 读取数据.read()).value;
      if (读取认证要求[1] === 0x02) { //检查是否需要用户名/密码认证
        if (!账号 || !密码) {
          throw new Error (`未配置账号密码`);
        }
        const 构建账号密码包 = new Uint8Array([ 1, 账号.length, ...转换数组.encode(账号), 密码.length, ...转换数组.encode(密码) ]); //构建账号密码数据包，把字符转换为字节数组
        await 传输数据.write(构建账号密码包); //发送账号密码认证信息
        const 读取账号密码认证结果 = (await 读取数据.read()).value;
        if (读取账号密码认证结果[0] !== 0x01 || 读取账号密码认证结果[1] !== 0x00) { //检查账号密码认证结果，认证失败则退出
          throw new Error (`账号密码错误`);
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
          转换访问地址 = 转换为Socks5IPv6地址(访问地址);
          function 转换为Socks5IPv6地址(原始地址) {
            const 去括号地址 = 原始地址.startsWith('[') && 原始地址.endsWith(']')
              ? 原始地址.slice(1, -1)
              : 原始地址;
            const 分段 = 去括号地址.split('::');
            const 前缀 = 分段[0] ? 分段[0].split(':').filter(Boolean) : [];
            const 后缀 = 分段[1] ? 分段[1].split(':').filter(Boolean) : [];
            const 填充数量 = 8 - (前缀.length + 后缀.length);
            if (填充数量 < 0) throw new Error('IPv6地址格式错误');
            const 完整分段 = [...前缀, ...Array(填充数量).fill('0'), ...后缀];
            const IPv6字节 = 完整分段.flatMap(字段 => {
              const 数值 = parseInt(字段 || '0', 16);
              return [(数值 >> 8) & 0xff, 数值 & 0xff];
            });
            return new Uint8Array([0x04, ...IPv6字节]);
          }
          break;
      }
      const 构建转换后的访问地址 = new Uint8Array([ 5, 1, 0, ...转换访问地址, 访问端口 >> 8, 访问端口 & 0xff ]); //构建转换好的地址消息
      await 传输数据.write(构建转换后的访问地址); //发送转换后的地址
      const 检查返回响应 = (await 读取数据.read()).value;
      if (检查返回响应[0] !== 0x05 || 检查返回响应[1] !== 0x00) {
        throw new Error (`目标地址连接失败，访问地址: ${访问地址}，地址类型: ${识别地址类型}`);
      }
      传输数据.releaseLock();
      读取数据.releaseLock();
      return SOCKS5接口;
    } catch {
      索引SOCKS5账号++
    };
  }
  传输数据?.releaseLock();
  读取数据?.releaseLock();
  await SOCKS5接口?.close();
  throw new Error (`所有SOCKS5账号失效`);
}
async function 获取SOCKS5账号(SOCKS5) {
  const 分隔账号 = SOCKS5.includes("@") ? SOCKS5.lastIndexOf("@") : -1;
  const 账号段 = SOCKS5.slice(0, 分隔账号);
  const 地址段 = 分隔账号 !== -1 ? SOCKS5.slice(分隔账号 + 1) : SOCKS5;
  const [账号, 密码] = [账号段.slice(0, 账号段.lastIndexOf(":")), 账号段.slice(账号段.lastIndexOf(":") + 1)];
  const [地址, 端口] = 解析地址端口(地址段);
  return { 账号, 密码, 地址, 端口 };
}
function 解析地址端口(地址段) {
  let 地址, IPV6地址, 端口;
  if (地址段.startsWith('[')) {
    [IPV6地址, 端口 = 443] = 地址段.slice(1, -1).split(']:');
    地址 = `[${IPV6地址}]`
  } else {
    [地址, 端口 = 443] = 地址段.split(':')
  }
  return [地址, 端口];
}
function 格式化时间(毫秒数) {
  const 总毫秒 = 毫秒数;
  const 小时 = Math.floor(总毫秒 / (3600 * 1000));
  const 分钟 = Math.floor((总毫秒 % (3600 * 1000)) / (60 * 1000));
  const 秒 = Math.floor((总毫秒 % (60 * 1000)) / 1000);
  const 毫秒 = 总毫秒 % 1000;
  return `${小时.toString().padStart(2, '0')}:${分钟.toString().padStart(2, '0')}:${秒.toString().padStart(2, '0')}.${毫秒.toString().padStart(3, '0')}`;
}