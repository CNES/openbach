!function(e){Drupal.behaviors.web3_mediatheque={attach:function(t){e("form").submit(function(){var t=e(this),i=function(e){return e.preventDefault(),!1};t.find("input[type=submit],input[type=image]").bind("click",i).addClass("secured"),setTimeout(function(){t.find("input[type=submit],input[type=image]").unbind("click",i).removeClass("secured")},5e3)})}}}(jQuery);;
// <?php
/**
* @file
* habillage_video.js
*/
// ?>	

(function ($) {
  Drupal.behaviors.web3_theme_habillage_video = {
    attach: function (context, settings) {
    	$('html', context).once('habillage-video', function () {
            // Apply the MyBehaviour effect to the elements only once.
			$('.media-item a.colorbox-inline').append('<span class="play_text">'+Drupal.t("Play video")+'</span>');
      });
    }
  };
})(jQuery);;
/*! Stellar.js v0.6.2 | Copyright 2013, Mark Dalgleish | http://markdalgleish.com/projects/stellar.js | http://markdalgleish.mit-license.org */
(function(e,t,n,r){function d(t,n){this.element=t,this.options=e.extend({},s,n),this._defaults=s,this._name=i,this.init()}var i="stellar",s={scrollProperty:"scroll",positionProperty:"position",horizontalScrolling:!0,verticalScrolling:!0,horizontalOffset:0,verticalOffset:0,responsive:!1,parallaxBackgrounds:!0,parallaxElements:!0,hideDistantElements:!0,hideElement:function(e){e.hide()},showElement:function(e){e.show()}},o={scroll:{getLeft:function(e){return e.scrollLeft()},setLeft:function(e,t){e.scrollLeft(t)},getTop:function(e){return e.scrollTop()},setTop:function(e,t){e.scrollTop(t)}},position:{getLeft:function(e){return parseInt(e.css("left"),10)*-1},getTop:function(e){return parseInt(e.css("top"),10)*-1}},margin:{getLeft:function(e){return parseInt(e.css("margin-left"),10)*-1},getTop:function(e){return parseInt(e.css("margin-top"),10)*-1}},transform:{getLeft:function(e){var t=getComputedStyle(e[0])[f];return t!=="none"?parseInt(t.match(/(-?[0-9]+)/g)[4],10)*-1:0},getTop:function(e){var t=getComputedStyle(e[0])[f];return t!=="none"?parseInt(t.match(/(-?[0-9]+)/g)[5],10)*-1:0}}},u={position:{setLeft:function(e,t){e.css("left",t)},setTop:function(e,t){e.css("top",t)}},transform:{setPosition:function(e,t,n,r,i){e[0].style[f]="translate3d("+(t-n)+"px, "+(r-i)+"px, 0)"}}},a=function(){var t=/^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,n=e("script")[0].style,r="",i;for(i in n)if(t.test(i)){r=i.match(t)[0];break}return"WebkitOpacity"in n&&(r="Webkit"),"KhtmlOpacity"in n&&(r="Khtml"),function(e){return r+(r.length>0?e.charAt(0).toUpperCase()+e.slice(1):e)}}(),f=a("transform"),l=e("<div />",{style:"background:#fff"}).css("background-position-x")!==r,c=l?function(e,t,n){e.css({"background-position-x":t,"background-position-y":n})}:function(e,t,n){e.css("background-position",t+" "+n)},h=l?function(e){return[e.css("background-position-x"),e.css("background-position-y")]}:function(e){return e.css("background-position").split(" ")},p=t.requestAnimationFrame||t.webkitRequestAnimationFrame||t.mozRequestAnimationFrame||t.oRequestAnimationFrame||t.msRequestAnimationFrame||function(e){setTimeout(e,1e3/60)};d.prototype={init:function(){this.options.name=i+"_"+Math.floor(Math.random()*1e9),this._defineElements(),this._defineGetters(),this._defineSetters(),this._handleWindowLoadAndResize(),this._detectViewport(),this.refresh({firstLoad:!0}),this.options.scrollProperty==="scroll"?this._handleScrollEvent():this._startAnimationLoop()},_defineElements:function(){this.element===n.body&&(this.element=t),this.$scrollElement=e(this.element),this.$element=this.element===t?e("body"):this.$scrollElement,this.$viewportElement=this.options.viewportElement!==r?e(this.options.viewportElement):this.$scrollElement[0]===t||this.options.scrollProperty==="scroll"?this.$scrollElement:this.$scrollElement.parent()},_defineGetters:function(){var e=this,t=o[e.options.scrollProperty];this._getScrollLeft=function(){return t.getLeft(e.$scrollElement)},this._getScrollTop=function(){return t.getTop(e.$scrollElement)}},_defineSetters:function(){var t=this,n=o[t.options.scrollProperty],r=u[t.options.positionProperty],i=n.setLeft,s=n.setTop;this._setScrollLeft=typeof i=="function"?function(e){i(t.$scrollElement,e)}:e.noop,this._setScrollTop=typeof s=="function"?function(e){s(t.$scrollElement,e)}:e.noop,this._setPosition=r.setPosition||function(e,n,i,s,o){t.options.horizontalScrolling&&r.setLeft(e,n,i),t.options.verticalScrolling&&r.setTop(e,s,o)}},_handleWindowLoadAndResize:function(){var n=this,r=e(t);n.options.responsive&&r.bind("load."+this.name,function(){n.refresh()}),r.bind("resize."+this.name,function(){n._detectViewport(),n.options.responsive&&n.refresh()})},refresh:function(n){var r=this,i=r._getScrollLeft(),s=r._getScrollTop();(!n||!n.firstLoad)&&this._reset(),this._setScrollLeft(0),this._setScrollTop(0),this._setOffsets(),this._findParticles(),this._findBackgrounds(),n&&n.firstLoad&&/WebKit/.test(navigator.userAgent)&&e(t).load(function(){var e=r._getScrollLeft(),t=r._getScrollTop();r._setScrollLeft(e+1),r._setScrollTop(t+1),r._setScrollLeft(e),r._setScrollTop(t)}),this._setScrollLeft(i),this._setScrollTop(s)},_detectViewport:function(){var e=this.$viewportElement.offset(),t=e!==null&&e!==r;this.viewportWidth=this.$viewportElement.width(),this.viewportHeight=this.$viewportElement.height(),this.viewportOffsetTop=t?e.top:0,this.viewportOffsetLeft=t?e.left:0},_findParticles:function(){var t=this,n=this._getScrollLeft(),i=this._getScrollTop();if(this.particles!==r)for(var s=this.particles.length-1;s>=0;s--)this.particles[s].$element.data("stellar-elementIsActive",r);this.particles=[];if(!this.options.parallaxElements)return;this.$element.find("[data-stellar-ratio]").each(function(n){var i=e(this),s,o,u,a,f,l,c,h,p,d=0,v=0,m=0,g=0;if(!i.data("stellar-elementIsActive"))i.data("stellar-elementIsActive",this);else if(i.data("stellar-elementIsActive")!==this)return;t.options.showElement(i),i.data("stellar-startingLeft")?(i.css("left",i.data("stellar-startingLeft")),i.css("top",i.data("stellar-startingTop"))):(i.data("stellar-startingLeft",i.css("left")),i.data("stellar-startingTop",i.css("top"))),u=i.position().left,a=i.position().top,f=i.css("margin-left")==="auto"?0:parseInt(i.css("margin-left"),10),l=i.css("margin-top")==="auto"?0:parseInt(i.css("margin-top"),10),h=i.offset().left-f,p=i.offset().top-l,i.parents().each(function(){var t=e(this);if(t.data("stellar-offset-parent")===!0)return d=m,v=g,c=t,!1;m+=t.position().left,g+=t.position().top}),s=i.data("stellar-horizontal-offset")!==r?i.data("stellar-horizontal-offset"):c!==r&&c.data("stellar-horizontal-offset")!==r?c.data("stellar-horizontal-offset"):t.horizontalOffset,o=i.data("stellar-vertical-offset")!==r?i.data("stellar-vertical-offset"):c!==r&&c.data("stellar-vertical-offset")!==r?c.data("stellar-vertical-offset"):t.verticalOffset,t.particles.push({$element:i,$offsetParent:c,isFixed:i.css("position")==="fixed",horizontalOffset:s,verticalOffset:o,startingPositionLeft:u,startingPositionTop:a,startingOffsetLeft:h,startingOffsetTop:p,parentOffsetLeft:d,parentOffsetTop:v,stellarRatio:i.data("stellar-ratio")!==r?i.data("stellar-ratio"):1,width:i.outerWidth(!0),height:i.outerHeight(!0),isHidden:!1})})},_findBackgrounds:function(){var t=this,n=this._getScrollLeft(),i=this._getScrollTop(),s;this.backgrounds=[];if(!this.options.parallaxBackgrounds)return;s=this.$element.find("[data-stellar-background-ratio]"),this.$element.data("stellar-background-ratio")&&(s=s.add(this.$element)),s.each(function(){var s=e(this),o=h(s),u,a,f,l,p,d,v,m,g,y=0,b=0,w=0,E=0;if(!s.data("stellar-backgroundIsActive"))s.data("stellar-backgroundIsActive",this);else if(s.data("stellar-backgroundIsActive")!==this)return;s.data("stellar-backgroundStartingLeft")?c(s,s.data("stellar-backgroundStartingLeft"),s.data("stellar-backgroundStartingTop")):(s.data("stellar-backgroundStartingLeft",o[0]),s.data("stellar-backgroundStartingTop",o[1])),p=s.css("margin-left")==="auto"?0:parseInt(s.css("margin-left"),10),d=s.css("margin-top")==="auto"?0:parseInt(s.css("margin-top"),10),v=s.offset().left-p-n,m=s.offset().top-d-i,s.parents().each(function(){var t=e(this);if(t.data("stellar-offset-parent")===!0)return y=w,b=E,g=t,!1;w+=t.position().left,E+=t.position().top}),u=s.data("stellar-horizontal-offset")!==r?s.data("stellar-horizontal-offset"):g!==r&&g.data("stellar-horizontal-offset")!==r?g.data("stellar-horizontal-offset"):t.horizontalOffset,a=s.data("stellar-vertical-offset")!==r?s.data("stellar-vertical-offset"):g!==r&&g.data("stellar-vertical-offset")!==r?g.data("stellar-vertical-offset"):t.verticalOffset,t.backgrounds.push({$element:s,$offsetParent:g,isFixed:s.css("background-attachment")==="fixed",horizontalOffset:u,verticalOffset:a,startingValueLeft:o[0],startingValueTop:o[1],startingBackgroundPositionLeft:isNaN(parseInt(o[0],10))?0:parseInt(o[0],10),startingBackgroundPositionTop:isNaN(parseInt(o[1],10))?0:parseInt(o[1],10),startingPositionLeft:s.position().left,startingPositionTop:s.position().top,startingOffsetLeft:v,startingOffsetTop:m,parentOffsetLeft:y,parentOffsetTop:b,stellarRatio:s.data("stellar-background-ratio")===r?1:s.data("stellar-background-ratio")})})},_reset:function(){var e,t,n,r,i;for(i=this.particles.length-1;i>=0;i--)e=this.particles[i],t=e.$element.data("stellar-startingLeft"),n=e.$element.data("stellar-startingTop"),this._setPosition(e.$element,t,t,n,n),this.options.showElement(e.$element),e.$element.data("stellar-startingLeft",null).data("stellar-elementIsActive",null).data("stellar-backgroundIsActive",null);for(i=this.backgrounds.length-1;i>=0;i--)r=this.backgrounds[i],r.$element.data("stellar-backgroundStartingLeft",null).data("stellar-backgroundStartingTop",null),c(r.$element,r.startingValueLeft,r.startingValueTop)},destroy:function(){this._reset(),this.$scrollElement.unbind("resize."+this.name).unbind("scroll."+this.name),this._animationLoop=e.noop,e(t).unbind("load."+this.name).unbind("resize."+this.name)},_setOffsets:function(){var n=this,r=e(t);r.unbind("resize.horizontal-"+this.name).unbind("resize.vertical-"+this.name),typeof this.options.horizontalOffset=="function"?(this.horizontalOffset=this.options.horizontalOffset(),r.bind("resize.horizontal-"+this.name,function(){n.horizontalOffset=n.options.horizontalOffset()})):this.horizontalOffset=this.options.horizontalOffset,typeof this.options.verticalOffset=="function"?(this.verticalOffset=this.options.verticalOffset(),r.bind("resize.vertical-"+this.name,function(){n.verticalOffset=n.options.verticalOffset()})):this.verticalOffset=this.options.verticalOffset},_repositionElements:function(){var e=this._getScrollLeft(),t=this._getScrollTop(),n,r,i,s,o,u,a,f=!0,l=!0,h,p,d,v,m;if(this.currentScrollLeft===e&&this.currentScrollTop===t&&this.currentWidth===this.viewportWidth&&this.currentHeight===this.viewportHeight)return;this.currentScrollLeft=e,this.currentScrollTop=t,this.currentWidth=this.viewportWidth,this.currentHeight=this.viewportHeight;for(m=this.particles.length-1;m>=0;m--)i=this.particles[m],s=i.isFixed?1:0,this.options.horizontalScrolling?(h=(e+i.horizontalOffset+this.viewportOffsetLeft+i.startingPositionLeft-i.startingOffsetLeft+i.parentOffsetLeft)*-(i.stellarRatio+s-1)+i.startingPositionLeft,d=h-i.startingPositionLeft+i.startingOffsetLeft):(h=i.startingPositionLeft,d=i.startingOffsetLeft),this.options.verticalScrolling?(p=(t+i.verticalOffset+this.viewportOffsetTop+i.startingPositionTop-i.startingOffsetTop+i.parentOffsetTop)*-(i.stellarRatio+s-1)+i.startingPositionTop,v=p-i.startingPositionTop+i.startingOffsetTop):(p=i.startingPositionTop,v=i.startingOffsetTop),this.options.hideDistantElements&&(l=!this.options.horizontalScrolling||d+i.width>(i.isFixed?0:e)&&d<(i.isFixed?0:e)+this.viewportWidth+this.viewportOffsetLeft,f=!this.options.verticalScrolling||v+i.height>(i.isFixed?0:t)&&v<(i.isFixed?0:t)+this.viewportHeight+this.viewportOffsetTop),l&&f?(i.isHidden&&(this.options.showElement(i.$element),i.isHidden=!1),this._setPosition(i.$element,h,i.startingPositionLeft,p,i.startingPositionTop)):i.isHidden||(this.options.hideElement(i.$element),i.isHidden=!0);for(m=this.backgrounds.length-1;m>=0;m--)o=this.backgrounds[m],s=o.isFixed?0:1,u=this.options.horizontalScrolling?(e+o.horizontalOffset-this.viewportOffsetLeft-o.startingOffsetLeft+o.parentOffsetLeft-o.startingBackgroundPositionLeft)*(s-o.stellarRatio)+"px":o.startingValueLeft,a=this.options.verticalScrolling?(t+o.verticalOffset-this.viewportOffsetTop-o.startingOffsetTop+o.parentOffsetTop-o.startingBackgroundPositionTop)*(s-o.stellarRatio)+"px":o.startingValueTop,c(o.$element,u,a)},_handleScrollEvent:function(){var e=this,t=!1,n=function(){e._repositionElements(),t=!1},r=function(){t||(p(n),t=!0)};this.$scrollElement.bind("scroll."+this.name,r),r()},_startAnimationLoop:function(){var e=this;this._animationLoop=function(){p(e._animationLoop),e._repositionElements()},this._animationLoop()}},e.fn[i]=function(t){var n=arguments;if(t===r||typeof t=="object")return this.each(function(){e.data(this,"plugin_"+i)||e.data(this,"plugin_"+i,new d(this,t))});if(typeof t=="string"&&t[0]!=="_"&&t!=="init")return this.each(function(){var r=e.data(this,"plugin_"+i);r instanceof d&&typeof r[t]=="function"&&r[t].apply(r,Array.prototype.slice.call(n,1)),t==="destroy"&&e.data(this,"plugin_"+i,null)})},e[i]=function(n){var r=e(t);return r.stellar.apply(r,Array.prototype.slice.call(arguments,0))},e[i].scrollProperty=o,e[i].positionProperty=u,t.Stellar=d})(jQuery,this,document);;
!function(a,b,c){a(c).ready(function(){var c=a(b)[0].innerWidth;!a(".bg-autonome").length&&c>=1024&&!Modernizr.touch&&a.stellar({hideDistantElements:!1})})}(jQuery,this,document);;
!function(a){function b(b,c){var e=this;e.el=b,e.$el=a(b),e.name="slidermosaique",e.init=function(){e.options=a.extend({},d,c);var b=e.$el.find("li:first-child >*");b.data("pause")?e.options.interval=parseInt(b.data("pause")):"",e.options.interval+=b.data("speed")?parseInt(b.data("speed")):e.options.speed;var f=1;e.$el.find("li").each(function(){var b=a(this);if(3>=f)b.addClass("little_"+f);else if(4==f)b.addClass("gigante");else if(5==f)b.addClass("large");else{var c=f-5;b.addClass("middle_"+c)}f++,b.removeClass("item")}),e.navigate(),e.start_interval(),e.$el.addClass("processed")},e.navigate=function(){e.$el.find("li").click(function(b){var c=a(this);if(!c.hasClass("gigante")){var d=e.$el.find(".gigante");e.goto_next(d,c),b.preventDefault()}}),e.$el.mouseenter(function(){e.stop_interval()}).mouseleave(function(){e.start_interval()})},e.start_interval=function(){clearInterval(e.name),e.name=setInterval(function(){var b=a(".slider_instit").find(".gigante"),c=a(b).next().length?a(b).next():a(".slider_instit li:first-child");e.goto_next(b,c)},e.options.interval)},e.stop_interval=function(){clearInterval(e.name)},e.goto_next=function(b,c){var d=a(c).attr("class");a(b).removeAttr("class").addClass(d),a(c).removeAttr("class").addClass("gigante")},e.init()}var c="slidermosaique",d={speed:800,interval:4e3};a.fn[c]=function(d){return this.each(function(){a.data(this,"plugin_"+c)||a.data(this,"plugin_"+c,new b(this,d))})},a(document).ready(function(a){var b=a(".slider_instit:not(.processed)"),c=a(window)[0].innerWidth;b.length&&c>=768&&b.slidermosaique()}),a(window).resize(function(){var b=a(".slider_instit:not(.processed)"),c=a(window)[0].innerWidth;b.length&&c>=768&&b.slidermosaique()})}(jQuery);;
/*jshint strict:true, browser:true, curly:true, eqeqeq:true, expr:true, forin:true, latedef:true, newcap:true, noarg:true, trailing: true, undef:true, unused:true */
/**
 * File:        clientside_validation.ie8.js
 * Version:     7.x-1.x
 * Description: ECMA-262, 5th edition support for IE <= 8
 * Language:    Javascript
 * Project:     clientside_validation
 * @module clientside_validation
 */
