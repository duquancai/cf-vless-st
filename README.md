# Cloudflare-workers代理脚本【目前版本：1.0.0】
### 1、本项目仅支持本地化部署
### 2、本项目配置都为本地化编辑，不使用订阅器、订阅转换等第三方外链引用
### 3、无需担心节点订阅信息被订阅器作者或者订阅转换作者后台查看
--------------------------------
## 脚本特色：
#### 1、Workers方式：支持vless+ws+tls代理节点
-------------------------------------------------------------
##：优选IP应用

CF官方优选80系端口：80、8080、8880、2052、2082、2086、2095

CF官方优选443系端口：443、2053、2083、2087、2096、8443

如果你没有天天最高速度或者选择国家的需求，使用默认的CF官方IP或者域名即可，不必更换

推荐好记的懒人专属CF官方IP如下，支持13个标准端口切换，称之为"冲在最前的不死IP"

104.16.0.0 

104.17.0.0 

104.18.0.0 

104.19.0.0 

104.20.0.0 

104.21.0.0 

104.22.0.0 

104.24.0.0 

104.25.0.0 

104.26.0.0 

104.27.0.0 

172.66.0.0

172.67.0.0

162.159.0.0

2606:4700::0 需IPV6环境

---------------------------------

##：客户端推荐

#### 启用分片(Fragment)功能的好处：无视域名被墙TLS阻断，从而让workers等被墙的域名支持TLS节点
#### 提示：未被墙TLS阻断的自定义域名
 
目前支持该功能的平台客户端如下（点击名称即跳转到官方下载地址）

1、安卓Android：[v2rayNG](https://github.com/2dust/v2rayNG/tags)、[Nekobox](https://github.com/starifly/NekoBoxForAndroid/releases)、[Karing](https://github.com/KaringX/karing/tags)、v2box

2、电脑Windows：[v2rayN](https://github.com/2dust/v2rayN/tags)、[Hiddify](https://github.com/hiddify/hiddify-next/tags)、[Karing](https://github.com/KaringX/karing/tags)