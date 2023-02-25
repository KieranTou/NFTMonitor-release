# NFTMonitor-release
### 项目简介
实时监测链上NFT交易，保存其NFT相关信息用作可视化与数据分析。项目部署在阿里云服务器，mysql、redis同样使用远程连接。
### 文件目录
- .env
项目常用URL、key配置文件 通过`require("dotenv").config({ path: ".env" });`导入
- master.js `主进程文件`
设置定时器通过`ethers.js`判断是否有新区块被打包上链 每当监测到有新块上链 将块中交易哈希进行划分 每部分都单独通过`child_process`多进程模块分配给子进程进行处理 同时将区块时间戳也作为参数传递给子进程
- contract.js `合约信息文件`
将NFT合约地址作为参数 通过`axios`向etherscan调用API请求 获取合约信息 将简单信息存入数据库合约表 将合约源代码写入本地文件
> 本想体验下文件服务器 没用上 不过倒是用了公司NAS 感觉还挺方便
- database.js `数据库文件`
配置了`mysql`和`redis`连接 定义了信息插入交易表、合约表的方法 这里已提前将signature database的黑名单导入到redis中 具体可见(实习期间小工具之爬取信息至redis)[https://github.com/KieranTou/NFTMonitor/tree/main/4RedisAdd] 作用是在进行获取合约信息前 判断该交易是否调用NFT常用方法 排除一些非NFT交易 这里的redis使用`list`数据类型 因为爬取过程中发现有数据冗余 多个`text signature`可能对应同一个`byte signature`
- process.js `子进程处理文件`
每个子进程处理被分配部分的交易哈希列表 获取其`receipt.logs` 通过事件判断该交易是否为Mint NFT的交易 判断为真则继续进行处理并保存
### 闲谈
> 满打满算开发了20天左右 时间紧注释也没写好 是我实习期间做的第一个项目 最后也是拿到北京的offer(但不打算去 继续备战春招！) 这也是我第一次接触JS语言及其相关技术 感觉...没啥意思 但也是与链交互很难跨过的一环 实习期间也没人带我 整个项目都是我一个人在做 也没机会练一下git协作 唉 从零基础到开发完整个项目 确实学到了很多东西 但总感觉做的东西和我想要的不一样 （我还是有技术改变世界的梦想的 可惜这个公司感觉整体氛围都是来web3世界捞波块钱的感觉 所以也拒了高薪offer 即便将要失业也并不后悔 哈哈哈哈）
> 希望下一段工作是充满意义的 加油 继续被算法和八股折磨吧