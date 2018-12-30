/**
 * @author Daniels Kursits (evolbug) <https://github.com/evolbug>
 * @license MIT
 * @version 0.5.0
 */

"use strict";

function Fetch(url, params = {}) {
   var req = new XMLHttpRequest();
   if (params.cache === undefined) params.cache = {};
   if (params.done === undefined) params.done = () => {};
   if (params.fail === undefined) params.fail = () => {};
   if (params.alias === undefined) params.alias = url;

   req.onreadystatechange = () => {
      if (req.readyState === XMLHttpRequest.DONE) {
         if (req.status == 200) {
            params.cache[params.alias] = {
               etag: req.getResponseHeader("etag"),
               date: req.getResponseHeader("last-modified"),
               data: req.responseText,
            };
            params.done(req.responseText, req);
         } else if (req.status == 304) {
            params.done(params.cache[params.alias].data, req);
         } else {
            params.fail(req);
         }
      }
   };

   req.open("GET", url, params.async || true);

   if (params.cache[params.alias]) {
      req.setRequestHeader("If-None-Match", params.cache[params.alias].etag);
   } else if (params.cache === false) {
      req.setRequestHeader("Cache-Control", "no-cache");
   }

   if (params.contentType)
      req.setRequestHeader("Content-Type", params.contentType);

   req.send();
}

// persistent localStorage
function Persistor(key) {
   var old = JSON.parse(localStorage[key] || "{}");
   this.getKey = () => key;
   this.restore = key => old[key];
   delete localStorage[key];
}

Persistor.prototype.store = function(key, value) {
   if (key) this[key] = value;
   localStorage[this.getKey()] = JSON.stringify(this);
};

function Wiktor(landing, title = "Wiktor") {
   this.storage = new Persistor(title);

   this.storage.version = "0.5.0";
   this.github = "https://github.com/wiktor-wiki/wiktor";

   // virtual entry root, useful for implementing localisation/versioning/etc
   this.storage.root = this.storage.restore("root") || "";

   this.storage.cache =
      (this.storage.restore("version") == this.storage.version &&
         this.storage.restore("cache")) ||
      {};
   this.storage.cache.core = this.storage.cache.core || {};
   this.storage.cache.entries = this.storage.cache.entries || {};
   this.storage.cache.extensions = this.storage.cache.extensions || {};

   this.storage.theme = this.storage.restore("theme") || "dark";

   this.notFound = {
      date: "Non, 00 Nul 0000 00:00:00 GMT",
      data:
         "<div id='not-found'>\
            <img src='https://i.imgur.com/Ulp2hk1.png' width='190px'/>\
            <h1>404</h1>\
            <div>Oh no, entry appears to be misplaced or missing</div>\
         </div>",
   };

   this.storage.store();

   this.entry = {
      root: "/entries/", // real entry root, don't change unless you want to store them elsewhere entirely
      list: "/wiktor/entries.json",
   };
   this.landing =
      "/" + landing.replace(new RegExp("^[/]+|[/]+$", "g"), "") + "/";
   this.title = title;

   this.nav = {
      opened: "fa fa-angle-down",
      closed: "fa fa-angle-right",
      is_locked: false, // force expanded navigation
   };

   this.layout =
      "<aside>\
         <nav></nav>\
         <footer>\
            <popups></popups>\
            <widgets>\
               <div class='left'></div>\
               <div class='center'></div>\
               <div class='right'></div>\
            </widgets>\
         </footer>\
      </aside>\
      <main id='top'></main>\
      <a class='go-top fas fa-angle-up' href='#top'/>";

   this.locks = {}; // locks for steps to wait for
}

$.extend(Wiktor, {
   extensionPath: "/wiktor/extensions/",
   extensionRegistry: "/wiktor/extensions/register.json",
   steps: [],
   widgets: [],
   processors: {},
   postProcessors: [],

   addWidget: function(widget) {
      if (Array.isArray(widget)) {
         widget.forEach(widget => this.addWidget(widget));
         return this;
      }

      this.widgets.push(widget);
      return this;
   },

   addStep: function(step) {
      if (Array.isArray(step)) {
         step.forEach(step => this.addStep(step));
         return this;
      }

      var name = Object.keys(step).find(
         key => ["waitFor", "before", "after", "preload"].indexOf(key) < 0
      );
      step.name = name;

      if (this.steps.findIndex(s => s.name == step.name) >= 0) {
         console.log("step with name '" + step.name + "' already defined");
         return this;
      }

      if (step.after)
         this.steps.splice(
            this.steps.findIndex(s => s.name == step.after) >= 0
               ? this.steps.findIndex(s => s.name == step.after) + 1
               : this.steps.length,
            0,
            step
         );
      else if (step.before)
         this.steps.splice(
            this.steps.findIndex(s => s.name == step.before) >= 0
               ? this.steps.findIndex(s => s.name == step.before)
               : this.steps.length,
            0,
            step
         );
      else this.steps.push(step);

      return this;
   },

   removeStep: function(name) {
      this.steps.splice(this.steps.findIndex(s => s.name == name), 1);
   },
});

