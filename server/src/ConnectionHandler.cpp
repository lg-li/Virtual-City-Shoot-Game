#include <unistd.h>
#include <exception>
#include <iostream>
#include <signal.h>
#include <locale>
#include "ConnectionHandler.h"
#include "EventLogger.h"

ConnectionHandler::ConnectionHandler(int fd):
    buff_(),
    status_(WEBSOCKET_UNCONNECT),
    header_map(),
    fd_(fd),
    request_(new MessageRequest)
{
}

ConnectionHandler::~ConnectionHandler()
{
}

int ConnectionHandler::process()
{
    if(status_ == WEBSOCKET_UNCONNECT)
    {
        return handshake();
    }
    request_->fetch_websocket_info(buff_);
    std::cout<<"[REQUEST] "<<request_->get_payload();
    try
    {
        // Process request
        json received_message = json::parse((std::string)request_->get_payload());
        // Handle
        GameEventService::get_shared_game_event_service()->handle(this->fd_, received_message);
    }
    catch(...)
    {
        DEBUG_LOG("FAILED TO PARSE:%s",request_->get_payload());
    }
    // Print info of request
    request_->print();

    memset(buff_, 0, sizeof(buff_));

    return 0;
}

int ConnectionHandler::handshake()
{
    char request[1024] = {};
    status_ = WEBSOCKET_HANDSHAKED;
    fetch_http_info();
    parse_str(request);
    memset(buff_, 0, sizeof(buff_));
    return send_data(request);
}

// Parse String
void ConnectionHandler::parse_str(char *request)
{
    strcat(request, "HTTP/1.1 101 Switching Protocols\r\n");
    strcat(request, "Connection: upgrade\r\n");
    strcat(request, "Sec-WebSocket-Accept: ");
    std::string server_key = header_map["Sec-WebSocket-Key"];
    server_key += MAGIC_KEY;

    SHA1 sha;
    unsigned int message_digest[5];
    sha.Reset();
    sha << server_key.c_str();

    sha.Result(message_digest);
    for (int i = 0; i < 5; i++)
    {
        message_digest[i] = htonl(message_digest[i]);
    }
    server_key = base64_encode(reinterpret_cast<const unsigned char*>(message_digest),20);
    server_key += "\r\n";
    strcat(request, server_key.c_str());
    strcat(request, "Upgrade: websocket\r\n\r\n");
}

int ConnectionHandler::fetch_http_info()
{
    std::istringstream s(buff_);
    std::string request;

    std::getline(s, request);
    if (request[request.size()-1] == '\r')
    {
        request.erase(request.end()-1);
    }
    else
    {
        return -1;
    }

    std::string header;
    std::string::size_type end;

    while (std::getline(s, header) && header != "\r")
    {
        if (header[header.size()-1] != '\r')
        {
            continue; //end
        }
        else
        {
            header.erase(header.end()-1);	//remove last char
        }
        end = header.find(": ",0);
        if (end != std::string::npos)
        {
            std::string key = header.substr(0,end);
            std::string value = header.substr(end+2);
            header_map[key] = value;
        }
    }
    return 0;
}

// write data to client
int ConnectionHandler::send_data(const char *buff)
{
    signal(SIGPIPE, SIG_IGN);
    DEBUG_LOG("[WRITE] sending to %d, content: %s \n",fd_, buff);
    int send_result = write(fd_, buff, strlen(buff));
    DEBUG_LOG("[WRITE RES] result = %d", send_result);
    return send_result;
}

int ConnectionHandler::send_message(std::string message)
{
    const char* frame_content = encode_frame(message.c_str(), WS_FrameType::WS_TEXT_FRAME);
    int send_result = write(fd_, frame_content, strlen(frame_content));
    delete frame_content;
    return send_result;
}

// Generate WS frame according to the WS protocol
const char* ConnectionHandler::encode_frame(const char* input_message, enum WS_FrameType frameType)
{
    // int ret = WS_EMPTY_FRAME;
    const uint32_t messageLength = strlen(input_message);
    // header: 2字节, mask位设置为0(不加密), 则后面的masking key无须填写, 省略4字节
    const int frameHeaderSize =(messageLength < 0xFFFF) ? ((messageLength < 0x7E) ? 2 : 4):10;
    uint32_t frameSize = frameHeaderSize + messageLength;
    // uint8_t *frameHeader = new uint8_t[frameHeaderSize];
    uint8_t *frame = new uint8_t[frameSize + 1];
    memset(frame, 0, frameHeaderSize);
    frame[0] = static_cast<uint8_t>(0x80 | frameType);
    // 填充数据长度
    if (messageLength < 0x7E)
    {
        frame[1] = static_cast<uint8_t>(messageLength);
    }
    else if(messageLength < 0xFFFF)
    {
        // Bigger than 0x7d
        frame[1] = 126;
        uint16_t len = messageLength;
        memcpy(frame+2, &len, 2);
        // memcpy(&frameHeader[2], &len, payloadFieldExtraBytes);
    }
    else
    {
        frame[1] = 127;
        frame[2] = 0;
        frame[3] = 0;
        frame[4] = 0;
        frame[5] = 0;
        frame[6] = (messageLength&0xFF000000)>>24;
        frame[7] =  (messageLength&0xFF000000)>>16;
        frame[8] =  (messageLength&0xFF000000)>>8;
        frame[9] =  messageLength&0xFF;
    }
    // 填充数据
    memcpy(frame + frameHeaderSize, input_message, messageLength+1);
    // frame[frameSize] = '\0';
    std::cout<<"\n\n[OUTFRAME]###"<<frame<<"##/\n[FRAME LENGTH] actual:"<<"/ allocated:"<<frameSize<<"\nHEADER SIZE = "<<frameHeaderSize<<"\nFRAME[2]="<<frame[2]<<"\n[MSG LENGTH]"<<messageLength<<"\n";
    return (char*)frame;
}
std::string ConnectionHandler::string_to_UTF8(const std::string & str)
{
    return "";
}
