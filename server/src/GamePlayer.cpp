#include "GamePlayer.h"
#define PLAYER_LIFE_MAX 100;
GamePlayer::GamePlayer(int player_id, double init_location_x, double init_location_y, double init_location_z)
{
    this->player_id = player_id;
    this->location_x = init_location_x;
    this->location_y = init_location_y;
    this->location_z = init_location_z;
    this->quaternion["x"] = 0;
    this->quaternion["y"] = 0;
    this->quaternion["z"] = 0;
    this->quaternion["w"] = 0;
    this->score = 0;
    this->life = PLAYER_LIFE_MAX;
}

GamePlayer::~GamePlayer()
{
    //dtor
}

double GamePlayer::get_location_x()
{
    return this->location_x;
}

double GamePlayer::get_location_y()
{
    return this->location_y;
}

double GamePlayer::get_location_z()
{
    return this->location_z;
}

void GamePlayer::set_location_x(double new_location_x)
{
    this->location_x = new_location_x;
}

void GamePlayer::set_quaternion(json new_quaternion)
{
    this->quaternion = new_quaternion;
}

void GamePlayer::set_location_y(double new_location_y)
{
    this->location_y = new_location_y;
}

void GamePlayer::set_location_z(double new_location_z)
{
    this->location_z = new_location_z;
}

json GamePlayer::to_json()
{
    json player_json;
    player_json["i"] = player_id;
    player_json["l"] = life;
    player_json["x"] = location_x;
    player_json["y"] = location_y;
    player_json["z"] = location_z;
    // player_json["q"] = quaternion;
    player_json["s"] = score;
    return player_json;
}

void GamePlayer::hurt(int life_to_decrease)
{
    life -= life_to_decrease;
}

void GamePlayer::add_score(int score_to_add){
    score += score_to_add;
}

int GamePlayer::get_score(){
    return score;
}

int GamePlayer::get_life(){
    return life;
}
