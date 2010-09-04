function(doc){
  //new
  if(doc === null || typeof(doc) !== 'object'){
    var doc = {body: ''};
  }

  $$(this).data = doc;

  if(doc.updated_at){
    var d = zaisu.util.parseDate(doc.updated_at);
    return $.extend({}, doc, {
      updated_at_str: (d.year+'/'+d.month+'/'+d.date+' ('+d.day+') '+d.hours+':'+d.minutes)
    });

  }else{
    return doc;

  }
}