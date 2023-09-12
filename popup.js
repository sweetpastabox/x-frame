var background = {
  "port": null,
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      background.message[id] = callback;
    }
  },
  "send": function (id, data) {
    if (id) {
      chrome.runtime.sendMessage({
        "method": id,
        "data": data,
        "path": "popup-to-background"
      }, function () {
        return chrome.runtime.lastError;
      });
    }
  },
  "connect": function (port) {
    chrome.runtime.onMessage.addListener(background.listener); 
    /*  */
    if (port) {
      background.port = port;
      background.port.onMessage.addListener(background.listener);
      background.port.onDisconnect.addListener(function () {
        background.port = null;
      });
    }
  },
  "post": function (id, data) {
    if (id) {
      if (background.port) {
        background.port.postMessage({
          "method": id,
          "data": data,
          "path": "popup-to-background",
          "port": background.port.name
        });
      }
    }
  },
  "listener": function (e) {
    if (e) {
      for (var id in background.message) {
        if (background.message[id]) {
          if ((typeof background.message[id]) === "function") {
            if (e.path === "background-to-popup") {
              if (e.method === id) {
                background.message[id](e.data);
              }
            }
          }
        }
      }
    }
  }
};

var config = {
  "tab": '',
  "show": {
    "invalid": {
      "alert": function () {
        window.alert("This is an invalid tab! please try on another tab.");
      }
    }
  },
  "load": function () {
    var test = document.querySelector(".test");
    var reload = document.querySelector(".reload");
    var toggle = document.querySelector(".toggle");
    var support = document.querySelector(".support");
    var options = document.querySelector(".options");
    var donation = document.querySelector(".donation");
    var whitelist = document.querySelector(".whitelist");
    /*  */
    test.addEventListener("click", function () {background.send("test")});
    reload.addEventListener("click", function () {background.send("reload")});
    support.addEventListener("click", function () {background.send("support")});
    options.addEventListener("click", function () {background.send("options")});
    donation.addEventListener("click", function () {background.send("donation")});
    whitelist.addEventListener("click", function () {background.send("whitelist")});
    /*  */
    toggle.addEventListener("click", function (e) {
      e.target.setAttribute("state", "loading");
      //
      window.setTimeout(function () {
        background.send("toggle", config.tab);
      }, 300);
    });
    /*  */
    background.send("load");
    window.removeEventListener("load", config.load, false);
  },
  "render": function (e) {
    var toggle = document.querySelector(".toggle");
    var whitelist = document.querySelector(".whitelist");
    /*  */
    whitelist.removeAttribute("added");
    toggle.setAttribute("state", e.state);
    whitelist.querySelector(".text").textContent = "Add to whitelist";
    /*  */
    if (e.session) {
      whitelist.setAttribute("disabled", '');
    } else {
      whitelist.removeAttribute("disabled");
    }
    /*  */
    if (e) {
      if (e.tab) {
        config.tab = e.tab;
        /*  */
        if (config.tab.url) {
          if (config.tab.url.indexOf("http") === 0) {
            if (e.whitelist) {
              var hostname = (new URL(config.tab.url)).hostname;
              if (e.whitelist.indexOf(hostname) !== -1) {
                whitelist.setAttribute("added", true);
                whitelist.querySelector(".text").textContent = "Remove from whitelist";
                return;
              }
            }
          }
        }
      }
    }
    /*  */
    if (e.alert === true) {
      if (e.valid === false) {
        if (e.session === true) {
          config.show.invalid.alert();
        }
      }
    }
  }
};

background.receive("storage", config.render);
background.receive("invalid", config.show.invalid.alert);
background.connect(chrome.runtime.connect({"name": "popup"}));

window.addEventListener("load", config.load, false);