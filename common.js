var core = {
  "start": function () {
    core.load();
  },
  "install": function () {
    core.load();
  },
  "load": function () {
    core.register.netrequest();
    core.update.toolbar.button();
  },
  "action": {
    "storage": function (changes, namespace) {
      const valid = !("rulescope" in changes);
      /*  */
      if (valid) {
        core.register.netrequest();
        core.update.toolbar.button();
      }
    },
    "tab": function (info, tab) {
      if (config.addon.session) {
        if (info.status === "loading") {
          const valid = tab.url ? tab.url.indexOf("file") === 0 || tab.url.indexOf("http") === 0 : false;
          /*  */
          core.update.popup(valid);
          core.update.toolbar.button();
        }
      }
    },
    "toggle": function (tab) {      
      if (tab) {
        if (config.addon.session) {
          const valid = tab.url ? tab.url.indexOf("file") === 0 || tab.url.indexOf("http") === 0 : false;
          /*  */
          if (valid) {
            let state = config.session.state;
            state[tab.id] = state[tab.id] === "ON" ? "OFF" : "ON";
            config.session.state = state;
          }
          /*  */
          core.update.popup(valid, true);
        } else {
          config.addon.state = config.addon.state === "ON" ? "OFF" : "ON";
          core.update.popup();
        }
      }
    }
  },
  "update": {
    "options": function () {
      app.options.send("storage", {
        "session": config.addon.session,
        "whitelist": config.addon.whitelist
      });
    },
    "popup": function (valid, alert) {
      app.tab.query.active(function (tab) {
        const state = config.addon.session ? config.session.state[tab.id] || "OFF" : config.addon.state;
        /*  */
        app.popup.send("storage", {
          "tab": tab,
          "valid": valid,
          "state": state,
          "alert": alert,
          "session": config.addon.session,
          "whitelist": config.addon.whitelist
        });
      });
    },
    "toolbar": {
      "button": function () {
        if (config.addon.session) {
          app.tab.query.active(function (tab) {
            const state = config.session.state;
            //
            app.button.icon(tab.id, state[tab.id] || "OFF");
            app.button.title(tab.id, "Allow X-Frame-Options: " + state[tab.id] || "OFF");
          });
        } else {
          app.button.icon(null, config.addon.state);
          app.button.title(null, "Allow X-Frame-Options: " + config.addon.state);
        }
      }
    },
    "whitelist": function () {
      app.tab.query.active(function (tab) {
        if (tab) {
          if (tab.url) {
            const valid = tab.url ? tab.url.indexOf("file") === 0 || tab.url.indexOf("http") === 0 : false;
            /*  */
            if (valid) {
              var whitelist = config.addon.whitelist;
              var hostname = (new URL(tab.url)).hostname;
              /*  */
              var index = whitelist.indexOf(hostname);
              if (index !== -1) whitelist.splice(index, 1);
              else {
                whitelist.push(hostname);
                whitelist = whitelist.filter(function (a, b) {
                  return whitelist.indexOf(a) === b;
                });
              }
              /*  */
              config.addon.whitelist = whitelist;
            } else {
              app.popup.send("invalid");
            }
          } else {
            app.popup.send("invalid");
          }
        }
        /*  */
        core.update.popup();
      });
    }
  },
  "register": {
    "netrequest": function () {
      app.netrequest.rules.scope = config.addon.session ? "session" : "dynamic";
      /*  */
      app.tab.query.active(async function (tab) {
        await app.netrequest.display.badge.text(false);
        /*  */
        if (app.netrequest.rules.scope === "session") {
          await app.netrequest.rules.remove.by.scope("dynamic");
          await app.netrequest.rules.remove.by.condition.tabId(tab.id);
        } else {
          await app.netrequest.rules.remove.by.scope("session");
          await app.netrequest.rules.remove.by.action.type("modifyHeaders", "responseHeaders");
        }
        /*  */
        const valid = tab.url ? tab.url.indexOf("file") === 0 || tab.url.indexOf("http") === 0 : false;
        const register = config.addon.session ? valid && config.session.state[tab.id] === "ON" : config.addon.state === "ON";
        /*  */
        if (register) {
          app.netrequest.rules.push({
            "condition": {
              "urlFilter": '*',
              ...(config.addon.session === true) && ({"tabIds": [tab.id]}),
              ...(config.addon.session === false && config.addon.whitelist.length) && ({"excludedRequestDomains": config.addon.whitelist}),
              ...(config.addon.session === false && config.addon.whitelist.length) && ({"excludedInitiatorDomains": config.addon.whitelist})
            },
            "action": {
              "type": "modifyHeaders",
              "responseHeaders": [{
                "operation": "remove",
                "header": "X-Frame-Options"
              }]
            }
          });
          /*  */
          app.netrequest.rules.push({
            "condition": {
              "urlFilter": '*',
              ...(config.addon.session === true) && ({"tabIds": [tab.id]}),
              ...(config.addon.session === false && config.addon.whitelist.length) && ({"excludedRequestDomains": config.addon.whitelist}),
              ...(config.addon.session === false && config.addon.whitelist.length) && ({"excludedInitiatorDomains": config.addon.whitelist})
            },
            "action": {
              "type": "modifyHeaders",
              "responseHeaders": [{
                "operation": "remove",
                "header": "Frame-Options"
              }]
            }
          });
        }
        /*  */
        await app.netrequest.rules.update();
      });
    }
  }
};

app.tab.on.updated(core.action.tab);

app.options.receive("load", core.update.options);
app.options.receive("session", function (e) {config.addon.session = e});
app.options.receive("whitelist", function (e) {config.addon.whitelist = e});

app.popup.receive("load", core.update.popup);
app.popup.receive("options", app.tab.options);
app.popup.receive("toggle", core.action.toggle);
app.popup.receive("whitelist", core.update.whitelist);
app.popup.receive("reload", function () {app.tab.reload(null, true)});
app.popup.receive("test", function () {app.tab.open(config.test.page)});
app.popup.receive("support", function () {app.tab.open(app.homepage())});
app.popup.receive("donation", function () {app.tab.open(app.homepage() + "?reason=support")});

app.on.startup(core.start);
app.on.installed(core.install);
app.on.storage(core.action.storage);