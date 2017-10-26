# erizod

## 环境搭建

```bash
git clone git@github.com:nareix/licode.git
cd licode/erizod

# OS X
curl http://woyao.qiniucdn.com/erizod-bundle-mac.tar | tar xf -
./bin/node demoserver.js

# Linux
curl http://woyao.qiniucdn.com/erizod-linux64-bundle.tar | tar xf -
LD_LIBRARY_PATH=lib ./bin/node demoserver.js
```

## demo 连通性测试

```
./bin/node demoserver.js
```

访问 http://localhost:8081/demo.html

## demo1 单人发布订阅测试

```
./bin/node demoserver1.js
```

访问 http://localhost:8081/demo1.html

如果提示缺少log4js库，请先安装 npm install --save log4js@1.0.1
