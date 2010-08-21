function(doc){
  //new
  if(doc === null || typeof(doc) !== 'object'){
    var doc = {body: ''};
  }

  $$(this).data = doc;
  return doc;
}