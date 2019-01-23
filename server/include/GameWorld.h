#ifndef GAME_WORLD_H
#define GAME_WORLD_H

#include <map>
#include "GamePlayer.h"
#include "JSON.hpp"
using json = nlohmann::json;

class GameWorld
{
    public:
        GameWorld();
        virtual ~GameWorld();

        GamePlayer* add_player(int fd);

        int remove_player(int fd);

        int update_player_location(int fd, double x, double y, double z, json quaternion);

        int shot_at(int fd,double locationX, double locationY, double locationZ, double directionX, double directionY, double directionZ);

        std::map<int, GamePlayer *> player_map;
    protected:

    private:
        double distance_of_line_ab_to_point_s(double ax, double ay, double az, double bx, double by, double bz, double sx, double sy, double sz );
};

#endif // GAME_WORLD_H
