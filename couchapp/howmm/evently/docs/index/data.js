function(resp){
  var res = [];

  $(resp.rows).each(function(){
    res.push($.extend(this.value, {
      href: "#/docs/" + encodeURIComponent(this.id)
    }));
  });

  return {docs: res};
}