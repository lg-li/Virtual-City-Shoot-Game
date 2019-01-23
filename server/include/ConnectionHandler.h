#ifndef __WEBSOCKET_HANDLER__
#define __WEBSOCKET_HANDLER__

#include <arpa/inet.h>
#include <iostream>
#include <map>
#include <sstream>
#include "Base64.h"
#include "SHA1.h"
#include "EventLogger.h"
#include "MessageRequest.h"
#include "GameEventService.h"
#include "JSON.hpp"
using json = nlohmann::json;

#define MAGIC_KEY "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

enum WEBSOCKET_STATUS {
	WEBSOCKET_UNCONNECT = 0,
	WEBSOCKET_HANDSHAKED = 1,
};


enum WS_FrameType
{
	WS_EMPTY_FRAME = 0xF0,
	WS_ERROR_FRAME = 0xF1,
	WS_TEXT_FRAME = 0x01,
	WS_BINARY_FRAME = 0x02,
	WS_PING_FRAME = 0x09,
	WS_PONG_FRAME = 0x0A,
	WS_OPENING_FRAME = 0xF3,
	WS_CLOSING_FRAME = 0x08
};

typedef std::map<std::string, std::string> HEADER_MAP;

class ConnectionHandler{
public:
	ConnectionHandler(int fd);
	~ConnectionHandler();
	int process();
	inline char *getbuff();
	int send_message(std::string message);
	std::string string_to_UTF8(const std::string & str);

private:
	int handshake();
	void parse_str(char *request);
	int fetch_http_info();
	const char* encode_frame(const char* , enum WS_FrameType frame_type);
	int send_data(const char *buff);

private:
	char buff_[4096];
	WEBSOCKET_STATUS status_;
	HEADER_MAP header_map;
	int fd_;
	MessageRequest *request_;
};

inline char *ConnectionHandler::getbuff(){
	return buff_;
}


#endif
