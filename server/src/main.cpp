#include "NetworkService.h"

int main(int argc, char **argv){
    // main entry point
	NetworkService::get_global_network_service()->start();
	return 0;
}
