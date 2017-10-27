# erizod

## 环境搭建

git clone git@github.com:nareix/licode.git

cd licode/erizod

wget http://woyao.qiniucdn.com/erizod-bundle-mac.tar

tar xf erizod-bundle-mac.tar

## demo 连通性测试

./bin/node demoserver.js

访问 http://localhost:8081/demo.html

## demo1 单人发布订阅测试

./bin/node demoserver1.js

访问 http://localhost:8081/demo1.html

如果提示缺少log4js库，请先安装 npm install --save log4js@1.0.1


## demo2 单人发布订阅测试

./bin/node demoserver2.js

访问 http://localhost:8081/demo2.html

发布流一次，订阅流两次

## room 多人房间测试

./bin/node roomserver.js

访问 http://localhost:8081/room.html

进入房间会把自己的流发布到默认房间，然后会订阅房间已经存在的流最多五个(包括自己发布的流)

暂不支持取消订阅，取消发布以及离开房间