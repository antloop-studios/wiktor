/*
   Daniels Kursits (evolbug) 2018
   MIT license
*/

var fadetime = 100;

function mktree(json, path = []) {
   var chunk = "";

   if (Array.isArray(json)) {
      chunk = $(document.createDocumentFragment());
      json.forEach(function(e) {
         mktree(e, path).appendTo(chunk);
      });
   } else if (typeof json === typeof {}) {
      chunk = $("<ul></ul>");
      for (var key in json) {
         $("<a id='" + key + "'><li class='sep'>" + key + "</li></a>").appendTo(
            chunk
         );
         var inner = $("<ul></ul>");
         path.push(key);
         mktree(json[key], path).appendTo(inner);
         path.pop();
         inner.appendTo(chunk);
      }
   } else {
      path = path.join("-");
      path = (path.length > 0 && path + "-") || "";

      chunk = $("<a href='#" + path + json + "'><li>" + json + "</li></a>").on(
         "click",
         function() {
            if (!$("#" + path + json).is(":visible")) {
               $("#" + path + json)
                  .appendTo("content")
                  .fadeIn(fadetime);
            }
         }
      );
   }

   return chunk;
}

function mkentry(json, path = [], defer = []) {
   if (Array.isArray(json)) {
      json.forEach(function(e) {
         mkentry(e, path, defer);
      });
   } else if (typeof json === typeof {}) {
      for (var key in json) {
         path.push(key);
         mkentry(json[key], path.slice(), defer);
         path.pop();
      }
   } else {
      defer.push(
         $.get(
            "entries/" + path.join("/") + "/" + json + ".md",
            { _: $.now() },
            function(data) {
               title = path.join(" · ");
               title = (title.length > 0 && title + " · ") || "";
               path = path.join("-");
               path = (path.length > 0 && path + "-") || "";

               var entryHtml = $(
                  "<entry id=" +
                     path +
                     json +
                     ' style="display:none">' +
                     "<h1>" +
                     title +
                     json +
                     "<close></close></h1>" +
                     marked(data) +
                     "</entry>"
               ).appendTo("content");

               $("close", entryHtml).on("click", function() {
                  entryHtml.fadeOut(100);
               });

               if (
                  entryHtml
                     .prop("id")
                     .startsWith(window.location.hash.substr(1))
               ) {
                  if (!entryHtml.is(":visible")) {
                     entryHtml.appendTo("content").fadeIn(fadetime);
                  }
               }
            }
         )
      );
   }

   return defer;
}

$(function() {
   $.getScript("entries.js", function() {
      mktree(entries).appendTo("links");
      var dentries = mkentry(entries);

      dentries.forEach(function(entry) {
         entry.done(function() {
            $("code").each((_, code) => highlight(code));
         });
      });

      $.when(...dentries)
         .done(function() {
            if ($("content")[0].childElementCount == 0) {
               $("#empty").fadeIn(fadetime);
            }
            $("nav").fadeIn(fadetime);
         })
         .fail(function() {
            if ($("content")[0].childElementCount == 0) {
               $("#empty").fadeIn(fadetime);
            }
            $("nav").fadeIn(fadetime);
         });
   });
});
