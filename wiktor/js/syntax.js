/*
   Daniels Kursits (evolbug) 2018
   MIT license
*/

function findall(regex_pattern, string_, typename) {
   var output_list = [];

   while (true) {
      var a_match = regex_pattern.exec(string_);
      console.log(a_match);
      if (a_match) {
         output_list.push([
            typename,
            a_match[1],
            a_match.index + (a_match[0].length - a_match[1].length),
         ]);
         console.log(
            "aaa " + (a_match.index + (a_match.index - a_match[1].length))
         );
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

      if (tokens[i + 1] && tokens[i][2] == tokens[i + 1][2]) {
         var j = i + 1;

         while (
            tokens[i][2] + tokens[i][1].length >
            tokens[j][2] + tokens[j][1].length
         ) {
            j++;
         }

         i = j;
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
   language = "wiktor/js/" + language.replace("-", "/") + ".json";

   return $.getJSON(language, null, function(data) {
      data.keywords = new RegExp(
         "(?:" + data.keywords.join(")|(?:") + ")",
         "gm"
      );

      data.punctuation = new RegExp(
         "(" +
            data.punctuation
               .split("")
               .map(regEscape)
               .join("|") +
            ")",
         "gm"
      );
      console.log(data.punctuation);

      data.comment = new RegExp(
         "(" +
            data.comment
               .map(
                  pair =>
                     "(" +
                     regEscape(pair[0]) +
                     "(.|\\s)*?" +
                     regEscape(pair[1]) +
                     ")"
               )
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
         console.log(code);
         var keywords = findall(lang.keywords, code.innerText, "keyword");
         console.log(keywords);
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
