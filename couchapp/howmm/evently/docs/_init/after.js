function(){
  var self = $(this);
  self.pathbinder("index", "/docs");
  self.pathbinder("edit",  "/docs/edit/:id");
  self.pathbinder("show",  "/docs/:id");
  self.trigger("index");
}


