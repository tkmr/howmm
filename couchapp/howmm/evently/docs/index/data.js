function(resp){
  var res = zaisu.util.extend_rows(resp.rows, function(){
    return { href: "#/docs/"+encodeURIComponent(this.id) };
  });
  return {docs: res};
}