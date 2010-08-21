function(){
  var id = $$(this).data._id;
  $(this).find("p.docs_body").dblclick(function(){
    location.hash = "/docs/edit/" + id;
  });
}