$.extend(Wiktor.prototype, {
   steps: Wiktor.steps,
   addStep: Wiktor.addStep,
   removeStep: Wiktor.removeStep,
   addWidget: Wiktor.addWidget,
   widgets: [],

   lock: function(lock) {
      if (!this.locks[lock]) this.locks[lock] = { handles: 1, done: [] };
      else this.locks[lock].handles += 1;
      console.log(
         "%clock #" + this.locks[lock].handles + " on " + lock,
         "color:orange"
      );
   },

   unlock: function(lock) {
      if (this.locks[lock]) {
         console.log(
            "%cunlock #" + this.locks[lock].handles + " on " + lock,
            "color:green"
         );
         this.locks[lock].handles -= 1;

         if (this.locks[lock].handles <= 0) {
            var done = this.locks[lock].done;
            delete this.locks[lock];

            done.forEach(
               fn =>
                  fn.waitFor.filter(l => this.locks[l]).length == 0 &&
                  fn.call(this)
            );
         }
      }
   },

   preload: function() {
      this.steps.forEach(step => {
         if (step.preload) {
            console.log("preload: " + step.name);
            step.preload = step.preload.call(this);
         } else {
            step.preload = true;
         }
      });
   },

   afterPreload: function(complete) {
      if (Object.keys(this.locks).length > 0) {
         setTimeout(() => this.afterPreload(complete), 30); // wait until all preload locks are closed
      } else {
         this.preload(); // preload any new preload steps
         complete(this);
      }
   },

   begin: function() {
      this.preload();

      this.afterPreload(() => {
         this.steps.forEach(step => {
            if (step.preload) {
               if (step.waitFor) {
                  this.lock(step.name);
                  step.waitFor.forEach(lock => {
                     if (this.locks[lock]) {
                        var fn = function() {
                           console.log("step: " + step.name);
                           step[step.name].call(this);
                           this.unlock(step.name);
                        };

                        fn.waitFor = step.waitFor;
                        this.locks[lock].done.push(fn);
                     }
                  });
               } else {
                  console.log("step: " + step.name);
                  step[step.name].call(this);
               }
            }
         });
      });

      return this;
   },

   step: function(name) {
      return this.steps[this.steps.findIndex(s => s.name == name)][name].apply(
         this,
         Array.prototype.slice.call(arguments).slice(1)
      );
   },
});

Wiktor.addStep({
   loadExtensions: () => {},
   preload: function() {
      this.lock("loadExtensions");

      Fetch(Wiktor.extensionRegistry, {
         cache: this.storage.cache.core,

         done: extensions => {
            this.unlock("loadExtensions");

            var extensions = JSON.parse(extensions);

            Object.keys(extensions).forEach(ext => {
               this.lock("loadExtensions");

               Fetch(Wiktor.extensionPath + ext + ".js", {
                  async: false,
                  cache: this.storage.cache.extensions,

                  done: (extension, req) => {
                     if (req.status == 200 && extensions[ext].invalidate) {
                        extensions[ext].invalidate.forEach(cache => {
                           this.storage.cache[cache] = {};
                        });
                     }

                     Function('"use strict";' + extension)();
                     console.log("%cloaded extension: " + ext, "color:blue");
                     this.unlock("loadExtensions");
                  },

                  fail: () => {
                     throw new Error(
                        "Wiktor: Failed to load extension: " + ext
                     );
                  },
               });
            });
         },

         fail: () => {
            throw new Error("Wiktor: Failed to load extension list");
         },
      });
   },
});

function wiktor(landing, title) {
   var wiktor = new Wiktor(landing, title);
   return wiktor.begin();
}
