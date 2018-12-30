Wiktor.addWidget(function() {
   this.widgets.left.append(
      $("<a class='clickable fa fa-palette'></a>").on("click", () => {
         $("body").swapClass("light", "dark");
         this.storage.theme = $("body").hasClass("dark") ? "dark" : "light";
         this.storage.store();
      })
   );
});
