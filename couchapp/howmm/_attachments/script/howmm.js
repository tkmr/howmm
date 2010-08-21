var howmm = {util: {}};
(function(){

  howmm.db = new zaisu.DB("howmm", {
    design: 'howmm'
  });

  howmm.util.message = function(message){
    $("#docs_message")
      .hide()
      .html("{ <span>"+ message +"</span> }")
      .fadeIn("fast", function(){
        var self = this;
        setTimeout(function(){   $(self).fadeOut("slow")   }, 3000);
      });
  }

})();
