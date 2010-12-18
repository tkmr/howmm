function(doc) {
  if(doc.body) {
    var target = doc.body;
    target.replace(/  ([^\s]*)  /g, function(total, word){
      if(word.length > 1){
        emit(word, {updated_at: doc.updated_at});
      }
      return '';
    });
  }
};