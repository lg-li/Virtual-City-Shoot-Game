#ifndef __NETWORK_INTERFACE__
#define __NETWORK_INTERFACE__

#include <map>

#include "ConnectionHandler.h"
#include "MessageRespond.h"

#define PORT 9000
#define TIMEWAIT 1000
#define BUFFLEN 2048
#define MAXEVENTSSIZE 2000
class ConnectionHandler;

typedef std::map<int, ConnectionHandler *> CONNECTION_HANDLER_MAP;

class NetworkService {
public:
	void start();
	static NetworkService *get_global_network_service();
	ConnectionHandler* get_network_handler_by_id(int id);

	void boardcast(MessageRespond* content_to_boardcast);
    void send_message_to(int fd, MessageRespond* content_to_send);

private:
	NetworkService(); // singleton private constructor
	~NetworkService();
	int init();
	int epoll_loop();
	int set_noblock(int fd);
	void ctl_event(int fd, bool flag);

	int epollfd_;
	int listenfd_;
	CONNECTION_HANDLER_MAP connection_handler_map;
	static NetworkService *m_network_interface;
};

#define NETWORK_INTERFACE NetworkService::get_global_network_service()

#endif
