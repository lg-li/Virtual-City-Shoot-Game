#include "MessageRespond.h"

MessageRespond::MessageRespond(std::string new_type, json new_data) {
    this->storage["type"] = new_type;
    this->storage["data"] = new_data;
}

MessageRespond::~MessageRespond() { }

void MessageRespond::set_data(json new_data){
    this->storage["data"]  = {new_data};
}

void MessageRespond::set_type(std::string new_type){
    this->storage["type"]  = new_type;
}

std::string MessageRespond::to_json_str(){
    return this->storage.dump();
}
