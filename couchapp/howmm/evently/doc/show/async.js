function(callback, e, params){
  if(!params.id && params._id && params.body){
    // params is a document of CouchDB
    callback(params);

  }else{
    // params is a request id
    howmm.db.openDoc(params.id, callback);
  }
}