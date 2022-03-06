# Path To Tarkov Additions
Addon mod for [Path To Tarkov](https://github.com/guillaumearm/PathToTarkov) that allow to setup additional restrictions

By default this mod does nothing, you have to configure it by yourself, please refer to the Path To Tarkov default config file.

## Limitations
When completing a quest, you have to do one raid before changes are taken into account, this is due to some client game restrictions.

If someone knows about creating csharp mods, I'm interested here to get some help.

## Available Features
- exfiltrations locked by quests


## Planned features
- infiltrations locked by quests
- traders locked by quests


## Example config
This will unlock ZB-1011 exfiltration point when `my_quest_id_1` and `my_quest_id_2` quests are completed
```js
{
  "enabled": true,
  "locked_by_quests": {
    "exfiltrations": {
      "bigmap": {
        "ZB-1011": [
          "my_quest_id_1",
          "my_quest_id_2"
        ]
      }
    }
  }
}
```
