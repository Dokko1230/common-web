# CommonWeb

*Under Construction! Documentation and code may not be in sync yet. Have a question? Just ask!*

CommonWeb is an open source JavaScript library that transforms common web user activity into a stream
of event data you can listen to and analyze. CommonWeb listens for:

+ Pageviews
+ Clicks
+ Form Submissions
+ More...

And emits a JSON representation of each, loaded with useful properties.

The data emitted by CommonWeb can be used to compute traditional web metrics like:

+ Visits and Visitors
+ Time on Site
+ Bounce Rate
+ Content Ranking
+ …and more

CommonWeb supports integrations with services like [Keen IO](https://keen.io/) that provide
 tools for analyzing and reporting on streams of event data.

### Philosophy

CommonWeb is more of a collection tool than an analysis tool. The philosophy
behind CommonWeb is that data collection is hard, but 80% of what needs to be collected
is common to everybody, and auto-collecting the 80% can enable a lot of basic reporting.

The analysis of the data, on the other hand, varies widely based on what you're trying
to learn about your users and how your product or web site works. For example, exactly how you
define a **cohort** might be very different than the company next door.

CommonWeb:

+ Automatically collects the 80% of interesting web events and properties
+ Lets you customize or add new events and properties (the 20% specific to you)
+ Send data to configurable back-ends or fire JavaScript callbacks

CommonWeb's job is to capture web analytics data in a consistent but configurable fashion.
Consistency has its advantages. For example, reporting tools built with commmon-web in mind can
be useful to anyone!

### Already a Keen IO user?

Hooray! <# <3 CommonWeb can help level up your web analytics game. It might allow you to pare down old
tracking code, or just learn something new about your users.

CommonWeb is not a replacement for [keen-js](https://github.com/keenlabs/keen-js). Rather,
it sits on top of it, while providing a data model and higher level abstractions than `addEvent`.

### Installation

Download [common-web.js](https://github.com/keenlabs/common-web/blob/master/common-web.js) from this repository into your project and include it on your pages.

```html
<script type="text/javascript" src="/javascripts/common-web.js"></script>
```

Make sure to change `/javascripts/common-web.js` if that's not where the file is in your project.

##### Dependencies

CommonWeb has no dependencies. It's a plug and play system where you pick your favorite backend, may it be [keen](http://keen.io), [firebase](http://firebase.com), [parse](http://parse.com), or custom!

### Usage

CommonWeb is designed in a way that is chainable and easily configurable.
```js
tail(document.getElementById('purchase'))
  .on('click')
  .track(['classname', 'id', 'x', 'y'])
  .data(function(data) {
    return data.map(function(item) {
      return $.extend(item, { extra : 'property' });
    });
  }) // Do data manipulations here
  .hook({
      initialize: function() {
        // Should return the client of whatever you're pushing shit with is
        var client = new Keen({
          projectId: "541c624f7d8cb9208a59fe91",
          writeKey: "734dea987282e4b08a37ecb6bed439274fb821de5816b507f7b24ad224b16a2551100ed67e3116501001acf1be51dc62500afcba8bccc5d3e4617419a272274da9fb3e7f6e171cb3341b3f9a2526ceb2c7a23f14eec62691e32dc26d4e5b835ad4586a4344012af7c9f817539d837c7e"
        });
        return client;
      },
      methodMap: {
        add: {
          name: 'addEvent',
          parameters: ['title', 'obj']
        }
      }
  })
  .onPost(function() {
    console.log('success');
  })
```

### API

##### CommonWeb([DOMNode])
*Creates an instance of CommonWeb.*
```js
var web = CommonWeb(document.getElementById('true_price'));
```

##### .global([object (optional) properties])
*Gets or sets the global properties. If the properties parameter does not exists, CW gets all global properties.The default data model used to represent events is described in another section below. Sometimes you may need to include more properties. For example, maybe you need to include extra user properties that allow for further segmenting analysis down the road.*
```js
// getter
var globals = web.global();
// setter
web.global({
  useragent: 'a sample user agent',
  username: 'John Ford'
});
```


##### .on([string eventType])
*Specifies the type of event that an element should be listening to.Specifies CW to listen to the node on click. This is true to any event type that can be applied to *addEventListener* api. See [here](http://en.wikipedia.org/wiki/DOM_events#Touch_events) for more.*
```js
web.on('click');
```

##### .track([array properties], [boolean isPassive = false])
*Starts tracking the items. Defaults to the page when eventType is not speificied. isPassive is false by default. See [Blocking vs. Non-Blocking](#Blocking vs. Non-Blocking) for more details.*
```js
web.track(['x', 'y', 'timestamp', 'classList'])
web.track(['x','width'], true);
```

##### .limitTo([number])
*Limits the number of items to track.*
```js
web.limitTo(4)
```

##### .groupBy([string eventType])
*Groups the events to be stored by a property in the event*
```js
web.groupBy('className');
```

##### .data([function fn])
*Tinker with the object to be passed to the server. Acts as middleware for the data*
```js
web.data(function(eventObject) {
  eventObject.whoohoo = 'more properties to be added';
  eventObject.username = `this is actually useful guys`;
});
```

##### .hook([object hooker])
*The hook method is the configuration for the backend of your choosing.*
```js
// Hook for keen-js
web.hook({
  // function must return the instance of the db client, that has the method to push data
  initialize: function() {
    var client = new Keen({
      projectId: "541c624f7d8cb9208a59fe91",
      writeKey: "734dea987282e4b08a37ecb6bed439274fb821de5816b507f7b24ad224b16a2551100ed67e3116501001acf1be51dc62500afcba8bccc5d3e4617419a272274da9fb3e7f6e171cb3341b3f9a2526ceb2c7a23f14eec62691e32dc26d4e5b835ad4586a4344012af7c9f817539d837c7e"
    });
    return client;
  },
  // map for the adding command
  methodMap: {
    add: {
      name: 'addEvent',
      parameters: ['title', 'obj']
    }
  }
});
```
You can also hook into multiple backends!

```js
web
  .hook({
    initialize: function() {
      return new Firebase(/* url */);
    },
    methodMap: {
      add: {
        name: 'set'
      }
    }
  })
  .hook({
    initialize: function() {
      return new keen(/* configs */);
    },
    methodMap: {
      add: {
        name: addEvent
      }
    }
  });
```

##### .onPost([function fn])
*The callback function to be invoked on post*
```js
web.onPost(function(status) {
  // Do magic here
});
```

##### .error([function fn])
*Invoked on error*
```js
web.error(function(err) {
  console.log('Error: ', err);
});
```

### Blocking vs. Non-Blocking

Most links (`<a>` tags) unload pages when they are clicked
because the user is being taken to a new page. Same with traditional, non-ajax form submissions.
If the page unloads before a call to record the event is finished the event may not be recorded. This
is a common issue in web analytics that often goes noticed to the detriment of accurate data.

CommonWeb's solution is to have you specify explicitly when to work around this scenario; i.e. to
tell CommonWeb what links / forms are going to unload the page. In that case CommonWeb will prevent the default
browser action, record the event with the backend, and then re-initiate the action.

### Specify HTML Elements (Recommended)

If you only want certain elements tracked, pass them in as the first argument to the track methods:

```javascript
// track clicks on the nav
CommonWeb(document.querySelectorAll('.nav a'));

// track clicks with a specific attribute
CommonWeb.trackClicks(document.querySelectorAll('a[data-track=true]');
```

The same arguments work for tracking non-link-clicks and forms:

```javascript
CommonWeb(document.querySelectorAll('span.less'))
          .on('hover')
          .track(['someAttribute']);

CommonWeb(document.querySelectorAll('form'))
          .on('submit')
          .track(['value']);
```

##### Words of Caution

CommonWeb is designed to make tracking automatic, but the design is also aware that
tracking certain elements may not be desired, or worse, may cause unexpected behavior.

That's why, at least for now, explicitly passing the elements you care about is preferred
over grabbing everything.

And be careful not to wire up the same element twice!

### Data Model - Event Types

CommonWeb identifies several event types based on the interaction
- `pageviews`, `clicks`, `form-submissions`. The event type is added to the JSON payload that represents each event so it can be used in analysis.

### Data Model - Event Properties

##### Global

These properties are sent with every event by default:

+ `page_url` - The `window.location.href` of the current page
+ `referrer_url` - The `document.referrer` of the current page

##### Events and Elements

JavaScript event and HTML element objects are turned into JSON structures and
places at the `event` and `element` top level keys respectively.

##### Keen Backend

*More documentation needed here*

Here's an example `clicks` event that shows what properties are collected:

``` json
[
  {
    "parsed_user_agent": {
      "device": {
        "family": "Other"
      },
      "os": {
        "major": "10",
        "patch_minor": null,
        "minor": "9",
        "family": "Mac OS X",
        "patch": "3"
      },
      "browser": {
        "major": "36",
        "minor": "0",
        "family": "Chrome",
        "patch": "1985"
      }
    },
    "referrer_info": {
      "source": null,
      "term": null,
      "medium": null
    },
    "parsed_page_url": {
      "path": "/Users/dzello/keen/common-web/index.html",
      "domain": "",
      "protocol": "file",
      "anchor": null
    },
    "element": {
      "style": "color: blue",
      "text": "Hello world!",
      "id": "link-0",
      "href": "./index.html",
      "tagName": "A",
      "path": "html > body > p > a#link-0.classy.classy2.classy3",
      "classes": [
        "classy",
        "classy2",
        "classy3"
      ],
      "class": "classy classy2 classy3"
    },
    "keen": {
      "timestamp": "2014-08-12T09:19:28.605Z",
      "created_at": "2014-08-12T09:19:28.605Z",
      "id": "53e9dc20c9e163024bc2c799"
    },
    "referrer_url": "",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36",
    "ip_geo_info": {
      "province": "California",
      "city": "San Francisco",
      "postal_code": "94103",
      "continent": "North America",
      "country": "United States"
    },
    "ip_address": "199.247.206.130",
    "event": {
      "metaKey": false,
      "type": "click"
    },
    "page_url": "file:///Users/dzello/keen/common-web/index.html"
  }
]
```

### Further Documentation and Examples

##### Example Page w/ Keen IO Backend

Open `index.html` after cloning this project and head to the console.
It will prompt you first to fill out Keen IO project information so that
there's somewhere to capture your events. The annoying pop-ups will go away
once you've put that in. It's there so that you don't have to hand edit the file
and then accidentally end up checking your credentials in.

The example page shows you a variety of elements. You can click on each and see
the event generated by viewing the JavaScript console.

### Contributing

Please do! Right now this project needs some tests.

##### Wishlist

+ Timeout and continue if a backend takes too long
+ Session ID and session age properties
+ Capture even more common interactions (e.g. time on page)
+ Create dashboards and visualizations based on this data!
+ AJAX Form Handling
