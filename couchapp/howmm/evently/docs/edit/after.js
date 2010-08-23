function(e, params){
  var app = $$(this).app;
  var doc = $(this).find("div.doc_holder");
  doc.evently('doc', app);
  doc.trigger('edit', [params]);
}