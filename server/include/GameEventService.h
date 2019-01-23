#ifndef GAMEEVENTSERVICE_H
#define GAMEEVENTSERVICE_H

#include "JSON.hpp"
#include "NetworkService.h"
#include "GameWorld.h"
#include "MessageRespond.h"

using json = nlohmann::json;

class GameEventService
{
    public:
        GameEventService();
        virtual ~GameEventService();
        void handle(int fd, json message);
        static GameEventService *get_shared_game_event_service();
        void remove_player(int fd);
        GameWorld* get_world();
    protected:
        GameWorld* game_world;

    private:
        static GameEventService *shared_game_event_service;
};

#endif // GAMEEVENTSERVICE_H
