 -------------------------------------------------------------
### 一、Cloudflare部署代理脚本js源码

1. 本项目收集了一些CF部署原码并通过本人理解并精心修改重构，旨在开源以供他人所需
2. 本项目仅支持本地化CF部署，强烈建议纯手搓节点，后面有手搓节点示意图
3. 打开源码：_worker.js，部署前请认真阅读代码头部的注释"使用说明"
 -------------------------------------------------------------
### 二、脚本特色
1. 支持workers、pages、snippets部署，vless+ws+tls代理节点
2. 支持pages部署：vless+ws+tls代理节点
3. 极大的丰富了反代功能的使用
   （1）. 本程序预设：<br>
      UUID=ef3dcc57-6689-48e4-b3f9-2a62d88c730a（强烈建议部署时更换）<br>
    (2). v2rayN客户端的单节点路径设置代理ip，通过代理客户端路径传递<br>
      1、socks5或者http代理所有网站(即：全局代理),格式：s5all=xxx或者httpall=xxx,二者任选其一<br>
      2、socks5代理cf相关的网站，非cf相关的网站走直连,格式：socks5=xxx或者socks5://xxx<br>
      3、http代理cf相关的网站，非cf相关的网站走直连,格式：http=xxx或者http://xxx<br>
      4、proxyip代理cf相关的网站，非cf相关的网站走直连,格式：pyip=xxx或者proxyip=xxx<br>
      5、nat64代理cf相关的网站，非cf相关的网站走直连,格式：nat64pf=[2602:fc59:b0:64::]<br>
      6、如果path路径不设置留空，cf相关的网站无法访问<br>
      以上六种任选其一即可<br>
    (2). 注意：<br>
      1、workers、pages、snippets都可以部署，纯手搓443系6个端口节点vless+ws+tls<br>
      2、snippets部署的，nat64及william的proxyip域名"不支持"<br>
4. 纯手搓示意图（以v2rayN客户端为例）<br>
   ![这是图片](/image/手搓.png "vless")<br>
 -------------------------------------------------------------
### 三、优选IP的运用
1. CF官方优选80系端口：80、8080、8880、2052、2082、2086、2095
2. CF官方优选443系端口：443、2053、2083、2087、2096、8443 <br>
   如果你没有天天最高速度或者选择国家的需求，使用默认的CF官方IP或者域名即可，不必更换
3. 推荐下面是优选官方IP大段支持13个标准端口切换 
   ##### 104.16.0.0 ; 104.17.0.0 ; 104.18.0.0 ; 104.19.0.0 ; 104.20.0.0 ; 104.21.0.0 ; 104.22.0.0 ; 104.24.0.0 ; 104.25.0.0 ; 104.26.0.0 ; 104.27.0.0
   ##### 172.66.0.0 ; 172.67.0.0
   ##### 162.159.0.0
   ##### 2606:4700::0 需IPV6环境
 -------------------------------------------------------------
### 四、客户端推荐
#### 点击名称即跳转到官方下载地址
1. 安卓Android：[v2rayNG](https://github.com/2dust/v2rayNG/tags)、[Nekobox](https://github.com/starifly/NekoBoxForAndroid/releases)、[Karing](https://github.com/KaringX/karing/tags) <br>

2. 电脑Windows：[v2rayN](https://github.com/2dust/v2rayN/tags)、[Hiddify](https://github.com/hiddify/hiddify-next/tags)、[Karing](https://github.com/KaringX/karing/tags)
-------------------------------------------------------------
## 感谢您右上角加Star🌟
[![Star History Chart](https://api.star-history.com/svg?repos=duquancai/cf-vless-st&type=Date)](https://www.star-history.com/#duquancai/cf-vless-st&Date)