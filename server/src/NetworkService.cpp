#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/epoll.h>
#include <unistd.h>
#include <fcntl.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <map>
#include "EventLogger.h"
#include "NetworkService.h"

NetworkService *NetworkService::m_network_interface = NULL;

NetworkService::NetworkService():
    epollfd_(0),
    listenfd_(0),
    connection_handler_map()
{
    if(0 != init())
        exit(1);
}

NetworkService::~NetworkService()
{

}

int NetworkService::init()
{
    listenfd_ = socket(AF_INET, SOCK_STREAM, 0);
    if(listenfd_ == -1)
    {
        DEBUG_LOG("[FAILED] Failed to create socket.");
        return -1;
    }
    struct sockaddr_in server_addr;
    memset(&server_addr, 0, sizeof(sockaddr_in));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    server_addr.sin_port = htons(PORT);
    if(-1 == bind(listenfd_, (struct sockaddr *)(&server_addr), sizeof(server_addr)))
    {
        DEBUG_LOG("[FAILED] Failed to bind socket.");
        return -1;
    }
    if(-1 == listen(listenfd_, 5))
    {
        DEBUG_LOG("[FAILED] Failed to listen at the file descriptor.");
        return -1;
    }
    epollfd_ = epoll_create(MAXEVENTSSIZE);

    ctl_event(listenfd_, true);
    DEBUG_LOG("[RUNNING] Server Started.");
    return 0;
}

// wait for connection
int NetworkService::epoll_loop()
{
    struct sockaddr_in client_addr;
    socklen_t clilen;
    int nfds = 0;
    int fd = 0;
    int bufflen = 0;
    struct epoll_event events[MAXEVENTSSIZE];
    while(true)
    {
        nfds = epoll_wait(epollfd_, events, MAXEVENTSSIZE, TIMEWAIT);
        for(int i = 0; i < nfds; i++)
        {
            if(events[i].data.fd == listenfd_)
            {
                fd = accept(listenfd_, (struct sockaddr *)&client_addr, &clilen);
                ctl_event(fd, true);
            }
            else if(events[i].events & EPOLLIN)
            {
                if((fd = events[i].data.fd) < 0)
                    continue;
                ConnectionHandler *handler = connection_handler_map[fd];
                if(handler == NULL)
                    continue;
                if((bufflen = read(fd, handler->getbuff(), BUFFLEN)) <= 0)
                {
                    // terminate
                    ctl_event(fd, false);
                }
                else
                {
                    handler->process();
                    // epoll_ctl(epollfd_, EPOLL_CTL_MOD, fd, &events[i]);
                }
            }
            else if(events[i].events & EPOLLOUT)
            {
                if((fd = events[i].data.fd) < 0)
                    continue;
                ConnectionHandler *handler = connection_handler_map[fd];
                if(handler == NULL)
                    continue;
            }
        }
    }

    return 0;
}

int NetworkService::set_noblock(int fd)
{
    int flags;
    if ((flags = fcntl(fd, F_GETFL, 0)) == -1)
        flags = 0;
    return fcntl(fd, F_SETFL, flags | O_NONBLOCK);
}

NetworkService *NetworkService::get_global_network_service()
{
    if(m_network_interface == NULL)
        m_network_interface = new NetworkService();
    return m_network_interface;
}

void NetworkService::ctl_event(int fd, bool flag)
{
    struct epoll_event ev;
    ev.data.fd = fd;
    ev.events = flag ? EPOLLIN : 0;
    epoll_ctl(epollfd_, flag ? EPOLL_CTL_ADD : EPOLL_CTL_DEL, fd, &ev);
    if(flag)
    {
        set_noblock(fd);
        connection_handler_map[fd] = new ConnectionHandler(fd);
        if(fd != listenfd_)
        {
            DEBUG_LOG("[ENTER] Player %d entered epoll loop", fd);
        }
    }
    else
    {
        close(fd);
        connection_handler_map.erase(fd);

        boardcast(new MessageRespond("RM_PLY", GameEventService::get_shared_game_event_service()->get_world()->player_map[fd]->to_json()));
        GameEventService::get_shared_game_event_service()->remove_player(fd);
        DEBUG_LOG("[EXIT] Player %d exit epoll loop", fd);
    }
}

void NetworkService::start()
{
    epoll_loop();
}

ConnectionHandler* NetworkService::get_network_handler_by_id(int id)
{
    return connection_handler_map[id];
}

// Boardcast message
void NetworkService::boardcast(MessageRespond* respond_message_to_send)
{
    std::string char_to_send = respond_message_to_send->to_json_str();
    CONNECTION_HANDLER_MAP::iterator boardcast_iterator;
    boardcast_iterator = connection_handler_map.begin();
    while(boardcast_iterator != connection_handler_map.end())
    {
        if(boardcast_iterator->first != listenfd_)
        {
            // skip listen fd
            boardcast_iterator->second->send_message(char_to_send);
        }

        boardcast_iterator++;
    }
    DEBUG_LOG("[BOARDCAST] Boardcast finished");
}
void NetworkService::send_message_to(int fd, MessageRespond* respond_message_to_send)
{
    connection_handler_map[fd]->send_message(respond_message_to_send->to_json_str());
}
