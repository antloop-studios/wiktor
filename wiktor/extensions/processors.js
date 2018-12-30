/**
 * @author Daniels Kursits (evolbug) <https://github.com/evolbug>
 * @license MIT
 * @version 0.5.0
 */

"use strict";

$.extend(Wiktor.processors, {
   html: { makeHtml: data => data },
   md: new showdown.Converter({
      tables: true,
      ghCompatibleHeaderId: true,
      disableForced4SpacesIndentedSublists: true,
      simplifiedAutoLink: true,
   }),
});

$.extend(Wiktor.postProcessors, [
   function(html) {
      $("table", html).forEach(table => {
         var titles = $("th", table).map(e => e.textContent);
         $("tr", table).forEach(tr => {
            $("td", tr).forEach((td, i) => {
               $(td).prepend($("<div class='rd-th'>" + titles[i] + "</div>"));
            });
         });
      });
   },
]);
