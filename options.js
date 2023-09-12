var background = (function () {
  var tmp = {};
  chrome.runtime.onMessage.addListener(function (request) {
    for (var id in tmp) {
      if (tmp[id] && (typeof tmp[id] === "function")) {
        if (request.path === "background-to-options") {
          if (request.method === id) {
            tmp[id](request.data);
          }
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {
      tmp[id] = callback;
    },
    "send": function (id, data) {
      chrome.runtime.sendMessage({
        "method": id, 
        "data": data,
        "path": "options-to-background"
      }, function () {
        return chrome.runtime.lastError;
      });
    }
  }
})();

var config = {
  "elements": {},
  "render": function (e) {
    config.handle.attribute.textarea(e.session);
    config.elements.session.checked = e.session;
    config.elements.whitelist.value = e.whitelist.join(", ");
  },
  "handle": {
    "attribute": {
      "textarea": function (checked) {
        if (checked) {
          config.elements.whitelist.setAttribute("disabled", '');
        } else {
          config.elements.whitelist.removeAttribute("disabled");
        }
      }
    }
  },
  "load": function () {
    config.elements.session = document.getElementById("session");
    config.elements.whitelist = document.getElementById("whitelist");
    /*  */
    config.elements.session.addEventListener("change", config.listener.session);
    config.elements.whitelist.addEventListener("change", config.listener.whitelist);
    /*  */
    background.send("load");
    window.removeEventListener("load", config.load, false);
  },
  "listener": {
    "session": function (e) {
      background.send("session", e.target.checked);
      config.handle.attribute.textarea(e.target.checked);
    },
    "whitelist": function (e) {
      let domains = [];
      if (e) {
        if (e.target) {
          if (e.target.value) {
            let list = e.target.value.split(',');
            domains = list.map(function (item) {
              try {
                item = item.trim();
                return item ? (new URL(item)).hostname : '';
              } catch (e) {
                return item;
              }
            }).filter(function(item, pos, self) {
              return item && self.indexOf(item) === pos;
            });
            /*  */
            e.target.value = domains.join(", ");
          }
        }
      }
      /*  */
      background.send("whitelist", domains);
    }
  }
};

background.receive("storage", config.render);
window.addEventListener("load", config.load, false);
