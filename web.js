(function (undefined) {
  var tail,
      hasModule = (typeof module !== 'undefined' && module.exports),
      globals = {
        click: {

        }
      }
      globalProps = {
        page_url: window.location.href,
        referrer_url: document.referrer
      };

  // create a common namespace with options
  tail = function(query) {
    return new Tail(query);
  };

  function Tail(query) {
    this._queue = [];
    this._elements = document.querySelectorAll(query);
  }

  /************************************
      Tail Prototype
  ************************************/
  extend(Tail.prototype, {
    on : function (type) {
      this._eventType = type || 'click';
      return this;
    },
    track : function (properties) {
      each(this._elements, function (node, i) {
        node.addEventListener(this._eventType, function(event) {
          var obj = this._package(event, properties, node);

          // this._queue.push(obj);
          this._addEvent(obj);
        }.bind(this));
      }.bind(this));
      return this;
    },

    /**
     * Pack the object to be sent to the cloud. Returns the
     * packaged object. Packs global properties to be inherited, then packs the event focused properties, then packs the user specified properties to it.
     *
     * If the event is a click, the properties will defer to a base click set. If it is a hover, it will defer to the hover base set, and so forth.
     * 
     * @param  {[object]} event      [the event object based from the addEventListener api. assume the object exists]
     * @param  {[type]} properties [description]
     * @return {[object]}            
     */
    _package : function (event, properties, element) {
      var obj = {};
      obj.tagName = element.tagName;
      // add the inner text for some tag types
      if (element.tagName === 'A') {
        obj.text = element.innerText;
      }
      // add each attribute
      each(element.attributes, function (index, attr) {
        obj[attr.nodeName] = attr.value;
      });

      obj.timestamp = event.timestamp;
      obj.type = event.type;
      obj.metaKey = event.metaKey;
      debugger;

      obj.classes = element.classList;
      obj.path = getPath.call(element);

      switch(event.type) {
        case 'click':
          extend(obj, globals.click);

          break;
      }

      each(properties, function (prop) {
        if(event.hasOwnProperty(prop)) {
          obj[prop] = event[prop];
        }
      });
      debugger;
      return obj;
    },

    limitTo : function (hookConfig) {
      return this;
    },

    groupBy : function (hookConfig) {
      return this;
    },

    data : function (middleware) {
      if(typeof middleware !== 'function') { return this._queue; }
      this._queue = middleware.call(this, this._queue);
      return this;
    },

    hook : function (hooker) { // Teehee
      this._vessel = hooker.initialize.call(this);
      this._methodMap = extend({}, hooker.methodMap);
      return this;
    },

    onPost: function () {
      return this;
    },

    _addEvent : function (obj) {
      //this.addEvent('shit', {});
      //this.set({});
      //this.addEvent('shit', {});
      debugger;
      this._vessel[this._methodMap.add.name](this._eventType, obj);
    }

  });

  /************************************
      Helpers
  ************************************/
  function each(list, fn) {
    if(list == null) return {};
    var length = list.length;
    if(length === +length) {
      for(var i = 0; i < list.length; i++) {
        fn(list[i], i, list);
      }
    } else {
      for(var key in list) {
        fn(list[key], key, list);
      }
    }
  }

  function extend() {
    var args = Array.prototype.slice.call(arguments, 0);
    var main = args[0] || {};
    for(var i = 1; i < args.length; i++) {
      var obj = args[i];
      each(obj, function(value, key, collection) {
        main[key] = value;
      });
    }
    return main;
  }

  function isMetaKey(event) {
    return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
  }

  /**
   * Gets the path
   * Used with the context of the current node.
   * @param  {[type]} path [description]
   * @return {[type]}      [description]
   */
  function getPath (path) {
    if ( typeof path == 'undefined' ) path = '';

    // If this element is <html> we've reached the end of the path.
    if ( this.localName === 'html' )
      return 'html' + path;

    // Add the element name.
    var cur = this.nodeName.toLowerCase();

    // Determine the IDs and path.
    var id    = this.id,
        klass = this.classList;

    // Add the #id if there is one.
    if ( typeof id !== 'undefined' )
      cur += '#' + id;

    // Add any classes.
    if ( typeof klass !== 'undefined' )
      cur += '.' + Array.prototype.join.call(klass, '.');

    // Recurse up the DOM.
    return getPath.call(this.parentNode, ' > ' + cur + path);
  }

  this['tail'] = tail;

}).call(this);
