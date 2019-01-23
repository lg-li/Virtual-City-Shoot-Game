#ifndef GAMEPLAYER_H
#define GAMEPLAYER_H

#include<JSON.hpp>
#include<string>

using json = nlohmann::json;
class GamePlayer
{
public:
    GamePlayer(int player_id, double init_location_x, double init_location_y, double init_location_z);
    virtual ~GamePlayer();
    double get_location_x();
    double get_location_y();
    double get_location_z();
    void set_location_x(double new_location_x);
    void set_location_y(double  new_location_y);
    void set_location_z(double  new_location_z);
    void set_quaternion(json new_quaternion);
    void hurt(int);
    json to_json();
    void add_score(int);
    int get_score();
    int get_life();

protected:
    // Location
    double location_x;
    double location_y;
    double location_z;

    // Quaternion
    json quaternion;

    // Life max 100
    int life;
    int score;
    int player_id;

private:

};

#endif // GAMEPLAYER_H
