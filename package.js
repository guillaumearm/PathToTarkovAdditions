"use strict";

const PTT_MINIMUM_VERSION = '2.5.0';


// deep clone taken on stackoverflow
function deepClone(item) {
    if (!item) { return item; } // null, undefined values check

    var types = [Number, String, Boolean],
        result;

    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach(function (type) {
        if (item instanceof type) {
            result = type(item);
        }
    });

    if (typeof result == "undefined") {
        if (Object.prototype.toString.call(item) === "[object Array]") {
            result = [];
            item.forEach(function (child, index, array) {
                result[index] = deepClone(child);
            });
        } else if (typeof item == "object") {
            // testing that this is DOM
            if (item.nodeType && typeof item.cloneNode == "function") {
                result = item.cloneNode(true);
            } else if (!item.prototype) { // check that this is a literal
                if (item instanceof Date) {
                    result = new Date(item);
                } else {
                    // it is an object literal
                    result = {};
                    for (var i in item) {
                        result[i] = deepClone(item[i]);
                    }
                }
            } else {
                // just keep the reference
                result = item;
                // depending what you would like here,
            }
        } else {
            result = item;
        }
    }

    return result;
}

const onQuestCompleted = (cb) => {
    const completeQuest = QuestController.completeQuest;
    QuestController.completeQuest = (pmcData, body, sessionId) => {
        const response = completeQuest(pmcData, body, sessionId);

        cb(pmcData, body, sessionId);

        return response;
    }
}

const forEachExfilsValue = (exfilsPayload, cb) => {
    Object.keys(exfilsPayload).forEach(mapName => {
        Object.keys(exfilsPayload[mapName]).forEach(exfilName => {
            const value = exfilsPayload[mapName][exfilName];
            cb(mapName, exfilName, value);
        })
    })
}

class PathToTarkovAdditions {
    constructor() {
        const mod = require("./package.json");

        this.modName = mod.name;
        this.modVersion = mod.version;

        this.config = require("./config/config.json");
        this.originalPttConfig = null;
        this.completedQuests = {};

        if (!this.config.enabled) {
            Logger.warning(`=> ${mod.name} v${mod.version} is disabled!`)
            return;
        }


        Logger.info(`Loading: ${mod.name} v${mod.version}`);
        ModLoader.onLoad[mod.name] = this.load.bind(this);
    }

    refreshLockedByQuests(sessionId) {
        const exfilsLockedByQuests = this.config.locked_by_quests.exfiltrations;

        forEachExfilsValue(exfilsLockedByQuests, (mapName, exfilName, quests) => {
            if (!quests.every(qid => Boolean(this.completedQuests[qid]))) {
                Logger.info(`=> Exfiltration point locked by quest: ${mapName} -> ${exfilName}`);

                const pttConfig = deepClone(this.originalPttConfig);
                delete pttConfig.exfiltrations[mapName][exfilName];

                PathToTarkovAPI.setConfig(pttConfig);

            } else {
                Logger.info(`=> Exfiltration point unlocked by quest: ${mapName} -> ${exfilName}`);

                const pttConfig = deepClone(this.originalPttConfig);
                pttConfig.exfiltrations[mapName][exfilName] = this.originalPttConfig.exfiltrations[mapName][exfilName];

                PathToTarkovAPI.setConfig(pttConfig);
            }
        });

        PathToTarkovAPI.refresh(sessionId);
    }

    initCompletedQuests(sessionId) {
        this.completedQuests = {};
        this.originalPttConfig = PathToTarkovAPI.getConfig();

        // load initial completedQuests
        const profile = SaveServer.profiles[sessionId];

        if (profile) {
            const pmcData = profile.characters.pmc;
            if (pmcData && pmcData.Quests) {
                pmcData.Quests
                    .forEach(q => {
                        if (q.status === 'Success') {
                            this.completedQuests[q.qid] = true;
                        }
                    });

                this.refreshLockedByQuests(sessionId);
            }

        } else {
            Logger.error(`=> ${this.modName}: profile '${sessionId}' not found`)
        }
    }

    questCompleted(questId, sessionId) {
        if (!questId) {
            Logger.error(`=> ${this.modName}: completed a quest without id`);
            return;
        }

        this.completedQuests[questId] = true;
        this.refreshLockedByQuests(sessionId);
    }

    load() {
        if (!globalThis.PathToTarkovAPI) {
            Logger.error(`=> ${this.modName}: PathToTarkovAPI not found, are you sure a version of PathToTarkov >= ${PTT_MINIMUM_VERSION} is installed ?`);
            return;
        }

        PathToTarkovAPI.onStart((sessionId) => {
            this.initCompletedQuests(sessionId);
        })

        onQuestCompleted((_pmcData, body, sessionId) => {
            this.questCompleted(body.qid, sessionId);
        })

        Logger.success(`=> ${this.modName} v${this.modVersion} loaded`);
    }
}

module.exports = new PathToTarkovAdditions();