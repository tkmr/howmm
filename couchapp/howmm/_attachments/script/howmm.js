var howmm = {util: {}};
(function(){

  var dbname = location.toString().match(/\/(howmm?)\//)[1];
  howmm.db = new zaisu.DB(dbname, {
    design: 'howmm'
  });

  howmm.docs = function(element, app){
    $(element).evently("docs", app);
    $(element).pathbinder("index", "/docs");
    $(element).pathbinder("edit",  "/docs/edit/:id");
    $(element).pathbinder("show",  "/docs/:id");

    this.index = function(){
      $(element).trigger("index");
    }
  }

  howmm.util.message = function(message, base){
    $(base).find(".docs_message")
      .hide()
      .html("<span>"+ message +"</span>")
      .fadeIn("fast", function(){
        var self = this;
        setTimeout(function(){   $(self).fadeOut("slow")   }, 3000);
      });
  }

})();
