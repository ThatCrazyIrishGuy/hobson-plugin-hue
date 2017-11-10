exports = module.exports;
const hobsonResponseTypes = require('hobson-response-types');
const jsonfile = require('jsonfile');
const path = require('path');
const hue = require("node-hue-api"),
    HueApi = hue.HueApi,
    lightState = hue.lightState;

const turnOn = lightState.create().on().brightness(100);
const turnOff = lightState.create().off();

function matchedGroup(api, values, defaultGroup){
    const str = values.join(' ');
    return api.getFullState().then((results)=>{
      return Object.keys(results.groups).map(
        key => results.groups[key]
      )
    }).then((groups)=>{
      let roomIndex = 0;
      groups.some((group, i)=>{
        if(str.includes(group.name.toLowerCase())){
          return roomIndex = i+1;
        }
      });
      if(roomIndex > 0) return roomIndex;
      return groups.findIndex(
        group => group.name == defaultGroup
      );
    });
}

function createApi(config){
  return new HueApi(config.hostname, config.username);
}

function getConfig(){
  return jsonfile.readFileSync(path.resolve(__dirname, 'config.json'));
}


exports.lights = {
    brightness: {
      type: hobsonResponseTypes.text,
      execute: function(values, callback) {
        const config = getConfig();
        const api = createApi(config);
        matchedGroup(api, values, config.defaultGroup)
          .then((roomIndex) => {
            const brightness = values[values.length - 1].replace('%', '');
            setBrigtness = lightState.create().on().brightness(brightness);
            api.setGroupLightState(roomIndex, setBrigtness);
            return callback('setting light brightness to ' + brightness + ' percent');
          });
      }
    },
    on: {
      type: hobsonResponseTypes.text,
      execute: function(values, callback) {
      const config = getConfig();
      const api = createApi(config);
      matchedGroup(api, values, config.defaultGroup)
        .then((roomIndex) => {
          api.setGroupLightState(roomIndex, turnOn);
          return callback('turning on the lights');
        });
      }
    },
    off: {
      type: hobsonResponseTypes.text,
      execute: function(values, callback) {
      const config = getConfig();
      const api = createApi(config);
      matchedGroup(api, values, config.defaultGroup)
        .then((roomIndex) => {
          api.setGroupLightState(roomIndex, turnOff);
          return callback('turning off the lights');
        });
      }
    }
};
