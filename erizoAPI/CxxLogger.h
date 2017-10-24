#ifndef ERIZOAPI_CXXLOGGER_H_
#define ERIZOAPI_CXXLOGGER_H_

#include <nan.h>
#include "logger.h"

class CxxLogger : public Nan::ObjectWrap {
public:
    static NAN_MODULE_INIT(Init);    
    static NAN_METHOD(New);
    static NAN_METHOD(info);
    static Nan::Persistent<v8::Function> constructor;
    
    std::string name; 
    log4cxx::LoggerPtr logptr;
    
private:
    CxxLogger();
    ~CxxLogger();

};

#endif
