var zaisu = {};
(function(za){

  //instance
  var Base = function(){};
  Base.prototype.initialize = function(){};
  Base.prototype.log = console.log;

  //klass
  var newclass = function(methods, superclass){
    var klass = function(){
      this.initialize.apply(this, arguments);
    }
    superclass = superclass || Base;
    jQuery.extend(klass.prototype, superclass.prototype, methods);
    return klass;
  }

  //Zaisu
  var util = {
    options_or_callback: function(options){
      //if input a function, wrap to {success: function(){....}}
      if(typeof(options) === 'function'){
        options = util.to_callback(options);
      }
      return (options || {});
    },
    to_callback: function(func){
      return {
        success: func,
        error: alert
      };
    },
    extend_rows: function(rows, extend_func){
      var res = [];
      $(rows).each(function(){
        res.push($.extend(this.value, extend_func.apply(this)));
      });
      return res;
    },
    resize_textarea: function (textarea){
      setTimeout(function(){
        //if (ev.keyCode != 13) return;
        var value = textarea.value || "";
        var lines = 1 + (value.split(/\n/).length);
        if($$(textarea).current_length !== lines){
          textarea.setAttribute("rows", lines);
          $$(textarea).current_length = lines;
        }
      }, 0);
    }
  };

  za.DB = newclass({
    initialize: function(name, options){
      options = options || {};
      this.db = jQuery.couch.db(name, options);
      this.design_name = options.design;
    },

    view: function(name, options){
      //descending
      options = util.options_or_callback(options);
      this.db.view(this.design_name+'/'+name, options);
    },

    openDoc: function(id, options){
      options = util.options_or_callback(options);
      this.db.openDoc(id, options);
    },

    saveDoc: function(obj, options){
      options = util.options_or_callback(options);
      this.db.saveDoc(obj, options);
    }
  });

  za.css = {};
  za.css.loader = function(options){
    var load = function(name){
      var css   = "<link rel='stylesheet' media='all' href='"+ name +"'>";
      $("head").append(css);
    };
    if(navigator.userAgent.search(/iPad|iPhone/i) > -1){
      load(options.ios);
      if(navigator.userAgent.search(/iPhone/i) > -1) load(options.iphone);
      if(navigator.userAgent.search(/iPad/i) > -1) load(options.ipad);
    }
  }

  za.util = util;

})(zaisu);