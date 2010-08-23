function(){
  var self     = $(this);
  var form     = self.find("form");
  var textarea = self.find("textarea");
  var old_data = $$(this).data;
  var old_body = textarea[0].value;

  textarea.bind("keydown", function(e){
    zaisu.util.resize_textarea(this, e);
  });
  zaisu.util.resize_textarea(textarea[0], {keyCode: 13});

  var go_to_show = function(new_doc){
    self.trigger('show', [new_doc]);
  }

  var submit_func = function(stop_chain){
    return function(){
      if(old_body !== textarea[0].value){
        old_body = textarea[0].value;

        var doc        = $.extend(old_data, form.serializeObject());
        doc.title      = doc.body.split("\n")[0];
        doc.updated_at = new Date();
        doc.created_at = doc.created_at || doc.updated_at;

        var new_doc = doc._id ? false : true;
        howmm.db.saveDoc(doc, function(save_resp) {
          howmm.util.message("saved doc!!", self);
          setTimeout(function(){ go_to_show(save_resp) }, 600);
        });
      }
      return !stop_chain;
    };
  }

  self.find("a.cancel_edit").click(function(){
    go_to_show(old_data);
  });

  form.bind('submit', submit_func(true));
  textarea.bind('blur', submit_func(false));

  if(zaisu.util.is_ios()){
    setTimeout(textarea.focus, 10);
  }else{
    textarea.focus();
  }
}