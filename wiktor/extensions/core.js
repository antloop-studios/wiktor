/**
 * @author Daniels Kursits (evolbug) <https://github.com/evolbug>
 * @license MIT
 * @version 0.5.0
 */

"use strict";

$.extend(Wiktor.prototype, {
   header: function(title, date) {
      title = title.split("/").filter(Boolean);
      return (
         "<header>" +
         "<div>" +
         "<span>" +
         title[title.length - 1] +
         "</span>" +
         "<date>" +
         date +
         "</date>" +
         "</div>" +
         "<close/>" +
         "</header>"
      );
   },

   drawEntry: function(entry) {
      entry = "/" + $.trim(entry.split("#")[0], "/") + "/";

      if (entry != "/404/") {
         entry = $(
            "<article id='" +
               entry +
               "' date='" +
               this.storage.cache.entries[entry].date +
               "'>" +
               this.header(entry, this.storage.cache.entries[entry].date) +
               "<section>" +
               this.storage.cache.entries[entry].data +
               "</section>" +
               "</article>"
         );

         $("close", entry).on("click", () => entry[0].remove());

         $("a", entry)
            .filter(
               a =>
                  a.attributes.href &&
                  a.attributes.href.value.match(/^(\.*\/+)+/)
            )
            .forEach(a =>
               $(a).on("click", e => {
                  e.preventDefault();
                  this.openEntry(a.attributes.href.value);
               })
            );

         $("a", entry)
            .filter(a => a.hash && a.attributes.href.value.match(/^#/))
            .forEach(a =>
               $(a).on("click", e => {
                  e.preventDefault();
                  this.scrollIntoView($(a.attributes.href.value, entry)[0]);
               })
            );
      } else {
         entry = $(
            "<article id='" +
               entry +
               "' date='" +
               this.notFound.date +
               "'>" +
               this.header(entry, this.notFound.date) +
               "<section>" +
               this.notFound.data +
               "</section>" +
               "</article>"
         );

         $("close", entry).on("click", () => entry[0].remove());
      }

      entry.appendTo("main");
   },

   scrollIntoView: function(item) {
      $("main")[0].scrollTop = item.offsetTop - $("header")[0].offsetHeight;
      $("body")[0].scrollTop = item.offsetTop - $("header")[0].offsetHeight;
   },

   openEntry: function(path) {
      var hash = path.split("#")[1];
      var fullpath = path;
      path = "/" + $.trim(path.split("#")[0], "/") + "/";

      if (Object.keys(this.storage.cache.entries).indexOf(path) >= 0) {
         if ($("[id='" + path + "']").length == 0) this.drawEntry(path);
         this.scrollIntoView($("[id='" + (hash || path) + "']")[0]);

         if (path != "/404/") {
            var expandable = path.split("/").filter(Boolean);

            while (expandable.length > 0) {
               var elem = $("[name='" + expandable.pop() + "']");
               var list = elem.siblings("ul");
               var icon = $("i.fa", elem);

               list.show();
               icon.removeClass(this.nav.closed);
               icon.addClass(this.nav.opened);
            }
         }
         history.replaceState("", "", fullpath);
         document.title =
            this.title + " - " + path.split(new RegExp("([^\\/]+)\\/$"))[1];
      } else {
         this.drawEntry("/404/");
         document.title = this.title + " - 404";
      }
   },

   setRoot: function(root) {
      this.storage.root = $.trim(root, "/") + "/";
      if (this.storage.root != this.storage.restore("root"))
         this.storage.cache.entries = {};
      this.storage.store();
   },

   postProcess: function(entry) {
      entry = $("<div>" + entry + "</div>");
      Wiktor.postProcessors.forEach(p => p.apply(this, [entry]));
      return entry[0].innerHTML;
   },
});

Wiktor.addStep([
   {
      drawLayout: () => {},
      preload: function() {
         $(this.layout).appendTo("body");
         $("body").addClass(this.storage.theme);
      },
   },
   {
      loadEntrylist: function() {
         this.lock("loadEntrylist");

         Fetch(this.entry.list, {
            cache: this.storage.cache.core,
            done: paths => {
               this.paths = JSON.parse(paths);
               this.unlock("loadEntrylist");
            },
            fail: () => {
               throw new Error("Wiktor: Failed to load entry index");
            },
         });
      },
   },
   {
      waitFor: ["loadEntrylist"],
      loadEntries: function() {
         this.paths = this.paths
            .filter(path => path.startsWith(this.storage.root))
            .map(path => path.replace(this.storage.root, ""));

         this.paths.forEach(entry => {
            var parts = entry
               .split(new RegExp("\\.([^\\.]+)$"))
               .filter(Boolean);

            if (parts[1]) {
               this.lock("loadEntries");

               Fetch(this.entry.root + this.storage.root + entry, {
                  alias: "/" + parts[0] + "/",
                  cache: this.storage.cache.entries,
                  done: (data, req) => {
                     if (req.status == 200) {
                        this.storage.cache.entries[
                           "/" + parts[0] + "/"
                        ].data = this.postProcess(
                           (Wiktor.processors[parts[1]] &&
                              Wiktor.processors[parts[1]].makeHtml(data)) ||
                              data
                        );
                     }

                     this.unlock("loadEntries");
                  },
                  fail: () => this.unlock("loadEntries"),
               });
            }
         });
      },
   },
   {
      waitFor: ["loadEntrylist"],
      buildNavigation: function() {
         this.navigation = [{}];

         this.paths.sort().forEach(path => {
            var segments = path.split("/");
            var level = this.navigation;

            segments.forEach(seg => {
               var existingPath = level[0][seg];

               if (existingPath) {
                  level = existingPath;
               } else if (seg.endsWith(".md")) {
                  level.push(seg.replace(".md", ""));
               } else {
                  level[0][seg] = [{}];
                  level = level[0][seg];
               }
            });
         });
      },
   },
   {
      waitFor: ["loadEntrylist"],
      drawNavigation: function(branch = this.navigation, path = []) {
         var self = this;
         var chunk = $("<ul></ul>");
         var fold =
            "<i class='" +
            (this.nav.is_locked ? this.nav.opened : this.nav.closed) +
            "'></i>";

         if (Array.isArray(branch)) {
            if (branch.length > 0)
               branch.forEach(b =>
                  chunk.append(this.step("drawNavigation", b, path))
               );
         } else if (typeof branch === typeof {}) {
            if (Object.keys(branch).length > 0) {
               Object.keys(branch).forEach(key => {
                  var inner = $("<li></li>");
                  $("<a name='" + key + "'>" + fold + "<b>" + key + "</b></a>")
                     .on("click", function(e) {
                        if (!self.nav.is_locked) {
                           var list = $(this).siblings("ul");
                           var icon = $("i.fa", this);

                           if (list.toggle().is_visible()) {
                              icon.replaceClass(
                                 self.nav.closed,
                                 self.nav.opened
                              );
                           } else {
                              icon.replaceClass(
                                 self.nav.opened,
                                 self.nav.closed
                              );
                           }
                        }
                     })
                     .appendTo(inner);

                  path.push(key);
                  this.step("drawNavigation", branch[key], path)
                     .hide()
                     .appendTo(inner.appendTo(chunk));
                  path.pop();
               });
            }
         } else {
            path = path.join("/");
            var link = (path && "/" + path) + "/" + branch + "/";
            chunk = $(new DocumentFragment()).append(
               $(
                  "<a name='" +
                     branch +
                     "' href='" +
                     link +
                     "'><li>" +
                     branch.replace("_", " ") +
                     "</li></a>"
               ).on("click", function(e) {
                  e.preventDefault();
                  self.openEntry(link);
               })
            );
         }

         return branch == this.navigation ? chunk.appendTo("nav") : chunk;
      },
   },
   {
      waitFor: ["loadEntries", "drawNavigation"],
      drawLanding: function() {
         var landing =
            window.location.pathname.length > 1
               ? decodeURI(window.location.pathname)
               : this.landing;
         this.openEntry(landing);
      },
   },
   {
      waitFor: ["loadEntries"],
      persistStorage: function() {
         this.storage.store();
      },
   },
   {
      waitFor: ["drawNavigation"],
      drawWidgets: function() {
         this.popups = $("popups");
         this.widgets = $("widgets");
         this.widgets.left = $(".left", this.widgets);
         this.widgets.center = $(".center", this.widgets);
         this.widgets.right = $(".right", this.widgets);

         Wiktor.widgets.forEach(widget => widget.call(this));
      },
   },
   {
      waitFor: ["loadEntries"],
      loadExtras: function() {
         var extras = [
            "https://use.fontawesome.com/releases/v5.3.1/css/fontawesome.css",
            "https://use.fontawesome.com/releases/v5.3.1/css/regular.css",
            "https://use.fontawesome.com/releases/v5.3.1/css/solid.css",
            "https://fonts.googleapis.com/css?family=Montserrat",
            "https://gitcdn.link/cdn/tonsky/FiraCode/1.206/distr/fira_code.css",
            "https://cdnjs.cloudflare.com/ajax/libs/mark.js/8.11.1/mark.min.js",
         ];
         extras.forEach(link => {
            if (link.endsWith(".js")) {
               this.lock("loadExtras");
               Fetch(link, {
                  done: data => {
                     Function(data)();
                     this.unlock("loadExtras");
                  },
               });
            } else if (link.endsWith(".css")) {
               $("head").append("<link rel='stylesheet' href='" + link + "'/>");
            }
         });
      },
   },
]);
