# Virtual City Shoot Game
此为一基于C++和JavaScript的城市沙盘多人网络实时第一人称射击游戏。

## 服务端 ##
本游戏服务端使用 C++ 编写，其需运行于 Linux 系统上。后端根据 WebSocket 协议使用 Linux Socket 编程对其进行实现，以达成与客户端通信之目的。


## 客户端 ##

客户端主要使用 JavaScript 的 3D 绘图引擎 THREE.JS 实现 （运行于浏览器），并通过 WebSocket 同后端服务器通信。

囿于跨域通信之限，前端需置于服务器容器间执行，直接使用 file:/// 打开其恐将不可与后端相接。

## 控制方式 ##

**键鼠控制**

使用方向键控制人物位置移动，使用鼠标控制视角，空格键跳跃，鼠标左键设计。

**触摸控制**

显示与页面右侧的虚拟摇杆可用于触摸控制任务方向移动，滑动场景任意部位可控制视角。

## 运行 ##

正确配置端口，使前后端同时启动，即可在浏览器中得到如下画面。

![运行效果](https://github.com/Cheelem/VirtualCityShoot/blob/master/images/cityShoot.jpg?raw=true)

由于时间限制，所有其他游戏玩家均以一正方体代替呈现（玩家不可见自身的正方体）。

被击中的生命值消耗根据其它玩家射击的准确度计算，越靠近玩家人物的几何中心，生命值消耗越大。

玩家人物生命值被其他玩家射击殆尽游戏即结束（如下图）。

![游戏结束结算](https://github.com/Cheelem/VirtualCityShoot/blob/master/images/cityShootDead.jpg?raw=true)

## 开源协定 ##

本项目于众多开源项目之基础之上构建，其亦悉遵循 [MIT](http://opensource.org/licenses/MIT) 协定之内容。
