(function () {

  var options = {
    pageviewsEventName: "pageviews",
    clicksEventName: "clicks",
    formSubmissionsEventName: "form-submissions",
    globalProperties: {
      page_url: window.location.href,
      referrer_url: document.referrer
    }
  };

  // create a common namespace with options
  var CommonWeb = {
    options: options
  };

  CommonWeb.addGlobalProperties = function(properties) {
    $.extend(CommonWeb.options.globalProperties, properties);
  }

  // setup pageview tracking hooks, optionally including more properties
  // more properties can also be a function
  // do not double set along with track!
  CommonWeb.trackPageview = function (moreProperties) {

    var defaultProperties = CommonWeb.options.globalProperties;
    var properties = $.extend(true, {}, defaultProperties, toProperties(moreProperties));

    CommonWeb.Callback(CommonWeb.options.pageviewsEventName, properties);

  }

  CommonWeb.trackClicks = function (elements, moreProperties) {

    if (typeof elements === 'undefined') {
      elements = $("a");
    }

    $.each(elements, function (index, element) {

      $(element).on('click', function (event) {

        // combine local and global moreProperties
        var properties = toClickProperties(event, element, moreProperties);

        // check if the page is probably going to unload
        var pageWillUnload = element.href && element.target !== '_blank' && !isMetaKey(event);
        var unloadCallback = function () {
        };

        // if the page will unload, don't let the JS event bubble
        // but navigate to the href after the click
        if (pageWillUnload) {
          unloadCallback = function () {
            window.location.href = element.href;
          };
          event.preventDefault();
        }

        CommonWeb.Callback(options.clicksEventName, properties, unloadCallback);

      });

    });

  }

  // track things that are not links; i.e. don't need any special tricks to
  // prevent page unloads
  CommonWeb.trackClicksPassive = function (elements, moreProperties) {

    $.each(elements, function (index, element) {

      $(element).on('click', function (event) {

        var properties = toClickProperties(event, element, moreProperties);
        CommonWeb.Callback(options.clicksEventName, properties);

      });

    });

  }

  // track form submissions
  CommonWeb.trackFormSubmissions = function (elements, moreProperties) {

    $.each(elements, function (index, element) {

      // use to avoid duplicate submits
      var callbackCalled = false;

      $(element).on('submit', function (event) {

        var properties = toSubmitProperties(event, element, moreProperties);

        // assume true for now in this method
        var pageWillUnload = true;
        var unloadCallback = function () {
        };

        if (pageWillUnload) {

          unloadCallback = function () {

            // not the best approach here.
            // the form can only be submitted
            // once, etc.
            if (!callbackCalled) {
              callbackCalled = true;
              element.submit();
            }

          };

          event.preventDefault();
        }

        CommonWeb.Callback(options.formSubmissionsEventName, properties, unloadCallback);

      });

    });
  }

  // define a namespace just for transformations of events and elements to properties
  // override as a workaround to add / remove properties
  CommonWeb.Transformations = {

    eventToProperties: function (event) {

      var properties = {};

      properties['timestamp'] = event.timestamp;
      properties['type'] = event.type;
      properties['metaKey'] = event.metaKey;

      return properties;

    },

    elementToProperties: function (element, extraProperties) {

      var properties = extraProperties || {};

      // add the tag name
      properties.tagName = element.tagName;

      // add the inner text for some tag types
      if (element.tagName === 'A') {
        properties.text = element.innerText;
      }

      // add each attribute
      $(element.attributes).each(function (index, attr) {
        properties[attr.nodeName] = attr.value;
      });

      // break classes out into an array if any exist
      var classes = $(element).attr('class');
      if (classes) {
        properties['classes'] = classes.split(/\s+/)
      }

      properties['path'] = $(element).getPath();

      return properties;

    },

    formElementToProperties: function (formElement) {

      var formValues = {};

      // TODO: remove dependency on jQuery
      formValues.form_values = $("#" + formElement.id).serializeArray();
      // simple alias for now, but could do more as
      // far as the form values are concerned
      return this.elementToProperties(formElement, formValues);

    }

  }

  function toClickProperties(event, element, moreProperties) {

    var defaultProperties = CommonWeb.options.globalProperties;
    var properties = $.extend(true, {}, defaultProperties, toProperties(moreProperties, [event, element]));

    var elementProperties = { element: CommonWeb.Transformations.elementToProperties(element, null) };
    var eventProperties = { event: CommonWeb.Transformations.eventToProperties(event) };

    return $.extend(true, {}, properties, elementProperties, eventProperties);

  }

  function toSubmitProperties(event, element, moreProperties) {

    var defaultProperties = CommonWeb.options.globalProperties;
    var properties = $.extend(true, {}, defaultProperties, toProperties(moreProperties, [event, element]));

    var elementProperties = { element: CommonWeb.Transformations.formElementToProperties(element) };
    var eventProperties = { event: CommonWeb.Transformations.eventToProperties(event) };

    return $.extend(true, {}, properties, elementProperties, eventProperties);

  }

  function toProperties(propertiesOrFunction, args) {
    if (typeof propertiesOrFunction === 'function') {
      debugger;
      return propertiesOrFunction.apply(window, args);
    } else {
      return propertiesOrFunction
    }
  }

  function isMetaKey(event) {
    return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
  }

  /*
   jQuery-GetPath v0.01, by Dave Cardwell. (2007-04-27)

   http://davecardwell.co.uk/javascript/jquery/plugins/jquery-getpath/

   Copyright (c)2007 Dave Cardwell. All rights reserved.
   Released under the MIT License.


   Usage:
   var path = $('#foo').getPath();
   */
  jQuery.fn.extend({
    getPath: function( path ) {
      // The first time this function is called, path won't be defined.
      if ( typeof path == 'undefined' ) path = '';

      // If this element is <html> we've reached the end of the path.
      if ( this.is('html') )
        return 'html' + path;

      // Add the element name.
      var cur = this.get(0).nodeName.toLowerCase();

      // Determine the IDs and path.
      var id    = this.attr('id'),
        klass = this.attr('class');

      // Add the #id if there is one.
      if ( typeof id != 'undefined' )
        cur += '#' + id;

      // Add any classes.
      if ( typeof klass != 'undefined' )
      cur += '.' + klass.split(/[\s\n]+/).join('.');

      // Recurse up the DOM.
      return this.parent().getPath( ' > ' + cur + path );
    }
  });

  // backends

  CommonWeb.Keen = {
    Client: null,
    Debug: false,
    Callback: function (collection, properties, callback) {
      CommonWeb.Keen.Client.addEvent(collection, properties, function() {
        if (CommonWeb.Keen.Debug) {
          console.log(collection + ": " + JSON.stringify(properties));
        }
        if (callback) {
          callback();
        }
      });
    },
    globalProperties: {
      keen: {
        addons: [
          {
            "name": "keen:ip_to_geo",
            "input": {
              "ip": "ip_address"
            },
            "output": "ip_geo_info"
          },
          {
            "name": "keen:ua_parser",
            "input": {
              "ua_string": "user_agent"
            },
            "output": "parsed_user_agent"
          },
          {
            "name": "keen:url_parser",
            "input": {
              "url": "page_url"
            },
            "output": "parsed_page_url"
          },
          {
            "name": "keen:referrer_parser",
            "input": {
              "referrer_url": "referrer_url",
              "page_url": "page_url"
            },
            "output": "referrer_info"
          }
        ]
      },
      ip_address: "${keen.ip}",
      user_agent: "${keen.user_agent}"
    }
  };

  window.CommonWeb = CommonWeb;

})();
