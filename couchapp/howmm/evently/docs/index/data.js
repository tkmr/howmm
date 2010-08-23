function(resp){
  var res = zaisu.util.extend_rows(resp.rows, function(){
    return { href: "#/docs/"+encodeURIComponent(this.id) };
  });
  var data = {docs: res};

  $$(this).data = data;
  return data;
}