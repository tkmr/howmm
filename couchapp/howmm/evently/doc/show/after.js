function(){
  var self = this;
  var id   = $$(self).data._id;
  var element = $(self).find("p.docs_body");

  var go_to_edit = function(){
    $(self).trigger('edit', [ {id: id} ]);
  }

  $(self).find("a.go_edit").click(function(){
    go_to_edit();
  });
}