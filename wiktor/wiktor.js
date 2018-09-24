/*
   Daniels Kursits (evolbug) 2018
   MIT license
*/

var fadetime = 100;
var pathsep = ":";
var subsep = "|";
var cache = {};
var indexfile = "index";

function toggleTheme() {
   localStorage.setItem(
      "theme",
      localStorage.getItem("theme") == "dark" ? "light" : "dark"
   );
   $("body").attr("class", localStorage.getItem("theme"));
}

function findall(regex_pattern, string_, typename) {
   var output_list = [];

   while (true) {
      var a_match = regex_pattern.exec(string_);
      if (a_match) {
         output_list.push([
            typename,
            a_match[1],
            a_match.index + (a_match[0].length - a_match[1].length),
         ]);
      } else {
         break;
      }
   }

   return output_list;
}

function process(source, tokens, i = 0, last = 0) {
   return tokens[i]
      ? source.slice(last, tokens[i][2]) +
           "<span class=" +
           tokens[i][0] +
           ">" +
           htmlEscape(tokens[i][1]) +
           "</span>" +
           process(source, tokens, i + 1, tokens[i][2] + tokens[i][1].length)
      : "";
}

function compose(source, tokens) {
   var tokens = [].concat(...tokens).sort((a, b) => a[2] >= b[2]);
   var final = [];

   for (var i = 0; tokens[i]; i++) {
      final.push(tokens[i]);

      if (tokens[i + 1] && tokens[i][2] <= tokens[i + 1][2]) {
         var j = i + 1;

         while (
            tokens[i][2] + tokens[i][1].length >=
            tokens[j][2] + tokens[j][1].length
         ) {
            j++;
         }

         i = j - 1;
      }
   }

   return process(source.innerText, final);
}

function regEscape(unsafe) {
   return unsafe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function htmlEscape(unsafe) {
   return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

function loadLanguage(language, success) {
   language =
      "https://raw.githubusercontent.com/wiktor-wiki/languages/master/" +
      language.replace(/language-/g, "") +
      ".json";

   return $.getJSON(language, { _: $.now() }, function(data) {
      data.keywords = new RegExp(data.keywords, "gm");

      data.punctuation = new RegExp(
         "(" +
            data.punctuation
               .split("")
               .map(regEscape)
               .join("|") +
            ")",
         "gm"
      );

      data.comment = new RegExp(
         "(" +
            data.comment
               .map(pair => "(?:" + pair[0] + "(?:.|\\s)*?" + pair[1] + ")")
               .join("|") +
            ")",
         "gm"
      );

      data.string = new RegExp(
         "(" +
            data.string
               .map(
                  pair =>
                     "(?:" +
                     regEscape(pair[0]) +
                     "(?:\\\\\\\\|\\\\" +
                     regEscape(pair[1]) +
                     "|.|\\s)*?" +
                     regEscape(pair[1]) +
                     ")"
               )
               .join("|") +
            ")",
         "gm"
      );

      success(data);
   });
}

function highlight(code) {
   if (code.className) {
      loadLanguage(code.className, function(lang) {
         var keywords = findall(lang.keywords, code.innerText, "keyword");
         var punctuation = findall(
            lang.punctuation,
            code.innerText,
            "punctuation"
         );
         var comments = findall(lang.comment, code.innerText, "comment");
         var strings = findall(lang.string, code.innerText, "string");

         code.innerHTML = compose(
            code,
            [punctuation, keywords, strings, comments]
         );
      });
   }
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

function openpath(path) {
   var all = $("entry").filter((_, e) => checkpath(path, e.id, e));
   all.filter(":hidden").appendTo("content");
   all.fadeIn(fadetime, function() {
      if ($("[name='" + path + "']")[0])
         $("[name='" + path + "']")[0].scrollIntoView();
      else if (all[0]) all[0].scrollIntoView();
   });
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

      for (var key in entries) {
         var inner = $("<li></li>");

         var link = mkpath(path, key);
         var index = entries[key].indexOf(indexfile);

         if (index > -1) {
            link += pathsep + indexfile;
            entries[key].splice(index, 1);
         }

         $("<a href='#" + link + "'>" + key + "</a>")
            .on("click", () => mkentry(link, () => openpath(link)))
            .appendTo(inner);

         cache[link] = false;

         path.push(key);
         mktree(entries[key], path).appendTo(inner);
         path.pop();

         inner.appendTo(chunk);
      }
   } else {
      path = mkpath(path, entries);
      cache[path] = false;

      chunk = $("<a href='#" + path + "'><li>" + entries + "</li></a>")
         .on("click", () => mkentry(path, openpath))
         .appendTo(chunk);
   }

   return chunk;
}

function mkentry(path, after) {
   Object.keys(cache)
      .filter(e => e.startsWith(path))
      .forEach(path => {
         if (cache[path]) {
            if (after) after(path);
            return;
         }
         cache[path] = true;
         $.get(
            "entries/" + path.replace(new RegExp(pathsep, "g"), "/") + ".md",
            { _: $.now() },
            function(entry) {
               title = path
                  .replace(pathsep + indexfile, "")
                  .replace(new RegExp(pathsep, "g"), " · ");

               var entryHtml = $(
                  "<entry id='" +
                     path +
                     "' style='display:none'>" +
                     "<h1 class='header'>" +
                     title +
                     "<close></close></h1>" +
                     marked(entry) +
                     "</entry>"
               ).appendTo("content");

               $("code", entryHtml).each((_, code) => highlight(code));

               $("a", entryHtml)
                  .filter(
                     (_, a) =>
                        a.hash != "" &&
                        !a.attributes["href"].value.startsWith("/")
                  )
                  .each(
                     (_, e) => (e.hash = "#" + path + subsep + e.hash.substr(1))
                  );

               $("a", entryHtml)
                  .filter(
                     (_, a) =>
                        a.hash != "" &&
                        a.attributes["href"].nodeValue.startsWith("/")
                  )
                  .each((_, e) => {
                     e.attributes["href"].value = e.attributes[
                        "href"
                     ].value.substr(1);

                     $(e).on("click", () =>
                        mkentry(e.hash.substr(1), openpath)
                     );
                  });

               $("a", entryHtml)
                  .filter((_, a) => a.name != "")
                  .each((_, e) => (e.name = path + subsep + e.name));

               $("table", entryHtml).wrap("<div class='table-box'>");

               $("close", entryHtml).on("click", function() {
                  entryHtml.fadeOut(fadetime);
               });

               if (after) after(path);
            }
         );
      });
}
function wiktor(landing) {
   $.getJSON("wiktor/entries.json", { _: $.now() }, entries => {
      $("body").attr("class", localStorage.getItem("theme") || "light");

      mktree(preptree(entries)).appendTo("links");

      if ($("links")[0].childElementCount == 0) {
         $("#empty").fadeIn(fadetime);
      }

      $(() => $("body").fadeIn(fadetime));

      var hashpath = window.location.hash.substr(1);
      if (landing) mkentry(landing, openpath);

      if (hashpath.split(subsep)[0])
         mkentry(hashpath.split(subsep)[0], () => openpath(hashpath));
   }).fail(() => {
      $("#empty").fadeIn(fadetime);
      $("body").fadeIn(fadetime);
   });
}
