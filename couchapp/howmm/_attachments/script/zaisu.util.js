var zaisu = zaisu || {};
(function(za){
  //Consts-------------------------------------------
  za.Keys = {
    CHANGE_LAST_SEQ   : "change_last_seq_num",
    DOC_ENTRIES       : 'meta::docs_entries',
    DOC_CLASS         : 'zaisu::doc',
    DOC_ENTRIES_CLASS : 'zaisu::doc_entries'
  };

  //class and instance---------------------------------------
  var Base = function(){};
  Base.prototype['__initialize__'] = function(){};
  Base.prototype['__log__']        = console.log;
  Base.prototype['__bind__']       = function(name, handler){
    $(this).bind(name, handler);
  }
  Base.prototype['__trigger__']    = function(name, params){
    $(this).trigger(name, params);
  }
  Base.prototype['__delegate__']   = function(base, names){
    var self = this;
    $.each(names, function(index, name){
      self[name] = base[name];
    });
  }

  za.newclass = function(methods, superclass){
    var superclass = superclass || Base;

    var my_methods = {};
    $.each(methods, function(key, value){
      my_methods['__'+key+'__'] = value;
    });

    var klass = function(){
      var self = this;
      var constr = this.constructor;

      $.each(constr.prototype, function(key, value){
        var name = key.match(/^__(.*)__$/)[1];
        self[name] = function(){
          return constr.prototype[key].apply(self, arguments);
        }
      });

      this.initialize.apply(this, arguments);
    }
    jQuery.extend(klass.prototype, superclass.prototype, my_methods);
    return klass;
  }

  //Zaisu util-----------------------------------------
  var util = {
    options_or_callback: function(options){
      //if input a function, wrap to {success: function(){....}}
      options = options || {};
      if(typeof(options) === 'function'){
        options = util.to_callback(options);
      }
      options.success = options.success || (function(){});
      options.error   = options.error   || (function(){});
      return options;
    },
    to_callback: function(func){
      return {success: func};
    },
    extend_rows: function(rows, extend_func){
      var res = [];
      $(rows).each(function(){
        res.push($.extend(this.value, extend_func.apply(this)));
      });
      return res;
    },
    resize_textarea: function (textarea, ev){
      setTimeout(function(){
        if (ev.keyCode != 13 && ev.keyCode != 8){
          return;
        }
        var value = textarea.value || "";
        var lines = 3 + (value.split(/\n/).length);
        if($$(textarea).current_length !== lines){
          textarea.setAttribute("rows", lines);
          $$(textarea).current_length = lines;
        }
      }, 0);
    },
    is_ios: function(){
      var ua =navigator.userAgent;
      return (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1 || ua.indexOf('iPod') > -1);
    },
    long_click: function(element, callback){
      var start = za.util.is_ios() ? 'touchstart' : 'mousedown';
      var end   = za.util.is_ios() ? 'touchend'   : 'mouseup';
      var time  = za.util.is_ios() ? 300 : 200;
      var proc  = function(){
        if($$(element).long_clicking) callback();
      }

      $(element).bind(start, function(){
        $$(element).long_clicking = true;
        setTimeout(proc, time);
        return true;
      });

      $(element).bind(end, function(){
        $$(element).long_clicking = false;
        return true;
      });
    },
    design_name: function(options){
      var urlPrefix = options.urlPrefix || "";
      var index     = urlPrefix.split('/').length;
      var fragments = unescape(document.location.href).split('/');
      return fragments[index + 4];
    },
    fork: function(func){
      setTimeout((func || (function(){})), 1);
    },
    parseJSON: function(str){
      return eval("("+str+")");
    }
  };
  za.util = util;

  //Zaisu CSS-----------------------------------------
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

})(zaisu);