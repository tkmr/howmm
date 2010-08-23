function(doc){
  doc.body = doc.body.replace(/\n/g, '\n<br />');

  $$(this).data = doc;
  return doc;
}