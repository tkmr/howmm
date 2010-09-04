function(){
  var app    = $$(this).app;
  var data   = $$(this).data;
  var holder = $(this).find("div.docs_holder");

  var gen_doc = function(){
    var doc = $("<div class='doc'></div>");
    doc.evently('doc', app);
    return doc;
  }

  //new window hack (re-cycle)
  var temp = {};
  temp.init = function(){
    var doc = gen_doc();
    holder.prepend(doc);
    doc.one('show', temp.init);
    doc.trigger('edit', [{id: 'new'}]);
  }
  temp.init();


  $(data.docs).each(function(){
    var doc = gen_doc();
    holder.append(doc);
    doc.trigger('show', [this]);
  });
}