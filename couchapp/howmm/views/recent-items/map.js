function(doc) {
  if (doc.updated_at) {
    emit(doc.updated_at, doc);
  }
};