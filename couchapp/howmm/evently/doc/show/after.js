function(){
  var self = this;
  var id   = $$(self).data._id;
  var element = $(self).find("p.docs_body");

  var go_to_edit = function(){
    $(self).trigger('edit', [ {id: id} ]);
  }

  $(self).find("a.go_edit").click(go_to_edit);
  $(self).find("p.docs_body").dblclick(go_to_edit);
  $(self).find("a.edit_switch").click(go_to_edit);


  $(self).find("a.collaps_switch").hide();
  $(self).find("a.expand_switch").click(function(){
    $(self).find("a.expand_switch").hide();
    $(self).find("a.collaps_switch").show();

    $(self).find("p.docs_body").css({"max-height":"none"});
  });

  $(self).find("a.collaps_switch").click(function(){
    $(self).find("a.expand_switch").show();
    $(self).find("a.collaps_switch").hide();

    $(self).find("p.docs_body").css({"max-height":"17em"});
  });
}