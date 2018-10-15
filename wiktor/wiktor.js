/*
   Daniels Kursits (evolbug) 2018
   MIT license
*/

"use strict";
var version = "0.4.3";

var list_opened = "fa fa-caret-down";
var list_closed = "fa fa-caret-right";
var expand_lock = false; // force expand tree

var mobile_width = 767;
var fadetime = 100;

var titlesep = " · ";
var pathpref = "?";
var pathsep = "&";
var subsep = "#";
var indexfile = "index";
var cache = {};

function nullAnchor(path) {
   return "<a onclick='return false' href='" + path + "'>";
}

function checkpath(a, b, elem) {
   var apath = a.split(subsep)[0].split(pathsep);
   var bpath = b.split(subsep)[0].split(pathsep);

   for (var i = 0; i < apath.length; i++) {
      if (apath[i] != bpath[i]) {
         return $("a", elem).filter((_, e) => e.name == a).length > 0;
      }
   }

   return true;
}

function scrollUnderHeader(item) {
   item.scrollIntoView();
   var offset = -$(item)
      .closest("entry")
      .children(".header")
      .outerHeight();

   $("content")[0].scrollBy(0, offset);
   $("body")[0].scrollBy(0, offset);
}

function openpath(path) {
   var all = $("entry").filter((_, e) => checkpath(path, e.id, e));

   all.filter(":hidden").appendTo("content");
   all.fadeIn(fadetime, function() {
      scrollUnderHeader($("[id='" + path.split(subsep)[1] + "']")[0] || all[0]);
   });

   var expandable = path.split(subsep)[0].split(pathsep);

   while (expandable.length > 0) {
      var name = expandable.pop();

      var elem = $("[name='" + name + "']");
      elem = elem.length ? elem : $("[name='" + name + ":index']");
      var list = elem.siblings("ul");
      var icon = $("i.fa", elem);

      list.show();
      icon.removeClass(list_closed);
      icon.addClass(list_opened);
   }
}

function mkpath(path, key = "") {
   path = path.join(pathsep);
   path = (path.length > 0 && path + pathsep) || "";
   return path + key;
}

function preptree(paths) {
   paths.sort();
   var tree = [{}];

   paths.forEach(path => {
      var segments = path.split("/");
      var level = tree;

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

   return tree;
}

function mktree(entries, path = []) {
   var chunk = $("<ul></ul>");

   if (Array.isArray(entries)) {
      if (entries.length == 0) return $("");

      entries.forEach(function(e) {
         mktree(e, path).appendTo(chunk);
      });
   } else if (typeof entries === typeof {}) {
      if (Object.keys(entries).length <= 0) {
         return $("");
      }

      Object.keys(entries).forEach(key => {
         var inner = $("<li></li>");

         $(
            "<a class='pointer' name='" +
               key +
               "'><i class='" +
               (expand_lock ? list_opened : list_closed) +
               "'/>" +
               key.replace("_", " ") +
               "</a>"
         )
            .on("click", e => {
               if (expand_lock) return;

               var list = $(e.target).siblings("ul");
               var icon = $("i.fa", e.target);

               list.toggle();

               if (list.is(":visible")) {
                  icon.removeClass(list_closed);
                  icon.addClass(list_opened);
               } else {
                  icon.removeClass(list_opened);
                  icon.addClass(list_closed);
               }
            })
            .appendTo(inner);

         path.push(key);
         mktree(entries[key], path)
            .hide()
            .appendTo(inner);
         path.pop();

         inner.appendTo(chunk);
      });
   } else {
      path = mkpath(path, entries);
      cache[path] = false;

      chunk = $(
         nullAnchor(pathpref + path) +
            "<li>" +
            entries.replace("_", " ") +
            "</li></a>"
      )
         .on("click", () => {
            history.pushState("", "", pathpref + path);
            mkentry(path, openpath);
         })
         .appendTo(chunk);
   }

   return chunk;
}

function mkentry(path, after) {
   if (cache[path]) {
      if (after) after(path);
      return;
   }

   var entry_root = localStorage.getItem("entry_root") || "";

   cache[path] = true;
   $.get(
      "entries/" +
         entry_root +
         "/" +
         path.replace(new RegExp(pathsep, "g"), "/") +
         ".md",
      { _: $.now() },
      function(entry) {
         var title = path.replace(new RegExp(pathsep, "g"), titlesep);
         if (entry_root.length > 0)
            title = title.replace(entry_root + titlesep, "");
         title = title.replace("_", " ");

         var link = $("<h1 class='header'>").append(
            $(nullAnchor(pathpref + path) + title + "</a><close></close>").on(
               "click",
               () => history.pushState("", "", pathpref + path)
            )
         );

         var entryHtml = $(
            "<entry id='" +
               path +
               "' style='display:none'>" +
               "" +
               marked(entry) +
               "</entry>"
         );
         link.prependTo(entryHtml);
         entryHtml.appendTo("content");

         $("code", entryHtml).each(
            (_, code) => typeof highlight != "undefined" && highlight(code)
         );

         $("a", entryHtml)
            .filter((_, e) => !e.hash && e.href.split(pathpref)[1])
            .attr("onclick", "return false")
            .each((_, e) => {
               $(e).click(() => {
                  mkentry(e.href.split(pathpref)[1], openpath);
                  history.pushState(
                     "",
                     "",
                     pathpref + e.href.split(pathpref)[1]
                  );
               });
            });

         $("a", entryHtml)
            .filter((_, e) => e.hash)
            .each((_, e) => {
               $(e).attr("onclick", "return false");
               $(e).click(() => {
                  var el = $(e.hash)[0];
                  scrollUnderHeader(el);
               });
            });

         $("table", entryHtml)
            .wrap("<div class='table-box'>")
            .each((_, e) => {
               var titles = $("th", $("thead", e)).map((_, e) => e.textContent);
               $("tr", $("tbody", e)).each((_, e) => {
                  $("td", e).each((i, e) => {
                     $(e).prepend(
                        $("<div class='rd-th'>" + titles[i] + "</div>")
                     );
                  });
               });
            });

         $("close", entryHtml).on("click", function() {
            entryHtml.fadeOut(fadetime);
         });

         if (after) $(() => after(path));
      }
   );
}

function wiktor(landing) {
   $.getJSON("wiktor/entries.json", { _: $.now() }, entries => {
      $("body").attr("class", localStorage.getItem("theme") || "light");

      var entry_root = localStorage.getItem("entry_root");
      var tree = preptree(entries);
      tree = entry_root ? tree[0][entry_root] : tree;

      if (tree) {
         mktree(tree).appendTo("links");

         var hashpath = decodeURI(window.location.href.split(pathpref)[1]);

         if (hashpath != "undefined")
            mkentry(hashpath.split(subsep)[0], () => openpath(hashpath));
         else if (landing) mkentry(landing, openpath);

         $(() => {
            $(
               "<a id='version' href='https://github.com/wiktor-wiki/wiktor'>Wiktor " +
                  version +
                  "</a>"
            ).appendTo("#controls");
         });
      }

      if (!($("links ul")[0] && $("links ul")[0].childElementCount != 0)) {
         $("#empty").show();
      }
      $("body").fadeIn(fadetime);
   }).fail(() => {
      $("#empty").show();
      $("body").fadeIn(fadetime);
   });
}
