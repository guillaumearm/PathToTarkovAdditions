"use strict";

class PathToTarkov {
    constructor() {
        const mod = require("./package.json");
        const config = require("./config/config.json");

        if (!config.enabled) {
            Logger.warning(`=> ${mod.name} v${mod.version} is disabled!`)
            return;
        }

        Logger.info(`Loading: ${mod.name} v${mod.version}`);

        ModLoader.onLoad[mod.name] = function () {
            Logger.success(`=> ${mod.name} v${mod.version} loaded`);
        }
    }
}

module.exports = new PathToTarkov();