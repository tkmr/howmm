function(callback, e, params){
  howmm.db.view('recent-items', {
    success: callback,
    descending: true
  });
}