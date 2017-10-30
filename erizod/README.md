# erizod

## 编译打包

```bash
git clone git@github.com:nareix/licode.git
cd licode

# OS X
./scripts/installMacDeps.sh
# Linux
./scripts/installUbuntuDeps.sh

./scripts/installErizo.sh -e
./scripts/installErizo.sh -a

cd erizod
go run pack.go buildnodemodules
go run pack.go pack
```

## 使用

```bash
git clone git@github.com:nareix/licode.git
cd licode/erizod

# OS X
curl http://woyao.qiniucdn.com/erizod-libdeps-darwin.tar.bz2?r=`date +%s` | tar xjf -
./bin/node demoserver.js

# Linux
curl http://woyao.qiniucdn.com/erizod-libdeps-linux.tar.bz2?r=`date +%s` | tar xjf -
LD_LIBRARY_PATH=lib ./lib/ld-linux.so ./bin/node demoserver.js
```

## demo 连通性测试

执行 demoserver.js

访问 http://localhost:8081/demo.html

## demo1 单人发布订阅测试

执行 demoserver1.js

访问 http://localhost:8081/demo1.html

## demo2 单人发布订阅测试

./bin/node demoserver2.js

访问 http://localhost:8081/demo2.html

发布流一次，订阅流两次

## room 多人房间测试

./bin/node roomserver.js

访问 http://localhost:8081/room.html

进入房间会把自己的流发布到默认房间，然后会订阅房间已经存在的流最多五个(包括自己发布的流)

暂不支持取消订阅，取消发布以及离开房间
