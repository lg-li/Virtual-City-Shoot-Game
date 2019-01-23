#include "GameEventService.h"
#include <string>

class NetworkService;
// singleton
GameEventService *GameEventService::shared_game_event_service = NULL;

GameEventService::GameEventService()
{
    game_world = new GameWorld();
}

GameEventService::~GameEventService()
{
    //dtor
}

GameEventService *GameEventService::get_shared_game_event_service()
{
    if(shared_game_event_service == NULL)
        shared_game_event_service = new GameEventService();
    return shared_game_event_service;
}

void GameEventService::handle(int fd, json message)
{
    std::string message_type = message["type"];

    if(message_type.compare("HELLO")==0)
    {
        // Hello Message
        this->game_world->add_player(fd);
        json hello_json;
        hello_json["id"] = fd;
        MessageRespond new_respond("HELLO", hello_json);
        NetworkService::get_global_network_service()->send_message_to(fd, &new_respond);
    }
    else if(message_type.compare("HB_EV_UPD_LOC")==0)
    {
        this->game_world->update_player_location(fd, message["data"]["lx"], message["data"]["ly"], message["data"]["lz"], message["data"]["quaternion"]);
        NetworkService::get_global_network_service()->boardcast(new MessageRespond("UPD_LOC", this->game_world->player_map[fd]->to_json()));
        if(this->game_world->player_map[fd]->get_life()<=0){
            // ignore dead player and remove it
            // this->game_world->remove_player(fd);
            return;
        }
    }
    else if(message_type.compare("EV_SHT")==0)
    {
        if(this->game_world->player_map[fd]->get_life()<=0){
            // ignore dead player and remove it
            // this->game_world->remove_player(fd);
            return;
        }
        // Shoot event
        NetworkService::get_global_network_service()->boardcast(new MessageRespond("PLY_SHT", this->game_world->player_map[fd]->to_json()));
        int shooted = this->game_world->shot_at(fd,
                                                message["data"]["lx"], message["data"]["ly"], message["data"]["lz"],  // location
                                                message["data"]["dx"], message["data"]["dy"], message["data"]["dz"] // direction
                                               );
        if(shooted != -1)
        {
            // shoot effected
            json shotPlayer = this->game_world->player_map[shooted]->to_json();
            NetworkService::get_global_network_service()->send_message_to(fd, new MessageRespond("PLY_SHTD", shotPlayer));
            NetworkService::get_global_network_service()->send_message_to(shooted, new MessageRespond("PLY_SHTD", shotPlayer));
            if(shotPlayer["l"] <= 0)
            {
                // death broadcast
                NetworkService::get_global_network_service()->boardcast(new MessageRespond("RM_PLY", shotPlayer));
            }
        }
    }
    else if(message_type.compare("BYE")==0)
    {
        // Terminate Message
        NetworkService::get_global_network_service()->boardcast(new MessageRespond("RM_PLY", this->game_world->player_map[fd]->to_json()));
    }
}

void GameEventService::remove_player(int fd)
{
    this->game_world->remove_player(fd);
}

GameWorld* GameEventService::get_world()
{
    return this->game_world;
}
