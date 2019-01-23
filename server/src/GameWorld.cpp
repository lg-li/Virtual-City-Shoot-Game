#include "GameWorld.h"
#include "EventLogger.h"
#define PLAYER_EFFECTIVE_RADIUS 0.8
GameWorld::GameWorld()
{
    //ctor
}

GameWorld::~GameWorld()
{
    //dtor
}
GamePlayer* GameWorld::add_player(int fd)
{
    this->player_map[fd] = new GamePlayer(fd, 0, 0, 0);
    return this->player_map[fd];
}

int GameWorld::remove_player(int fd)
{
    this->player_map.erase(fd);
    return 0;
}

int GameWorld::update_player_location(int fd, double x, double y, double z, json quaternion)
{
    if(player_map[fd] == NULL)
    {
        add_player(fd);
    }
    GamePlayer* op_player = this->player_map[fd];
    op_player->set_location_x(x);
    op_player->set_location_y(y);
    op_player->set_location_z(z);
    op_player->set_quaternion(quaternion);
    return 0;
}

// shoot judgment
int GameWorld::shot_at(int from, double locationX, double locationY, double locationZ, double directionX, double directionY, double directionZ)
{
    std::map<int, GamePlayer *>::iterator player_iterator;
    player_iterator = player_map.begin();
    while(player_iterator != player_map.end())
    {
        if(player_iterator->first != from)
        {
            double dis= distance_of_line_ab_to_point_s(locationX, locationY, locationZ,
                        locationX + directionX, locationY + directionY, locationZ+directionZ,
                        player_iterator->second->get_location_x(),
                        player_iterator->second->get_location_y(),
                        player_iterator->second->get_location_z());
            DEBUG_LOG("[SHOOT JUDGE] Shoot distance from player %d = %f \n",  player_iterator->first, dis);
            if(dis<PLAYER_EFFECTIVE_RADIUS)
            {
                int hurt_value = (PLAYER_EFFECTIVE_RADIUS-dis)*10;
                // SHOOT EFFECTIVE
                player_iterator->second->hurt(hurt_value);
                // add score to the shooter
                player_map[from]->add_score(hurt_value);
                return player_iterator->first;
            }
        }
        player_iterator++;
    }
    return -1;
}

double GameWorld::distance_of_line_ab_to_point_s(double ax, double ay, double az, double bx, double by, double bz, double sx, double sy, double sz )
{
    double ab = sqrt(pow((ax - bx), 2.0) + pow((ay - by), 2.0) + pow((az - bz), 2.0));
    double as = sqrt(pow((ax - sx), 2.0) + pow((ay - sy), 2.0) + pow((az - sz), 2.0));
    double bs = sqrt(pow((sx - bx), 2.0) + pow((sy - by), 2.0) + pow((sz - bz), 2.0));
    double cos_A = (pow(as, 2.0) + pow(ab, 2.0) - pow(bs, 2.0)) / (2 * ab*as);
    double sin_A = sqrt(1 - pow(cos_A, 2.0));
    return as*sin_A;
}
