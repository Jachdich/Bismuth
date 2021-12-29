#define OLC_PGE_APPLICATION
#include "olcPixelGameEngine.h"
#include <jsoncpp/json/json.h>
#include <iostream>
#include <fstream>
#include <string>

int idtocol(int id) {
    switch (id) {
        case 1: return  0xFF829174;
        case 2: return  0xFF6a7560;
        case 3: return  0xFF4e524b;
        default: return 0xFF829174;
    }
}

class Example : public olc::PixelGameEngine {
public:
    Json::Value data;
	Example() {
		sAppName = "Example";
	}

public:
	bool OnUserCreate() override {
		std::ifstream f("data2.json");
        f >> data;
        return true;
	}

	bool OnUserUpdate(float) override {
		for (const std::string& id : data.getMemberNames()) {
		    uint16_t cx = data[id]["x"].asInt();
		    uint16_t cy = data[id]["y"].asInt();
		    for (Json::Value::ArrayIndex i = 0; i != data[id]["tiles"].size(); i++) {
		        int tile = data[id]["tiles"][i].asInt();
		        int tx = i % 32 + cx * 32 + 64;
		        int ty = i / 32 + cy * 32 + 64;

		        Draw(tx, ty, olc::Pixel(idtocol(tile)));
		    }
		}
		return true;
	}
};

int main() {
	Example demo;
	if (demo.Construct(1024 + 128 * 4, 1024 + 128 * 4, 1, 1))
		demo.Start();
	return 0;
}
