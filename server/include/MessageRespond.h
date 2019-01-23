#ifndef __MessageRespond__
#define __MessageRespond__
#include <string>

#include "JSON.hpp"

using json = nlohmann::json;

class MessageRespond {
public:
	MessageRespond(std::string new_type, json new_data);
	~MessageRespond();
	void set_type (std::string new_type);
	void set_data(json new_data);
	std::string to_json_str();

private:
    json storage;
};

#endif
