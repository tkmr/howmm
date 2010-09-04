function(doc){
  doc.body = doc.body.replace(/\n/g, '\n<br />');

  $$(this).data = doc;

  var d = zaisu.util.parseDate(doc.updated_at);
  return $.extend({}, doc, {
    updated_at_str: (d.year+'/'+d.month+'/'+d.date+' ('+d.day+') '+d.hours+':'+d.minutes)
  });
}