(function(){
"use strict";

/*
 * Support for String.trim
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/Trim#Compatibility
 */
if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}

/*
 * Support for Array.indexOf
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf#Compatibility
 */
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        if (this === null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n !== n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    };
}

/*
 * Support for Array.lastIndexOf
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf#Compatibility
 */
if (!Array.prototype.lastIndexOf)
{
  Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/)
  {

    if (this === null) {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length >>> 0;
    if (len === 0) {
      return -1;
    }

    var n = len;
    if (arguments.length > 1)
    {
      n = Number(arguments[1]);
      if (n !== n) {
        n = 0;
      }
      else if (n !== 0 && n !== Infinity && n !== -Infinity) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
    }

    var k = n >= 0
          ? Math.min(n, len - 1)
          : len - Math.abs(n);

    for (; k >= 0; k--)
    {
      if (k in t && t[k] === searchElement) {
        return k;
      }
    }
    return -1;
  };
}

/*
 * Support for Array.filter
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter#Compatibility
 */
if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp */)
  {

    if (this === null) {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function") {
      throw new TypeError();
    }

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t)) {
          res.push(val);
        }
      }
    }

    return res;
  };
}

/*
 * Support for Array.map
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map#Browser_compatibility
 */
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
if (!Array.prototype.map) {
  Array.prototype.map = function(callback, thisArg) {

    var T, A, k;

    if (this === null) {
      throw new TypeError(" this is null or not defined");
    }

    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if ({}.toString.call(callback) !== "[object Function]") {
      throw new TypeError(callback + " is not a function");
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (thisArg) {
      T = thisArg;
    }

    // 6. Let A be a new array created as if by the expression new Array(len) where Array is
    // the standard built-in constructor with that name and len is the value of len.
    A = new Array(len);

    // 7. Let k be 0
    k = 0;

    // 8. Repeat, while k < len
    while(k < len) {

      var kValue, mappedValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[ k ];

        // ii. Let mappedValue be the result of calling the Call internal method of callback
        // with T as the this value and argument list containing kValue, k, and O.
        mappedValue = callback.call(T, kValue, k, O);

        // iii. Call the DefineOwnProperty internal method of A with arguments
        // Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},
        // and false.

        // In browsers that support Object.defineProperty, use the following:
        // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

        // For best browser support, use the following:
        A[ k ] = mappedValue;
      }
      // d. Increase k by 1.
      k++;
    }

    // 9. return A
    return A;
  };
}
})();;
/*jshint strict:true, browser:true, curly:true, eqeqeq:true, expr:true, forin:true, latedef:true, newcap:true, noarg:true, trailing: true, undef:true, unused:true */
/*global Drupal: true, jQuery: true*/
/**
 * File:        clientside_validation_html5.js
 * Version:     7.x-1.x
 * Description: Add clientside validation rules
 * Author:      Attiks
 * Language:    Javascript
 * Project:     clientside_validation html5
 * @module clientside_validation
 */

