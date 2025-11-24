 -------------------------------------------------------------
### 一、Cloudflare部署代理脚本js源码

1. 在大佬的基础上通过本人理解并精心修改重构，旨在开源以供他人所需
2. 仅仅支持纯手搓节点
3. 打开源码：shadowsocks.js **部署前请认真阅读代码头部的注释"使用说明"**
 -------------------------------------------------------------
### 二、脚本特色
#### (一) 支持workers、pages、snippets部署，ss+ws+tls代理节点
#### (二) 脚本没有任何预设，也没有订阅链接，部署后纯手搓节点, 部署前请认真阅读代码头部的注释"使用说明"
#### (三) 反代功能使用路径传参，程序中不预设任何反代
v2rayN客户端的单节点路径设置代理ip，通过代理客户端路径传递，**以下任选其一**<br>
支持IPV4、IPV6、域名三种方式（**端口为443时，可不写:port**）<br>
支持socks5或http**用户名:密码或者为空**<br>
| 代理类型 | IPv4形式 | IPv6形式 | 域名形式 |
|------|------|------|------|
| socks5代理全局 |s5all=IPv4:port|s5all=[IPv6]:port|s5all=domain:port|
| http或者https代理全局 |httpall=IPv4:port|httpall=[IPv6]:port|httpall=domain:port|
|proxyip代理cf网站 |pyip=IPv4:port<br>proxyip=IPv4:port|pyip=[IPv6]:port<br>proxyip=[IPv6]:port|pyip=domain:port<br>proxyip=domain:port|
#### 注意
1. PASSWORD为节点密码，v2rayN客户端的密码、路径与部署的保持一致！
2. workers、pages、snippets都可以部署，纯手搓443系6个端口节点ss+ws+tls
3. snippets部署的，william的反代**域名**"不支持"
4. SS纯手搓示意图（以v2rayN客户端为例）
   ![SS手搓图例](/image/SS手搓图例.png)
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
1. 安卓Android：[v2rayNG](https://github.com/2dust/v2rayNG/tags)<br>
2. 电脑Windows：[v2rayN](https://github.com/2dust/v2rayN/tags)
-------------------------------------------------------------
### 🛠 开源代码引用
- [eooce/Cloudflare-proxy](https://github.com/eooce/Cloudflare-proxy)
-------------------------------------------------------------
## 感谢您右上角加Star🌟
[![Star History Chart](https://api.star-history.com/svg?repos=duquancai/cf-vless-st&type=Date)](https://www.star-history.com/#duquancai/cf-vless-st&Date)