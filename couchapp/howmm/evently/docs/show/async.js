function(callback, e, params){
  howmm.db.openDoc(params.id, function(resp){
    callback(resp);
  });
}