(/** @lends Drupal */function ($) {
  "use strict";
  /**
   * Drupal.behaviors.clientsideValidationHtml5.
   *
   * Attach clientside validation to the page for HTML5.
   */
  Drupal.behaviors.clientsideValidationHtml5 = {
    attach: function () {
      $(document).bind('clientsideValidationAddCustomRules', function(){
        /**
         * HTML5 specific rules.
         * @name _bindHTML5Rules
         * @memberof Drupal.clientsideValidation
         * @method
         * @private
         */
        function _getMultiplier(a, b, c) {
          var inta = Number(parseInt(a, 10));
          var mula = a.length - inta.toString().length - 1;

          var intb = parseInt(b, 10);
          var mulb = b.toString().length - intb.toString().length - 1;

          var intc = parseInt(c, 10);
          var mulc = c.toString().length - intc.toString().length - 1;

          var multiplier = Math.pow(10, Math.max(mulc, Math.max(mula, mulb)));
          return (multiplier > 1) ? multiplier : 1;
        }

        jQuery.validator.addMethod("Html5Min", function(value, element, param) {
          //param[0] = min, param[1] = step;
          var min = param[0];
          var step = param[1];
          var multiplier = _getMultiplier(value, min, step);

          value = parseInt(parseFloat(value) * multiplier, 10);
          min = parseInt(parseFloat(min) * multiplier, 10);

          var mismatch = 0;
          if (param[1] !== 'any') {
            step = parseInt(parseFloat(param[1]) * multiplier, 10);
            mismatch = (value - min) % step;
          }
          return this.optional(element) || (mismatch === 0 && value >= min);
        }, jQuery.format('Value must be greater than {0} with steps of {1}.'));

        jQuery.validator.addMethod("Html5Max", function(value, element, param) {
          //param[0] = max, param[1] = step;
          var max = param[0];
          var step = param[1];
          var multiplier = _getMultiplier(value, max, step);

          value = parseInt(parseFloat(value) * multiplier, 10);
          max = parseInt(parseFloat(max) * multiplier, 10);

          var mismatch = 0;
          if (param[1] !== 'any') {
            step = parseInt(parseFloat(param[1]) * multiplier, 10);
            mismatch = (max - value) % step;
          }
          return this.optional(element) || (mismatch === 0 && value <= max);
        }, jQuery.format('Value must be smaller than {0} and must be dividable by {1}.'));

        jQuery.validator.addMethod("Html5Range", function(value, element, param) {
          //param[0] = min, param[1] = max, param[2] = step;
          var min = param[0];
          var max = param[1];
          var step = param[2];
          var multiplier = _getMultiplier(value, min, step);

          value = parseInt(parseFloat(value) * multiplier, 10);
          min = parseInt(parseFloat(min) * multiplier, 10);
          max = parseInt(parseFloat(max) * multiplier, 10);

          var mismatch = 0;
          if (param[2] !== 'any') {
            step = parseInt(parseFloat(param[2]) * multiplier, 10);
            mismatch = (value - min) % step;
          }
          return this.optional(element) || (mismatch === 0 && value >= min && value <= max);
        }, jQuery.format('Value must be greater than {0} with steps of {2} and smaller than {1}.'));

        jQuery.validator.addMethod("Html5Color", function(value) {
          return (/^#([a-f]|[A-F]|[0-9]){6}$/).test(value);
        }, jQuery.format('Value must be a valid color code'));
      });
    }
  };
})(jQuery);
;
/*jshint strict:true, browser:true, curly:true, eqeqeq:true, expr:true, forin:true, latedef:true, newcap:true, noarg:true, trailing: true, undef:true, unused:true */
/*global Drupal: true, jQuery: true, XRegExp:true*/
/**
 * File:        clientside_validation.js
 * Version:     7.x-1.x
 * Description: Add clientside validation rules
 * Author:      Attiks
 * Language:    Javascript
 * Project:     clientside_validation
 * @module clientside_validation
 */


(/** @lends Drupal */function ($) {
  /**
   * Drupal.behaviors.clientsideValidation.
   *
   * Attach clientside validation to the page or rebind the rules in case of AJAX calls.
   * @extends Drupal.behaviors
   * @fires clientsideValidationInitialized
   */
  "use strict";
  Drupal.behaviors.clientsideValidation = {
    attach: function (context) {
      if (!Drupal.myClientsideValidation) {
        if (Drupal.settings.clientsideValidation) {
          Drupal.myClientsideValidation = new Drupal.clientsideValidation();
        }
      }
      else {
        if (typeof(Drupal.settings.clientsideValidation.forms) === 'undefined') {
          return;
        }
        var update = false;
        jQuery.each(Drupal.settings.clientsideValidation.forms, function (f) {
          if ($(context).find('#' + f).length || $(context).is('#' + f)) {
            update = true;
          }
        });
        //update settings
        if (update) {
          Drupal.myClientsideValidation.data = Drupal.settings.clientsideValidation;
          Drupal.myClientsideValidation.forms = Drupal.myClientsideValidation.data.forms;
          Drupal.myClientsideValidation.groups = Drupal.myClientsideValidation.data.groups;
          Drupal.myClientsideValidation.bindForms();
        }
      }

      /**
       * Let other modules know we are ready.
       * @event clientsideValidationInitialized
       * @name clientsideValidationInitialized
       * @memberof Drupal.clientsideValidation
       */
      jQuery.event.trigger('clientsideValidationInitialized');
    }
  };

  /**
   * Drupal.clientsideValidation.
   * This module adds clientside validation for all forms and webforms using jquery.validate
   * Don't forget to read the README
   *
   * @class Drupal.clientsideValidation
   * @see https://github.com/jzaefferer/jquery-validation
   * @fires clientsideValidationAddCustomRules
   */
  Drupal.clientsideValidation = function() {
    var self = this;
    if (typeof window.time !== 'undefined') {
      // activate by setting clientside_validation_add_js_timing
      self.time = window.time;
    }
    else {
      self.time = {
        start: function() {},
        stop: function() {},
        report: function() {}
      };
    }
    self.time.start('1. clientsideValidation');

    /**
     * prefix to use
     * @memberof Drupal.clientsideValidation
     * @type string
     * @readonly
     * @private
     */
    this.prefix = 'clientsidevalidation-';

    /**
     * local copy of settings
     * @memberof Drupal.clientsideValidation
     * @type array
     * @readonly
     * @private
     */
    this.data = $.extend(true, {}, Drupal.settings.clientsideValidation);

    /**
     * local reference of all defined forms
     * @memberof Drupal.clientsideValidation
     * @type array
     * @readonly
     */
    this.forms = this.data.forms;

    /**
     * list of all defined validators
     * @memberof Drupal.clientsideValidation
     * @type array
     * @readonly
     */
    this.validators = {};

    /**
     * groups used for radios/checkboxes
     * @memberof Drupal.clientsideValidation
     * @type array
     * @readonly
     * @private
     */
    this.groups = this.data.groups;

    // disable class and attribute rules defined by jquery.validate
    $.validator.classRules = function() {
      return {};
    };
    $.validator.attributeRules = function() {
      return {};
    };

    /**
     * add extra rules not defined in jquery.validate
     * @see jquery.validate
     */
    this.addExtraRules();

    /**
     * bind all rules to all forms
     * @see Drupal.clientsideValidation.prototype.bindForms
     */
    this.bindForms();
    self.time.stop('1. clientsideValidation');
    self.time.report();
  };

  /**
   * findVerticalTab helper.
   * @memberof Drupal.clientsideValidation
   * @private
   */
  Drupal.clientsideValidation.prototype.findVerticalTab = function(element) {
    element = $(element);

    // Check for the vertical tabs fieldset and the verticalTab data
    var fieldset = element.parents('fieldset.vertical-tabs-pane');
    if ((fieldset.size() > 0) && (typeof(fieldset.data('verticalTab')) !== 'undefined')) {
      var tab = $(fieldset.data('verticalTab').item[0]).find('a');
      if (tab.size()) {
        return tab;
      }
    }

    // Return null by default
    return null;
  };

  /**
   * findHorizontalTab helper.
   * @memberof Drupal.clientsideValidation
   * @private
   */
  Drupal.clientsideValidation.prototype.findHorizontalTab = function(element) {
    element = $(element);

    // Check for the vertical tabs fieldset and the verticalTab data
    var fieldset = element.parents('fieldset.horizontal-tabs-pane');
    if ((fieldset.size() > 0) && (typeof(fieldset.data('horizontalTab')) !== 'undefined')) {
      var tab = $(fieldset.data('horizontalTab').item[0]).find('a');
      if (tab.size()) {
        return tab;
      }
    }

    // Return null by default
    return null;
  };

  /**
   * Bind all forms.
   * @memberof Drupal.clientsideValidation
   * @public
   */
  Drupal.clientsideValidation.prototype.bindForms = function(){
    var self = this;
    var groupkey;
    if (typeof(self.forms) === 'undefined') {
      return;
    }
    self.time.start('2. bindForms');
    // unset invalid forms
    jQuery.each (self.forms, function (f) {
      if ($('#' + f).length < 1) {
        delete self.forms[f];
      }
    });
    jQuery.each (self.forms, function(f) {
      var errorel = self.prefix + f + '-errors';
      // Remove any existing validation stuff
      if (self.validators[f]) {
        // Doesn't work :: $('#' + f).rules('remove');
        var form = $('#' + f).get(0);
        if (typeof(form) !== 'undefined') {
          jQuery.removeData(form, 'validator');
        }
      }

      if('checkboxrules' in self.forms[f]){
        self.time.start('checkboxrules_groups');
        groupkey = "";
        jQuery.each (self.forms[f].checkboxrules, function(r) {
          groupkey = r + '_group';
          self.groups[f][groupkey] = [];
          jQuery.each(this, function(){
            $(this[2]).find('input[type=checkbox]').each(function(){
              self.groups[f][groupkey].push($(this).attr('name'));
            });
          });
        });
        self.time.stop('checkboxrules_groups');
      }

      if('daterangerules' in self.forms[f]){
        self.time.start('daterangerules');
        groupkey = "";
        jQuery.each (self.forms[f].daterangerules, function(r) {
          groupkey = r + '_group';
          self.groups[f][groupkey] = [];
          jQuery.each(this, function(){
            $('#' + f + ' #' + r + ' :input').not('input[type=image]').each(function(){
              self.groups[f][groupkey].push($(this).attr('name'));
            });
          });
        });
        self.time.stop('daterangerules');
      }

      if('dateminrules' in self.forms[f]){
        self.time.start('dateminrules');
        groupkey = "";
        jQuery.each (self.forms[f].dateminrules, function(r) {
          groupkey = r + '_group';
          self.groups[f][groupkey] = [];
          jQuery.each(this, function(){
            $('#' + f + ' #' + r + ' :input').not('input[type=image]').each(function(){
              self.groups[f][groupkey].push($(this).attr('name'));
            });
          });
        });
        self.time.stop('dateminrules');
      }

      if('datemaxrules' in self.forms[f]){
        self.time.start('datemaxrules');
        groupkey = "";
        jQuery.each (self.forms[f].datemaxrules, function(r) {
          groupkey = r + '_group';
          self.groups[f][groupkey] = [];
          jQuery.each(this, function(){
            $('#' + f + ' #' + r + ' :input').not('input[type=image]').each(function(){
              self.groups[f][groupkey].push($(this).attr('name'));
            });
          });
        });
        self.time.stop('datemaxrules');
      }


      // Add basic settings
      // todo: find cleaner fix
      // ugly fix for nodes in colorbox
      if(typeof $('#' + f).validate === 'function') {
        var validate_options = {
          errorClass: 'error',
          groups: self.groups[f],
          errorElement: self.forms[f].general.errorElement,
          unhighlight: function(element, errorClass, validClass) {
            var tab;
            // Default behavior
            $(element).removeClass(errorClass).addClass(validClass);

            // Sort the classes out for the tabs - we only want to remove the
            // highlight if there are no inputs with errors...
            var fieldset = $(element).parents('fieldset.vertical-tabs-pane');
            if (fieldset.size() && fieldset.find('.' + errorClass).not('label').size() === 0) {
              tab = self.findVerticalTab(element);
              if (tab) {
                tab.removeClass(errorClass).addClass(validClass);
              }
            }

            // Same for horizontal tabs
            fieldset = $(element).parents('fieldset.horizontal-tabs-pane');
            if (fieldset.size() && fieldset.find('.' + errorClass).not('label').size() === 0) {
              tab = self.findHorizontalTab(element);
              if (tab) {
                tab.removeClass(errorClass).addClass(validClass);
              }
            }
          },
          highlight: function(element, errorClass, validClass) {
            // Default behavior
            $(element).addClass(errorClass).removeClass(validClass);

            // Sort the classes out for the tabs
            var tab = self.findVerticalTab(element);
            if (tab) {
              tab.addClass(errorClass).removeClass(validClass);
            }
            tab = self.findHorizontalTab(element);
            if (tab) {
              tab.addClass(errorClass).removeClass(validClass);
            }
          },
          invalidHandler: function(form, validator) {
            var tab;
            if (validator.errorList.length > 0) {
              // Check if any of the errors are in the selected tab
              var errors_in_selected = false;
              for (var i = 0; i < validator.errorList.length; i++) {
                tab = self.findVerticalTab(validator.errorList[i].element);
                if (tab && tab.parent().hasClass('selected')) {
                  errors_in_selected = true;
                  break;
                }
              }

              // Only focus the first tab with errors if the selected tab doesn't have
              // errors itself. We shouldn't hide a tab that contains errors!
              if (!errors_in_selected) {
                tab = self.findVerticalTab(validator.errorList[0].element);
                if (tab) {
                  tab.click();
                }
              }

              // Same for vertical tabs
              // Check if any of the errors are in the selected tab
              errors_in_selected = false;
              for (i = 0; i < validator.errorList.length; i++) {
                tab = self.findHorizontalTab(validator.errorList[i].element);
                if (tab && tab.parent().hasClass('selected')) {
                  errors_in_selected = true;
                  break;
                }
              }

              // Only focus the first tab with errors if the selected tab doesn't have
              // errors itself. We shouldn't hide a tab that contains errors!
              if (!errors_in_selected) {
                tab = self.findHorizontalTab(validator.errorList[0].element);
                if (tab) {
                  tab.click();
                }
              }
              if (self.forms[f].general.scrollTo) {
                var x;
                if ($("#" + errorel).length) {
                  $("#" + errorel).show();
                  x = $("#" + errorel).offset().top - $("#" + errorel).height() - 100; // provides buffer in viewport
                }
                else {
                  x = $(validator.errorList[0].element).offset().top - $(validator.errorList[0].element).height() - 100;
                }
                $('html, body').animate({scrollTop: x}, self.forms[f].general.scrollSpeed);
                $('.wysiwyg-toggle-wrapper a').each(function() {
                  $(this).click();
                  $(this).click();
                });
              }

              /**
               * Notify that the form contains errors.
               * @event clientsideValidationFormHasErrors
               * @name clientsideValidationFormHasErrors
               * @memberof Drupal.clientsideValidation
               */
              jQuery.event.trigger('clientsideValidationFormHasErrors', [form.target]);
            }
          }
        };

        switch (parseInt(self.forms[f].errorPlacement, 10)) {
          case 0: // CLIENTSIDE_VALIDATION_JQUERY_SELECTOR
            if ($(self.forms[f].errorJquerySelector).length) {
              if (!$(self.forms[f].errorJquerySelector + ' #' + errorel).length) {
                $('<div id="' + errorel + '" class="messages error clientside-error"><ul></ul></div>').prependTo(self.forms[f].errorJquerySelector).hide();
              }
            }
            else if (!$('#' + errorel).length) {
              $('<div id="' + errorel + '" class="messages error clientside-error"><ul></ul></div>').insertBefore('#' + f).hide();
            }
            validate_options.errorContainer = '#' + errorel;
            validate_options.errorLabelContainer = '#' + errorel + ' ul';
            validate_options.wrapper = 'li';
            break;
          case 1: // CLIENTSIDE_VALIDATION_TOP_OF_FORM
            if (!$('#' + errorel).length) {
              $('<div id="' + errorel + '" class="messages error clientside-error"><ul></ul></div>').insertBefore('#' + f).hide();
            }
            validate_options.errorContainer = '#' + errorel;
            validate_options.errorLabelContainer = '#' + errorel + ' ul';
            validate_options.wrapper = 'li';
            break;
          case 2: // CLIENTSIDE_VALIDATION_BEFORE_LABEL
            validate_options.errorPlacement = function(error, element) {
              var parents;
              if (element.is(":radio")) {
                parents = element.parents(".form-type-checkbox-tree");
                if(parents.length) {
                  error.insertBefore(parents.find("label").first());
                }
                else {
                  parents = element.parents('.form-radios').prev('label');
                  if (!parents.length) {
                    parents = 'label[for="'+ element.attr('id') +'"]';
                  }
                  error.insertBefore(parents);
                }
              }
              else if (element.is(":checkbox")) {
                parents = element.parents(".form-type-checkbox-tree");
                if(parents.length) {
                  error.insertBefore(parents.find("label").first());
                }
                else {
                  parents = element.parents('.form-radios').prev('label');
                  if (!parents.length) {
                    parents = 'label[for="'+ element.attr('id') +'"]';
                  }
                  error.insertBefore(parents);
                }
              }
              else {
                error.insertBefore('label[for="'+ element.attr('id') +'"]');
              }
            };
            break;
          case 3: // CLIENTSIDE_VALIDATION_AFTER_LABEL
            validate_options.errorPlacement = function(error, element) {
              var parents;
              if (element.is(":radio")) {
                parents = element.parents(".form-type-checkbox-tree");
                if(parents.length) {
                  error.insertAfter(parents.find("label").first());
                }
                else {
                  parents = element.parents('.form-radios').prev('label');
                  if (!parents.length) {
                    parents = 'label[for="'+ element.attr('id') +'"]';
                  }
                  error.insertAfter(parents);
                }
              }
              else if (element.is(":checkbox")) {
                parents = element.parents(".form-type-checkbox-tree");
                if(parents.length) {
                  error.insertAfter(parents.find("label").first());
                }
                else {
                  parents = element.parents('.form-checkboxes').prev('label');
                  if (!parents.length) {
                    parents = 'label[for="'+ element.attr('id') +'"]';
                  }
                  error.insertAfter(parents);
                }
              }
              else {
                error.insertAfter('label[for="'+ element.attr('id') +'"]');
              }
            };
            break;
          case 4: // CLIENTSIDE_VALIDATION_BEFORE_INPUT
            validate_options.errorPlacement = function(error, element) {
              error.insertBefore(element);
            };
            break;
          case 5: // CLIENTSIDE_VALIDATION_AFTER_INPUT
            validate_options.errorPlacement = function(error, element) {
              var parents;
              if (element.is(":radio")) {
                parents = element.parents(".form-type-checkbox-tree");
                if(parents.length) {
                  error.insertAfter(parents);
                }
                else {
                  parents = element.parents('.form-radios');
                  if (!parents.length) {
                    parents = element;
                  }
                  error.insertAfter(parents);
                }
              }
              else if (element.is(":checkbox")) {
                parents = element.parents(".form-type-checkbox-tree");
                if(parents.length) {
                  error.insertAfter(parents);
                }
                else {
                  parents = element.parents('.form-checkboxes');
                  if (!parents.length) {
                    parents = element;
                  }
                  error.insertAfter(parents);
                }
              }
              else if (element.next('div.grippie').length) {
                error.insertAfter(element.next('div.grippie'));
              } else {
                error.insertAfter(element);
              }
            };
            break;
          case 6: // CLIENTSIDE_VALIDATION_TOP_OF_FIRST_FORM
            if ($('div.messages.error').length) {
              if ($('div.messages.error').attr('id').length) {
                errorel = $('div.messages.error').attr('id');
              }
              else {
                $('div.messages.error').attr('id', errorel);
              }
            }
            else if (!$('#' + errorel).length) {
              $('<div id="' + errorel + '" class="messages error clientside-error"><ul></ul></div>').insertBefore('#' + f).hide();
            }
            validate_options.errorContainer = '#' + errorel;
            validate_options.errorLabelContainer = '#' + errorel + ' ul';
            validate_options.wrapper = 'li';
            break;
          case 7: // CLIENTSIDE_VALIDATION_CUSTOM_ERROR_FUNCTION
            validate_options.errorPlacement = function (error, element) {
              var func = self.forms[f].customErrorFunction;
              Drupal.myClientsideValidation[func](error, element);
            };
            break;
        }

        if (!self.forms[f].includeHidden) {
          validate_options.ignore = ':input:hidden';
        }
        else {
          validate_options.ignore = '';
        }
        if(self.forms[f].general.validateTabs) {
          if($('.vertical-tabs-pane input').length) {
            validate_options.ignore += ' :not(.vertical-tabs-pane :input, .horizontal-tabs-pane :input)';
          }
        }
        else {
          validate_options.ignore += ', .horizontal-tab-hidden :input';
        }
        //Since we can only give boolean false to onsubmit, onfocusout and onkeyup, we need
        //a lot of if's (boolean true can not be passed to these properties).
        if (!Boolean(parseInt(self.forms[f].general.validateOnSubmit, 10))) {
          validate_options.onsubmit = false;
        }
        if (!Boolean(parseInt(self.forms[f].general.validateOnBlur, 10))) {
          validate_options.onfocusout = false;
        }
        if (Boolean(parseInt(self.forms[f].general.validateOnBlurAlways, 10))) {
          validate_options.onfocusout = function(element) {
            if ( !this.checkable(element) ) {
              this.element(element);
            }
          };
        }
        if (!Boolean(parseInt(self.forms[f].general.validateOnKeyUp, 10))) {
          validate_options.onkeyup = false;
        }
        // Only apply this setting if errorplacement is set to the top of the form
        if (parseInt(self.forms[f].general.showMessages, 10) > 0 && parseInt(self.forms[f].errorPlacement, 10) === 1) {
          var showMessages = parseInt(self.forms[f].general.showMessages, 10);
          // Show only last message
          if (showMessages === 2) {
            validate_options.showErrors = function() {
              var allErrors = this.errors();
              var i;
              this.toHide = allErrors;
              $(':input.' + this.settings.errorClass).removeClass(this.settings.errorClass);
              for ( i = this.errorList.length -1; this.errorList[i]; i++ ) {
                var error = this.errorList[i];
                this.settings.highlight && this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
                this.showLabel( error.element, error.message );
              }
              if( this.errorList.length ) {
                this.toShow = this.toShow.add( this.containers );
              }
              if (this.settings.success) {
                for ( i = 0; this.successList[i]; i++ ) {
                  this.showLabel( this.successList[i] );
                }
              }
              if (this.settings.unhighlight) {
                var elements;
                for ( i = 0, elements = this.validElements(); elements[i]; i++ ) {
                  this.settings.unhighlight.call( this, elements[i], this.settings.errorClass, this.settings.validClass );
                }
              }
              this.toHide = this.toHide.not( this.toShow );
              this.hideErrors();
              this.addWrapper( this.toShow ).show();
            };
          }
          // Show only first message
          else if(showMessages === 1) {
            validate_options.showErrors = function() {
              var allErrors = this.errors();
              var i;
              var elements;
              if (this.settings.unhighlight) {
                var firstErrorElement = this.clean($(allErrors[0]).attr('for'));
                //for attr points to name or id
                if (typeof firstErrorElement === 'undefined') {
                  firstErrorElement = this.clean('#' + $(allErrors[0]).attr('for'));
                }
                for (i = 0, elements = this.elements().not($(firstErrorElement)); elements[i]; i++) {
                  this.settings.unhighlight.call( this, elements[i], this.settings.errorClass, this.settings.validClass );
                }
              }

              for ( i = 0; this.errorList[i] && i<1; i++ ) {
                var error = this.errorList[i];
                this.settings.highlight && this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
                this.showLabel( error.element, error.message );
              }
              if( this.errorList.length ) {
                this.toShow = this.toShow.add( this.containers );
              }
              if (this.settings.success) {
                for ( i = 0; this.successList[i]; i++ ) {
                  this.showLabel( this.successList[i] );
                }
              }
              if (this.settings.unhighlight) {
                for ( i = 0, elements = this.validElements(); elements[i]; i++ ) {
                  this.settings.unhighlight.call( this, elements[i], this.settings.errorClass, this.settings.validClass );
                }
              }

              this.toHide = this.toHide.not( this.toShow );
              this.hideErrors();
              this.addWrapper( this.toShow ).show();
              allErrors = this.errors();
              allErrors.splice(0,1);
              this.toHide = allErrors;
              this.hideErrors();
            };
          }
        }
        self.validators[f] = $('#' + f).validate(validate_options);

        // Disable HTML5 validation
        if (!Boolean(parseInt(self.forms[f].general.disableHtml5Validation, 10))) {
          $('#' + f).removeAttr('novalidate');
        }
        else {
          $('#' + f).attr('novalidate', 'novalidate');
        }
        // Bind all rules
        self.bindRules(f);

      }
    });
  self.time.stop('2. bindForms');
  };

  /**
   * Bind all rules.
   * @memberof Drupal.clientsideValidation
   */
  Drupal.clientsideValidation.prototype.bindRules = function(formid){
    var self = this;
    self.time.start('3. bindRules');
    var $form = $('#' + formid);
    var hideErrordiv = function(){
      //wait just one milisecond until the error div is updated
      window.setTimeout(function(){
        var visibles = 0;
        // @TODO: check settings
        $(".clientside-error ul li").each(function(){
          if($(this).is(':visible')){
            visibles++;
          }
          else {
            $(this).remove();
          }
        });
        if(visibles < 1){
          $(".clientside-error").hide();
        }
      }, 1);
    };
    if('checkboxrules' in self.forms[formid]){
      self.time.start('checkboxrules');
      jQuery.each (self.forms[formid].checkboxrules, function(r) {
        var $checkboxes = $form.find(this.checkboxgroupminmax[2]).find('input[type="checkbox"]');
        if ($checkboxes.length) {
          $checkboxes.addClass('require-one');
          $checkboxes.each(function(){
            var rule = self.forms[formid].checkboxrules[r];
            if (typeof self.validators[formid].settings.messages[r] === 'undefined') {
              self.validators[formid].settings.messages[r] = {};
            }
            $.extend(self.validators[formid].settings.messages[r], rule.messages);
            delete rule.messages;
            $(this).rules("add", rule);
            $(this).change(hideErrordiv);
          });
        }
      });
      self.time.stop('checkboxrules');
    }
    if('daterangerules' in self.forms[formid]){
      self.time.start('daterangerules');
      jQuery.each (self.forms[formid].daterangerules, function(r) {
        $form.find('#' + r).find('input, select').not('input[type=image]').each(function(){
          var rule = self.forms[formid].daterangerules[r];
          if (typeof self.validators[formid].settings.messages[r] === 'undefined') {
            self.validators[formid].settings.messages[r] = {};
          }
          $.extend(self.validators[formid].settings.messages[r], rule.messages);
          delete rule.messages;
          $(this).rules("add", rule);
          $(this).blur(hideErrordiv);
        });
      });
      self.time.stop('daterangerules');
    }

    if('dateminrules' in self.forms[formid]){
      self.time.start('dateminrules');
      jQuery.each (self.forms[formid].dateminrules, function(r) {
        $form.find('#' + r).find('input, select').not('input[type=image]').each(function(){
          var rule = self.forms[formid].dateminrules[r];
          if (typeof self.validators[formid].settings.messages[r] === 'undefined') {
            self.validators[formid].settings.messages[r] = {};
          }
          $.extend(self.validators[formid].settings.messages[r], rule.messages);
          delete rule.messages;
          $(this).rules("add", rule);
          $(this).blur(hideErrordiv);
        });
      });
      self.time.stop('dateminrules');
    }

    if('datemaxrules' in self.forms[formid]){
      self.time.start('datemaxrules');
      jQuery.each (self.forms[formid].datemaxrules, function(r) {
        $form.find('#' + r).find('input, select').not('input[type=image]').each(function(){
          var rule = self.forms[formid].datemaxrules[r];
          if (typeof self.validators[formid].settings.messages[r] === 'undefined') {
            self.validators[formid].settings.messages[r] = {};
          }
          $.extend(self.validators[formid].settings.messages[r], rule.messages);
          delete rule.messages;
          $(this).rules("add", rule);
          $(this).blur(hideErrordiv);
        });
      });
      self.time.stop('datemaxrules');
    }

    if ('rules' in self.forms[formid]) {
      self.time.start('rules');
      var rules = self.forms[formid].rules;
      // :input can be slow, see http://jsperf.com/input-vs-input/2
      $form.find('input, textarea, select').each(function(idx, elem) {
        var rule = rules[elem.name];
        if (rule) {
          var $elem = $(elem);
          if (typeof self.validators[formid].settings.messages[elem.name] === 'undefined') {
            self.validators[formid].settings.messages[elem.name] = {};
          }
          $.extend(self.validators[formid].settings.messages[elem.name], rule.messages);
          delete rule.messages;
          $elem.rules("add",rule);
          $elem.change(hideErrordiv);
        }
      });
      self.time.stop('rules');
    }
    self.time.stop('3. bindRules');
  };

  /**
   * Add extra rules.
   * @memberof Drupal.clientsideValidation
  */
  Drupal.clientsideValidation.prototype.addExtraRules = function(){
    var self = this;

    jQuery.validator.addMethod("numberDE", function(value, element) {
      return this.optional(element) || /^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(value);
    });

    // Min a and maximum b checkboxes from a group
    jQuery.validator.addMethod("checkboxgroupminmax", function(value, element, param) {
      var amountChecked = $(param[2]).find('input:checked').length;
      return (amountChecked >= param[0] && amountChecked <= param[1]);
    }, jQuery.format('Minimum {0}, maximum {1}'));

    // Allow integers, same as digits but including a leading '-'
    jQuery.validator.addMethod("digits_negative", function(value, element) {
      return this.optional(element) || /^-?\d+$/.test(value);
    }, jQuery.format('Please enter only digits.'));

    // One of the values
    jQuery.validator.addMethod("oneOf", function(value, element, param) {
      for (var p in param.values) {
        if (param.values[p] === value && param.caseSensitive) {
          return !param.negate;
        }
        else if (param.values[p].toLowerCase() === value.toLowerCase() && !param.caseSensitive) {
          return !param.negate;
        }
      }
      return param.negate;
    }, jQuery.format(''));

    jQuery.validator.addMethod("specificVals", function(value, element, param){
      for (var i in value) {
        if(param.indexOf(value[i]) === -1) {
            return false;
        }
      }
      return true;
    });

    jQuery.validator.addMethod("blacklist", function(value, element, param) {
      if (typeof(value) !== 'object') {
        value = value.split(' ');
      }
      for (var i in value) {
        if(param.values.indexOf(value[i]) !== -1) {
            return param.negate;
        }
      }
      return !param.negate;
    });

    // Default regular expression support
    var ajaxPCREfn = function(value, element, param) {
      var result = false;
      jQuery.ajax({
        'url': Drupal.settings.basePath + 'clientside_validation/ajax',
        'type': "POST",
        'data': {
          'value': value,
          'param': param
        },
        'dataType': 'json',
        'async': false,
        'success': function(res){
          result = res;
        }
      });
      if (result.result === false) {
        if (result.message.length) {
          jQuery.extend(jQuery.validator.messages, {
            "regexMatchPCRE": result.message
          });
        }
      }
      return result.result;
    };

    // Regular expression support using XRegExp
    var xregexPCREfn = function(value, element, param) {
      if (window.XRegExp && XRegExp.version ) {
        try {
          var result = true;
          for (var i = 0; i < param.expressions.length; i++) {
            var reg = param.expressions[i];
            var delim = reg.lastIndexOf(reg.charAt(0));
            // Only allow supported modifiers
            var modraw = reg.substr(delim + 1) || '';
            var mod = '';
            if (mod !== '') {
              for (var l = 0; l < 6; l++) {
                if (modraw.indexOf('gimnsx'[l]) !== -1) {
                  mod += 'gimnsx'[l];
                }
              }
            }
            reg = reg.substring(1, delim);
            if (!(new XRegExp(reg, mod).test(value))) {
              result = false;
              if (param.messages[i].length) {
                jQuery.extend(jQuery.validator.messages, {
                  "regexMatchPCRE": param.messages[i]
                });
              }
            }
          }
          return result;
        }
        catch (e) {
          return ajaxPCREfn(value, element, param);
        }
      }
      else {
        return ajaxPCREfn(value, element, param);
      }
    };

    // Decide which one to use
    if (self.data.general.usexregxp) {
      jQuery.validator.addMethod("regexMatchPCRE", xregexPCREfn, jQuery.format('The value does not match the expected format.'));
    }
    else {
      jQuery.validator.addMethod("regexMatchPCRE", ajaxPCREfn, jQuery.format('The value does not match the expected format.'));
    }

    // Unique values
    jQuery.validator.addMethod("notEqualTo", function(value, element, param) {
      var ret = true;
      jQuery.each(param, function (index, selector){
        var $target = $(selector);
        $target.unbind(".validate-notEqualTo").bind("blur.validate-notEqualTo", function() {
          $(element).valid();
        });
        ret = ret && ($target.val() !== value);
      });
      return ret;
    }, jQuery.format('Please don\'t enter the same value again.'));

    jQuery.validator.addMethod("regexMatch", function(value, element, param) {
      if (this.optional(element) && value === '') {
        return this.optional(element);
      }
      else {
        var regexp = new RegExp(param.regex[0], param.regex[1]);
        if(regexp.test(value)){
          return !param.negate;
        }
        return param.negate;
      }

    }, jQuery.format('The value does not match the expected format.'));

    jQuery.validator.addMethod("captcha", function (value, element, param) {
      var result = false;
      var sid = $(element).closest('.captcha').find('input[name=captcha_sid]').val();
      jQuery.ajax({
        'url': Drupal.settings.basePath + 'clientside_validation/captcha',
        'type': "POST",
        'data': {
          'value': value,
          'param': [sid, param]
        },
        'dataType': 'json',
        'async': false,
        'success': function(res){
          result = res;
        }
      });
      if (result.result === false) {
        if (typeof result.message !== 'undefined' && result.message.length) {
          jQuery.extend(jQuery.validator.messages, {
            "captcha": result.message
          });
        }
      }
      return result.result;
    }, jQuery.format('Wrong answer.'));

    jQuery.validator.addMethod("rangewords", function(value, element, param) {
      return this.optional(element) || (param[0] <= jQuery.trim(value).split(/\s+/).length && value.split(/\s+/).length <= param[1]);
    }, jQuery.format('The value must be between {0} and {1} words long'));

    jQuery.validator.addMethod("minwords", function(value, element, param) {
      return this.optional(element) || param <= jQuery.trim(value).split(/\s+/).length;
    }, jQuery.format('The value must be more than {0} words long'));

    jQuery.validator.addMethod("maxwords", function(value, element, param) {
      return this.optional(element) || jQuery.trim(value).split(/\s+/).length <= param;
    }, jQuery.format('The value must be fewer than {0} words long'));

    jQuery.validator.addMethod("plaintext", function(value, element, param){
      var result = param.negate ? (value !== strip_tags(value, param.tags)) : (value === strip_tags(value, param.tags));
      return this.optional(element) || result;
    }, jQuery.format('The value must be plaintext'));

    jQuery.validator.addMethod("selectMinlength", function(value, element, param) {
      var result = $(element).find('option:selected').length >= param.min;
      if (param.negate) {
        result = !result;
      }
      return this.optional(element) || result;
    }, jQuery.format('You must select at least {0} values'));

    jQuery.validator.addMethod("selectMaxlength", function(value, element, param) {
      var result = $(element).find('option:selected').length <= param.max;
      if (param.negate) {
        result = !result;
      }
      return this.optional(element) || result;
    }, jQuery.format('You must select a maximum of {0} values'));

    jQuery.validator.addMethod("selectRangelength", function(value, element, param) {
      var result = ($(element).find('option:selected').length >= param.range[0] && $(element).find('option:selected').length <= param.range[1]);
      if (param.negate) {
        result = !result;
      }
      return this.optional(element) || result;
    }, jQuery.format('You must select at between {0} and {1} values'));

    jQuery.validator.addMethod("datemin", function(value, element, param) {
      //Assume [month], [day], and [year] ??
      var dayelem, monthelem, yearelem, name, $form, element_name;
      $form = $(element).closest('form');
      element_name = $(element).attr('name');
      if (element_name.indexOf('[day]') > 0) {
        dayelem = $(element);
        name = dayelem.attr('name').replace('[day]', '');
        monthelem = $form.find("[name='" + name + "[month]']");
        yearelem = $form.find("[name='" + name + "[year]']");
      }
      else if (element_name.indexOf('[month]') > 0) {
        monthelem = $(element);
        name = monthelem.attr('name').replace('[month]', '');
        dayelem = $form.find("[name='" + name + "[day]']");
        yearelem = $form.find("[name='" + name + "[year]']");
      }
      else if ($(element).attr('name').indexOf('[year]') > 0) {
        yearelem = $(element);
        name = yearelem.attr('name').replace('[year]', '');
        dayelem = $form.find("[name='" + name + "[day]']");
        monthelem = $form.find("[name='" + name + "[month]']");
      }

      if (parseInt(yearelem.val(), 10) < parseInt(param[0], 10)) {
        return false;
      }
      else if (parseInt(yearelem.val(), 10) === parseInt(param[0], 10)){
        if (parseInt(monthelem.val(), 10) < parseInt(param[1], 10)){
          return false;
        }
        else if (parseInt(monthelem.val(), 10) === parseInt(param[1], 10)){
          if(parseInt(dayelem.val(), 10) < parseInt(param[2], 10)) {
            return false;
          }
        }
      }
      yearelem.once('daterange', function() {
        $(this).change(function(){$(this).trigger('focusout').trigger('blur');});
      }).removeClass('error');
      monthelem.once('daterange', function() {
        $(this).change(function(){$(this).trigger('focusout').trigger('blur');});
      }).removeClass('error');
      dayelem.once('daterange', function() {
        $(this).change(function(){$(this).trigger('focusout').trigger('blur');});
      }).removeClass('error');
      return true;
    });

    jQuery.validator.addMethod("datemax", function(value, element, param) {
      //Assume [month], [day], and [year] ??
      var dayelem, monthelem, yearelem, name, $form, element_name;
      $form = $(element).closest('form');
      element_name = $(element).attr('name');
      if (element_name.indexOf('[day]') > 0) {
        dayelem = $(element);
        name = dayelem.attr('name').replace('[day]', '');
        monthelem = $form.find("[name='" + name + "[month]']");
        yearelem = $form.find("[name='" + name + "[year]']");
      }
      else if (element_name.indexOf('[month]') > 0) {
        monthelem = $(element);
        name = monthelem.attr('name').replace('[month]', '');
        dayelem = $form.find("[name='" + name + "[day]']");
        yearelem = $form.find("[name='" + name + "[year]']");
      }
      else if (element_name.indexOf('[year]') > 0) {
        yearelem = $(element);
        name = yearelem.attr('name').replace('[year]', '');
        dayelem = $form.find("[name='" + name + "[day]']");
        monthelem = $form.find("[name='" + name + "[month]']");

      }

      if (parseInt(yearelem.val(), 10) > parseInt(param[0], 10)) {
        return false;
      }
      else if (parseInt(yearelem.val(), 10) === parseInt(param[0], 10)){
        if (parseInt(monthelem.val(), 10) > parseInt(param[1], 10)){
          return false;
        }
        else if (parseInt(monthelem.val(), 10) === parseInt(param[1], 10)){
          if(parseInt(dayelem.val(), 10) > parseInt(param[2], 10)) {
            return false;
          }
        }
      }
      yearelem.once('daterange', function() {
        $(this).change(function(){$(this).trigger('focusout').trigger('blur');});
      }).removeClass('error');
      monthelem.once('daterange', function() {
        $(this).change(function(){$(this).trigger('focusout').trigger('blur');});
      }).removeClass('error');
      dayelem.once('daterange', function() {
        $(this).change(function(){$(this).trigger('focusout').trigger('blur');});
      }).removeClass('error');
      return true;
    });

    jQuery.validator.addMethod("daterange", function(value, element, param) {
      //Assume [month], [day], and [year] ??
      var dayelem, monthelem, yearelem, name, $form, element_name;
      $form = $(element).closest('form');
      element_name = $(element).attr('name');
      if (element_name.indexOf('[day]') > 0) {
        dayelem = $(element);
        name = dayelem.attr('name').replace('[day]', '');
        monthelem = $form.find("[name='" + name + "[month]']");
        yearelem = $form.find("[name='" + name + "[year]']");
      }
      else if (element_name.indexOf('[month]') > 0) {
        monthelem = $(element);
        name = monthelem.attr('name').replace('[month]', '');
        dayelem = $form.find("[name='" + name + "[day]']");
        yearelem = $form.find("[name='" + name + "[year]']");
      }
      else if (element_name.indexOf('[year]') > 0) {
        yearelem = $(element);
        name = yearelem.attr('name').replace('[year]', '');
        dayelem = $form.find("[name='" + name + "[day]']");
        monthelem = $form.find("[name='" + name + "[month]']");
      }

      if (parseInt(yearelem.val(), 10) < parseInt(param[0][0], 10)) {
        return false;
      }
      else if (parseInt(yearelem.val(), 10) === parseInt(param[0][0], 10)){
        if (parseInt(monthelem.val(), 10) < parseInt(param[0][1], 10)){
          return false;
        }
        else if (parseInt(monthelem.val(), 10) === parseInt(param[0][1], 10)){
          if(parseInt(dayelem.val(), 10) < parseInt(param[0][2], 10)) {
            return false;
          }
        }
      }

      if (parseInt(yearelem.val(), 10) > parseInt(param[1][0], 10)) {
        return false;
      }
      else if (parseInt(yearelem.val(), 10) === parseInt(param[1][0], 10)){
        if (parseInt(monthelem.val(), 10) > parseInt(param[1][1], 10)){
          return false;
        }
        else if (parseInt(monthelem.val(), 10) === parseInt(param[1][1], 10)){
          if(parseInt(dayelem.val(), 10) > parseInt(param[1][2], 10)) {
            return false;
          }
        }
      }
      yearelem.once('daterange', function() {
        $(this).change(function(){$(this).trigger('focusout').trigger('blur');});
      }).removeClass('error');
      monthelem.once('daterange', function() {
        $(this).change(function(){$(this).trigger('focusout').trigger('blur');});
      }).removeClass('error');
      dayelem.once('daterange', function() {
        $(this).change(function(){$(this).trigger('focusout').trigger('blur');});
      }).removeClass('error');
      return true;
    });

    jQuery.validator.addMethod("dateFormat", function(value, element, param) {
      try{
        var parts = value.split(param.splitter);
        var expectedpartscount = 0;
        var day = parseInt(parts[param.daypos], 10);

        var month = parseInt(parts[param.monthpos], 10);
        if (isNaN(month)) {
          var date_parts = param.format.split(param.splitter);
          var full_idx = date_parts.indexOf("F");
          var abbr_idx = date_parts.indexOf("M");
          var mopos = Math.max(full_idx, abbr_idx);
          if (parseInt(mopos) > -1) {
            param.monthpos = mopos;
            date = new Date(parts[param.monthpos] + " 1, 2000");
            month = date.getMonth();
          }
          else {
            if (typeof Drupal.settings.clientsideValidation.general.months[parts[param.monthpos]] !== 'undefined') {
              month = Drupal.settings.clientsideValidation.general.months[parts[param.monthpos]];
            }
            else {
              month = new Date(parts[param.monthpos] + " 1, 2000");
              month = month.getMonth();
            }
          }
        }
        else {
          month--;
        }

        var year = parseInt(parts[param.yearpos], 10);
        var date = new Date();
        var result = true;
        if (parts[param.daypos].toString().length !== parts[param.daypos].length){
          result = false;
        }
        if (parts[param.monthpos].toString().length !== parts[param.monthpos].length){
          result = false;
        }
        if (parts[param.yearpos].toString().length !== parts[param.yearpos].length){
          result = false;
        }
        if (param.yearpos !== false){
          expectedpartscount++;
          date.setFullYear(year);
          if (year !== date.getFullYear()) {
            result = false;
          }
        }
        if (param.monthpos !== false) {
          expectedpartscount++;
          date.setMonth(month, 1);
          if (month !== date.getMonth()) {
            result = false;
          }
        }
        if (param.daypos !== false) {
          expectedpartscount++;
          date.setDate(day);
          if (day !== date.getDate()) {
            result = false;
          }
        }
        if (expectedpartscount !== parts.length) {
          result = false;
        }
        return this.optional(element) || result;
      } catch(e) {
        return this.optional(element) || false;
      }
    }, jQuery.format('The date is not in a valid format'));

    // Require one of several
    jQuery.validator.addMethod("requireOneOf", function(value, element, param) {
      var ret = false;
      if (value === "") {
        jQuery.each(param, function(index, name) {
          // @TODO: limit to current form
          if (!ret && $("[name='" + name + "']").val().length) {
            ret = true;
          }
        });
      }
      else {
        $(element).removeClass("error");
        ret = true;
      }
      $(element).blur(function () {
        jQuery.each(param, function(index, name) {
          // @TODO: limit to current form
          $("[name='" + name + "']").valid();
        });
      });
      return ret;
    }, jQuery.format('Please fill in at least one of the fields'));

    // Support for phone
    jQuery.validator.addMethod("phone", function(value, element, param) {
      var country_code = param;
      var result = false;
      jQuery.ajax({
        'url': Drupal.settings.basePath + 'clientside_validation/phone',
        'type': "POST",
        'data': {
          'value': value,
          'country_code': country_code
        },
        'dataType': 'json',
        'async': false,
        'success': function(res){
          result = res;
        }
      });
      return this.optional(element) || result.result;

    }, jQuery.format('Please fill in a valid phone number'));

    // EAN code
    jQuery.validator.addMethod("validEAN", function(value, element) {
      if (this.optional(element) && value === '') {
        return this.optional(element);
      }
      else {
        if (value.length > 13) {
          return false;
        }
        else if (value.length !== 13) {
          value = '0000000000000'.substr(0, 13 - value.length).concat(value);
        }
        if (value === '0000000000000') {
          return false;
        }
        if (isNaN(parseInt(value, 10)) || parseInt(value, 10) === 0) {
          return false;
        }
        var runningTotal = 0;
        for (var c = 0; c < 12; c++) {
          if (c % 2 === 0) {
            runningTotal += 3 * parseInt(value.substr(c, 1), 10);
          }
          else {
            runningTotal += parseInt(value.substr(c, 1), 10);
          }
        }
        var rem = runningTotal % 10;
        if (rem !== 0) {
          rem = 10 - rem;
        }

        return rem === parseInt(value.substr(12, 1), 10);

      }
    }, jQuery.format('Not a valid EAN number.'));

    /**
     * Allow other modules to add more rules.
     * @event clientsideValidationAddCustomRules
     * @name clientsideValidationAddCustomRules
     * @memberof Drupal.clientsideValidation
     */
    jQuery.event.trigger('clientsideValidationAddCustomRules');


    /**
     * strip illegal tags
     * @memberof Drupal.clientsideValidation
     * @private
     */
    function strip_tags (input, allowed) {
      allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
      var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
          commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
      return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
      });
    }
  };

  Drupal.behaviors.ZZZClientsideValidation = {
    attach: function () {
      function changeAjax(ajax_el) {
       if(!Drupal.ajax[ajax_el].url.match('/file\/ajax/')) {
        var origBeforeSubmit = Drupal.ajax[ajax_el].options.beforeSubmit;
        Drupal.ajax[ajax_el].options.beforeSubmit = function (form_values, element, options) {
          var ret = origBeforeSubmit(form_values, element, options);
          // If this function didn't return anything, just set the return value to true.
          // If it did return something, allow it to prevent submit if necessary.
          if (typeof ret === 'undefined') {
            ret = true;
          }
          var id = element.is('form') ? element.attr('id') : element.closest('form').attr('id');
          if (id && Drupal.myClientsideValidation.validators[id]) {
            Drupal.myClientsideValidation.validators[id].onsubmit = false;
            ret = ret && Drupal.myClientsideValidation.validators[id].form();
            if (!ret) {
              Drupal.ajax[ajax_el].ajaxing = false;
            }
          }
          return ret;
        };
       }
      }
      // Set validation for ctools modal forms
      for (var ajax_el in Drupal.ajax) {
        if (typeof Drupal.ajax[ajax_el] !== 'undefined') {
          var $ajax_el = jQuery(Drupal.ajax[ajax_el].element);
          var ajax_form = $ajax_el.is('form') ? $ajax_el.attr('id') : $ajax_el.closest('form').attr('id');
          var change_ajax = true;
          if (typeof Drupal.myClientsideValidation.forms[ajax_form] !== 'undefined') {
            change_ajax = Boolean(parseInt(Drupal.myClientsideValidation.forms[ajax_form].general.validateBeforeAjax, 10));
          }
          if (!$ajax_el.hasClass('cancel') && change_ajax) {
            changeAjax(ajax_el);
          }
        }
      }
    }
  };
})(jQuery);
;
