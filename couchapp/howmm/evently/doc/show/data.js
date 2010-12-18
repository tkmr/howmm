function(doc){
  //改行
  doc.body = doc.body.replace(/\n/g, '\n<br />');

  //オートリンク
  doc.body = doc.body.replace(/  ([^\s]*)  /g, function(total, word){
    if(word.length > 1){
      return ' <a href="javascript:void(0);" onclick="howmm.current_docs.search(\'' + word + '\')">' + word + '</a> ';
    }else{
      return ' ';
    }
  });

  $$(this).data = doc;

  //試しに created_at をメインとしてみる
  //var d = zaisu.util.parseDate(doc.updated_at);
  var d = zaisu.util.parseDate(doc.created_at || doc.updated_at);

  return $.extend({}, doc, {
    updated_at_str: (d.year+'/'+(d.month+1)+'/'+d.date+' ('+d.day+') '+d.hours+':'+d.minutes)
  });
}