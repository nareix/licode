#include "CxxLogger.h"

using v8::HandleScope;
using v8::Function;
using v8::FunctionTemplate;
using v8::Local;
using v8::Value;

Nan::Persistent<Function> CxxLogger::constructor;

CxxLogger::CxxLogger() {
}

CxxLogger::~CxxLogger() {
}

NAN_METHOD(CxxLogger::New) {
    CxxLogger* obj = new CxxLogger();

    v8::String::Utf8Value name_(Nan::To<v8::String>(info[0]).ToLocalChecked());
    obj->name = std::string(*name_);
    obj->logptr = log4cxx::Logger::getLogger(obj->name.c_str());
  
    obj->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

NAN_METHOD(CxxLogger::info) {
    v8::String::Utf8Value content_(Nan::To<v8::String>(info[0]).ToLocalChecked());
    std::string content = std::string(*content_);

    CxxLogger *obj = Nan::ObjectWrap::Unwrap<CxxLogger>(info.Holder());
    log4cxx::LoggerPtr logptr = obj->logptr;

    if (logptr->isInfoEnabled()) {
        LOG4CXX_INFO(logptr, content.c_str());
    }
}

NAN_MODULE_INIT(CxxLogger::Init) {
    Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("CxxLogger").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);  

    Nan::SetPrototypeMethod(tpl, "info", info);    

    constructor.Reset(tpl->GetFunction());
    Nan::Set(target, Nan::New("CxxLogger").ToLocalChecked(), Nan::GetFunction(tpl).ToLocalChecked());
}