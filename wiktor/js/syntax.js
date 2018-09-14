/*
   Daniels Kursits (evolbug) 2018
   MIT license
*/


function findall(regex_pattern, string_, typename) {
   var output_list = [];
   while (true) {
      var a_match = regex_pattern.exec(string_);
      if (a_match) {
         output_list.push([typename, a_match[0], a_match.index]);
      } else {
         break;
      }
   }
   return output_list;
}

function highlight(source, tokens, i = 0, last = 0) {
   return tokens[i]
      ? source.slice(last, tokens[i][2])
      + '<span class=' + tokens[i][0] + '>' + tokens[i][1] + '</span>'
      + highlight(source, tokens, i + 1, tokens[i][2] + tokens[i][1].length)
      : '';
}

function compose(source, tokens) {
   var tokens = [].concat(...tokens).sort((a, b) => a[2] >= b[2]);
   var final = [];
   for (var i = 0; tokens[i]; i++) {
      final.push(tokens[i])
      if (tokens[i + 1] && tokens[i][2] == tokens[i + 1][2]) {
         var j = i + 1;
         while (tokens[i][2] + tokens[i][1].length > tokens[j][2] + tokens[j][1].length) j++;
         i = j;
      }
   }
   return highlight(source.innerText, final)
}

function regEscape(string) {
   return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

$.loadLanguage = function (language, success) {
   language = 'wiktor/js/' + language.replace('-', '/') + '.json';
   return $.getJSON(language, null, function (data) {

      data.keywords = new RegExp('\\b(' + data.keywords.join('|') + ')\\b', 'gm')
      data.punctuation = new RegExp('(' + data.punctuation.split('').map(regEscape).join('|') + ')', 'gm')
      data.comment = new RegExp('(' +
         data.comment.map(
            (pair) => '(' + regEscape(pair[0]) + '(.|\\s)*?' + regEscape(pair[1]) + ')'
         ).join('|') + ')', 'gm')
      data.string = new RegExp('(' +
         data.string.map(
            (pair) => '(' + regEscape(pair[0]) + '(\\\\\\\\|\\\\' + regEscape(pair[1]) + '|.|\\s)*?' + regEscape(pair[1]) + ')'
         ).join('|') + ')', 'gm')

      success(data)
   });
};

$(function () {
   $('code').each(function (_, code) {
      if (code.className) {
         $.loadLanguage(code.className, function (lang) {
            var keywords = findall(lang.keywords, code.innerText, 'keyword')
            var punctuation = findall(lang.punctuation, code.innerText, 'punctuation')
            var comments = findall(lang.comment, code.innerText, 'comment')
            var strings = findall(lang.string, code.innerText, 'string')
            code.innerHTML = compose(code, [punctuation, keywords, strings, comments]);
         })
      }
   })
})
