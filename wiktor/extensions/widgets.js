Wiktor.Menu = function(options, selected, callback) {
   var widget = $("<widget>");
   var menu = $("<ul>");

   options.forEach(option =>
      $(
         "<li class='option'><input type='radio' " +
            (selected == option ? "checked='checked'" : "") +
            " id='" +
            option +
            "'><label for='" +
            option +
            "'>" +
            option +
            "</label></input></li>"
      )
         .on("click", function(e) {
            callback(option, this);
         })
         .appendTo(menu)
   );

   return widget.append(menu);
};

Wiktor.Input = function(type, placeholder, events) {
   var widget = $("<widget>");
   var input = $(
      "<input type='" + type + "' placeholder='" + placeholder + "'>"
   );
   Object.keys(events).forEach(event => input.on(event, events[event]));
   return widget.append(input);
};
