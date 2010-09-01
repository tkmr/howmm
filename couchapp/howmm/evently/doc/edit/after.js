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

  var save_doc = function(switch_to_show){
    if(old_body !== textarea[0].value){
      old_body = textarea[0].value;

      var doc        = $.extend(old_data, form.serializeObject());
      doc.title      = doc.body.split("\n")[0];
      doc.updated_at = new Date();
      doc.created_at = doc.created_at || doc.updated_at;

      var new_doc = doc._id ? false : true;
      howmm.db.saveDoc(doc, function(save_resp) {
        howmm.util.message("saved doc!!", self);
        if(switch_to_show){
          setTimeout(function(){ go_to_show(save_resp) }, 100);
        }
      });
    }
  };

  var submit_action = function(stop_chain){
    return function(){
      save_doc(true);
      return !stop_chain;
    }
  }

  form.bind('submit', submit_action(true));
  textarea.bind('blur', submit_action(false));

  self.find("a.cancel_edit").click(function(){
    go_to_show(old_data);
  });

  if(zaisu.util.is_ios()){
    setTimeout(function(){
      //textarea[0].focus();
    }, 50);
  }else{
    textarea.focus();
  }
}