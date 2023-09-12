var config = {};

config.test = {
  "page": "https://webbrowsertools.com/test-x-frame-options/"
};

config.session = {
  set state (val) {app.session.write("state", val)},
  get state () {return app.session.read("state") !== undefined ? app.session.read("state") : {}}
};

config.welcome = {
  set lastupdate (val) {app.storage.write("lastupdate", val)},
  get lastupdate () {return app.storage.read("lastupdate") !== undefined ? app.storage.read("lastupdate") : 0}
};

config.addon = {
  set state (val) {app.storage.write("state", val)},
  set session (val) {app.storage.write("session", val)},
  set whitelist (val) {app.storage.write("whitelist", val)},
  get state () {return app.storage.read("state") !== undefined  ? app.storage.read("state") : "OFF"},
  get session () {return app.storage.read("session") !== undefined  ? app.storage.read("session") : false},
  get whitelist () {return app.storage.read("whitelist") !== undefined ? app.storage.read("whitelist") : []}
};
