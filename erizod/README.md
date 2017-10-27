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

## 直接使用

```bash
git clone git@github.com:nareix/licode.git
cd licode/erizod

# OS X
curl http://woyao.qiniucdn.com/erizod-libdeps-darwin.tar | tar xf -
./bin/node demoserver.js

# Linux
curl http://woyao.qiniucdn.com/erizod-libdeps-linux.tar | tar xf -
LD_LIBRARY_PATH=lib ./bin/node demoserver.js
```

## demo 连通性测试

执行 demoserver.js

访问 http://localhost:8081/demo.html

## demo1 单人发布订阅测试

执行 demoserver1.js

访问 http://localhost:8081/demo1.html

如果提示缺少log4js库，请先安装 npm install --save log4js@1.0.1