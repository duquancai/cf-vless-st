 -------------------------------------------------------------
### 一、Cloudflare部署代理脚本js源码

1. 本项目收集了一些CF部署原码并通过本人理解并精心修改重构，旨在开源以供他人所需
2. 本项目仅支持本地化CF部署，强烈建议纯手搓节点，后面有手搓节点示意图
3. 打开源码：_worker.js, _worker(1.0).js, _worker(2.0).js **部署前请认真阅读代码头部的注释"使用说明"**
 -------------------------------------------------------------
### 二、脚本特色
#### (一) 支持workers、pages、snippets部署，vless+ws+tls代理节点
#### (二) 脚本没有任何预设，也没有订阅链接，部署后纯手搓节点, 部署前请认真阅读代码头部的注释"使用说明"
#### (三) 极大的丰富了反代功能的使用
v2rayN客户端的单节点路径设置代理ip，通过代理客户端路径传递，**以下任选其一**<br>
支持IPV4、IPV6、域名三种方式（**端口为443时，可不写:port**）<br>
支持socks5或http**用户名:密码或者为空**<br>
| 代理类型 | IPv4形式 | IPv6形式 | 域名形式 |
|------|------|------|------|
| socks5全局代理 |s5all=IPv4:port|s5all=[IPv6]:port |s5all=domain:port|
| http或者https全局代理 |httpall=IPv4:port|httpall=[IPv6]:port|httpall=domain:port|
| socks5代理cf网站 |socks5=IPv4:port<br>socks5://IPv4:port|socks5=[IPv6]:port<br>socks5://[IPv6]:port|socks5=domain:port<br>socks5://domain:port|
| http或者https代理cf网站 |http=IPv4:port<br>`http://IPv4:port`|http=[IPv6]:port<br>http://[IPv6]:port|http=domain:port<br>`http://domain:port`|
| proxyip代理cf网站 |pyip=IPv4:port<br>proxyip=IPv4:port|pyip=[IPv6]:port<br>proxyip=[IPv6]:port|pyip=domain:port<br>proxyip=domain:port|
| nat64代理cf网站 | |nat64pf=[2602:fc59:b0:64::]| |
#### 注意
1. workers、pages、snippets都可以部署，纯手搓443系6个端口节点vless+ws+tls
2. snippets部署的，nat64及william的反代**域名**"不支持"
#### (四) 纯手搓示意图（以v2rayN客户端为例）
   ![这是图片](/image/手搓.png "vless")<br>
 -------------------------------------------------------------
### 三、优选IP的运用
| IPv4 | IPv6 | Domain |
|------|------|------|
|104.16.0.0 ; 104.17.0.0 ; 104.18.0.0 ; 104.19.0.0 ; 104.20.0.0 ; 104.21.0.0 ; 104.22.0.0 ; 104.24.0.0; 104.25.0.0 ; 104.26.0.0 ; 104.27.0.0; 172.66.0.0 ; 172.67.0.0; 162.159.0.0|2606:4700::0; 2803:f800:50::df53:c8fa; 2a06:98c1:50::5c:5eb2:d3b|`www.udacity.com; www.shopify.com; www.wto.org;`<br> `mfa.gov.ua`;<br> [CF优选域名](https://cf.090227.xyz/)|
1. CF官方优选80系端口：80、8080、8880、2052、2082、2086、2095
2. CF官方优选443系端口：443、2053、2083、2087、2096、8443 <br>
   如果你没有天天最高速度或者选择国家的需求，使用默认的CF官方IP或者域名即可，不必更换
3. 推荐上面优选官方IP大段或域名支持13个标准端口切换 
  -------------------------------------------------------------
### 四、客户端推荐
#### 点击名称即跳转到官方下载地址
1. 安卓Android：[v2rayNG](https://github.com/2dust/v2rayNG/tags)、[Nekobox](https://github.com/starifly/NekoBoxForAndroid/releases)、[Karing](https://github.com/KaringX/karing/tags) <br>

2. 电脑Windows：[v2rayN](https://github.com/2dust/v2rayN/tags)、[Hiddify](https://github.com/hiddify/hiddify-next/tags)、[Karing](https://github.com/KaringX/karing/tags)
-------------------------------------------------------------
### 🛠 开源代码引用
- [cmliu/edgetunnel/tree/beta2.0](https://github.com/cmliu/edgetunnel/tree/beta2.0)
-------------------------------------------------------------
## 感谢您右上角加Star🌟
[![Star History Chart](https://api.star-history.com/svg?repos=duquancai/cf-vless-st&type=Date)](https://www.star-history.com/#duquancai/cf-vless-st&Date)