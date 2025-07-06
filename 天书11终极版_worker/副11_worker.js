const 哎呀呀这是我的ID啊 = "123456"; //与主worker的ID需保持一致
import { connect } from 'cloudflare:sockets';
export default {
  async fetch(访问请求) {
    const 验证安全密钥 = 访问请求.headers.get('safe-key');
    if (验证安全密钥 === 哎呀呀这是我的ID啊) {
      const 启用反代功能String = 访问请求.headers.get('proxyip-open');
      启用反代功能 = 启用反代功能String === 'true';
      const 启用SOCKS5反代String = 访问请求.headers.get('socks5-open');
      启用SOCKS5反代 = 启用SOCKS5反代String === 'true';
      const 启用SOCKS5全局反代String = 访问请求.headers.get('socks5-global');
      启用SOCKS5全局反代 = 启用SOCKS5全局反代String === 'true';
      反代IP = 访问请求.headers.get('proxyip');
      我的SOCKS5账号 = 访问请求.headers.get('socks5');
      const 启动控流机制String = 访问请求.headers.get('kongliu-open');
      启动控流机制 = 启动控流机制String === 'true';
      return await 升级WS请求(访问请求);
    } else {
    return new Response('Forbidden', { status: 403 });
    }
  }
};
let 启用反代功能, 反代IP, 启用SOCKS5反代, 启用SOCKS5全局反代, 我的SOCKS5账号, 启动控流机制;
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
let 访问地址, 访问端口;
async function 解析VL标头(VL数据, WS接口, TCP接口) {
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
//第三步，创建客户端WS-CF-目标的传输通道并监听状态
async function 建立传输管道(WS接口, TCP接口, 写入初始数据, 写入队列 = Promise.resolve(), 回写队列 = Promise.resolve()) {
  let 累计接收字节数 = 0;
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
        const { done: 流结束, value: 返回数据 } = await 读取数据.read();
        if (流结束) {
          await 清理资源();
          break;
        }
        if (返回数据.length > 0) {
          累计接收字节数 += 返回数据.length;
          回写队列 = 回写队列.then(() => WS接口.send(返回数据)).catch();
          if (启动控流机制 && (累计接收字节数 - 字节计数) > 4*1024*1024) {
            await new Promise(resolve => setTimeout(resolve, 获取当前总延迟() + 500));
            字节计数 = 累计接收字节数;
          }
        }
      }
    } catch (err) {
      await 清理资源();
    }
  }
  async function 清理资源() {
    if (已清理资源) return;
    已清理资源 = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      WS接口.close(1000);
      await TCP接口.close?.();
    } catch {};
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