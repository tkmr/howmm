function(){
  var self     = $(this);
  var form     = self.find('form');
  var textarea = self.find("textarea");
  var old_data = $$(this).data;
  var old_body = textarea[0].value;

  textarea.bind("keydown", function(){
    zaisu.util.resize_textarea(this);
  });
  zaisu.util.resize_textarea(textarea[0]);

  var submit_func = function(stop_chain){
    return function(){
      if(old_body !== textarea[0].value){
        old_body = textarea[0].value;

        var doc        = $.extend(old_data, form.serializeObject());
        doc.title      = doc.body.split('\n')[0];
        doc.updated_at = new Date();
        doc.created_at = doc.created_at || doc.updated_at;

        var new_doc = doc._id ? false : true;
        howmm.db.saveDoc(doc, function(save_resp) {
          howmm.util.message("saved doc!!");

          setTimeout(function(){
            location.hash = ("/docs/"+ save_resp.id);
          }, 800);
        });
      }

      return !stop_chain;
    };
  }

  form.bind('submit', submit_func(true));
  textarea.bind('blur', submit_func(false));
}