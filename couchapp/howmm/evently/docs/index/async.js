function(callback, e, params){
  if(params.docs){
    callback(params.docs);

  }else{
    howmm.db.view('recent-items', {
      success: callback,
      descending: true,
      limit: 20
    });

  }
}