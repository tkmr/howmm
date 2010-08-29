var zaisu = zaisu || {};
(function(za){

  //class and instance---------------------------------------
  var Base = function(){};
  Base.prototype.initialize = function(){};
  Base.prototype.log = console.log;

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