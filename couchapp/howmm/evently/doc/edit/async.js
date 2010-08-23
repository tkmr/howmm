function(callback, e, params){
  if(params.id === 'new'){
    //new
    setTimeout(function(){
      callback(null);
    }, 1);

  }else{
    //update
    howmm.db.openDoc(params.id, function(resp){
      callback(resp);
    });

  }
}