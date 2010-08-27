var zaisu = {};
(function(za){

  //instance
  var Base = function(){};
  Base.prototype.initialize = function(){};
  Base.prototype.log = console.log;

  //klass----------------------------------------------
  var newclass = function(methods, superclass){
    var klass = function(){
      this.initialize.apply(this, arguments);
    }
    superclass = superclass || Base;
    jQuery.extend(klass.prototype, superclass.prototype, methods);
    return klass;
  }

  //Zaisu util-----------------------------------------
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
    }
  };
  za.util = util;

  //Zaisu LocalStorage-------------------------------
  za.LocalStorage = newclass({
    initialize: function(name, options){
      options = options || {};
      this.name = name;
      this.init(options.after_init);
    },

    //methods
    init: function(callback){
      //when use SQLDatabase.
      callback = (callback || function(){});
      setTimeout(callback, 1);
    },
    get: function(key, callback){
      key = this.name+"::"+key;
      var val = localStorage.getItem(key);
      callback(val);
    },
    put: function(key, value, callback){
      key = this.name+"::"+key;
      localStorage.setItem(key, value);
      callback(true);
    },

    //arrow methods
    initA: function(){
      var self = this;
      return Arrow.fromCPS(function(x, k){
        self.init(k);
      });
    },
    getA: function(key){
      var self = this;
      return Arrow.fromCPS(function(x, k){
        self.get(key, k);
      });
    },
    putA: function(key, value){
      var self = this;
      return Arrow.fromCPS(function(x, k){
        self.put(key, (value || x), k);
      });
    }
  });

  //Zaisu Doc----------------------------------------
  za.Doc = newclass({
    initialize: function(doc, options){
      this.doc = doc;
      this.id  = options.id || doc._id;
    }
  });

  //Zaisu DB-----------------------------------------
  za.DB = newclass({
    initialize: function(name, options){
      options    = options || {};
      this.db    = options.couch  || jQuery.couch.db(name, options);
      this.local = options.local  || new za.LocalStorage("zaisu::db");
      this.dname = options.design || za.util.design_name(options);
      this.offline = false;
    },
    db: function(name, options){
      var cdb = $.couch.db(name, options);
      options = $.extend(options, {couch: cdb});
      var zdb = new za.DB(name, options);
      return $.extend(cdb, zdb);
    },
    check_change: function(options, couch_options){
      options       = options || {};
      options.after = options.after || (function(){});
      var mode  = options.check_mode || "once";
      this.last_seq(function(){
				
      });
    }

    //couch API
    view: function(name, options){
      console.log("now view..." + name);
      options = util.options_or_callback(options);

      if(name.search("/") < 1) name = this.dname+'/'+name;
      this.db.view(name, options);
    },
    openDoc: function(id, options, ajaxOptions){
      console.log("now openDoc..." + id);
      options = util.options_or_callback(options);

      this.db.openDoc(id, options, ajaxOptions);
    },
    saveDoc: function(obj, options){
      console.log("now saveDoc..." + obj._id);
      options = util.options_or_callback(options);

      this.db.saveDoc(obj, options);
    }
  });

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