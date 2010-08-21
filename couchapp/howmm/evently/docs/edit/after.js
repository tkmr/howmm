function(){
  var self = $(this);
  var old_data = $$(this).data;

  var textarea = self.find("textarea");
  textarea.bind("keydown", function(){
    zaisu.util.resize_textarea(this);
  });
  zaisu.util.resize_textarea(textarea[0]);

  var form = self.find('form');
  form.bind('submit', function(){
    var doc        = $.extend(old_data, form.serializeObject());
    doc.title      = doc.body.split('\n')[0];
    doc.updated_at = new Date();
    doc.created_at = doc.created_at || doc.updated_at;

    var new_doc = doc._id ? false : true;
    howmm.db.saveDoc(doc, function(save_resp) {
      $("#docs_message").hide().html("{ <span>save done!!</span> }").fadeIn("fast", function(){
        var self = this;
        setTimeout(function(){   $(self).fadeOut("slow")   }, 2000);
      });

      if(new_doc){
        location.hash = ("/docs/edit/"+ save_resp.id);
      }
    });

    return false;
  });
}