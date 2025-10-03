//////////////////////////////////////////////////////////////////////////配置区块////////////////////////////////////////////////////////////////////////
let 哎呀呀这是我的ID啊 = "123456"; //实际上这是你的订阅路径，支持任意大小写字母和数字，[域名/ID]进入订阅页面
let 哎呀呀这是我的VL密钥 = "ae15a25c-cbcc-4dd6-bb51-5a70cc1a62a8"; //建议修改为自己的规范化UUID

let 隐藏订阅 = false //选择是否隐藏订阅页面，false不隐藏，true隐藏，当然隐藏后自己也无法订阅，因为配置固定，适合自己订阅后就隐藏，防止被爬订阅，并且可以到下方添加嘲讽语^_^
let 嘲讽语 = "哎呀你找到了我，但是我就是不给你看，气不气，嘿嘿嘿" //隐藏订阅后，真实的订阅页面就会显示这段话，想写啥写啥

let 我的优选 = [
  //'ip.sb.net',
] //格式127.0.0.1:443#US@notls或[2606:4700:3030:0:4563:5696:a36f:cdc5]:2096#US，如果#US不填则使用统一名称，如果@notls不填则默认使用TLS，每行一个
let 我的优选TXT =[ //支持多TXT链接，可以汇聚各路大神的节点【格式相同的情况下】，方便节点恐慌症同学
  'https://ip.txt',
] //优选TXT路径[https://ip.txt]，表达格式与上述相同，使用TXT时脚本内部填写的节点无效，二选一

let 传输脚本地址 = '' //指向你部署的传输脚本的地址，示例：'xxx.pages.dev'
let 自定义路径 = '/?xxxx' //我的脚本已经抛弃了ed头，这个功能是给想兼容其他纯传输脚本的同学研究的，示例：'/?proxyip=111.111.111.111'
//////////////////////////////////////////////////////////////////////////网页入口////////////////////////////////////////////////////////////////////////
export default {
  async fetch(访问请求) {
    const 识别路径 = new URL(访问请求.url);
    switch (识别路径.pathname) {
      case `/${哎呀呀这是我的ID啊}`: {
        if (隐藏订阅) {
          return new Response (`${嘲讽语}`, { status: 200 });
        } else {
          const 备用节点 = `${传输脚本地址}:443#备用节点`
          if (我的优选TXT) {
            const 链接数组 = Array.isArray(我的优选TXT) ? 我的优选TXT : [我的优选TXT];
            const 响应列表 = await Promise.allSettled(
              链接数组.map(url => fetch(url).then(r => r.text()))
            );
            const 节点集合 = new Set(
              响应列表
                .flatMap(res => {
                  if (res.status === "fulfilled") {
                    return res.value
                      .split('\n')
                      .map(line => line.trim())
                      .filter(line => line);
                  } else {
                    console.warn("请求失败", res.reason);
                    return [];
                  }
                })
            );
            if (节点集合.size > 0) {
              我的优选 = [备用节点,...节点集合];
            }
          }
          const 读取UA = 访问请求.headers.get('User-Agent')
          if (读取UA.toLowerCase().includes(小猫 + 咪)) {
            const 小猫咪配置文件 = 给我小猫咪配置文件(传输脚本地址);
            return new Response(`${小猫咪配置文件}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
          } else {
            const 通用配置文件 = 给我通用配置文件(传输脚本地址);
            return new Response(`${通用配置文件}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
          }
        }
      }
      default:
        return new Response('Hello World!', { status: 200 });
    }
  }
};
//////////////////////////////////////////////////////////////////////////订阅页面////////////////////////////////////////////////////////////////////////
let 转码 = atob("dmw="), 转码2 = atob("ZXNz"), 符号 = atob("Oi8v"), 小猫 = atob("Y2xh"), 咪 = atob("c2g=");
function 给我通用配置文件(hostName) {
  return 我的优选.map(获取优选 => {
    const [主内容,tls] = 获取优选.split("@");
    const [地址端口, 节点名字] = 主内容.split("#");
    const 拆分地址端口 = 地址端口.split(":");
    const 端口 =拆分地址端口.length > 1 ? Number(拆分地址端口.pop()) : 443;
    const 地址 = 拆分地址端口.join(":");
    const TLS开关 = tls === 'notls' ? 'security=none' : 'security=tls';
    return `${转码}${转码2}${符号}${哎呀呀这是我的VL密钥}@${地址}:${端口}?encryption=none&${TLS开关}&sni=${hostName}&type=ws&host=${hostName}&path=${encodeURIComponent(`${自定义路径}`)}#${节点名字}`;
  }).join("\n");
}
function 给我小猫咪配置文件(hostName) {
  function 生成节点(节点输入列表, hostName) {
    const 节点配置列表 = [];
    const 节点名称列表 = [];
    const 负载均衡节点名称列表 = [];
    for (const 获取优选 of 节点输入列表) {
      const [主内容, tls] = 获取优选.split("@");
      const [地址端口, 节点名字] = 主内容.split("#");
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
  network: ws
  ws-opts:
    path: "${自定义路径}"
    headers:
      Host: ${hostName}`);
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
  interval: 600 #自动测试间隔
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
  interval: 600 #自动测试间隔
  tolerance: 30
  proxies:
${负载均衡组名 ? `    - ${负载均衡组名}` : ""}
${节点名称列表.join("\n")}`;
return `
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