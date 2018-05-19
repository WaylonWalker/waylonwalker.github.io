(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * reveal.js
 * http://lab.hakim.se/reveal-js
 * MIT licensed
 *
 * Copyright (C) 2013 Hakim El Hattab, http://hakim.se
 */
var Reveal = (function(){

	'use strict';

	var SLIDES_SELECTOR = '.reveal .slides section',
		HORIZONTAL_SLIDES_SELECTOR = '.reveal .slides>section',
		VERTICAL_SLIDES_SELECTOR = '.reveal .slides>section.present>section',
		HOME_SLIDE_SELECTOR = '.reveal .slides>section:first-of-type',

		// Configurations defaults, can be overridden at initialization time
		config = {

			// The "normal" size of the presentation, aspect ratio will be preserved
			// when the presentation is scaled to fit different resolutions
			width: 960,
			height: 700,

			// Factor of the display size that should remain empty around the content
			margin: 0.1,

			// Bounds for smallest/largest possible scale to apply to content
			minScale: 0.2,
			maxScale: 1.0,

			// Display controls in the bottom right corner
			controls: true,

			// Display a presentation progress bar
			progress: true,

			// Display the page number of the current slide
			slideNumber: false,

			// Push each slide change to the browser history
			history: false,

			// Enable keyboard shortcuts for navigation
			keyboard: true,

			// Enable the slide overview mode
			overview: true,

			// Vertical centering of slides
			center: true,

			// Enables touch navigation on devices with touch input
			touch: true,

			// Loop the presentation
			loop: false,

			// Change the presentation direction to be RTL
			rtl: false,

			// Turns fragments on and off globally
			fragments: true,

			// Flags if the presentation is running in an embedded mode,
			// i.e. contained within a limited portion of the screen
			embedded: false,

			// Number of milliseconds between automatically proceeding to the
			// next slide, disabled when set to 0, this value can be overwritten
			// by using a data-autoslide attribute on your slides
			autoSlide: 0,

			// Stop auto-sliding after user input
			autoSlideStoppable: true,

			// Enable slide navigation via mouse wheel
			mouseWheel: false,

			// Apply a 3D roll to links on hover
			rollingLinks: false,

			// Hides the address bar on mobile devices
			hideAddressBar: true,

			// Opens links in an iframe preview overlay
			previewLinks: false,

			// Focuses body when page changes visiblity to ensure keyboard shortcuts work
			focusBodyOnPageVisiblityChange: true,

			// Theme (see /css/theme)
			theme: null,

			// Transition style
			transition: 'default', // default/cube/page/concave/zoom/linear/fade/none

			// Transition speed
			transitionSpeed: 'default', // default/fast/slow

			// Transition style for full page slide backgrounds
			backgroundTransition: 'default', // default/linear/none

			// Parallax background image
			parallaxBackgroundImage: '', // CSS syntax, e.g. "a.jpg"

			// Parallax background size
			parallaxBackgroundSize: '', // CSS syntax, e.g. "3000px 2000px"

			// Number of slides away from the current that are visible
			viewDistance: 3,

			// Script dependencies to load
			dependencies: []

		},

		// Flags if reveal.js is loaded (has dispatched the 'ready' event)
		loaded = false,

		// The horizontal and vertical index of the currently active slide
		indexh,
		indexv,

		// The previous and current slide HTML elements
		previousSlide,
		currentSlide,

		previousBackground,

		// Slides may hold a data-state attribute which we pick up and apply
		// as a class to the body. This list contains the combined state of
		// all current slides.
		state = [],

		// The current scale of the presentation (see width/height config)
		scale = 1,

		// Cached references to DOM elements
		dom = {},

		// Features supported by the browser, see #checkCapabilities()
		features = {},

		// Client is a mobile device, see #checkCapabilities()
		isMobileDevice,

		// Throttles mouse wheel navigation
		lastMouseWheelStep = 0,

		// Delays updates to the URL due to a Chrome thumbnailer bug
		writeURLTimeout = 0,

		// A delay used to activate the overview mode
		activateOverviewTimeout = 0,

		// A delay used to deactivate the overview mode
		deactivateOverviewTimeout = 0,

		// Flags if the interaction event listeners are bound
		eventsAreBound = false,

		// The current auto-slide duration
		autoSlide = 0,

		// Auto slide properties
		autoSlidePlayer,
		autoSlideTimeout = 0,
		autoSlideStartTime = -1,
		autoSlidePaused = false,

		// Holds information about the currently ongoing touch input
		touch = {
			startX: 0,
			startY: 0,
			startSpan: 0,
			startCount: 0,
			captured: false,
			threshold: 40
		};

	/**
	 * Starts up the presentation if the client is capable.
	 */
	function initialize( options ) {

		checkCapabilities();

		if( !features.transforms2d && !features.transforms3d ) {
			document.body.setAttribute( 'class', 'no-transforms' );

			// If the browser doesn't support core features we won't be
			// using JavaScript to control the presentation
			return;
		}

		// Force a layout when the whole page, incl fonts, has loaded
		window.addEventListener( 'load', layout, false );

		var query = Reveal.getQueryHash();

		// Do not accept new dependencies via query config to avoid
		// the potential of malicious script injection
		if( typeof query['dependencies'] !== 'undefined' ) delete query['dependencies'];

		// Copy options over to our config object
		extend( config, options );
		extend( config, query );

		// Hide the address bar in mobile browsers
		hideAddressBar();

		// Loads the dependencies and continues to #start() once done
		load();

	}

	/**
	 * Inspect the client to see what it's capable of, this
	 * should only happens once per runtime.
	 */
	function checkCapabilities() {

		features.transforms3d = 'WebkitPerspective' in document.body.style ||
								'MozPerspective' in document.body.style ||
								'msPerspective' in document.body.style ||
								'OPerspective' in document.body.style ||
								'perspective' in document.body.style;

		features.transforms2d = 'WebkitTransform' in document.body.style ||
								'MozTransform' in document.body.style ||
								'msTransform' in document.body.style ||
								'OTransform' in document.body.style ||
								'transform' in document.body.style;

		features.requestAnimationFrameMethod = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
		features.requestAnimationFrame = typeof features.requestAnimationFrameMethod === 'function';

		features.canvas = !!document.createElement( 'canvas' ).getContext;

		isMobileDevice = navigator.userAgent.match( /(iphone|ipod|android)/gi );

	}


    /**
     * Loads the dependencies of reveal.js. Dependencies are
     * defined via the configuration option 'dependencies'
     * and will be loaded prior to starting/binding reveal.js.
     * Some dependencies may have an 'async' flag, if so they
     * will load after reveal.js has been started up.
     */
	function load() {

		var scripts = [],
			scriptsAsync = [],
			scriptsToPreload = 0;

		// Called once synchronous scripts finish loading
		function proceed() {
			if( scriptsAsync.length ) {
				// Load asynchronous scripts
				head.js.apply( null, scriptsAsync );
			}

			start();
		}

		function loadScript( s ) {
			head.ready( s.src.match( /([\w\d_\-]*)\.?js$|[^\\\/]*$/i )[0], function() {
				// Extension may contain callback functions
				if( typeof s.callback === 'function' ) {
					s.callback.apply( this );
				}

				if( --scriptsToPreload === 0 ) {
					proceed();
				}
			});
		}

		for( var i = 0, len = config.dependencies.length; i < len; i++ ) {
			var s = config.dependencies[i];

			// Load if there's no condition or the condition is truthy
			if( !s.condition || s.condition() ) {
				if( s.async ) {
					scriptsAsync.push( s.src );
				}
				else {
					scripts.push( s.src );
				}

				loadScript( s );
			}
		}

		if( scripts.length ) {
			scriptsToPreload = scripts.length;

			// Load synchronous scripts
			head.js.apply( null, scripts );
		}
		else {
			proceed();
		}

	}

	/**
	 * Starts up reveal.js by binding input events and navigating
	 * to the current URL deeplink if there is one.
	 */
	function start() {

		// Make sure we've got all the DOM elements we need
		setupDOM();

		// Resets all vertical slides so that only the first is visible
		resetVerticalSlides();

		// Updates the presentation to match the current configuration values
		configure();

		// Read the initial hash
		readURL();

		// Update all backgrounds
		updateBackground( true );

		// Notify listeners that the presentation is ready but use a 1ms
		// timeout to ensure it's not fired synchronously after #initialize()
		setTimeout( function() {
			// Enable transitions now that we're loaded
			dom.slides.classList.remove( 'no-transition' );

			loaded = true;

			dispatchEvent( 'ready', {
				'indexh': indexh,
				'indexv': indexv,
				'currentSlide': currentSlide
			} );
		}, 1 );

	}

	/**
	 * Finds and stores references to DOM elements which are
	 * required by the presentation. If a required element is
	 * not found, it is created.
	 */
	function setupDOM() {

		// Cache references to key DOM elements
		dom.theme = document.querySelector( '#theme' );
		dom.wrapper = document.querySelector( '.reveal' );
		dom.slides = document.querySelector( '.reveal .slides' );

		// Prevent transitions while we're loading
		dom.slides.classList.add( 'no-transition' );

		// Background element
		dom.background = createSingletonNode( dom.wrapper, 'div', 'backgrounds', null );

		// Progress bar
		dom.progress = createSingletonNode( dom.wrapper, 'div', 'progress', '<span></span>' );
		dom.progressbar = dom.progress.querySelector( 'span' );

		// Arrow controls
		createSingletonNode( dom.wrapper, 'aside', 'controls',
			'<div class="navigate-left"></div>' +
			'<div class="navigate-right"></div>' +
			'<div class="navigate-up"></div>' +
			'<div class="navigate-down"></div>' );

		// Slide number
		dom.slideNumber = createSingletonNode( dom.wrapper, 'div', 'slide-number', '' );

		// State background element [DEPRECATED]
		createSingletonNode( dom.wrapper, 'div', 'state-background', null );

		// Overlay graphic which is displayed during the paused mode
		createSingletonNode( dom.wrapper, 'div', 'pause-overlay', null );

		// Cache references to elements
		dom.controls = document.querySelector( '.reveal .controls' );

		// There can be multiple instances of controls throughout the page
		dom.controlsLeft = toArray( document.querySelectorAll( '.navigate-left' ) );
		dom.controlsRight = toArray( document.querySelectorAll( '.navigate-right' ) );
		dom.controlsUp = toArray( document.querySelectorAll( '.navigate-up' ) );
		dom.controlsDown = toArray( document.querySelectorAll( '.navigate-down' ) );
		dom.controlsPrev = toArray( document.querySelectorAll( '.navigate-prev' ) );
		dom.controlsNext = toArray( document.querySelectorAll( '.navigate-next' ) );

	}

	/**
	 * Creates an HTML element and returns a reference to it.
	 * If the element already exists the existing instance will
	 * be returned.
	 */
	function createSingletonNode( container, tagname, classname, innerHTML ) {

		var node = container.querySelector( '.' + classname );
		if( !node ) {
			node = document.createElement( tagname );
			node.classList.add( classname );
			if( innerHTML !== null ) {
				node.innerHTML = innerHTML;
			}
			container.appendChild( node );
		}
		return node;

	}

	/**
	 * Creates the slide background elements and appends them
	 * to the background container. One element is created per
	 * slide no matter if the given slide has visible background.
	 */
	function createBackgrounds() {

		if( isPrintingPDF() ) {
			document.body.classList.add( 'print-pdf' );
		}

		// Clear prior backgrounds
		dom.background.innerHTML = '';
		dom.background.classList.add( 'no-transition' );

		// Helper method for creating a background element for the
		// given slide
		function _createBackground( slide, container ) {

			var data = {
				background: slide.getAttribute( 'data-background' ),
				backgroundSize: slide.getAttribute( 'data-background-size' ),
				backgroundImage: slide.getAttribute( 'data-background-image' ),
				backgroundColor: slide.getAttribute( 'data-background-color' ),
				backgroundRepeat: slide.getAttribute( 'data-background-repeat' ),
				backgroundPosition: slide.getAttribute( 'data-background-position' ),
				backgroundTransition: slide.getAttribute( 'data-background-transition' )
			};

			var element = document.createElement( 'div' );
			element.className = 'slide-background';

			if( data.background ) {
				// Auto-wrap image urls in url(...)
				if( /^(http|file|\/\/)/gi.test( data.background ) || /\.(svg|png|jpg|jpeg|gif|bmp)$/gi.test( data.background ) ) {
					element.style.backgroundImage = 'url('+ data.background +')';
				}
				else {
					element.style.background = data.background;
				}
			}

			if( data.background || data.backgroundColor || data.backgroundImage ) {
				element.setAttribute( 'data-background-hash', data.background + data.backgroundSize + data.backgroundImage + data.backgroundColor + data.backgroundRepeat + data.backgroundPosition + data.backgroundTransition );
			}

			// Additional and optional background properties
			if( data.backgroundSize ) element.style.backgroundSize = data.backgroundSize;
			if( data.backgroundImage ) element.style.backgroundImage = 'url("' + data.backgroundImage + '")';
			if( data.backgroundColor ) element.style.backgroundColor = data.backgroundColor;
			if( data.backgroundRepeat ) element.style.backgroundRepeat = data.backgroundRepeat;
			if( data.backgroundPosition ) element.style.backgroundPosition = data.backgroundPosition;
			if( data.backgroundTransition ) element.setAttribute( 'data-background-transition', data.backgroundTransition );

			container.appendChild( element );

			return element;

		}

		// Iterate over all horizontal slides
		toArray( document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ).forEach( function( slideh ) {

			var backgroundStack;

			if( isPrintingPDF() ) {
				backgroundStack = _createBackground( slideh, slideh );
			}
			else {
				backgroundStack = _createBackground( slideh, dom.background );
			}

			// Iterate over all vertical slides
			toArray( slideh.querySelectorAll( 'section' ) ).forEach( function( slidev ) {

				if( isPrintingPDF() ) {
					_createBackground( slidev, slidev );
				}
				else {
					_createBackground( slidev, backgroundStack );
				}

			} );

		} );

		// Add parallax background if specified
		if( config.parallaxBackgroundImage ) {

			dom.background.style.backgroundImage = 'url("' + config.parallaxBackgroundImage + '")';
			dom.background.style.backgroundSize = config.parallaxBackgroundSize;

			// Make sure the below properties are set on the element - these properties are
			// needed for proper transitions to be set on the element via CSS. To remove
			// annoying background slide-in effect when the presentation starts, apply
			// these properties after short time delay
			setTimeout( function() {
				dom.wrapper.classList.add( 'has-parallax-background' );
			}, 1 );

		}
		else {

			dom.background.style.backgroundImage = '';
			dom.wrapper.classList.remove( 'has-parallax-background' );

		}

	}

	/**
	 * Applies the configuration settings from the config
	 * object. May be called multiple times.
	 */
	function configure( options ) {

		var numberOfSlides = document.querySelectorAll( SLIDES_SELECTOR ).length;

		dom.wrapper.classList.remove( config.transition );

		// New config options may be passed when this method
		// is invoked through the API after initialization
		if( typeof options === 'object' ) extend( config, options );

		// Force linear transition based on browser capabilities
		if( features.transforms3d === false ) config.transition = 'linear';

		dom.wrapper.classList.add( config.transition );

		dom.wrapper.setAttribute( 'data-transition-speed', config.transitionSpeed );
		dom.wrapper.setAttribute( 'data-background-transition', config.backgroundTransition );

		dom.controls.style.display = config.controls ? 'block' : 'none';
		dom.progress.style.display = config.progress ? 'block' : 'none';

		if( config.rtl ) {
			dom.wrapper.classList.add( 'rtl' );
		}
		else {
			dom.wrapper.classList.remove( 'rtl' );
		}

		if( config.center ) {
			dom.wrapper.classList.add( 'center' );
		}
		else {
			dom.wrapper.classList.remove( 'center' );
		}

		if( config.mouseWheel ) {
			document.addEventListener( 'DOMMouseScroll', onDocumentMouseScroll, false ); // FF
			document.addEventListener( 'mousewheel', onDocumentMouseScroll, false );
		}
		else {
			document.removeEventListener( 'DOMMouseScroll', onDocumentMouseScroll, false ); // FF
			document.removeEventListener( 'mousewheel', onDocumentMouseScroll, false );
		}

		// Rolling 3D links
		if( config.rollingLinks ) {
			enableRollingLinks();
		}
		else {
			disableRollingLinks();
		}

		// Iframe link previews
		if( config.previewLinks ) {
			enablePreviewLinks();
		}
		else {
			disablePreviewLinks();
			enablePreviewLinks( '[data-preview-link]' );
		}

		// Auto-slide playback controls
		if( numberOfSlides > 1 && config.autoSlide && config.autoSlideStoppable && features.canvas && features.requestAnimationFrame ) {
			autoSlidePlayer = new Playback( dom.wrapper, function() {
				return Math.min( Math.max( ( Date.now() - autoSlideStartTime ) / autoSlide, 0 ), 1 );
			} );

			autoSlidePlayer.on( 'click', onAutoSlidePlayerClick );
			autoSlidePaused = false;
		}
		else if( autoSlidePlayer ) {
			autoSlidePlayer.destroy();
			autoSlidePlayer = null;
		}

		// Load the theme in the config, if it's not already loaded
		if( config.theme && dom.theme ) {
			var themeURL = dom.theme.getAttribute( 'href' );
			var themeFinder = /[^\/]*?(?=\.css)/;
			var themeName = themeURL.match(themeFinder)[0];

			if(  config.theme !== themeName ) {
				themeURL = themeURL.replace(themeFinder, config.theme);
				dom.theme.setAttribute( 'href', themeURL );
			}
		}

		sync();

	}

	/**
	 * Binds all event listeners.
	 */
	function addEventListeners() {

		eventsAreBound = true;

		window.addEventListener( 'hashchange', onWindowHashChange, false );
		window.addEventListener( 'resize', onWindowResize, false );

		if( config.touch ) {
			dom.wrapper.addEventListener( 'touchstart', onTouchStart, false );
			dom.wrapper.addEventListener( 'touchmove', onTouchMove, false );
			dom.wrapper.addEventListener( 'touchend', onTouchEnd, false );

			// Support pointer-style touch interaction as well
			if( window.navigator.msPointerEnabled ) {
				dom.wrapper.addEventListener( 'MSPointerDown', onPointerDown, false );
				dom.wrapper.addEventListener( 'MSPointerMove', onPointerMove, false );
				dom.wrapper.addEventListener( 'MSPointerUp', onPointerUp, false );
			}
		}

		if( config.keyboard ) {
			document.addEventListener( 'keydown', onDocumentKeyDown, false );
		}

		if( config.progress && dom.progress ) {
			dom.progress.addEventListener( 'click', onProgressClicked, false );
		}

		if( config.focusBodyOnPageVisiblityChange ) {
			var visibilityChange;

			if( 'hidden' in document ) {
				visibilityChange = 'visibilitychange';
			}
			else if( 'msHidden' in document ) {
				visibilityChange = 'msvisibilitychange';
			}
			else if( 'webkitHidden' in document ) {
				visibilityChange = 'webkitvisibilitychange';
			}

			if( visibilityChange ) {
				document.addEventListener( visibilityChange, onPageVisibilityChange, false );
			}
		}

		[ 'touchstart', 'click' ].forEach( function( eventName ) {
			dom.controlsLeft.forEach( function( el ) { el.addEventListener( eventName, onNavigateLeftClicked, false ); } );
			dom.controlsRight.forEach( function( el ) { el.addEventListener( eventName, onNavigateRightClicked, false ); } );
			dom.controlsUp.forEach( function( el ) { el.addEventListener( eventName, onNavigateUpClicked, false ); } );
			dom.controlsDown.forEach( function( el ) { el.addEventListener( eventName, onNavigateDownClicked, false ); } );
			dom.controlsPrev.forEach( function( el ) { el.addEventListener( eventName, onNavigatePrevClicked, false ); } );
			dom.controlsNext.forEach( function( el ) { el.addEventListener( eventName, onNavigateNextClicked, false ); } );
		} );

	}

	/**
	 * Unbinds all event listeners.
	 */
	function removeEventListeners() {

		eventsAreBound = false;

		document.removeEventListener( 'keydown', onDocumentKeyDown, false );
		window.removeEventListener( 'hashchange', onWindowHashChange, false );
		window.removeEventListener( 'resize', onWindowResize, false );

		dom.wrapper.removeEventListener( 'touchstart', onTouchStart, false );
		dom.wrapper.removeEventListener( 'touchmove', onTouchMove, false );
		dom.wrapper.removeEventListener( 'touchend', onTouchEnd, false );

		if( window.navigator.msPointerEnabled ) {
			dom.wrapper.removeEventListener( 'MSPointerDown', onPointerDown, false );
			dom.wrapper.removeEventListener( 'MSPointerMove', onPointerMove, false );
			dom.wrapper.removeEventListener( 'MSPointerUp', onPointerUp, false );
		}

		if ( config.progress && dom.progress ) {
			dom.progress.removeEventListener( 'click', onProgressClicked, false );
		}

		[ 'touchstart', 'click' ].forEach( function( eventName ) {
			dom.controlsLeft.forEach( function( el ) { el.removeEventListener( eventName, onNavigateLeftClicked, false ); } );
			dom.controlsRight.forEach( function( el ) { el.removeEventListener( eventName, onNavigateRightClicked, false ); } );
			dom.controlsUp.forEach( function( el ) { el.removeEventListener( eventName, onNavigateUpClicked, false ); } );
			dom.controlsDown.forEach( function( el ) { el.removeEventListener( eventName, onNavigateDownClicked, false ); } );
			dom.controlsPrev.forEach( function( el ) { el.removeEventListener( eventName, onNavigatePrevClicked, false ); } );
			dom.controlsNext.forEach( function( el ) { el.removeEventListener( eventName, onNavigateNextClicked, false ); } );
		} );

	}

	/**
	 * Extend object a with the properties of object b.
	 * If there's a conflict, object b takes precedence.
	 */
	function extend( a, b ) {

		for( var i in b ) {
			a[ i ] = b[ i ];
		}

	}

	/**
	 * Converts the target object to an array.
	 */
	function toArray( o ) {

		return Array.prototype.slice.call( o );

	}

	/**
	 * Measures the distance in pixels between point a
	 * and point b.
	 *
	 * @param {Object} a point with x/y properties
	 * @param {Object} b point with x/y properties
	 */
	function distanceBetween( a, b ) {

		var dx = a.x - b.x,
			dy = a.y - b.y;

		return Math.sqrt( dx*dx + dy*dy );

	}

	/**
	 * Applies a CSS transform to the target element.
	 */
	function transformElement( element, transform ) {

		element.style.WebkitTransform = transform;
		element.style.MozTransform = transform;
		element.style.msTransform = transform;
		element.style.OTransform = transform;
		element.style.transform = transform;

	}

	/**
	 * Retrieves the height of the given element by looking
	 * at the position and height of its immediate children.
	 */
	function getAbsoluteHeight( element ) {

		var height = 0;

		if( element ) {
			var absoluteChildren = 0;

			toArray( element.childNodes ).forEach( function( child ) {

				if( typeof child.offsetTop === 'number' && child.style ) {
					// Count # of abs children
					if( child.style.position === 'absolute' ) {
						absoluteChildren += 1;
					}

					height = Math.max( height, child.offsetTop + child.offsetHeight );
				}

			} );

			// If there are no absolute children, use offsetHeight
			if( absoluteChildren === 0 ) {
				height = element.offsetHeight;
			}

		}

		return height;

	}

	/**
	 * Returns the remaining height within the parent of the
	 * target element after subtracting the height of all
	 * siblings.
	 *
	 * remaining height = [parent height] - [ siblings height]
	 */
	function getRemainingHeight( element, height ) {

		height = height || 0;

		if( element ) {
			var parent = element.parentNode;
			var siblings = parent.childNodes;

			// Subtract the height of each sibling
			toArray( siblings ).forEach( function( sibling ) {

				if( typeof sibling.offsetHeight === 'number' && sibling !== element ) {

					var styles = window.getComputedStyle( sibling ),
						marginTop = parseInt( styles.marginTop, 10 ),
						marginBottom = parseInt( styles.marginBottom, 10 );

					height -= sibling.offsetHeight + marginTop + marginBottom;

				}

			} );

			var elementStyles = window.getComputedStyle( element );

			// Subtract the margins of the target element
			height -= parseInt( elementStyles.marginTop, 10 ) +
						parseInt( elementStyles.marginBottom, 10 );

		}

		return height;

	}

	/**
	 * Checks if this instance is being used to print a PDF.
	 */
	function isPrintingPDF() {

		return ( /print-pdf/gi ).test( window.location.search );

	}

	/**
	 * Hides the address bar if we're on a mobile device.
	 */
	function hideAddressBar() {

		if( config.hideAddressBar && isMobileDevice ) {
			// Events that should trigger the address bar to hide
			window.addEventListener( 'load', removeAddressBar, false );
			window.addEventListener( 'orientationchange', removeAddressBar, false );
		}

	}

	/**
	 * Causes the address bar to hide on mobile devices,
	 * more vertical space ftw.
	 */
	function removeAddressBar() {

		setTimeout( function() {
			window.scrollTo( 0, 1 );
		}, 10 );

	}

	/**
	 * Dispatches an event of the specified type from the
	 * reveal DOM element.
	 */
	function dispatchEvent( type, properties ) {

		var event = document.createEvent( "HTMLEvents", 1, 2 );
		event.initEvent( type, true, true );
		extend( event, properties );
		dom.wrapper.dispatchEvent( event );

	}

	/**
	 * Wrap all links in 3D goodness.
	 */
	function enableRollingLinks() {

		if( features.transforms3d && !( 'msPerspective' in document.body.style ) ) {
			var anchors = document.querySelectorAll( SLIDES_SELECTOR + ' a:not(.image)' );

			for( var i = 0, len = anchors.length; i < len; i++ ) {
				var anchor = anchors[i];

				if( anchor.textContent && !anchor.querySelector( '*' ) && ( !anchor.className || !anchor.classList.contains( anchor, 'roll' ) ) ) {
					var span = document.createElement('span');
					span.setAttribute('data-title', anchor.text);
					span.innerHTML = anchor.innerHTML;

					anchor.classList.add( 'roll' );
					anchor.innerHTML = '';
					anchor.appendChild(span);
				}
			}
		}

	}

	/**
	 * Unwrap all 3D links.
	 */
	function disableRollingLinks() {

		var anchors = document.querySelectorAll( SLIDES_SELECTOR + ' a.roll' );

		for( var i = 0, len = anchors.length; i < len; i++ ) {
			var anchor = anchors[i];
			var span = anchor.querySelector( 'span' );

			if( span ) {
				anchor.classList.remove( 'roll' );
				anchor.innerHTML = span.innerHTML;
			}
		}

	}

	/**
	 * Bind preview frame links.
	 */
	function enablePreviewLinks( selector ) {

		var anchors = toArray( document.querySelectorAll( selector ? selector : 'a' ) );

		anchors.forEach( function( element ) {
			if( /^(http|www)/gi.test( element.getAttribute( 'href' ) ) ) {
				element.addEventListener( 'click', onPreviewLinkClicked, false );
			}
		} );

	}

	/**
	 * Unbind preview frame links.
	 */
	function disablePreviewLinks() {

		var anchors = toArray( document.querySelectorAll( 'a' ) );

		anchors.forEach( function( element ) {
			if( /^(http|www)/gi.test( element.getAttribute( 'href' ) ) ) {
				element.removeEventListener( 'click', onPreviewLinkClicked, false );
			}
		} );

	}

	/**
	 * Opens a preview window for the target URL.
	 */
	function openPreview( url ) {

		closePreview();

		dom.preview = document.createElement( 'div' );
		dom.preview.classList.add( 'preview-link-overlay' );
		dom.wrapper.appendChild( dom.preview );

		dom.preview.innerHTML = [
			'<header>',
				'<a class="close" href="#"><span class="icon"></span></a>',
				'<a class="external" href="'+ url +'" target="_blank"><span class="icon"></span></a>',
			'</header>',
			'<div class="spinner"></div>',
			'<div class="viewport">',
				'<iframe src="'+ url +'"></iframe>',
			'</div>'
		].join('');

		dom.preview.querySelector( 'iframe' ).addEventListener( 'load', function( event ) {
			dom.preview.classList.add( 'loaded' );
		}, false );

		dom.preview.querySelector( '.close' ).addEventListener( 'click', function( event ) {
			closePreview();
			event.preventDefault();
		}, false );

		dom.preview.querySelector( '.external' ).addEventListener( 'click', function( event ) {
			closePreview();
		}, false );

		setTimeout( function() {
			dom.preview.classList.add( 'visible' );
		}, 1 );

	}

	/**
	 * Closes the iframe preview window.
	 */
	function closePreview() {

		if( dom.preview ) {
			dom.preview.setAttribute( 'src', '' );
			dom.preview.parentNode.removeChild( dom.preview );
			dom.preview = null;
		}

	}

	/**
	 * Applies JavaScript-controlled layout rules to the
	 * presentation.
	 */
	function layout() {

		if( dom.wrapper && !isPrintingPDF() ) {

			// Available space to scale within
			var availableWidth = dom.wrapper.offsetWidth,
				availableHeight = dom.wrapper.offsetHeight;

			// Reduce available space by margin
			availableWidth -= ( availableHeight * config.margin );
			availableHeight -= ( availableHeight * config.margin );

			// Dimensions of the content
			var slideWidth = config.width,
				slideHeight = config.height,
				slidePadding = 20; // TODO Dig this out of DOM

			// Layout the contents of the slides
			layoutSlideContents( config.width, config.height, slidePadding );

			// Slide width may be a percentage of available width
			if( typeof slideWidth === 'string' && /%$/.test( slideWidth ) ) {
				slideWidth = parseInt( slideWidth, 10 ) / 100 * availableWidth;
			}

			// Slide height may be a percentage of available height
			if( typeof slideHeight === 'string' && /%$/.test( slideHeight ) ) {
				slideHeight = parseInt( slideHeight, 10 ) / 100 * availableHeight;
			}

			dom.slides.style.width = slideWidth + 'px';
			dom.slides.style.height = slideHeight + 'px';

			// Determine scale of content to fit within available space
			scale = Math.min( availableWidth / slideWidth, availableHeight / slideHeight );

			// Respect max/min scale settings
			scale = Math.max( scale, config.minScale );
			scale = Math.min( scale, config.maxScale );

			// Prefer applying scale via zoom since Chrome blurs scaled content
			// with nested transforms
			if( typeof dom.slides.style.zoom !== 'undefined' && !navigator.userAgent.match( /(iphone|ipod|ipad|android)/gi ) ) {
				dom.slides.style.zoom = scale;
			}
			// Apply scale transform as a fallback
			else {
				transformElement( dom.slides, 'translate(-50%, -50%) scale('+ scale +') translate(50%, 50%)' );
			}

			// Select all slides, vertical and horizontal
			var slides = toArray( document.querySelectorAll( SLIDES_SELECTOR ) );

			for( var i = 0, len = slides.length; i < len; i++ ) {
				var slide = slides[ i ];

				// Don't bother updating invisible slides
				if( slide.style.display === 'none' ) {
					continue;
				}

				if( config.center || slide.classList.contains( 'center' ) ) {
					// Vertical stacks are not centred since their section
					// children will be
					if( slide.classList.contains( 'stack' ) ) {
						slide.style.top = 0;
					}
					else {
						slide.style.top = Math.max( - ( getAbsoluteHeight( slide ) / 2 ) - slidePadding, -slideHeight / 2 ) + 'px';
					}
				}
				else {
					slide.style.top = '';
				}

			}

			updateProgress();
			updateParallax();

		}

	}

	/**
	 * Applies layout logic to the contents of all slides in
	 * the presentation.
	 */
	function layoutSlideContents( width, height, padding ) {

		// Handle sizing of elements with the 'stretch' class
		toArray( dom.slides.querySelectorAll( 'section > .stretch' ) ).forEach( function( element ) {

			// Determine how much vertical space we can use
			var remainingHeight = getRemainingHeight( element, ( height - ( padding * 2 ) ) );

			// Consider the aspect ratio of media elements
			if( /(img|video)/gi.test( element.nodeName ) ) {
				var nw = element.naturalWidth || element.videoWidth,
					nh = element.naturalHeight || element.videoHeight;

				var es = Math.min( width / nw, remainingHeight / nh );

				element.style.width = ( nw * es ) + 'px';
				element.style.height = ( nh * es ) + 'px';

			}
			else {
				element.style.width = width + 'px';
				element.style.height = remainingHeight + 'px';
			}

		} );

	}

	/**
	 * Stores the vertical index of a stack so that the same
	 * vertical slide can be selected when navigating to and
	 * from the stack.
	 *
	 * @param {HTMLElement} stack The vertical stack element
	 * @param {int} v Index to memorize
	 */
	function setPreviousVerticalIndex( stack, v ) {

		if( typeof stack === 'object' && typeof stack.setAttribute === 'function' ) {
			stack.setAttribute( 'data-previous-indexv', v || 0 );
		}

	}

	/**
	 * Retrieves the vertical index which was stored using
	 * #setPreviousVerticalIndex() or 0 if no previous index
	 * exists.
	 *
	 * @param {HTMLElement} stack The vertical stack element
	 */
	function getPreviousVerticalIndex( stack ) {

		if( typeof stack === 'object' && typeof stack.setAttribute === 'function' && stack.classList.contains( 'stack' ) ) {
			// Prefer manually defined start-indexv
			var attributeName = stack.hasAttribute( 'data-start-indexv' ) ? 'data-start-indexv' : 'data-previous-indexv';

			return parseInt( stack.getAttribute( attributeName ) || 0, 10 );
		}

		return 0;

	}

	/**
	 * Displays the overview of slides (quick nav) by
	 * scaling down and arranging all slide elements.
	 *
	 * Experimental feature, might be dropped if perf
	 * can't be improved.
	 */
	function activateOverview() {

		// Only proceed if enabled in config
		if( config.overview ) {

			// Don't auto-slide while in overview mode
			cancelAutoSlide();

			var wasActive = dom.wrapper.classList.contains( 'overview' );

			// Vary the depth of the overview based on screen size
			var depth = window.innerWidth < 400 ? 1000 : 2500;

			dom.wrapper.classList.add( 'overview' );
			dom.wrapper.classList.remove( 'overview-deactivating' );

			clearTimeout( activateOverviewTimeout );
			clearTimeout( deactivateOverviewTimeout );

			// Not the pretties solution, but need to let the overview
			// class apply first so that slides are measured accurately
			// before we can position them
			activateOverviewTimeout = setTimeout( function() {

				var horizontalSlides = document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR );

				for( var i = 0, len1 = horizontalSlides.length; i < len1; i++ ) {
					var hslide = horizontalSlides[i],
						hoffset = config.rtl ? -105 : 105;

					hslide.setAttribute( 'data-index-h', i );

					// Apply CSS transform
					transformElement( hslide, 'translateZ(-'+ depth +'px) translate(' + ( ( i - indexh ) * hoffset ) + '%, 0%)' );

					if( hslide.classList.contains( 'stack' ) ) {

						var verticalSlides = hslide.querySelectorAll( 'section' );

						for( var j = 0, len2 = verticalSlides.length; j < len2; j++ ) {
							var verticalIndex = i === indexh ? indexv : getPreviousVerticalIndex( hslide );

							var vslide = verticalSlides[j];

							vslide.setAttribute( 'data-index-h', i );
							vslide.setAttribute( 'data-index-v', j );

							// Apply CSS transform
							transformElement( vslide, 'translate(0%, ' + ( ( j - verticalIndex ) * 105 ) + '%)' );

							// Navigate to this slide on click
							vslide.addEventListener( 'click', onOverviewSlideClicked, true );
						}

					}
					else {

						// Navigate to this slide on click
						hslide.addEventListener( 'click', onOverviewSlideClicked, true );

					}
				}

				updateSlidesVisibility();

				layout();

				if( !wasActive ) {
					// Notify observers of the overview showing
					dispatchEvent( 'overviewshown', {
						'indexh': indexh,
						'indexv': indexv,
						'currentSlide': currentSlide
					} );
				}

			}, 10 );

		}

	}

	/**
	 * Exits the slide overview and enters the currently
	 * active slide.
	 */
	function deactivateOverview() {

		// Only proceed if enabled in config
		if( config.overview ) {

			clearTimeout( activateOverviewTimeout );
			clearTimeout( deactivateOverviewTimeout );

			dom.wrapper.classList.remove( 'overview' );

			// Temporarily add a class so that transitions can do different things
			// depending on whether they are exiting/entering overview, or just
			// moving from slide to slide
			dom.wrapper.classList.add( 'overview-deactivating' );

			deactivateOverviewTimeout = setTimeout( function () {
				dom.wrapper.classList.remove( 'overview-deactivating' );
			}, 1 );

			// Select all slides
			toArray( document.querySelectorAll( SLIDES_SELECTOR ) ).forEach( function( slide ) {
				// Resets all transforms to use the external styles
				transformElement( slide, '' );

				slide.removeEventListener( 'click', onOverviewSlideClicked, true );
			} );

			slide( indexh, indexv );

			cueAutoSlide();

			// Notify observers of the overview hiding
			dispatchEvent( 'overviewhidden', {
				'indexh': indexh,
				'indexv': indexv,
				'currentSlide': currentSlide
			} );

		}
	}

	/**
	 * Toggles the slide overview mode on and off.
	 *
	 * @param {Boolean} override Optional flag which overrides the
	 * toggle logic and forcibly sets the desired state. True means
	 * overview is open, false means it's closed.
	 */
	function toggleOverview( override ) {

		if( typeof override === 'boolean' ) {
			override ? activateOverview() : deactivateOverview();
		}
		else {
			isOverview() ? deactivateOverview() : activateOverview();
		}

	}

	/**
	 * Checks if the overview is currently active.
	 *
	 * @return {Boolean} true if the overview is active,
	 * false otherwise
	 */
	function isOverview() {

		return dom.wrapper.classList.contains( 'overview' );

	}

	/**
	 * Checks if the current or specified slide is vertical
	 * (nested within another slide).
	 *
	 * @param {HTMLElement} slide [optional] The slide to check
	 * orientation of
	 */
	function isVerticalSlide( slide ) {

		// Prefer slide argument, otherwise use current slide
		slide = slide ? slide : currentSlide;

		return slide && slide.parentNode && !!slide.parentNode.nodeName.match( /section/i );

	}

	/**
	 * Handling the fullscreen functionality via the fullscreen API
	 *
	 * @see http://fullscreen.spec.whatwg.org/
	 * @see https://developer.mozilla.org/en-US/docs/DOM/Using_fullscreen_mode
	 */
	function enterFullscreen() {

		var element = document.body;

		// Check which implementation is available
		var requestMethod = element.requestFullScreen ||
							element.webkitRequestFullscreen ||
							element.webkitRequestFullScreen ||
							element.mozRequestFullScreen ||
							element.msRequestFullScreen;

		if( requestMethod ) {
			requestMethod.apply( element );
		}

	}

	/**
	 * Enters the paused mode which fades everything on screen to
	 * black.
	 */
	function pause() {

		var wasPaused = dom.wrapper.classList.contains( 'paused' );

		cancelAutoSlide();
		dom.wrapper.classList.add( 'paused' );

		if( wasPaused === false ) {
			dispatchEvent( 'paused' );
		}

	}

	/**
	 * Exits from the paused mode.
	 */
	function resume() {

		var wasPaused = dom.wrapper.classList.contains( 'paused' );
		dom.wrapper.classList.remove( 'paused' );

		cueAutoSlide();

		if( wasPaused ) {
			dispatchEvent( 'resumed' );
		}

	}

	/**
	 * Toggles the paused mode on and off.
	 */
	function togglePause() {

		if( isPaused() ) {
			resume();
		}
		else {
			pause();
		}

	}

	/**
	 * Checks if we are currently in the paused mode.
	 */
	function isPaused() {

		return dom.wrapper.classList.contains( 'paused' );

	}

	/**
	 * Steps from the current point in the presentation to the
	 * slide which matches the specified horizontal and vertical
	 * indices.
	 *
	 * @param {int} h Horizontal index of the target slide
	 * @param {int} v Vertical index of the target slide
	 * @param {int} f Optional index of a fragment within the
	 * target slide to activate
	 * @param {int} o Optional origin for use in multimaster environments
	 */
	function slide( h, v, f, o ) {

		// Remember where we were at before
		previousSlide = currentSlide;

		// Query all horizontal slides in the deck
		var horizontalSlides = document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR );

		// If no vertical index is specified and the upcoming slide is a
		// stack, resume at its previous vertical index
		if( v === undefined ) {
			v = getPreviousVerticalIndex( horizontalSlides[ h ] );
		}

		// If we were on a vertical stack, remember what vertical index
		// it was on so we can resume at the same position when returning
		if( previousSlide && previousSlide.parentNode && previousSlide.parentNode.classList.contains( 'stack' ) ) {
			setPreviousVerticalIndex( previousSlide.parentNode, indexv );
		}

		// Remember the state before this slide
		var stateBefore = state.concat();

		// Reset the state array
		state.length = 0;

		var indexhBefore = indexh || 0,
			indexvBefore = indexv || 0;

		// Activate and transition to the new slide
		indexh = updateSlides( HORIZONTAL_SLIDES_SELECTOR, h === undefined ? indexh : h );
		indexv = updateSlides( VERTICAL_SLIDES_SELECTOR, v === undefined ? indexv : v );

		// Update the visibility of slides now that the indices have changed
		updateSlidesVisibility();

		layout();

		// Apply the new state
		stateLoop: for( var i = 0, len = state.length; i < len; i++ ) {
			// Check if this state existed on the previous slide. If it
			// did, we will avoid adding it repeatedly
			for( var j = 0; j < stateBefore.length; j++ ) {
				if( stateBefore[j] === state[i] ) {
					stateBefore.splice( j, 1 );
					continue stateLoop;
				}
			}

			document.documentElement.classList.add( state[i] );

			// Dispatch custom event matching the state's name
			dispatchEvent( state[i] );
		}

		// Clean up the remains of the previous state
		while( stateBefore.length ) {
			document.documentElement.classList.remove( stateBefore.pop() );
		}

		// If the overview is active, re-activate it to update positions
		if( isOverview() ) {
			activateOverview();
		}

		// Find the current horizontal slide and any possible vertical slides
		// within it
		var currentHorizontalSlide = horizontalSlides[ indexh ],
			currentVerticalSlides = currentHorizontalSlide.querySelectorAll( 'section' );

		// Store references to the previous and current slides
		currentSlide = currentVerticalSlides[ indexv ] || currentHorizontalSlide;

		// Show fragment, if specified
		if( typeof f !== 'undefined' ) {
			navigateFragment( f );
		}

		// Dispatch an event if the slide changed
		var slideChanged = ( indexh !== indexhBefore || indexv !== indexvBefore );
		if( slideChanged ) {
			dispatchEvent( 'slidechanged', {
				'indexh': indexh,
				'indexv': indexv,
				'previousSlide': previousSlide,
				'currentSlide': currentSlide,
				'origin': o
			} );
		}
		else {
			// Ensure that the previous slide is never the same as the current
			previousSlide = null;
		}

		// Solves an edge case where the previous slide maintains the
		// 'present' class when navigating between adjacent vertical
		// stacks
		if( previousSlide ) {
			previousSlide.classList.remove( 'present' );

			// Reset all slides upon navigate to home
			// Issue: #285
			if ( document.querySelector( HOME_SLIDE_SELECTOR ).classList.contains( 'present' ) ) {
				// Launch async task
				setTimeout( function () {
					var slides = toArray( document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR + '.stack') ), i;
					for( i in slides ) {
						if( slides[i] ) {
							// Reset stack
							setPreviousVerticalIndex( slides[i], 0 );
						}
					}
				}, 0 );
			}
		}

		// Handle embedded content
		if( slideChanged ) {
			stopEmbeddedContent( previousSlide );
			startEmbeddedContent( currentSlide );
		}

		updateControls();
		updateProgress();
		updateBackground();
		updateParallax();
		updateSlideNumber();

		// Update the URL hash
		writeURL();

		cueAutoSlide();

	}

	/**
	 * Syncs the presentation with the current DOM. Useful
	 * when new slides or control elements are added or when
	 * the configuration has changed.
	 */
	function sync() {

		// Subscribe to input
		removeEventListeners();
		addEventListeners();

		// Force a layout to make sure the current config is accounted for
		layout();

		// Reflect the current autoSlide value
		autoSlide = config.autoSlide;

		// Start auto-sliding if it's enabled
		cueAutoSlide();

		// Re-create the slide backgrounds
		createBackgrounds();

		sortAllFragments();

		updateControls();
		updateProgress();
		updateBackground( true );
		updateSlideNumber();

	}

	/**
	 * Resets all vertical slides so that only the first
	 * is visible.
	 */
	function resetVerticalSlides() {

		var horizontalSlides = toArray( document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );
		horizontalSlides.forEach( function( horizontalSlide ) {

			var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) );
			verticalSlides.forEach( function( verticalSlide, y ) {

				if( y > 0 ) {
					verticalSlide.classList.remove( 'present' );
					verticalSlide.classList.remove( 'past' );
					verticalSlide.classList.add( 'future' );
				}

			} );

		} );

	}

	/**
	 * Sorts and formats all of fragments in the
	 * presentation.
	 */
	function sortAllFragments() {

		var horizontalSlides = toArray( document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );
		horizontalSlides.forEach( function( horizontalSlide ) {

			var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) );
			verticalSlides.forEach( function( verticalSlide, y ) {

				sortFragments( verticalSlide.querySelectorAll( '.fragment' ) );

			} );

			if( verticalSlides.length === 0 ) sortFragments( horizontalSlide.querySelectorAll( '.fragment' ) );

		} );

	}

	/**
	 * Updates one dimension of slides by showing the slide
	 * with the specified index.
	 *
	 * @param {String} selector A CSS selector that will fetch
	 * the group of slides we are working with
	 * @param {Number} index The index of the slide that should be
	 * shown
	 *
	 * @return {Number} The index of the slide that is now shown,
	 * might differ from the passed in index if it was out of
	 * bounds.
	 */
	function updateSlides( selector, index ) {

		// Select all slides and convert the NodeList result to
		// an array
		var slides = toArray( document.querySelectorAll( selector ) ),
			slidesLength = slides.length;

		if( slidesLength ) {

			// Should the index loop?
			if( config.loop ) {
				index %= slidesLength;

				if( index < 0 ) {
					index = slidesLength + index;
				}
			}

			// Enforce max and minimum index bounds
			index = Math.max( Math.min( index, slidesLength - 1 ), 0 );

			for( var i = 0; i < slidesLength; i++ ) {
				var element = slides[i];

				var reverse = config.rtl && !isVerticalSlide( element );

				element.classList.remove( 'past' );
				element.classList.remove( 'present' );
				element.classList.remove( 'future' );

				// http://www.w3.org/html/wg/drafts/html/master/editing.html#the-hidden-attribute
				element.setAttribute( 'hidden', '' );

				if( i < index ) {
					// Any element previous to index is given the 'past' class
					element.classList.add( reverse ? 'future' : 'past' );

					var pastFragments = toArray( element.querySelectorAll( '.fragment' ) );

					// Show all fragments on prior slides
					while( pastFragments.length ) {
						var pastFragment = pastFragments.pop();
						pastFragment.classList.add( 'visible' );
						pastFragment.classList.remove( 'current-fragment' );
					}
				}
				else if( i > index ) {
					// Any element subsequent to index is given the 'future' class
					element.classList.add( reverse ? 'past' : 'future' );

					var futureFragments = toArray( element.querySelectorAll( '.fragment.visible' ) );

					// No fragments in future slides should be visible ahead of time
					while( futureFragments.length ) {
						var futureFragment = futureFragments.pop();
						futureFragment.classList.remove( 'visible' );
						futureFragment.classList.remove( 'current-fragment' );
					}
				}

				// If this element contains vertical slides
				if( element.querySelector( 'section' ) ) {
					element.classList.add( 'stack' );
				}
			}

			// Mark the current slide as present
			slides[index].classList.add( 'present' );
			slides[index].removeAttribute( 'hidden' );

			// If this slide has a state associated with it, add it
			// onto the current state of the deck
			var slideState = slides[index].getAttribute( 'data-state' );
			if( slideState ) {
				state = state.concat( slideState.split( ' ' ) );
			}

		}
		else {
			// Since there are no slides we can't be anywhere beyond the
			// zeroth index
			index = 0;
		}

		return index;

	}

	/**
	 * Optimization method; hide all slides that are far away
	 * from the present slide.
	 */
	function updateSlidesVisibility() {

		// Select all slides and convert the NodeList result to
		// an array
		var horizontalSlides = toArray( document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ),
			horizontalSlidesLength = horizontalSlides.length,
			distanceX,
			distanceY;

		if( horizontalSlidesLength ) {

			// The number of steps away from the present slide that will
			// be visible
			var viewDistance = isOverview() ? 10 : config.viewDistance;

			// Limit view distance on weaker devices
			if( isMobileDevice ) {
				viewDistance = isOverview() ? 6 : 1;
			}

			for( var x = 0; x < horizontalSlidesLength; x++ ) {
				var horizontalSlide = horizontalSlides[x];

				var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) ),
					verticalSlidesLength = verticalSlides.length;

				// Loops so that it measures 1 between the first and last slides
				distanceX = Math.abs( ( indexh - x ) % ( horizontalSlidesLength - viewDistance ) ) || 0;

				// Show the horizontal slide if it's within the view distance
				horizontalSlide.style.display = distanceX > viewDistance ? 'none' : 'block';

				if( verticalSlidesLength ) {

					var oy = getPreviousVerticalIndex( horizontalSlide );

					for( var y = 0; y < verticalSlidesLength; y++ ) {
						var verticalSlide = verticalSlides[y];

						distanceY = x === indexh ? Math.abs( indexv - y ) : Math.abs( y - oy );

						verticalSlide.style.display = ( distanceX + distanceY ) > viewDistance ? 'none' : 'block';
					}

				}
			}

		}

	}

	/**
	 * Updates the progress bar to reflect the current slide.
	 */
	function updateProgress() {

		// Update progress if enabled
		if( config.progress && dom.progress ) {

			var horizontalSlides = toArray( document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );

			// The number of past and total slides
			var totalCount = document.querySelectorAll( SLIDES_SELECTOR + ':not(.stack)' ).length;
			var pastCount = 0;

			// Step through all slides and count the past ones
			mainLoop: for( var i = 0; i < horizontalSlides.length; i++ ) {

				var horizontalSlide = horizontalSlides[i];
				var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) );

				for( var j = 0; j < verticalSlides.length; j++ ) {

					// Stop as soon as we arrive at the present
					if( verticalSlides[j].classList.contains( 'present' ) ) {
						break mainLoop;
					}

					pastCount++;

				}

				// Stop as soon as we arrive at the present
				if( horizontalSlide.classList.contains( 'present' ) ) {
					break;
				}

				// Don't count the wrapping section for vertical slides
				if( horizontalSlide.classList.contains( 'stack' ) === false ) {
					pastCount++;
				}

			}

			dom.progressbar.style.width = ( pastCount / ( totalCount - 1 ) ) * window.innerWidth + 'px';

		}

	}

	/**
	 * Updates the slide number div to reflect the current slide.
	 */
	function updateSlideNumber() {

		// Update slide number if enabled
		if( config.slideNumber && dom.slideNumber) {

			// Display the number of the page using 'indexh - indexv' format
			var indexString = indexh;
			if( indexv > 0 ) {
				indexString += ' - ' + indexv;
			}

			dom.slideNumber.innerHTML = indexString;
		}

	}

	/**
	 * Updates the state of all control/navigation arrows.
	 */
	function updateControls() {

		var routes = availableRoutes();
		var fragments = availableFragments();

		// Remove the 'enabled' class from all directions
		dom.controlsLeft.concat( dom.controlsRight )
						.concat( dom.controlsUp )
						.concat( dom.controlsDown )
						.concat( dom.controlsPrev )
						.concat( dom.controlsNext ).forEach( function( node ) {
			node.classList.remove( 'enabled' );
			node.classList.remove( 'fragmented' );
		} );

		// Add the 'enabled' class to the available routes
		if( routes.left ) dom.controlsLeft.forEach( function( el ) { el.classList.add( 'enabled' );	} );
		if( routes.right ) dom.controlsRight.forEach( function( el ) { el.classList.add( 'enabled' ); } );
		if( routes.up ) dom.controlsUp.forEach( function( el ) { el.classList.add( 'enabled' );	} );
		if( routes.down ) dom.controlsDown.forEach( function( el ) { el.classList.add( 'enabled' ); } );

		// Prev/next buttons
		if( routes.left || routes.up ) dom.controlsPrev.forEach( function( el ) { el.classList.add( 'enabled' ); } );
		if( routes.right || routes.down ) dom.controlsNext.forEach( function( el ) { el.classList.add( 'enabled' ); } );

		// Highlight fragment directions
		if( currentSlide ) {

			// Always apply fragment decorator to prev/next buttons
			if( fragments.prev ) dom.controlsPrev.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );
			if( fragments.next ) dom.controlsNext.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );

			// Apply fragment decorators to directional buttons based on
			// what slide axis they are in
			if( isVerticalSlide( currentSlide ) ) {
				if( fragments.prev ) dom.controlsUp.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );
				if( fragments.next ) dom.controlsDown.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );
			}
			else {
				if( fragments.prev ) dom.controlsLeft.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );
				if( fragments.next ) dom.controlsRight.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );
			}

		}

	}

	/**
	 * Updates the background elements to reflect the current
	 * slide.
	 *
	 * @param {Boolean} includeAll If true, the backgrounds of
	 * all vertical slides (not just the present) will be updated.
	 */
	function updateBackground( includeAll ) {

		var currentBackground = null;

		// Reverse past/future classes when in RTL mode
		var horizontalPast = config.rtl ? 'future' : 'past',
			horizontalFuture = config.rtl ? 'past' : 'future';

		// Update the classes of all backgrounds to match the
		// states of their slides (past/present/future)
		toArray( dom.background.childNodes ).forEach( function( backgroundh, h ) {

			if( h < indexh ) {
				backgroundh.className = 'slide-background ' + horizontalPast;
			}
			else if ( h > indexh ) {
				backgroundh.className = 'slide-background ' + horizontalFuture;
			}
			else {
				backgroundh.className = 'slide-background present';

				// Store a reference to the current background element
				currentBackground = backgroundh;
			}

			if( includeAll || h === indexh ) {
				toArray( backgroundh.childNodes ).forEach( function( backgroundv, v ) {

					if( v < indexv ) {
						backgroundv.className = 'slide-background past';
					}
					else if ( v > indexv ) {
						backgroundv.className = 'slide-background future';
					}
					else {
						backgroundv.className = 'slide-background present';

						// Only if this is the present horizontal and vertical slide
						if( h === indexh ) currentBackground = backgroundv;
					}

				} );
			}

		} );

		// Don't transition between identical backgrounds. This
		// prevents unwanted flicker.
		if( currentBackground ) {
			var previousBackgroundHash = previousBackground ? previousBackground.getAttribute( 'data-background-hash' ) : null;
			var currentBackgroundHash = currentBackground.getAttribute( 'data-background-hash' );
			if( currentBackgroundHash && currentBackgroundHash === previousBackgroundHash && currentBackground !== previousBackground ) {
				dom.background.classList.add( 'no-transition' );
			}

			previousBackground = currentBackground;
		}

		// Allow the first background to apply without transition
		setTimeout( function() {
			dom.background.classList.remove( 'no-transition' );
		}, 1 );

	}

	/**
	 * Updates the position of the parallax background based
	 * on the current slide index.
	 */
	function updateParallax() {

		if( config.parallaxBackgroundImage ) {

			var horizontalSlides = document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ),
				verticalSlides = document.querySelectorAll( VERTICAL_SLIDES_SELECTOR );

			var backgroundSize = dom.background.style.backgroundSize.split( ' ' ),
				backgroundWidth, backgroundHeight;

			if( backgroundSize.length === 1 ) {
				backgroundWidth = backgroundHeight = parseInt( backgroundSize[0], 10 );
			}
			else {
				backgroundWidth = parseInt( backgroundSize[0], 10 );
				backgroundHeight = parseInt( backgroundSize[1], 10 );
			}

			var slideWidth = dom.background.offsetWidth;
			var horizontalSlideCount = horizontalSlides.length;
			var horizontalOffset = -( backgroundWidth - slideWidth ) / ( horizontalSlideCount-1 ) * indexh;

			var slideHeight = dom.background.offsetHeight;
			var verticalSlideCount = verticalSlides.length;
			var verticalOffset = verticalSlideCount > 0 ? -( backgroundHeight - slideHeight ) / ( verticalSlideCount-1 ) * indexv : 0;

			dom.background.style.backgroundPosition = horizontalOffset + 'px ' + verticalOffset + 'px';

		}

	}

	/**
	 * Determine what available routes there are for navigation.
	 *
	 * @return {Object} containing four booleans: left/right/up/down
	 */
	function availableRoutes() {

		var horizontalSlides = document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ),
			verticalSlides = document.querySelectorAll( VERTICAL_SLIDES_SELECTOR );

		var routes = {
			left: indexh > 0 || config.loop,
			right: indexh < horizontalSlides.length - 1 || config.loop,
			up: indexv > 0,
			down: indexv < verticalSlides.length - 1
		};

		// reverse horizontal controls for rtl
		if( config.rtl ) {
			var left = routes.left;
			routes.left = routes.right;
			routes.right = left;
		}

		return routes;

	}

	/**
	 * Returns an object describing the available fragment
	 * directions.
	 *
	 * @return {Object} two boolean properties: prev/next
	 */
	function availableFragments() {

		if( currentSlide && config.fragments ) {
			var fragments = currentSlide.querySelectorAll( '.fragment' );
			var hiddenFragments = currentSlide.querySelectorAll( '.fragment:not(.visible)' );

			return {
				prev: fragments.length - hiddenFragments.length > 0,
				next: !!hiddenFragments.length
			};
		}
		else {
			return { prev: false, next: false };
		}

	}

	/**
	 * Start playback of any embedded content inside of
	 * the targeted slide.
	 */
	function startEmbeddedContent( slide ) {

		if( slide && !isSpeakerNotes() ) {
			// HTML5 media elements
			toArray( slide.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
				if( el.hasAttribute( 'data-autoplay' ) ) {
					el.play();
				}
			} );

			// iframe embeds
			toArray( slide.querySelectorAll( 'iframe' ) ).forEach( function( el ) {
				el.contentWindow.postMessage( 'slide:start', '*' );
			});

			// YouTube embeds
			toArray( slide.querySelectorAll( 'iframe[src*="youtube.com/embed/"]' ) ).forEach( function( el ) {
				if( el.hasAttribute( 'data-autoplay' ) ) {
					el.contentWindow.postMessage( '{"event":"command","func":"playVideo","args":""}', '*' );
				}
			});
		}

	}

	/**
	 * Stop playback of any embedded content inside of
	 * the targeted slide.
	 */
	function stopEmbeddedContent( slide ) {

		if( slide ) {
			// HTML5 media elements
			toArray( slide.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
				if( !el.hasAttribute( 'data-ignore' ) ) {
					el.pause();
				}
			} );

			// iframe embeds
			toArray( slide.querySelectorAll( 'iframe' ) ).forEach( function( el ) {
				el.contentWindow.postMessage( 'slide:stop', '*' );
			});

			// YouTube embeds
			toArray( slide.querySelectorAll( 'iframe[src*="youtube.com/embed/"]' ) ).forEach( function( el ) {
				if( !el.hasAttribute( 'data-ignore' ) && typeof el.contentWindow.postMessage === 'function' ) {
					el.contentWindow.postMessage( '{"event":"command","func":"pauseVideo","args":""}', '*' );
				}
			});
		}

	}

	/**
	 * Checks if this presentation is running inside of the
	 * speaker notes window.
	 */
	function isSpeakerNotes() {

		return !!window.location.search.match( /receiver/gi );

	}

	/**
	 * Reads the current URL (hash) and navigates accordingly.
	 */
	function readURL() {

		var hash = window.location.hash;

		// Attempt to parse the hash as either an index or name
		var bits = hash.slice( 2 ).split( '/' ),
			name = hash.replace( /#|\//gi, '' );

		// If the first bit is invalid and there is a name we can
		// assume that this is a named link
		if( isNaN( parseInt( bits[0], 10 ) ) && name.length ) {
			// Find the slide with the specified name
			var element = document.querySelector( '#' + name );

			if( element ) {
				// Find the position of the named slide and navigate to it
				var indices = Reveal.getIndices( element );
				slide( indices.h, indices.v );
			}
			// If the slide doesn't exist, navigate to the current slide
			else {
				slide( indexh || 0, indexv || 0 );
			}
		}
		else {
			// Read the index components of the hash
			var h = parseInt( bits[0], 10 ) || 0,
				v = parseInt( bits[1], 10 ) || 0;

			if( h !== indexh || v !== indexv ) {
				slide( h, v );
			}
		}

	}

	/**
	 * Updates the page URL (hash) to reflect the current
	 * state.
	 *
	 * @param {Number} delay The time in ms to wait before
	 * writing the hash
	 */
	function writeURL( delay ) {

		if( config.history ) {

			// Make sure there's never more than one timeout running
			clearTimeout( writeURLTimeout );

			// If a delay is specified, timeout this call
			if( typeof delay === 'number' ) {
				writeURLTimeout = setTimeout( writeURL, delay );
			}
			else {
				var url = '/';

				// If the current slide has an ID, use that as a named link
				if( currentSlide && typeof currentSlide.getAttribute( 'id' ) === 'string' ) {
					url = '/' + currentSlide.getAttribute( 'id' );
				}
				// Otherwise use the /h/v index
				else {
					if( indexh > 0 || indexv > 0 ) url += indexh;
					if( indexv > 0 ) url += '/' + indexv;
				}

				window.location.hash = url;
			}
		}

	}

	/**
	 * Retrieves the h/v location of the current, or specified,
	 * slide.
	 *
	 * @param {HTMLElement} slide If specified, the returned
	 * index will be for this slide rather than the currently
	 * active one
	 *
	 * @return {Object} { h: <int>, v: <int>, f: <int> }
	 */
	function getIndices( slide ) {

		// By default, return the current indices
		var h = indexh,
			v = indexv,
			f;

		// If a slide is specified, return the indices of that slide
		if( slide ) {
			var isVertical = isVerticalSlide( slide );
			var slideh = isVertical ? slide.parentNode : slide;

			// Select all horizontal slides
			var horizontalSlides = toArray( document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );

			// Now that we know which the horizontal slide is, get its index
			h = Math.max( horizontalSlides.indexOf( slideh ), 0 );

			// If this is a vertical slide, grab the vertical index
			if( isVertical ) {
				v = Math.max( toArray( slide.parentNode.querySelectorAll( 'section' ) ).indexOf( slide ), 0 );
			}
		}

		if( !slide && currentSlide ) {
			var hasFragments = currentSlide.querySelectorAll( '.fragment' ).length > 0;
			if( hasFragments ) {
				var visibleFragments = currentSlide.querySelectorAll( '.fragment.visible' );
				f = visibleFragments.length - 1;
			}
		}

		return { h: h, v: v, f: f };

	}

	/**
	 * Return a sorted fragments list, ordered by an increasing
	 * "data-fragment-index" attribute.
	 *
	 * Fragments will be revealed in the order that they are returned by
	 * this function, so you can use the index attributes to control the
	 * order of fragment appearance.
	 *
	 * To maintain a sensible default fragment order, fragments are presumed
	 * to be passed in document order. This function adds a "fragment-index"
	 * attribute to each node if such an attribute is not already present,
	 * and sets that attribute to an integer value which is the position of
	 * the fragment within the fragments list.
	 */
	function sortFragments( fragments ) {

		fragments = toArray( fragments );

		var ordered = [],
			unordered = [],
			sorted = [];

		// Group ordered and unordered elements
		fragments.forEach( function( fragment, i ) {
			if( fragment.hasAttribute( 'data-fragment-index' ) ) {
				var index = parseInt( fragment.getAttribute( 'data-fragment-index' ), 10 );

				if( !ordered[index] ) {
					ordered[index] = [];
				}

				ordered[index].push( fragment );
			}
			else {
				unordered.push( [ fragment ] );
			}
		} );

		// Append fragments without explicit indices in their
		// DOM order
		ordered = ordered.concat( unordered );

		// Manually count the index up per group to ensure there
		// are no gaps
		var index = 0;

		// Push all fragments in their sorted order to an array,
		// this flattens the groups
		ordered.forEach( function( group ) {
			group.forEach( function( fragment ) {
				sorted.push( fragment );
				fragment.setAttribute( 'data-fragment-index', index );
			} );

			index ++;
		} );

		return sorted;

	}

	/**
	 * Navigate to the specified slide fragment.
	 *
	 * @param {Number} index The index of the fragment that
	 * should be shown, -1 means all are invisible
	 * @param {Number} offset Integer offset to apply to the
	 * fragment index
	 *
	 * @return {Boolean} true if a change was made in any
	 * fragments visibility as part of this call
	 */
	function navigateFragment( index, offset ) {

		if( currentSlide && config.fragments ) {

			var fragments = sortFragments( currentSlide.querySelectorAll( '.fragment' ) );
			if( fragments.length ) {

				// If no index is specified, find the current
				if( typeof index !== 'number' ) {
					var lastVisibleFragment = sortFragments( currentSlide.querySelectorAll( '.fragment.visible' ) ).pop();

					if( lastVisibleFragment ) {
						index = parseInt( lastVisibleFragment.getAttribute( 'data-fragment-index' ) || 0, 10 );
					}
					else {
						index = -1;
					}
				}

				// If an offset is specified, apply it to the index
				if( typeof offset === 'number' ) {
					index += offset;
				}

				var fragmentsShown = [],
					fragmentsHidden = [];

				toArray( fragments ).forEach( function( element, i ) {

					if( element.hasAttribute( 'data-fragment-index' ) ) {
						i = parseInt( element.getAttribute( 'data-fragment-index' ), 10 );
					}

					// Visible fragments
					if( i <= index ) {
						if( !element.classList.contains( 'visible' ) ) fragmentsShown.push( element );
						element.classList.add( 'visible' );
						element.classList.remove( 'current-fragment' );

						if( i === index ) {
							element.classList.add( 'current-fragment' );
						}
					}
					// Hidden fragments
					else {
						if( element.classList.contains( 'visible' ) ) fragmentsHidden.push( element );
						element.classList.remove( 'visible' );
						element.classList.remove( 'current-fragment' );
					}


				} );

				if( fragmentsHidden.length ) {
					dispatchEvent( 'fragmenthidden', { fragment: fragmentsHidden[0], fragments: fragmentsHidden } );
				}

				if( fragmentsShown.length ) {
					dispatchEvent( 'fragmentshown', { fragment: fragmentsShown[0], fragments: fragmentsShown } );
				}

				updateControls();

				return !!( fragmentsShown.length || fragmentsHidden.length );

			}

		}

		return false;

	}

	/**
	 * Navigate to the next slide fragment.
	 *
	 * @return {Boolean} true if there was a next fragment,
	 * false otherwise
	 */
	function nextFragment() {

		return navigateFragment( null, 1 );

	}

	/**
	 * Navigate to the previous slide fragment.
	 *
	 * @return {Boolean} true if there was a previous fragment,
	 * false otherwise
	 */
	function previousFragment() {

		return navigateFragment( null, -1 );

	}

	/**
	 * Cues a new automated slide if enabled in the config.
	 */
	function cueAutoSlide() {

		cancelAutoSlide();

		if( currentSlide ) {

			var parentAutoSlide = currentSlide.parentNode ? currentSlide.parentNode.getAttribute( 'data-autoslide' ) : null;
			var slideAutoSlide = currentSlide.getAttribute( 'data-autoslide' );

			// Pick value in the following priority order:
			// 1. Current slide's data-autoslide
			// 2. Parent slide's data-autoslide
			// 3. Global autoSlide setting
			if( slideAutoSlide ) {
				autoSlide = parseInt( slideAutoSlide, 10 );
			}
			else if( parentAutoSlide ) {
				autoSlide = parseInt( parentAutoSlide, 10 );
			}
			else {
				autoSlide = config.autoSlide;
			}

			// If there are media elements with data-autoplay,
			// automatically set the autoSlide duration to the
			// length of that media
			toArray( currentSlide.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
				if( el.hasAttribute( 'data-autoplay' ) ) {
					if( autoSlide && el.duration * 1000 > autoSlide ) {
						autoSlide = ( el.duration * 1000 ) + 1000;
					}
				}
			} );

			// Cue the next auto-slide if:
			// - There is an autoSlide value
			// - Auto-sliding isn't paused by the user
			// - The presentation isn't paused
			// - The overview isn't active
			// - The presentation isn't over
			if( autoSlide && !autoSlidePaused && !isPaused() && !isOverview() && ( !Reveal.isLastSlide() || config.loop === true ) ) {
				autoSlideTimeout = setTimeout( navigateNext, autoSlide );
				autoSlideStartTime = Date.now();
			}

			if( autoSlidePlayer ) {
				autoSlidePlayer.setPlaying( autoSlideTimeout !== -1 );
			}

		}

	}

	/**
	 * Cancels any ongoing request to auto-slide.
	 */
	function cancelAutoSlide() {

		clearTimeout( autoSlideTimeout );
		autoSlideTimeout = -1;

	}

	function pauseAutoSlide() {

		autoSlidePaused = true;
		clearTimeout( autoSlideTimeout );

		if( autoSlidePlayer ) {
			autoSlidePlayer.setPlaying( false );
		}

	}

	function resumeAutoSlide() {

		autoSlidePaused = false;
		cueAutoSlide();

	}

	function navigateLeft() {

		// Reverse for RTL
		if( config.rtl ) {
			if( ( isOverview() || nextFragment() === false ) && availableRoutes().left ) {
				slide( indexh + 1 );
			}
		}
		// Normal navigation
		else if( ( isOverview() || previousFragment() === false ) && availableRoutes().left ) {
			slide( indexh - 1 );
		}

	}

	function navigateRight() {

		// Reverse for RTL
		if( config.rtl ) {
			if( ( isOverview() || previousFragment() === false ) && availableRoutes().right ) {
				slide( indexh - 1 );
			}
		}
		// Normal navigation
		else if( ( isOverview() || nextFragment() === false ) && availableRoutes().right ) {
			slide( indexh + 1 );
		}

	}

	function navigateUp() {

		// Prioritize hiding fragments
		if( ( isOverview() || previousFragment() === false ) && availableRoutes().up ) {
			slide( indexh, indexv - 1 );
		}

	}

	function navigateDown() {

		// Prioritize revealing fragments
		if( ( isOverview() || nextFragment() === false ) && availableRoutes().down ) {
			slide( indexh, indexv + 1 );
		}

	}

	/**
	 * Navigates backwards, prioritized in the following order:
	 * 1) Previous fragment
	 * 2) Previous vertical slide
	 * 3) Previous horizontal slide
	 */
	function navigatePrev() {

		// Prioritize revealing fragments
		if( previousFragment() === false ) {
			if( availableRoutes().up ) {
				navigateUp();
			}
			else {
				// Fetch the previous horizontal slide, if there is one
				var previousSlide = document.querySelector( HORIZONTAL_SLIDES_SELECTOR + '.past:nth-child(' + indexh + ')' );

				if( previousSlide ) {
					var v = ( previousSlide.querySelectorAll( 'section' ).length - 1 ) || undefined;
					var h = indexh - 1;
					slide( h, v );
				}
			}
		}

	}

	/**
	 * Same as #navigatePrev() but navigates forwards.
	 */
	function navigateNext() {

		// Prioritize revealing fragments
		if( nextFragment() === false ) {
			availableRoutes().down ? navigateDown() : navigateRight();
		}

		// If auto-sliding is enabled we need to cue up
		// another timeout
		cueAutoSlide();

	}


	// --------------------------------------------------------------------//
	// ----------------------------- EVENTS -------------------------------//
	// --------------------------------------------------------------------//

	/**
	 * Called by all event handlers that are based on user
	 * input.
	 */
	function onUserInput( event ) {

		if( config.autoSlideStoppable ) {
			pauseAutoSlide();
		}

	}

	/**
	 * Handler for the document level 'keydown' event.
	 */
	function onDocumentKeyDown( event ) {

		onUserInput( event );

		// Check if there's a focused element that could be using
		// the keyboard
		var activeElement = document.activeElement;
		var hasFocus = !!( document.activeElement && ( document.activeElement.type || document.activeElement.href || document.activeElement.contentEditable !== 'inherit' ) );

		// Disregard the event if there's a focused element or a
		// keyboard modifier key is present
		if( hasFocus || (event.shiftKey && event.keyCode !== 32) || event.altKey || event.ctrlKey || event.metaKey ) return;

		// While paused only allow "unpausing" keyboard events (b and .)
		if( isPaused() && [66,190,191].indexOf( event.keyCode ) === -1 ) {
			return false;
		}

		var triggered = false;

		// 1. User defined key bindings
		if( typeof config.keyboard === 'object' ) {

			for( var key in config.keyboard ) {

				// Check if this binding matches the pressed key
				if( parseInt( key, 10 ) === event.keyCode ) {

					var value = config.keyboard[ key ];

					// Callback function
					if( typeof value === 'function' ) {
						value.apply( null, [ event ] );
					}
					// String shortcuts to reveal.js API
					else if( typeof value === 'string' && typeof Reveal[ value ] === 'function' ) {
						Reveal[ value ].call();
					}

					triggered = true;

				}

			}

		}

		// 2. System defined key bindings
		if( triggered === false ) {

			// Assume true and try to prove false
			triggered = true;

			switch( event.keyCode ) {
				// p, page up
				case 80: case 33: navigatePrev(); break;
				// n, page down
				case 78: case 34: navigateNext(); break;
				// h, left
				case 72: case 37: navigateLeft(); break;
				// l, right
				case 76: case 39: navigateRight(); break;
				// k, up
				case 75: case 38: navigateUp(); break;
				// j, down
				case 74: case 40: navigateDown(); break;
				// home
				case 36: slide( 0 ); break;
				// end
				case 35: slide( Number.MAX_VALUE ); break;
				// space
				case 32: isOverview() ? deactivateOverview() : event.shiftKey ? navigatePrev() : navigateNext(); break;
				// return
				case 13: isOverview() ? deactivateOverview() : triggered = false; break;
				// b, period, Logitech presenter tools "black screen" button
				case 66: case 190: case 191: togglePause(); break;
				// f
				case 70: enterFullscreen(); break;
				default:
					triggered = false;
			}

		}

		// If the input resulted in a triggered action we should prevent
		// the browsers default behavior
		if( triggered ) {
			event.preventDefault();
		}
		// ESC or O key
		else if ( ( event.keyCode === 27 || event.keyCode === 79 ) && features.transforms3d ) {
			if( dom.preview ) {
				closePreview();
			}
			else {
				toggleOverview();
			}

			event.preventDefault();
		}

		// If auto-sliding is enabled we need to cue up
		// another timeout
		cueAutoSlide();

	}

	/**
	 * Handler for the 'touchstart' event, enables support for
	 * swipe and pinch gestures.
	 */
	function onTouchStart( event ) {

		touch.startX = event.touches[0].clientX;
		touch.startY = event.touches[0].clientY;
		touch.startCount = event.touches.length;

		// If there's two touches we need to memorize the distance
		// between those two points to detect pinching
		if( event.touches.length === 2 && config.overview ) {
			touch.startSpan = distanceBetween( {
				x: event.touches[1].clientX,
				y: event.touches[1].clientY
			}, {
				x: touch.startX,
				y: touch.startY
			} );
		}

	}

	/**
	 * Handler for the 'touchmove' event.
	 */
	function onTouchMove( event ) {

		// Each touch should only trigger one action
		if( !touch.captured ) {
			onUserInput( event );

			var currentX = event.touches[0].clientX;
			var currentY = event.touches[0].clientY;

			// If the touch started with two points and still has
			// two active touches; test for the pinch gesture
			if( event.touches.length === 2 && touch.startCount === 2 && config.overview ) {

				// The current distance in pixels between the two touch points
				var currentSpan = distanceBetween( {
					x: event.touches[1].clientX,
					y: event.touches[1].clientY
				}, {
					x: touch.startX,
					y: touch.startY
				} );

				// If the span is larger than the desire amount we've got
				// ourselves a pinch
				if( Math.abs( touch.startSpan - currentSpan ) > touch.threshold ) {
					touch.captured = true;

					if( currentSpan < touch.startSpan ) {
						activateOverview();
					}
					else {
						deactivateOverview();
					}
				}

				event.preventDefault();

			}
			// There was only one touch point, look for a swipe
			else if( event.touches.length === 1 && touch.startCount !== 2 ) {

				var deltaX = currentX - touch.startX,
					deltaY = currentY - touch.startY;

				if( deltaX > touch.threshold && Math.abs( deltaX ) > Math.abs( deltaY ) ) {
					touch.captured = true;
					navigateLeft();
				}
				else if( deltaX < -touch.threshold && Math.abs( deltaX ) > Math.abs( deltaY ) ) {
					touch.captured = true;
					navigateRight();
				}
				else if( deltaY > touch.threshold ) {
					touch.captured = true;
					navigateUp();
				}
				else if( deltaY < -touch.threshold ) {
					touch.captured = true;
					navigateDown();
				}

				// If we're embedded, only block touch events if they have
				// triggered an action
				if( config.embedded ) {
					if( touch.captured || isVerticalSlide( currentSlide ) ) {
						event.preventDefault();
					}
				}
				// Not embedded? Block them all to avoid needless tossing
				// around of the viewport in iOS
				else {
					event.preventDefault();
				}

			}
		}
		// There's a bug with swiping on some Android devices unless
		// the default action is always prevented
		else if( navigator.userAgent.match( /android/gi ) ) {
			event.preventDefault();
		}

	}

	/**
	 * Handler for the 'touchend' event.
	 */
	function onTouchEnd( event ) {

		touch.captured = false;

	}

	/**
	 * Convert pointer down to touch start.
	 */
	function onPointerDown( event ) {

		if( event.pointerType === event.MSPOINTER_TYPE_TOUCH ) {
			event.touches = [{ clientX: event.clientX, clientY: event.clientY }];
			onTouchStart( event );
		}

	}

	/**
	 * Convert pointer move to touch move.
	 */
	function onPointerMove( event ) {

		if( event.pointerType === event.MSPOINTER_TYPE_TOUCH ) {
			event.touches = [{ clientX: event.clientX, clientY: event.clientY }];
			onTouchMove( event );
		}

	}

	/**
	 * Convert pointer up to touch end.
	 */
	function onPointerUp( event ) {

		if( event.pointerType === event.MSPOINTER_TYPE_TOUCH ) {
			event.touches = [{ clientX: event.clientX, clientY: event.clientY }];
			onTouchEnd( event );
		}

	}

	/**
	 * Handles mouse wheel scrolling, throttled to avoid skipping
	 * multiple slides.
	 */
	function onDocumentMouseScroll( event ) {

		if( Date.now() - lastMouseWheelStep > 600 ) {

			lastMouseWheelStep = Date.now();

			var delta = event.detail || -event.wheelDelta;
			if( delta > 0 ) {
				navigateNext();
			}
			else {
				navigatePrev();
			}

		}

	}

	/**
	 * Clicking on the progress bar results in a navigation to the
	 * closest approximate horizontal slide using this equation:
	 *
	 * ( clickX / presentationWidth ) * numberOfSlides
	 */
	function onProgressClicked( event ) {

		onUserInput( event );

		event.preventDefault();

		var slidesTotal = toArray( document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ).length;
		var slideIndex = Math.floor( ( event.clientX / dom.wrapper.offsetWidth ) * slidesTotal );

		slide( slideIndex );

	}

	/**
	 * Event handler for navigation control buttons.
	 */
	function onNavigateLeftClicked( event ) { event.preventDefault(); onUserInput(); navigateLeft(); }
	function onNavigateRightClicked( event ) { event.preventDefault(); onUserInput(); navigateRight(); }
	function onNavigateUpClicked( event ) { event.preventDefault(); onUserInput(); navigateUp(); }
	function onNavigateDownClicked( event ) { event.preventDefault(); onUserInput(); navigateDown(); }
	function onNavigatePrevClicked( event ) { event.preventDefault(); onUserInput(); navigatePrev(); }
	function onNavigateNextClicked( event ) { event.preventDefault(); onUserInput(); navigateNext(); }

	/**
	 * Handler for the window level 'hashchange' event.
	 */
	function onWindowHashChange( event ) {

		readURL();

	}

	/**
	 * Handler for the window level 'resize' event.
	 */
	function onWindowResize( event ) {

		layout();

	}

	/**
	 * Handle for the window level 'visibilitychange' event.
	 */
	function onPageVisibilityChange( event ) {

		var isHidden =  document.webkitHidden ||
						document.msHidden ||
						document.hidden;

		// If, after clicking a link or similar and we're coming back,
		// focus the document.body to ensure we can use keyboard shortcuts
		if( isHidden === false && document.activeElement !== document.body ) {
			document.activeElement.blur();
			document.body.focus();
		}

	}

	/**
	 * Invoked when a slide is and we're in the overview.
	 */
	function onOverviewSlideClicked( event ) {

		// TODO There's a bug here where the event listeners are not
		// removed after deactivating the overview.
		if( eventsAreBound && isOverview() ) {
			event.preventDefault();

			var element = event.target;

			while( element && !element.nodeName.match( /section/gi ) ) {
				element = element.parentNode;
			}

			if( element && !element.classList.contains( 'disabled' ) ) {

				deactivateOverview();

				if( element.nodeName.match( /section/gi ) ) {
					var h = parseInt( element.getAttribute( 'data-index-h' ), 10 ),
						v = parseInt( element.getAttribute( 'data-index-v' ), 10 );

					slide( h, v );
				}

			}
		}

	}

	/**
	 * Handles clicks on links that are set to preview in the
	 * iframe overlay.
	 */
	function onPreviewLinkClicked( event ) {

		var url = event.target.getAttribute( 'href' );
		if( url ) {
			openPreview( url );
			event.preventDefault();
		}

	}

	/**
	 * Handles click on the auto-sliding controls element.
	 */
	function onAutoSlidePlayerClick( event ) {

		// Replay
		if( Reveal.isLastSlide() && config.loop === false ) {
			slide( 0, 0 );
			resumeAutoSlide();
		}
		// Resume
		else if( autoSlidePaused ) {
			resumeAutoSlide();
		}
		// Pause
		else {
			pauseAutoSlide();
		}

	}


	// --------------------------------------------------------------------//
	// ------------------------ PLAYBACK COMPONENT ------------------------//
	// --------------------------------------------------------------------//


	/**
	 * Constructor for the playback component, which displays
	 * play/pause/progress controls.
	 *
	 * @param {HTMLElement} container The component will append
	 * itself to this
	 * @param {Function} progressCheck A method which will be
	 * called frequently to get the current progress on a range
	 * of 0-1
	 */
	function Playback( container, progressCheck ) {

		// Cosmetics
		this.diameter = 50;
		this.thickness = 3;

		// Flags if we are currently playing
		this.playing = false;

		// Current progress on a 0-1 range
		this.progress = 0;

		// Used to loop the animation smoothly
		this.progressOffset = 1;

		this.container = container;
		this.progressCheck = progressCheck;

		this.canvas = document.createElement( 'canvas' );
		this.canvas.className = 'playback';
		this.canvas.width = this.diameter;
		this.canvas.height = this.diameter;
		this.context = this.canvas.getContext( '2d' );

		this.container.appendChild( this.canvas );

		this.render();

	}

	Playback.prototype.setPlaying = function( value ) {

		var wasPlaying = this.playing;

		this.playing = value;

		// Start repainting if we weren't already
		if( !wasPlaying && this.playing ) {
			this.animate();
		}
		else {
			this.render();
		}

	};

	Playback.prototype.animate = function() {

		var progressBefore = this.progress;

		this.progress = this.progressCheck();

		// When we loop, offset the progress so that it eases
		// smoothly rather than immediately resetting
		if( progressBefore > 0.8 && this.progress < 0.2 ) {
			this.progressOffset = this.progress;
		}

		this.render();

		if( this.playing ) {
			features.requestAnimationFrameMethod.call( window, this.animate.bind( this ) );
		}

	};

	/**
	 * Renders the current progress and playback state.
	 */
	Playback.prototype.render = function() {

		var progress = this.playing ? this.progress : 0,
			radius = ( this.diameter / 2 ) - this.thickness,
			x = this.diameter / 2,
			y = this.diameter / 2,
			iconSize = 14;

		// Ease towards 1
		this.progressOffset += ( 1 - this.progressOffset ) * 0.1;

		var endAngle = ( - Math.PI / 2 ) + ( progress * ( Math.PI * 2 ) );
		var startAngle = ( - Math.PI / 2 ) + ( this.progressOffset * ( Math.PI * 2 ) );

		this.context.save();
		this.context.clearRect( 0, 0, this.diameter, this.diameter );

		// Solid background color
		this.context.beginPath();
		this.context.arc( x, y, radius + 2, 0, Math.PI * 2, false );
		this.context.fillStyle = 'rgba( 0, 0, 0, 0.4 )';
		this.context.fill();

		// Draw progress track
		this.context.beginPath();
		this.context.arc( x, y, radius, 0, Math.PI * 2, false );
		this.context.lineWidth = this.thickness;
		this.context.strokeStyle = '#666';
		this.context.stroke();

		if( this.playing ) {
			// Draw progress on top of track
			this.context.beginPath();
			this.context.arc( x, y, radius, startAngle, endAngle, false );
			this.context.lineWidth = this.thickness;
			this.context.strokeStyle = '#fff';
			this.context.stroke();
		}

		this.context.translate( x - ( iconSize / 2 ), y - ( iconSize / 2 ) );

		// Draw play/pause icons
		if( this.playing ) {
			this.context.fillStyle = '#fff';
			this.context.fillRect( 0, 0, iconSize / 2 - 2, iconSize );
			this.context.fillRect( iconSize / 2 + 2, 0, iconSize / 2 - 2, iconSize );
		}
		else {
			this.context.beginPath();
			this.context.translate( 2, 0 );
			this.context.moveTo( 0, 0 );
			this.context.lineTo( iconSize - 2, iconSize / 2 );
			this.context.lineTo( 0, iconSize );
			this.context.fillStyle = '#fff';
			this.context.fill();
		}

		this.context.restore();

	};

	Playback.prototype.on = function( type, listener ) {
		this.canvas.addEventListener( type, listener, false );
	};

	Playback.prototype.off = function( type, listener ) {
		this.canvas.removeEventListener( type, listener, false );
	};

	Playback.prototype.destroy = function() {

		this.playing = false;

		if( this.canvas.parentNode ) {
			this.container.removeChild( this.canvas );
		}

	};


	// --------------------------------------------------------------------//
	// ------------------------------- API --------------------------------//
	// --------------------------------------------------------------------//


	return {
		initialize: initialize,
		configure: configure,
		sync: sync,

		// Navigation methods
		slide: slide,
		left: navigateLeft,
		right: navigateRight,
		up: navigateUp,
		down: navigateDown,
		prev: navigatePrev,
		next: navigateNext,

		// Fragment methods
		navigateFragment: navigateFragment,
		prevFragment: previousFragment,
		nextFragment: nextFragment,

		// Deprecated aliases
		navigateTo: slide,
		navigateLeft: navigateLeft,
		navigateRight: navigateRight,
		navigateUp: navigateUp,
		navigateDown: navigateDown,
		navigatePrev: navigatePrev,
		navigateNext: navigateNext,

		// Forces an update in slide layout
		layout: layout,

		// Returns an object with the available routes as booleans (left/right/top/bottom)
		availableRoutes: availableRoutes,

		// Returns an object with the available fragments as booleans (prev/next)
		availableFragments: availableFragments,

		// Toggles the overview mode on/off
		toggleOverview: toggleOverview,

		// Toggles the "black screen" mode on/off
		togglePause: togglePause,

		// State checks
		isOverview: isOverview,
		isPaused: isPaused,

		// Adds or removes all internal event listeners (such as keyboard)
		addEventListeners: addEventListeners,
		removeEventListeners: removeEventListeners,

		// Returns the indices of the current, or specified, slide
		getIndices: getIndices,

		// Returns the slide at the specified index, y is optional
		getSlide: function( x, y ) {
			var horizontalSlide = document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR )[ x ];
			var verticalSlides = horizontalSlide && horizontalSlide.querySelectorAll( 'section' );

			if( typeof y !== 'undefined' ) {
				return verticalSlides ? verticalSlides[ y ] : undefined;
			}

			return horizontalSlide;
		},

		// Returns the previous slide element, may be null
		getPreviousSlide: function() {
			return previousSlide;
		},

		// Returns the current slide element
		getCurrentSlide: function() {
			return currentSlide;
		},

		// Returns the current scale of the presentation content
		getScale: function() {
			return scale;
		},

		// Returns the current configuration object
		getConfig: function() {
			return config;
		},

		// Helper method, retrieves query string as a key/value hash
		getQueryHash: function() {
			var query = {};

			location.search.replace( /[A-Z0-9]+?=([\w\.%-]*)/gi, function(a) {
				query[ a.split( '=' ).shift() ] = a.split( '=' ).pop();
			} );

			// Basic deserialization
			for( var i in query ) {
				var value = query[ i ];

				query[ i ] = unescape( value );

				if( value === 'null' ) query[ i ] = null;
				else if( value === 'true' ) query[ i ] = true;
				else if( value === 'false' ) query[ i ] = false;
				else if( value.match( /^\d+$/ ) ) query[ i ] = parseFloat( value );
			}

			return query;
		},

		// Returns true if we're currently on the first slide
		isFirstSlide: function() {
			return document.querySelector( SLIDES_SELECTOR + '.past' ) == null ? true : false;
		},

		// Returns true if we're currently on the last slide
		isLastSlide: function() {
			if( currentSlide ) {
				// Does this slide has next a sibling?
				if( currentSlide.nextElementSibling ) return false;

				// If it's vertical, does its parent have a next sibling?
				if( isVerticalSlide( currentSlide ) && currentSlide.parentNode.nextElementSibling ) return false;

				return true;
			}

			return false;
		},

		// Checks if reveal.js has been loaded and is ready for use
		isReady: function() {
			return loaded;
		},

		// Forward event binding to the reveal DOM element
		addEventListener: function( type, listener, useCapture ) {
			if( 'addEventListener' in window ) {
				( dom.wrapper || document.querySelector( '.reveal' ) ).addEventListener( type, listener, useCapture );
			}
		},
		removeEventListener: function( type, listener, useCapture ) {
			if( 'addEventListener' in window ) {
				( dom.wrapper || document.querySelector( '.reveal' ) ).removeEventListener( type, listener, useCapture );
			}
		}
	};

})();

module.exports = Reveal;
},{}],2:[function(require,module,exports){
var Reveal = require('reveal');

// Full list of configuration options available here: 
// https://github.com/hakimel/reveal.js#configuration 
Reveal.initialize({
  controls: true,
  progress: true,
  history: true,
  center: true,
  // default/cube/page/concave/zoom/linear/fade/none 
  transition: 'linear',
});
},{"reveal":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxCb3ggU3luY1xcNS4gRGF0YSBBbmFseXNpc1xcdGVzdFxccmV2ZWFsX2phZGVcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L0JveCBTeW5jLzUuIERhdGEgQW5hbHlzaXMvdGVzdC9yZXZlYWxfamFkZS9ub2RlX21vZHVsZXMvcmV2ZWFsL2luZGV4LmpzIiwiQzovQm94IFN5bmMvNS4gRGF0YSBBbmFseXNpcy90ZXN0L3JldmVhbF9qYWRlL3N0YXRpYy9kZXYvanMvZmFrZV8yNmNiMmVkNi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2ekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIHJldmVhbC5qc1xuICogaHR0cDovL2xhYi5oYWtpbS5zZS9yZXZlYWwtanNcbiAqIE1JVCBsaWNlbnNlZFxuICpcbiAqIENvcHlyaWdodCAoQykgMjAxMyBIYWtpbSBFbCBIYXR0YWIsIGh0dHA6Ly9oYWtpbS5zZVxuICovXG52YXIgUmV2ZWFsID0gKGZ1bmN0aW9uKCl7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBTTElERVNfU0VMRUNUT1IgPSAnLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24nLFxuXHRcdEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SID0gJy5yZXZlYWwgLnNsaWRlcz5zZWN0aW9uJyxcblx0XHRWRVJUSUNBTF9TTElERVNfU0VMRUNUT1IgPSAnLnJldmVhbCAuc2xpZGVzPnNlY3Rpb24ucHJlc2VudD5zZWN0aW9uJyxcblx0XHRIT01FX1NMSURFX1NFTEVDVE9SID0gJy5yZXZlYWwgLnNsaWRlcz5zZWN0aW9uOmZpcnN0LW9mLXR5cGUnLFxuXG5cdFx0Ly8gQ29uZmlndXJhdGlvbnMgZGVmYXVsdHMsIGNhbiBiZSBvdmVycmlkZGVuIGF0IGluaXRpYWxpemF0aW9uIHRpbWVcblx0XHRjb25maWcgPSB7XG5cblx0XHRcdC8vIFRoZSBcIm5vcm1hbFwiIHNpemUgb2YgdGhlIHByZXNlbnRhdGlvbiwgYXNwZWN0IHJhdGlvIHdpbGwgYmUgcHJlc2VydmVkXG5cdFx0XHQvLyB3aGVuIHRoZSBwcmVzZW50YXRpb24gaXMgc2NhbGVkIHRvIGZpdCBkaWZmZXJlbnQgcmVzb2x1dGlvbnNcblx0XHRcdHdpZHRoOiA5NjAsXG5cdFx0XHRoZWlnaHQ6IDcwMCxcblxuXHRcdFx0Ly8gRmFjdG9yIG9mIHRoZSBkaXNwbGF5IHNpemUgdGhhdCBzaG91bGQgcmVtYWluIGVtcHR5IGFyb3VuZCB0aGUgY29udGVudFxuXHRcdFx0bWFyZ2luOiAwLjEsXG5cblx0XHRcdC8vIEJvdW5kcyBmb3Igc21hbGxlc3QvbGFyZ2VzdCBwb3NzaWJsZSBzY2FsZSB0byBhcHBseSB0byBjb250ZW50XG5cdFx0XHRtaW5TY2FsZTogMC4yLFxuXHRcdFx0bWF4U2NhbGU6IDEuMCxcblxuXHRcdFx0Ly8gRGlzcGxheSBjb250cm9scyBpbiB0aGUgYm90dG9tIHJpZ2h0IGNvcm5lclxuXHRcdFx0Y29udHJvbHM6IHRydWUsXG5cblx0XHRcdC8vIERpc3BsYXkgYSBwcmVzZW50YXRpb24gcHJvZ3Jlc3MgYmFyXG5cdFx0XHRwcm9ncmVzczogdHJ1ZSxcblxuXHRcdFx0Ly8gRGlzcGxheSB0aGUgcGFnZSBudW1iZXIgb2YgdGhlIGN1cnJlbnQgc2xpZGVcblx0XHRcdHNsaWRlTnVtYmVyOiBmYWxzZSxcblxuXHRcdFx0Ly8gUHVzaCBlYWNoIHNsaWRlIGNoYW5nZSB0byB0aGUgYnJvd3NlciBoaXN0b3J5XG5cdFx0XHRoaXN0b3J5OiBmYWxzZSxcblxuXHRcdFx0Ly8gRW5hYmxlIGtleWJvYXJkIHNob3J0Y3V0cyBmb3IgbmF2aWdhdGlvblxuXHRcdFx0a2V5Ym9hcmQ6IHRydWUsXG5cblx0XHRcdC8vIEVuYWJsZSB0aGUgc2xpZGUgb3ZlcnZpZXcgbW9kZVxuXHRcdFx0b3ZlcnZpZXc6IHRydWUsXG5cblx0XHRcdC8vIFZlcnRpY2FsIGNlbnRlcmluZyBvZiBzbGlkZXNcblx0XHRcdGNlbnRlcjogdHJ1ZSxcblxuXHRcdFx0Ly8gRW5hYmxlcyB0b3VjaCBuYXZpZ2F0aW9uIG9uIGRldmljZXMgd2l0aCB0b3VjaCBpbnB1dFxuXHRcdFx0dG91Y2g6IHRydWUsXG5cblx0XHRcdC8vIExvb3AgdGhlIHByZXNlbnRhdGlvblxuXHRcdFx0bG9vcDogZmFsc2UsXG5cblx0XHRcdC8vIENoYW5nZSB0aGUgcHJlc2VudGF0aW9uIGRpcmVjdGlvbiB0byBiZSBSVExcblx0XHRcdHJ0bDogZmFsc2UsXG5cblx0XHRcdC8vIFR1cm5zIGZyYWdtZW50cyBvbiBhbmQgb2ZmIGdsb2JhbGx5XG5cdFx0XHRmcmFnbWVudHM6IHRydWUsXG5cblx0XHRcdC8vIEZsYWdzIGlmIHRoZSBwcmVzZW50YXRpb24gaXMgcnVubmluZyBpbiBhbiBlbWJlZGRlZCBtb2RlLFxuXHRcdFx0Ly8gaS5lLiBjb250YWluZWQgd2l0aGluIGEgbGltaXRlZCBwb3J0aW9uIG9mIHRoZSBzY3JlZW5cblx0XHRcdGVtYmVkZGVkOiBmYWxzZSxcblxuXHRcdFx0Ly8gTnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBiZXR3ZWVuIGF1dG9tYXRpY2FsbHkgcHJvY2VlZGluZyB0byB0aGVcblx0XHRcdC8vIG5leHQgc2xpZGUsIGRpc2FibGVkIHdoZW4gc2V0IHRvIDAsIHRoaXMgdmFsdWUgY2FuIGJlIG92ZXJ3cml0dGVuXG5cdFx0XHQvLyBieSB1c2luZyBhIGRhdGEtYXV0b3NsaWRlIGF0dHJpYnV0ZSBvbiB5b3VyIHNsaWRlc1xuXHRcdFx0YXV0b1NsaWRlOiAwLFxuXG5cdFx0XHQvLyBTdG9wIGF1dG8tc2xpZGluZyBhZnRlciB1c2VyIGlucHV0XG5cdFx0XHRhdXRvU2xpZGVTdG9wcGFibGU6IHRydWUsXG5cblx0XHRcdC8vIEVuYWJsZSBzbGlkZSBuYXZpZ2F0aW9uIHZpYSBtb3VzZSB3aGVlbFxuXHRcdFx0bW91c2VXaGVlbDogZmFsc2UsXG5cblx0XHRcdC8vIEFwcGx5IGEgM0Qgcm9sbCB0byBsaW5rcyBvbiBob3ZlclxuXHRcdFx0cm9sbGluZ0xpbmtzOiBmYWxzZSxcblxuXHRcdFx0Ly8gSGlkZXMgdGhlIGFkZHJlc3MgYmFyIG9uIG1vYmlsZSBkZXZpY2VzXG5cdFx0XHRoaWRlQWRkcmVzc0JhcjogdHJ1ZSxcblxuXHRcdFx0Ly8gT3BlbnMgbGlua3MgaW4gYW4gaWZyYW1lIHByZXZpZXcgb3ZlcmxheVxuXHRcdFx0cHJldmlld0xpbmtzOiBmYWxzZSxcblxuXHRcdFx0Ly8gRm9jdXNlcyBib2R5IHdoZW4gcGFnZSBjaGFuZ2VzIHZpc2libGl0eSB0byBlbnN1cmUga2V5Ym9hcmQgc2hvcnRjdXRzIHdvcmtcblx0XHRcdGZvY3VzQm9keU9uUGFnZVZpc2libGl0eUNoYW5nZTogdHJ1ZSxcblxuXHRcdFx0Ly8gVGhlbWUgKHNlZSAvY3NzL3RoZW1lKVxuXHRcdFx0dGhlbWU6IG51bGwsXG5cblx0XHRcdC8vIFRyYW5zaXRpb24gc3R5bGVcblx0XHRcdHRyYW5zaXRpb246ICdkZWZhdWx0JywgLy8gZGVmYXVsdC9jdWJlL3BhZ2UvY29uY2F2ZS96b29tL2xpbmVhci9mYWRlL25vbmVcblxuXHRcdFx0Ly8gVHJhbnNpdGlvbiBzcGVlZFxuXHRcdFx0dHJhbnNpdGlvblNwZWVkOiAnZGVmYXVsdCcsIC8vIGRlZmF1bHQvZmFzdC9zbG93XG5cblx0XHRcdC8vIFRyYW5zaXRpb24gc3R5bGUgZm9yIGZ1bGwgcGFnZSBzbGlkZSBiYWNrZ3JvdW5kc1xuXHRcdFx0YmFja2dyb3VuZFRyYW5zaXRpb246ICdkZWZhdWx0JywgLy8gZGVmYXVsdC9saW5lYXIvbm9uZVxuXG5cdFx0XHQvLyBQYXJhbGxheCBiYWNrZ3JvdW5kIGltYWdlXG5cdFx0XHRwYXJhbGxheEJhY2tncm91bmRJbWFnZTogJycsIC8vIENTUyBzeW50YXgsIGUuZy4gXCJhLmpwZ1wiXG5cblx0XHRcdC8vIFBhcmFsbGF4IGJhY2tncm91bmQgc2l6ZVxuXHRcdFx0cGFyYWxsYXhCYWNrZ3JvdW5kU2l6ZTogJycsIC8vIENTUyBzeW50YXgsIGUuZy4gXCIzMDAwcHggMjAwMHB4XCJcblxuXHRcdFx0Ly8gTnVtYmVyIG9mIHNsaWRlcyBhd2F5IGZyb20gdGhlIGN1cnJlbnQgdGhhdCBhcmUgdmlzaWJsZVxuXHRcdFx0dmlld0Rpc3RhbmNlOiAzLFxuXG5cdFx0XHQvLyBTY3JpcHQgZGVwZW5kZW5jaWVzIHRvIGxvYWRcblx0XHRcdGRlcGVuZGVuY2llczogW11cblxuXHRcdH0sXG5cblx0XHQvLyBGbGFncyBpZiByZXZlYWwuanMgaXMgbG9hZGVkIChoYXMgZGlzcGF0Y2hlZCB0aGUgJ3JlYWR5JyBldmVudClcblx0XHRsb2FkZWQgPSBmYWxzZSxcblxuXHRcdC8vIFRoZSBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBpbmRleCBvZiB0aGUgY3VycmVudGx5IGFjdGl2ZSBzbGlkZVxuXHRcdGluZGV4aCxcblx0XHRpbmRleHYsXG5cblx0XHQvLyBUaGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgc2xpZGUgSFRNTCBlbGVtZW50c1xuXHRcdHByZXZpb3VzU2xpZGUsXG5cdFx0Y3VycmVudFNsaWRlLFxuXG5cdFx0cHJldmlvdXNCYWNrZ3JvdW5kLFxuXG5cdFx0Ly8gU2xpZGVzIG1heSBob2xkIGEgZGF0YS1zdGF0ZSBhdHRyaWJ1dGUgd2hpY2ggd2UgcGljayB1cCBhbmQgYXBwbHlcblx0XHQvLyBhcyBhIGNsYXNzIHRvIHRoZSBib2R5LiBUaGlzIGxpc3QgY29udGFpbnMgdGhlIGNvbWJpbmVkIHN0YXRlIG9mXG5cdFx0Ly8gYWxsIGN1cnJlbnQgc2xpZGVzLlxuXHRcdHN0YXRlID0gW10sXG5cblx0XHQvLyBUaGUgY3VycmVudCBzY2FsZSBvZiB0aGUgcHJlc2VudGF0aW9uIChzZWUgd2lkdGgvaGVpZ2h0IGNvbmZpZylcblx0XHRzY2FsZSA9IDEsXG5cblx0XHQvLyBDYWNoZWQgcmVmZXJlbmNlcyB0byBET00gZWxlbWVudHNcblx0XHRkb20gPSB7fSxcblxuXHRcdC8vIEZlYXR1cmVzIHN1cHBvcnRlZCBieSB0aGUgYnJvd3Nlciwgc2VlICNjaGVja0NhcGFiaWxpdGllcygpXG5cdFx0ZmVhdHVyZXMgPSB7fSxcblxuXHRcdC8vIENsaWVudCBpcyBhIG1vYmlsZSBkZXZpY2UsIHNlZSAjY2hlY2tDYXBhYmlsaXRpZXMoKVxuXHRcdGlzTW9iaWxlRGV2aWNlLFxuXG5cdFx0Ly8gVGhyb3R0bGVzIG1vdXNlIHdoZWVsIG5hdmlnYXRpb25cblx0XHRsYXN0TW91c2VXaGVlbFN0ZXAgPSAwLFxuXG5cdFx0Ly8gRGVsYXlzIHVwZGF0ZXMgdG8gdGhlIFVSTCBkdWUgdG8gYSBDaHJvbWUgdGh1bWJuYWlsZXIgYnVnXG5cdFx0d3JpdGVVUkxUaW1lb3V0ID0gMCxcblxuXHRcdC8vIEEgZGVsYXkgdXNlZCB0byBhY3RpdmF0ZSB0aGUgb3ZlcnZpZXcgbW9kZVxuXHRcdGFjdGl2YXRlT3ZlcnZpZXdUaW1lb3V0ID0gMCxcblxuXHRcdC8vIEEgZGVsYXkgdXNlZCB0byBkZWFjdGl2YXRlIHRoZSBvdmVydmlldyBtb2RlXG5cdFx0ZGVhY3RpdmF0ZU92ZXJ2aWV3VGltZW91dCA9IDAsXG5cblx0XHQvLyBGbGFncyBpZiB0aGUgaW50ZXJhY3Rpb24gZXZlbnQgbGlzdGVuZXJzIGFyZSBib3VuZFxuXHRcdGV2ZW50c0FyZUJvdW5kID0gZmFsc2UsXG5cblx0XHQvLyBUaGUgY3VycmVudCBhdXRvLXNsaWRlIGR1cmF0aW9uXG5cdFx0YXV0b1NsaWRlID0gMCxcblxuXHRcdC8vIEF1dG8gc2xpZGUgcHJvcGVydGllc1xuXHRcdGF1dG9TbGlkZVBsYXllcixcblx0XHRhdXRvU2xpZGVUaW1lb3V0ID0gMCxcblx0XHRhdXRvU2xpZGVTdGFydFRpbWUgPSAtMSxcblx0XHRhdXRvU2xpZGVQYXVzZWQgPSBmYWxzZSxcblxuXHRcdC8vIEhvbGRzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50bHkgb25nb2luZyB0b3VjaCBpbnB1dFxuXHRcdHRvdWNoID0ge1xuXHRcdFx0c3RhcnRYOiAwLFxuXHRcdFx0c3RhcnRZOiAwLFxuXHRcdFx0c3RhcnRTcGFuOiAwLFxuXHRcdFx0c3RhcnRDb3VudDogMCxcblx0XHRcdGNhcHR1cmVkOiBmYWxzZSxcblx0XHRcdHRocmVzaG9sZDogNDBcblx0XHR9O1xuXG5cdC8qKlxuXHQgKiBTdGFydHMgdXAgdGhlIHByZXNlbnRhdGlvbiBpZiB0aGUgY2xpZW50IGlzIGNhcGFibGUuXG5cdCAqL1xuXHRmdW5jdGlvbiBpbml0aWFsaXplKCBvcHRpb25zICkge1xuXG5cdFx0Y2hlY2tDYXBhYmlsaXRpZXMoKTtcblxuXHRcdGlmKCAhZmVhdHVyZXMudHJhbnNmb3JtczJkICYmICFmZWF0dXJlcy50cmFuc2Zvcm1zM2QgKSB7XG5cdFx0XHRkb2N1bWVudC5ib2R5LnNldEF0dHJpYnV0ZSggJ2NsYXNzJywgJ25vLXRyYW5zZm9ybXMnICk7XG5cblx0XHRcdC8vIElmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCBjb3JlIGZlYXR1cmVzIHdlIHdvbid0IGJlXG5cdFx0XHQvLyB1c2luZyBKYXZhU2NyaXB0IHRvIGNvbnRyb2wgdGhlIHByZXNlbnRhdGlvblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEZvcmNlIGEgbGF5b3V0IHdoZW4gdGhlIHdob2xlIHBhZ2UsIGluY2wgZm9udHMsIGhhcyBsb2FkZWRcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBsYXlvdXQsIGZhbHNlICk7XG5cblx0XHR2YXIgcXVlcnkgPSBSZXZlYWwuZ2V0UXVlcnlIYXNoKCk7XG5cblx0XHQvLyBEbyBub3QgYWNjZXB0IG5ldyBkZXBlbmRlbmNpZXMgdmlhIHF1ZXJ5IGNvbmZpZyB0byBhdm9pZFxuXHRcdC8vIHRoZSBwb3RlbnRpYWwgb2YgbWFsaWNpb3VzIHNjcmlwdCBpbmplY3Rpb25cblx0XHRpZiggdHlwZW9mIHF1ZXJ5WydkZXBlbmRlbmNpZXMnXSAhPT0gJ3VuZGVmaW5lZCcgKSBkZWxldGUgcXVlcnlbJ2RlcGVuZGVuY2llcyddO1xuXG5cdFx0Ly8gQ29weSBvcHRpb25zIG92ZXIgdG8gb3VyIGNvbmZpZyBvYmplY3Rcblx0XHRleHRlbmQoIGNvbmZpZywgb3B0aW9ucyApO1xuXHRcdGV4dGVuZCggY29uZmlnLCBxdWVyeSApO1xuXG5cdFx0Ly8gSGlkZSB0aGUgYWRkcmVzcyBiYXIgaW4gbW9iaWxlIGJyb3dzZXJzXG5cdFx0aGlkZUFkZHJlc3NCYXIoKTtcblxuXHRcdC8vIExvYWRzIHRoZSBkZXBlbmRlbmNpZXMgYW5kIGNvbnRpbnVlcyB0byAjc3RhcnQoKSBvbmNlIGRvbmVcblx0XHRsb2FkKCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBJbnNwZWN0IHRoZSBjbGllbnQgdG8gc2VlIHdoYXQgaXQncyBjYXBhYmxlIG9mLCB0aGlzXG5cdCAqIHNob3VsZCBvbmx5IGhhcHBlbnMgb25jZSBwZXIgcnVudGltZS5cblx0ICovXG5cdGZ1bmN0aW9uIGNoZWNrQ2FwYWJpbGl0aWVzKCkge1xuXG5cdFx0ZmVhdHVyZXMudHJhbnNmb3JtczNkID0gJ1dlYmtpdFBlcnNwZWN0aXZlJyBpbiBkb2N1bWVudC5ib2R5LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J01velBlcnNwZWN0aXZlJyBpbiBkb2N1bWVudC5ib2R5LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J21zUGVyc3BlY3RpdmUnIGluIGRvY3VtZW50LmJvZHkuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQnT1BlcnNwZWN0aXZlJyBpbiBkb2N1bWVudC5ib2R5LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J3BlcnNwZWN0aXZlJyBpbiBkb2N1bWVudC5ib2R5LnN0eWxlO1xuXG5cdFx0ZmVhdHVyZXMudHJhbnNmb3JtczJkID0gJ1dlYmtpdFRyYW5zZm9ybScgaW4gZG9jdW1lbnQuYm9keS5zdHlsZSB8fFxuXHRcdFx0XHRcdFx0XHRcdCdNb3pUcmFuc2Zvcm0nIGluIGRvY3VtZW50LmJvZHkuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQnbXNUcmFuc2Zvcm0nIGluIGRvY3VtZW50LmJvZHkuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQnT1RyYW5zZm9ybScgaW4gZG9jdW1lbnQuYm9keS5zdHlsZSB8fFxuXHRcdFx0XHRcdFx0XHRcdCd0cmFuc2Zvcm0nIGluIGRvY3VtZW50LmJvZHkuc3R5bGU7XG5cblx0XHRmZWF0dXJlcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVNZXRob2QgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZTtcblx0XHRmZWF0dXJlcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB0eXBlb2YgZmVhdHVyZXMucmVxdWVzdEFuaW1hdGlvbkZyYW1lTWV0aG9kID09PSAnZnVuY3Rpb24nO1xuXG5cdFx0ZmVhdHVyZXMuY2FudmFzID0gISFkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApLmdldENvbnRleHQ7XG5cblx0XHRpc01vYmlsZURldmljZSA9IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goIC8oaXBob25lfGlwb2R8YW5kcm9pZCkvZ2kgKTtcblxuXHR9XG5cblxuICAgIC8qKlxuICAgICAqIExvYWRzIHRoZSBkZXBlbmRlbmNpZXMgb2YgcmV2ZWFsLmpzLiBEZXBlbmRlbmNpZXMgYXJlXG4gICAgICogZGVmaW5lZCB2aWEgdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9uICdkZXBlbmRlbmNpZXMnXG4gICAgICogYW5kIHdpbGwgYmUgbG9hZGVkIHByaW9yIHRvIHN0YXJ0aW5nL2JpbmRpbmcgcmV2ZWFsLmpzLlxuICAgICAqIFNvbWUgZGVwZW5kZW5jaWVzIG1heSBoYXZlIGFuICdhc3luYycgZmxhZywgaWYgc28gdGhleVxuICAgICAqIHdpbGwgbG9hZCBhZnRlciByZXZlYWwuanMgaGFzIGJlZW4gc3RhcnRlZCB1cC5cbiAgICAgKi9cblx0ZnVuY3Rpb24gbG9hZCgpIHtcblxuXHRcdHZhciBzY3JpcHRzID0gW10sXG5cdFx0XHRzY3JpcHRzQXN5bmMgPSBbXSxcblx0XHRcdHNjcmlwdHNUb1ByZWxvYWQgPSAwO1xuXG5cdFx0Ly8gQ2FsbGVkIG9uY2Ugc3luY2hyb25vdXMgc2NyaXB0cyBmaW5pc2ggbG9hZGluZ1xuXHRcdGZ1bmN0aW9uIHByb2NlZWQoKSB7XG5cdFx0XHRpZiggc2NyaXB0c0FzeW5jLmxlbmd0aCApIHtcblx0XHRcdFx0Ly8gTG9hZCBhc3luY2hyb25vdXMgc2NyaXB0c1xuXHRcdFx0XHRoZWFkLmpzLmFwcGx5KCBudWxsLCBzY3JpcHRzQXN5bmMgKTtcblx0XHRcdH1cblxuXHRcdFx0c3RhcnQoKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBsb2FkU2NyaXB0KCBzICkge1xuXHRcdFx0aGVhZC5yZWFkeSggcy5zcmMubWF0Y2goIC8oW1xcd1xcZF9cXC1dKilcXC4/anMkfFteXFxcXFxcL10qJC9pIClbMF0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvLyBFeHRlbnNpb24gbWF5IGNvbnRhaW4gY2FsbGJhY2sgZnVuY3Rpb25zXG5cdFx0XHRcdGlmKCB0eXBlb2Ygcy5jYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0XHRzLmNhbGxiYWNrLmFwcGx5KCB0aGlzICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiggLS1zY3JpcHRzVG9QcmVsb2FkID09PSAwICkge1xuXHRcdFx0XHRcdHByb2NlZWQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGNvbmZpZy5kZXBlbmRlbmNpZXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHR2YXIgcyA9IGNvbmZpZy5kZXBlbmRlbmNpZXNbaV07XG5cblx0XHRcdC8vIExvYWQgaWYgdGhlcmUncyBubyBjb25kaXRpb24gb3IgdGhlIGNvbmRpdGlvbiBpcyB0cnV0aHlcblx0XHRcdGlmKCAhcy5jb25kaXRpb24gfHwgcy5jb25kaXRpb24oKSApIHtcblx0XHRcdFx0aWYoIHMuYXN5bmMgKSB7XG5cdFx0XHRcdFx0c2NyaXB0c0FzeW5jLnB1c2goIHMuc3JjICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0c2NyaXB0cy5wdXNoKCBzLnNyYyApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bG9hZFNjcmlwdCggcyApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKCBzY3JpcHRzLmxlbmd0aCApIHtcblx0XHRcdHNjcmlwdHNUb1ByZWxvYWQgPSBzY3JpcHRzLmxlbmd0aDtcblxuXHRcdFx0Ly8gTG9hZCBzeW5jaHJvbm91cyBzY3JpcHRzXG5cdFx0XHRoZWFkLmpzLmFwcGx5KCBudWxsLCBzY3JpcHRzICk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cHJvY2VlZCgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFN0YXJ0cyB1cCByZXZlYWwuanMgYnkgYmluZGluZyBpbnB1dCBldmVudHMgYW5kIG5hdmlnYXRpbmdcblx0ICogdG8gdGhlIGN1cnJlbnQgVVJMIGRlZXBsaW5rIGlmIHRoZXJlIGlzIG9uZS5cblx0ICovXG5cdGZ1bmN0aW9uIHN0YXJ0KCkge1xuXG5cdFx0Ly8gTWFrZSBzdXJlIHdlJ3ZlIGdvdCBhbGwgdGhlIERPTSBlbGVtZW50cyB3ZSBuZWVkXG5cdFx0c2V0dXBET00oKTtcblxuXHRcdC8vIFJlc2V0cyBhbGwgdmVydGljYWwgc2xpZGVzIHNvIHRoYXQgb25seSB0aGUgZmlyc3QgaXMgdmlzaWJsZVxuXHRcdHJlc2V0VmVydGljYWxTbGlkZXMoKTtcblxuXHRcdC8vIFVwZGF0ZXMgdGhlIHByZXNlbnRhdGlvbiB0byBtYXRjaCB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uIHZhbHVlc1xuXHRcdGNvbmZpZ3VyZSgpO1xuXG5cdFx0Ly8gUmVhZCB0aGUgaW5pdGlhbCBoYXNoXG5cdFx0cmVhZFVSTCgpO1xuXG5cdFx0Ly8gVXBkYXRlIGFsbCBiYWNrZ3JvdW5kc1xuXHRcdHVwZGF0ZUJhY2tncm91bmQoIHRydWUgKTtcblxuXHRcdC8vIE5vdGlmeSBsaXN0ZW5lcnMgdGhhdCB0aGUgcHJlc2VudGF0aW9uIGlzIHJlYWR5IGJ1dCB1c2UgYSAxbXNcblx0XHQvLyB0aW1lb3V0IHRvIGVuc3VyZSBpdCdzIG5vdCBmaXJlZCBzeW5jaHJvbm91c2x5IGFmdGVyICNpbml0aWFsaXplKClcblx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcblx0XHRcdC8vIEVuYWJsZSB0cmFuc2l0aW9ucyBub3cgdGhhdCB3ZSdyZSBsb2FkZWRcblx0XHRcdGRvbS5zbGlkZXMuY2xhc3NMaXN0LnJlbW92ZSggJ25vLXRyYW5zaXRpb24nICk7XG5cblx0XHRcdGxvYWRlZCA9IHRydWU7XG5cblx0XHRcdGRpc3BhdGNoRXZlbnQoICdyZWFkeScsIHtcblx0XHRcdFx0J2luZGV4aCc6IGluZGV4aCxcblx0XHRcdFx0J2luZGV4dic6IGluZGV4dixcblx0XHRcdFx0J2N1cnJlbnRTbGlkZSc6IGN1cnJlbnRTbGlkZVxuXHRcdFx0fSApO1xuXHRcdH0sIDEgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEZpbmRzIGFuZCBzdG9yZXMgcmVmZXJlbmNlcyB0byBET00gZWxlbWVudHMgd2hpY2ggYXJlXG5cdCAqIHJlcXVpcmVkIGJ5IHRoZSBwcmVzZW50YXRpb24uIElmIGEgcmVxdWlyZWQgZWxlbWVudCBpc1xuXHQgKiBub3QgZm91bmQsIGl0IGlzIGNyZWF0ZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBzZXR1cERPTSgpIHtcblxuXHRcdC8vIENhY2hlIHJlZmVyZW5jZXMgdG8ga2V5IERPTSBlbGVtZW50c1xuXHRcdGRvbS50aGVtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoICcjdGhlbWUnICk7XG5cdFx0ZG9tLndyYXBwZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCAnLnJldmVhbCcgKTtcblx0XHRkb20uc2xpZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJy5yZXZlYWwgLnNsaWRlcycgKTtcblxuXHRcdC8vIFByZXZlbnQgdHJhbnNpdGlvbnMgd2hpbGUgd2UncmUgbG9hZGluZ1xuXHRcdGRvbS5zbGlkZXMuY2xhc3NMaXN0LmFkZCggJ25vLXRyYW5zaXRpb24nICk7XG5cblx0XHQvLyBCYWNrZ3JvdW5kIGVsZW1lbnRcblx0XHRkb20uYmFja2dyb3VuZCA9IGNyZWF0ZVNpbmdsZXRvbk5vZGUoIGRvbS53cmFwcGVyLCAnZGl2JywgJ2JhY2tncm91bmRzJywgbnVsbCApO1xuXG5cdFx0Ly8gUHJvZ3Jlc3MgYmFyXG5cdFx0ZG9tLnByb2dyZXNzID0gY3JlYXRlU2luZ2xldG9uTm9kZSggZG9tLndyYXBwZXIsICdkaXYnLCAncHJvZ3Jlc3MnLCAnPHNwYW4+PC9zcGFuPicgKTtcblx0XHRkb20ucHJvZ3Jlc3NiYXIgPSBkb20ucHJvZ3Jlc3MucXVlcnlTZWxlY3RvciggJ3NwYW4nICk7XG5cblx0XHQvLyBBcnJvdyBjb250cm9sc1xuXHRcdGNyZWF0ZVNpbmdsZXRvbk5vZGUoIGRvbS53cmFwcGVyLCAnYXNpZGUnLCAnY29udHJvbHMnLFxuXHRcdFx0JzxkaXYgY2xhc3M9XCJuYXZpZ2F0ZS1sZWZ0XCI+PC9kaXY+JyArXG5cdFx0XHQnPGRpdiBjbGFzcz1cIm5hdmlnYXRlLXJpZ2h0XCI+PC9kaXY+JyArXG5cdFx0XHQnPGRpdiBjbGFzcz1cIm5hdmlnYXRlLXVwXCI+PC9kaXY+JyArXG5cdFx0XHQnPGRpdiBjbGFzcz1cIm5hdmlnYXRlLWRvd25cIj48L2Rpdj4nICk7XG5cblx0XHQvLyBTbGlkZSBudW1iZXJcblx0XHRkb20uc2xpZGVOdW1iZXIgPSBjcmVhdGVTaW5nbGV0b25Ob2RlKCBkb20ud3JhcHBlciwgJ2RpdicsICdzbGlkZS1udW1iZXInLCAnJyApO1xuXG5cdFx0Ly8gU3RhdGUgYmFja2dyb3VuZCBlbGVtZW50IFtERVBSRUNBVEVEXVxuXHRcdGNyZWF0ZVNpbmdsZXRvbk5vZGUoIGRvbS53cmFwcGVyLCAnZGl2JywgJ3N0YXRlLWJhY2tncm91bmQnLCBudWxsICk7XG5cblx0XHQvLyBPdmVybGF5IGdyYXBoaWMgd2hpY2ggaXMgZGlzcGxheWVkIGR1cmluZyB0aGUgcGF1c2VkIG1vZGVcblx0XHRjcmVhdGVTaW5nbGV0b25Ob2RlKCBkb20ud3JhcHBlciwgJ2RpdicsICdwYXVzZS1vdmVybGF5JywgbnVsbCApO1xuXG5cdFx0Ly8gQ2FjaGUgcmVmZXJlbmNlcyB0byBlbGVtZW50c1xuXHRcdGRvbS5jb250cm9scyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoICcucmV2ZWFsIC5jb250cm9scycgKTtcblxuXHRcdC8vIFRoZXJlIGNhbiBiZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgY29udHJvbHMgdGhyb3VnaG91dCB0aGUgcGFnZVxuXHRcdGRvbS5jb250cm9sc0xlZnQgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLm5hdmlnYXRlLWxlZnQnICkgKTtcblx0XHRkb20uY29udHJvbHNSaWdodCA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcubmF2aWdhdGUtcmlnaHQnICkgKTtcblx0XHRkb20uY29udHJvbHNVcCA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcubmF2aWdhdGUtdXAnICkgKTtcblx0XHRkb20uY29udHJvbHNEb3duID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5uYXZpZ2F0ZS1kb3duJyApICk7XG5cdFx0ZG9tLmNvbnRyb2xzUHJldiA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcubmF2aWdhdGUtcHJldicgKSApO1xuXHRcdGRvbS5jb250cm9sc05leHQgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLm5hdmlnYXRlLW5leHQnICkgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYW4gSFRNTCBlbGVtZW50IGFuZCByZXR1cm5zIGEgcmVmZXJlbmNlIHRvIGl0LlxuXHQgKiBJZiB0aGUgZWxlbWVudCBhbHJlYWR5IGV4aXN0cyB0aGUgZXhpc3RpbmcgaW5zdGFuY2Ugd2lsbFxuXHQgKiBiZSByZXR1cm5lZC5cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZVNpbmdsZXRvbk5vZGUoIGNvbnRhaW5lciwgdGFnbmFtZSwgY2xhc3NuYW1lLCBpbm5lckhUTUwgKSB7XG5cblx0XHR2YXIgbm9kZSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCAnLicgKyBjbGFzc25hbWUgKTtcblx0XHRpZiggIW5vZGUgKSB7XG5cdFx0XHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggdGFnbmFtZSApO1xuXHRcdFx0bm9kZS5jbGFzc0xpc3QuYWRkKCBjbGFzc25hbWUgKTtcblx0XHRcdGlmKCBpbm5lckhUTUwgIT09IG51bGwgKSB7XG5cdFx0XHRcdG5vZGUuaW5uZXJIVE1MID0gaW5uZXJIVE1MO1xuXHRcdFx0fVxuXHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKCBub2RlICk7XG5cdFx0fVxuXHRcdHJldHVybiBub2RlO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyB0aGUgc2xpZGUgYmFja2dyb3VuZCBlbGVtZW50cyBhbmQgYXBwZW5kcyB0aGVtXG5cdCAqIHRvIHRoZSBiYWNrZ3JvdW5kIGNvbnRhaW5lci4gT25lIGVsZW1lbnQgaXMgY3JlYXRlZCBwZXJcblx0ICogc2xpZGUgbm8gbWF0dGVyIGlmIHRoZSBnaXZlbiBzbGlkZSBoYXMgdmlzaWJsZSBiYWNrZ3JvdW5kLlxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlQmFja2dyb3VuZHMoKSB7XG5cblx0XHRpZiggaXNQcmludGluZ1BERigpICkge1xuXHRcdFx0ZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCAncHJpbnQtcGRmJyApO1xuXHRcdH1cblxuXHRcdC8vIENsZWFyIHByaW9yIGJhY2tncm91bmRzXG5cdFx0ZG9tLmJhY2tncm91bmQuaW5uZXJIVE1MID0gJyc7XG5cdFx0ZG9tLmJhY2tncm91bmQuY2xhc3NMaXN0LmFkZCggJ25vLXRyYW5zaXRpb24nICk7XG5cblx0XHQvLyBIZWxwZXIgbWV0aG9kIGZvciBjcmVhdGluZyBhIGJhY2tncm91bmQgZWxlbWVudCBmb3IgdGhlXG5cdFx0Ly8gZ2l2ZW4gc2xpZGVcblx0XHRmdW5jdGlvbiBfY3JlYXRlQmFja2dyb3VuZCggc2xpZGUsIGNvbnRhaW5lciApIHtcblxuXHRcdFx0dmFyIGRhdGEgPSB7XG5cdFx0XHRcdGJhY2tncm91bmQ6IHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZCcgKSxcblx0XHRcdFx0YmFja2dyb3VuZFNpemU6IHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC1zaXplJyApLFxuXHRcdFx0XHRiYWNrZ3JvdW5kSW1hZ2U6IHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC1pbWFnZScgKSxcblx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtY29sb3InICksXG5cdFx0XHRcdGJhY2tncm91bmRSZXBlYXQ6IHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC1yZXBlYXQnICksXG5cdFx0XHRcdGJhY2tncm91bmRQb3NpdGlvbjogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXBvc2l0aW9uJyApLFxuXHRcdFx0XHRiYWNrZ3JvdW5kVHJhbnNpdGlvbjogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb24nIClcblx0XHRcdH07XG5cblx0XHRcdHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHRcdGVsZW1lbnQuY2xhc3NOYW1lID0gJ3NsaWRlLWJhY2tncm91bmQnO1xuXG5cdFx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kICkge1xuXHRcdFx0XHQvLyBBdXRvLXdyYXAgaW1hZ2UgdXJscyBpbiB1cmwoLi4uKVxuXHRcdFx0XHRpZiggL14oaHR0cHxmaWxlfFxcL1xcLykvZ2kudGVzdCggZGF0YS5iYWNrZ3JvdW5kICkgfHwgL1xcLihzdmd8cG5nfGpwZ3xqcGVnfGdpZnxibXApJC9naS50ZXN0KCBkYXRhLmJhY2tncm91bmQgKSApIHtcblx0XHRcdFx0XHRlbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoJysgZGF0YS5iYWNrZ3JvdW5kICsnKSc7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0ZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kID0gZGF0YS5iYWNrZ3JvdW5kO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmKCBkYXRhLmJhY2tncm91bmQgfHwgZGF0YS5iYWNrZ3JvdW5kQ29sb3IgfHwgZGF0YS5iYWNrZ3JvdW5kSW1hZ2UgKSB7XG5cdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWhhc2gnLCBkYXRhLmJhY2tncm91bmQgKyBkYXRhLmJhY2tncm91bmRTaXplICsgZGF0YS5iYWNrZ3JvdW5kSW1hZ2UgKyBkYXRhLmJhY2tncm91bmRDb2xvciArIGRhdGEuYmFja2dyb3VuZFJlcGVhdCArIGRhdGEuYmFja2dyb3VuZFBvc2l0aW9uICsgZGF0YS5iYWNrZ3JvdW5kVHJhbnNpdGlvbiApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBZGRpdGlvbmFsIGFuZCBvcHRpb25hbCBiYWNrZ3JvdW5kIHByb3BlcnRpZXNcblx0XHRcdGlmKCBkYXRhLmJhY2tncm91bmRTaXplICkgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9IGRhdGEuYmFja2dyb3VuZFNpemU7XG5cdFx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kSW1hZ2UgKSBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoXCInICsgZGF0YS5iYWNrZ3JvdW5kSW1hZ2UgKyAnXCIpJztcblx0XHRcdGlmKCBkYXRhLmJhY2tncm91bmRDb2xvciApIGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gZGF0YS5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kUmVwZWF0ICkgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gZGF0YS5iYWNrZ3JvdW5kUmVwZWF0O1xuXHRcdFx0aWYoIGRhdGEuYmFja2dyb3VuZFBvc2l0aW9uICkgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSBkYXRhLmJhY2tncm91bmRQb3NpdGlvbjtcblx0XHRcdGlmKCBkYXRhLmJhY2tncm91bmRUcmFuc2l0aW9uICkgZWxlbWVudC5zZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbicsIGRhdGEuYmFja2dyb3VuZFRyYW5zaXRpb24gKTtcblxuXHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKCBlbGVtZW50ICk7XG5cblx0XHRcdHJldHVybiBlbGVtZW50O1xuXG5cdFx0fVxuXG5cdFx0Ly8gSXRlcmF0ZSBvdmVyIGFsbCBob3Jpem9udGFsIHNsaWRlc1xuXHRcdHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggc2xpZGVoICkge1xuXG5cdFx0XHR2YXIgYmFja2dyb3VuZFN0YWNrO1xuXG5cdFx0XHRpZiggaXNQcmludGluZ1BERigpICkge1xuXHRcdFx0XHRiYWNrZ3JvdW5kU3RhY2sgPSBfY3JlYXRlQmFja2dyb3VuZCggc2xpZGVoLCBzbGlkZWggKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRiYWNrZ3JvdW5kU3RhY2sgPSBfY3JlYXRlQmFja2dyb3VuZCggc2xpZGVoLCBkb20uYmFja2dyb3VuZCApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJdGVyYXRlIG92ZXIgYWxsIHZlcnRpY2FsIHNsaWRlc1xuXHRcdFx0dG9BcnJheSggc2xpZGVoLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIHNsaWRldiApIHtcblxuXHRcdFx0XHRpZiggaXNQcmludGluZ1BERigpICkge1xuXHRcdFx0XHRcdF9jcmVhdGVCYWNrZ3JvdW5kKCBzbGlkZXYsIHNsaWRldiApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdF9jcmVhdGVCYWNrZ3JvdW5kKCBzbGlkZXYsIGJhY2tncm91bmRTdGFjayApO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0gKTtcblxuXHRcdH0gKTtcblxuXHRcdC8vIEFkZCBwYXJhbGxheCBiYWNrZ3JvdW5kIGlmIHNwZWNpZmllZFxuXHRcdGlmKCBjb25maWcucGFyYWxsYXhCYWNrZ3JvdW5kSW1hZ2UgKSB7XG5cblx0XHRcdGRvbS5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoXCInICsgY29uZmlnLnBhcmFsbGF4QmFja2dyb3VuZEltYWdlICsgJ1wiKSc7XG5cdFx0XHRkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9IGNvbmZpZy5wYXJhbGxheEJhY2tncm91bmRTaXplO1xuXG5cdFx0XHQvLyBNYWtlIHN1cmUgdGhlIGJlbG93IHByb3BlcnRpZXMgYXJlIHNldCBvbiB0aGUgZWxlbWVudCAtIHRoZXNlIHByb3BlcnRpZXMgYXJlXG5cdFx0XHQvLyBuZWVkZWQgZm9yIHByb3BlciB0cmFuc2l0aW9ucyB0byBiZSBzZXQgb24gdGhlIGVsZW1lbnQgdmlhIENTUy4gVG8gcmVtb3ZlXG5cdFx0XHQvLyBhbm5veWluZyBiYWNrZ3JvdW5kIHNsaWRlLWluIGVmZmVjdCB3aGVuIHRoZSBwcmVzZW50YXRpb24gc3RhcnRzLCBhcHBseVxuXHRcdFx0Ly8gdGhlc2UgcHJvcGVydGllcyBhZnRlciBzaG9ydCB0aW1lIGRlbGF5XG5cdFx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ2hhcy1wYXJhbGxheC1iYWNrZ3JvdW5kJyApO1xuXHRcdFx0fSwgMSApO1xuXG5cdFx0fVxuXHRcdGVsc2Uge1xuXG5cdFx0XHRkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnJztcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoICdoYXMtcGFyYWxsYXgtYmFja2dyb3VuZCcgKTtcblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEFwcGxpZXMgdGhlIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3MgZnJvbSB0aGUgY29uZmlnXG5cdCAqIG9iamVjdC4gTWF5IGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcy5cblx0ICovXG5cdGZ1bmN0aW9uIGNvbmZpZ3VyZSggb3B0aW9ucyApIHtcblxuXHRcdHZhciBudW1iZXJPZlNsaWRlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIFNMSURFU19TRUxFQ1RPUiApLmxlbmd0aDtcblxuXHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoIGNvbmZpZy50cmFuc2l0aW9uICk7XG5cblx0XHQvLyBOZXcgY29uZmlnIG9wdGlvbnMgbWF5IGJlIHBhc3NlZCB3aGVuIHRoaXMgbWV0aG9kXG5cdFx0Ly8gaXMgaW52b2tlZCB0aHJvdWdoIHRoZSBBUEkgYWZ0ZXIgaW5pdGlhbGl6YXRpb25cblx0XHRpZiggdHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnICkgZXh0ZW5kKCBjb25maWcsIG9wdGlvbnMgKTtcblxuXHRcdC8vIEZvcmNlIGxpbmVhciB0cmFuc2l0aW9uIGJhc2VkIG9uIGJyb3dzZXIgY2FwYWJpbGl0aWVzXG5cdFx0aWYoIGZlYXR1cmVzLnRyYW5zZm9ybXMzZCA9PT0gZmFsc2UgKSBjb25maWcudHJhbnNpdGlvbiA9ICdsaW5lYXInO1xuXG5cdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggY29uZmlnLnRyYW5zaXRpb24gKTtcblxuXHRcdGRvbS53cmFwcGVyLnNldEF0dHJpYnV0ZSggJ2RhdGEtdHJhbnNpdGlvbi1zcGVlZCcsIGNvbmZpZy50cmFuc2l0aW9uU3BlZWQgKTtcblx0XHRkb20ud3JhcHBlci5zZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbicsIGNvbmZpZy5iYWNrZ3JvdW5kVHJhbnNpdGlvbiApO1xuXG5cdFx0ZG9tLmNvbnRyb2xzLnN0eWxlLmRpc3BsYXkgPSBjb25maWcuY29udHJvbHMgPyAnYmxvY2snIDogJ25vbmUnO1xuXHRcdGRvbS5wcm9ncmVzcy5zdHlsZS5kaXNwbGF5ID0gY29uZmlnLnByb2dyZXNzID8gJ2Jsb2NrJyA6ICdub25lJztcblxuXHRcdGlmKCBjb25maWcucnRsICkge1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ3J0bCcgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCAncnRsJyApO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcuY2VudGVyICkge1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ2NlbnRlcicgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCAnY2VudGVyJyApO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcubW91c2VXaGVlbCApIHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdET01Nb3VzZVNjcm9sbCcsIG9uRG9jdW1lbnRNb3VzZVNjcm9sbCwgZmFsc2UgKTsgLy8gRkZcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZXdoZWVsJywgb25Eb2N1bWVudE1vdXNlU2Nyb2xsLCBmYWxzZSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdET01Nb3VzZVNjcm9sbCcsIG9uRG9jdW1lbnRNb3VzZVNjcm9sbCwgZmFsc2UgKTsgLy8gRkZcblx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdtb3VzZXdoZWVsJywgb25Eb2N1bWVudE1vdXNlU2Nyb2xsLCBmYWxzZSApO1xuXHRcdH1cblxuXHRcdC8vIFJvbGxpbmcgM0QgbGlua3Ncblx0XHRpZiggY29uZmlnLnJvbGxpbmdMaW5rcyApIHtcblx0XHRcdGVuYWJsZVJvbGxpbmdMaW5rcygpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGRpc2FibGVSb2xsaW5nTGlua3MoKTtcblx0XHR9XG5cblx0XHQvLyBJZnJhbWUgbGluayBwcmV2aWV3c1xuXHRcdGlmKCBjb25maWcucHJldmlld0xpbmtzICkge1xuXHRcdFx0ZW5hYmxlUHJldmlld0xpbmtzKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZGlzYWJsZVByZXZpZXdMaW5rcygpO1xuXHRcdFx0ZW5hYmxlUHJldmlld0xpbmtzKCAnW2RhdGEtcHJldmlldy1saW5rXScgKTtcblx0XHR9XG5cblx0XHQvLyBBdXRvLXNsaWRlIHBsYXliYWNrIGNvbnRyb2xzXG5cdFx0aWYoIG51bWJlck9mU2xpZGVzID4gMSAmJiBjb25maWcuYXV0b1NsaWRlICYmIGNvbmZpZy5hdXRvU2xpZGVTdG9wcGFibGUgJiYgZmVhdHVyZXMuY2FudmFzICYmIGZlYXR1cmVzLnJlcXVlc3RBbmltYXRpb25GcmFtZSApIHtcblx0XHRcdGF1dG9TbGlkZVBsYXllciA9IG5ldyBQbGF5YmFjayggZG9tLndyYXBwZXIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gTWF0aC5taW4oIE1hdGgubWF4KCAoIERhdGUubm93KCkgLSBhdXRvU2xpZGVTdGFydFRpbWUgKSAvIGF1dG9TbGlkZSwgMCApLCAxICk7XG5cdFx0XHR9ICk7XG5cblx0XHRcdGF1dG9TbGlkZVBsYXllci5vbiggJ2NsaWNrJywgb25BdXRvU2xpZGVQbGF5ZXJDbGljayApO1xuXHRcdFx0YXV0b1NsaWRlUGF1c2VkID0gZmFsc2U7XG5cdFx0fVxuXHRcdGVsc2UgaWYoIGF1dG9TbGlkZVBsYXllciApIHtcblx0XHRcdGF1dG9TbGlkZVBsYXllci5kZXN0cm95KCk7XG5cdFx0XHRhdXRvU2xpZGVQbGF5ZXIgPSBudWxsO1xuXHRcdH1cblxuXHRcdC8vIExvYWQgdGhlIHRoZW1lIGluIHRoZSBjb25maWcsIGlmIGl0J3Mgbm90IGFscmVhZHkgbG9hZGVkXG5cdFx0aWYoIGNvbmZpZy50aGVtZSAmJiBkb20udGhlbWUgKSB7XG5cdFx0XHR2YXIgdGhlbWVVUkwgPSBkb20udGhlbWUuZ2V0QXR0cmlidXRlKCAnaHJlZicgKTtcblx0XHRcdHZhciB0aGVtZUZpbmRlciA9IC9bXlxcL10qPyg/PVxcLmNzcykvO1xuXHRcdFx0dmFyIHRoZW1lTmFtZSA9IHRoZW1lVVJMLm1hdGNoKHRoZW1lRmluZGVyKVswXTtcblxuXHRcdFx0aWYoICBjb25maWcudGhlbWUgIT09IHRoZW1lTmFtZSApIHtcblx0XHRcdFx0dGhlbWVVUkwgPSB0aGVtZVVSTC5yZXBsYWNlKHRoZW1lRmluZGVyLCBjb25maWcudGhlbWUpO1xuXHRcdFx0XHRkb20udGhlbWUuc2V0QXR0cmlidXRlKCAnaHJlZicsIHRoZW1lVVJMICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0c3luYygpO1xuXG5cdH1cblxuXHQvKipcblx0ICogQmluZHMgYWxsIGV2ZW50IGxpc3RlbmVycy5cblx0ICovXG5cdGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuXG5cdFx0ZXZlbnRzQXJlQm91bmQgPSB0cnVlO1xuXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdoYXNoY2hhbmdlJywgb25XaW5kb3dIYXNoQ2hhbmdlLCBmYWxzZSApO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlICk7XG5cblx0XHRpZiggY29uZmlnLnRvdWNoICkge1xuXHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQsIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUsIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSApO1xuXG5cdFx0XHQvLyBTdXBwb3J0IHBvaW50ZXItc3R5bGUgdG91Y2ggaW50ZXJhY3Rpb24gYXMgd2VsbFxuXHRcdFx0aWYoIHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCApIHtcblx0XHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ01TUG9pbnRlckRvd24nLCBvblBvaW50ZXJEb3duLCBmYWxzZSApO1xuXHRcdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAnTVNQb2ludGVyTW92ZScsIG9uUG9pbnRlck1vdmUsIGZhbHNlICk7XG5cdFx0XHRcdGRvbS53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoICdNU1BvaW50ZXJVcCcsIG9uUG9pbnRlclVwLCBmYWxzZSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKCBjb25maWcua2V5Ym9hcmQgKSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCAna2V5ZG93bicsIG9uRG9jdW1lbnRLZXlEb3duLCBmYWxzZSApO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcucHJvZ3Jlc3MgJiYgZG9tLnByb2dyZXNzICkge1xuXHRcdFx0ZG9tLnByb2dyZXNzLmFkZEV2ZW50TGlzdGVuZXIoICdjbGljaycsIG9uUHJvZ3Jlc3NDbGlja2VkLCBmYWxzZSApO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcuZm9jdXNCb2R5T25QYWdlVmlzaWJsaXR5Q2hhbmdlICkge1xuXHRcdFx0dmFyIHZpc2liaWxpdHlDaGFuZ2U7XG5cblx0XHRcdGlmKCAnaGlkZGVuJyBpbiBkb2N1bWVudCApIHtcblx0XHRcdFx0dmlzaWJpbGl0eUNoYW5nZSA9ICd2aXNpYmlsaXR5Y2hhbmdlJztcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoICdtc0hpZGRlbicgaW4gZG9jdW1lbnQgKSB7XG5cdFx0XHRcdHZpc2liaWxpdHlDaGFuZ2UgPSAnbXN2aXNpYmlsaXR5Y2hhbmdlJztcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoICd3ZWJraXRIaWRkZW4nIGluIGRvY3VtZW50ICkge1xuXHRcdFx0XHR2aXNpYmlsaXR5Q2hhbmdlID0gJ3dlYmtpdHZpc2liaWxpdHljaGFuZ2UnO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggdmlzaWJpbGl0eUNoYW5nZSApIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggdmlzaWJpbGl0eUNoYW5nZSwgb25QYWdlVmlzaWJpbGl0eUNoYW5nZSwgZmFsc2UgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRbICd0b3VjaHN0YXJ0JywgJ2NsaWNrJyBdLmZvckVhY2goIGZ1bmN0aW9uKCBldmVudE5hbWUgKSB7XG5cdFx0XHRkb20uY29udHJvbHNMZWZ0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuYWRkRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlTGVmdENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc1JpZ2h0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuYWRkRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlUmlnaHRDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNVcC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZVVwQ2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzRG93bi5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZURvd25DbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNQcmV2LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuYWRkRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlUHJldkNsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc05leHQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5hZGRFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVOZXh0Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFVuYmluZHMgYWxsIGV2ZW50IGxpc3RlbmVycy5cblx0ICovXG5cdGZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXJzKCkge1xuXG5cdFx0ZXZlbnRzQXJlQm91bmQgPSBmYWxzZTtcblxuXHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgb25Eb2N1bWVudEtleURvd24sIGZhbHNlICk7XG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdoYXNoY2hhbmdlJywgb25XaW5kb3dIYXNoQ2hhbmdlLCBmYWxzZSApO1xuXHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCAncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlICk7XG5cblx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UgKTtcblx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUsIGZhbHNlICk7XG5cdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UgKTtcblxuXHRcdGlmKCB3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgKSB7XG5cdFx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAnTVNQb2ludGVyRG93bicsIG9uUG9pbnRlckRvd24sIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAnTVNQb2ludGVyTW92ZScsIG9uUG9pbnRlck1vdmUsIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAnTVNQb2ludGVyVXAnLCBvblBvaW50ZXJVcCwgZmFsc2UgKTtcblx0XHR9XG5cblx0XHRpZiAoIGNvbmZpZy5wcm9ncmVzcyAmJiBkb20ucHJvZ3Jlc3MgKSB7XG5cdFx0XHRkb20ucHJvZ3Jlc3MucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgb25Qcm9ncmVzc0NsaWNrZWQsIGZhbHNlICk7XG5cdFx0fVxuXG5cdFx0WyAndG91Y2hzdGFydCcsICdjbGljaycgXS5mb3JFYWNoKCBmdW5jdGlvbiggZXZlbnROYW1lICkge1xuXHRcdFx0ZG9tLmNvbnRyb2xzTGVmdC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZUxlZnRDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNSaWdodC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZVJpZ2h0Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzVXAuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVVcENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc0Rvd24uZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVEb3duQ2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzUHJldi5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZVByZXZDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNOZXh0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlTmV4dENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFeHRlbmQgb2JqZWN0IGEgd2l0aCB0aGUgcHJvcGVydGllcyBvZiBvYmplY3QgYi5cblx0ICogSWYgdGhlcmUncyBhIGNvbmZsaWN0LCBvYmplY3QgYiB0YWtlcyBwcmVjZWRlbmNlLlxuXHQgKi9cblx0ZnVuY3Rpb24gZXh0ZW5kKCBhLCBiICkge1xuXG5cdFx0Zm9yKCB2YXIgaSBpbiBiICkge1xuXHRcdFx0YVsgaSBdID0gYlsgaSBdO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIHRoZSB0YXJnZXQgb2JqZWN0IHRvIGFuIGFycmF5LlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9BcnJheSggbyApIHtcblxuXHRcdHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggbyApO1xuXG5cdH1cblxuXHQvKipcblx0ICogTWVhc3VyZXMgdGhlIGRpc3RhbmNlIGluIHBpeGVscyBiZXR3ZWVuIHBvaW50IGFcblx0ICogYW5kIHBvaW50IGIuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBhIHBvaW50IHdpdGggeC95IHByb3BlcnRpZXNcblx0ICogQHBhcmFtIHtPYmplY3R9IGIgcG9pbnQgd2l0aCB4L3kgcHJvcGVydGllc1xuXHQgKi9cblx0ZnVuY3Rpb24gZGlzdGFuY2VCZXR3ZWVuKCBhLCBiICkge1xuXG5cdFx0dmFyIGR4ID0gYS54IC0gYi54LFxuXHRcdFx0ZHkgPSBhLnkgLSBiLnk7XG5cblx0XHRyZXR1cm4gTWF0aC5zcXJ0KCBkeCpkeCArIGR5KmR5ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBsaWVzIGEgQ1NTIHRyYW5zZm9ybSB0byB0aGUgdGFyZ2V0IGVsZW1lbnQuXG5cdCAqL1xuXHRmdW5jdGlvbiB0cmFuc2Zvcm1FbGVtZW50KCBlbGVtZW50LCB0cmFuc2Zvcm0gKSB7XG5cblx0XHRlbGVtZW50LnN0eWxlLldlYmtpdFRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblx0XHRlbGVtZW50LnN0eWxlLk1velRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblx0XHRlbGVtZW50LnN0eWxlLm1zVHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXHRcdGVsZW1lbnQuc3R5bGUuT1RyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblx0XHRlbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgaGVpZ2h0IG9mIHRoZSBnaXZlbiBlbGVtZW50IGJ5IGxvb2tpbmdcblx0ICogYXQgdGhlIHBvc2l0aW9uIGFuZCBoZWlnaHQgb2YgaXRzIGltbWVkaWF0ZSBjaGlsZHJlbi5cblx0ICovXG5cdGZ1bmN0aW9uIGdldEFic29sdXRlSGVpZ2h0KCBlbGVtZW50ICkge1xuXG5cdFx0dmFyIGhlaWdodCA9IDA7XG5cblx0XHRpZiggZWxlbWVudCApIHtcblx0XHRcdHZhciBhYnNvbHV0ZUNoaWxkcmVuID0gMDtcblxuXHRcdFx0dG9BcnJheSggZWxlbWVudC5jaGlsZE5vZGVzICkuZm9yRWFjaCggZnVuY3Rpb24oIGNoaWxkICkge1xuXG5cdFx0XHRcdGlmKCB0eXBlb2YgY2hpbGQub2Zmc2V0VG9wID09PSAnbnVtYmVyJyAmJiBjaGlsZC5zdHlsZSApIHtcblx0XHRcdFx0XHQvLyBDb3VudCAjIG9mIGFicyBjaGlsZHJlblxuXHRcdFx0XHRcdGlmKCBjaGlsZC5zdHlsZS5wb3NpdGlvbiA9PT0gJ2Fic29sdXRlJyApIHtcblx0XHRcdFx0XHRcdGFic29sdXRlQ2hpbGRyZW4gKz0gMTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRoZWlnaHQgPSBNYXRoLm1heCggaGVpZ2h0LCBjaGlsZC5vZmZzZXRUb3AgKyBjaGlsZC5vZmZzZXRIZWlnaHQgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIElmIHRoZXJlIGFyZSBubyBhYnNvbHV0ZSBjaGlsZHJlbiwgdXNlIG9mZnNldEhlaWdodFxuXHRcdFx0aWYoIGFic29sdXRlQ2hpbGRyZW4gPT09IDAgKSB7XG5cdFx0XHRcdGhlaWdodCA9IGVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGhlaWdodDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHJlbWFpbmluZyBoZWlnaHQgd2l0aGluIHRoZSBwYXJlbnQgb2YgdGhlXG5cdCAqIHRhcmdldCBlbGVtZW50IGFmdGVyIHN1YnRyYWN0aW5nIHRoZSBoZWlnaHQgb2YgYWxsXG5cdCAqIHNpYmxpbmdzLlxuXHQgKlxuXHQgKiByZW1haW5pbmcgaGVpZ2h0ID0gW3BhcmVudCBoZWlnaHRdIC0gWyBzaWJsaW5ncyBoZWlnaHRdXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRSZW1haW5pbmdIZWlnaHQoIGVsZW1lbnQsIGhlaWdodCApIHtcblxuXHRcdGhlaWdodCA9IGhlaWdodCB8fCAwO1xuXG5cdFx0aWYoIGVsZW1lbnQgKSB7XG5cdFx0XHR2YXIgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlO1xuXHRcdFx0dmFyIHNpYmxpbmdzID0gcGFyZW50LmNoaWxkTm9kZXM7XG5cblx0XHRcdC8vIFN1YnRyYWN0IHRoZSBoZWlnaHQgb2YgZWFjaCBzaWJsaW5nXG5cdFx0XHR0b0FycmF5KCBzaWJsaW5ncyApLmZvckVhY2goIGZ1bmN0aW9uKCBzaWJsaW5nICkge1xuXG5cdFx0XHRcdGlmKCB0eXBlb2Ygc2libGluZy5vZmZzZXRIZWlnaHQgPT09ICdudW1iZXInICYmIHNpYmxpbmcgIT09IGVsZW1lbnQgKSB7XG5cblx0XHRcdFx0XHR2YXIgc3R5bGVzID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoIHNpYmxpbmcgKSxcblx0XHRcdFx0XHRcdG1hcmdpblRvcCA9IHBhcnNlSW50KCBzdHlsZXMubWFyZ2luVG9wLCAxMCApLFxuXHRcdFx0XHRcdFx0bWFyZ2luQm90dG9tID0gcGFyc2VJbnQoIHN0eWxlcy5tYXJnaW5Cb3R0b20sIDEwICk7XG5cblx0XHRcdFx0XHRoZWlnaHQgLT0gc2libGluZy5vZmZzZXRIZWlnaHQgKyBtYXJnaW5Ub3AgKyBtYXJnaW5Cb3R0b207XG5cblx0XHRcdFx0fVxuXG5cdFx0XHR9ICk7XG5cblx0XHRcdHZhciBlbGVtZW50U3R5bGVzID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoIGVsZW1lbnQgKTtcblxuXHRcdFx0Ly8gU3VidHJhY3QgdGhlIG1hcmdpbnMgb2YgdGhlIHRhcmdldCBlbGVtZW50XG5cdFx0XHRoZWlnaHQgLT0gcGFyc2VJbnQoIGVsZW1lbnRTdHlsZXMubWFyZ2luVG9wLCAxMCApICtcblx0XHRcdFx0XHRcdHBhcnNlSW50KCBlbGVtZW50U3R5bGVzLm1hcmdpbkJvdHRvbSwgMTAgKTtcblxuXHRcdH1cblxuXHRcdHJldHVybiBoZWlnaHQ7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgaWYgdGhpcyBpbnN0YW5jZSBpcyBiZWluZyB1c2VkIHRvIHByaW50IGEgUERGLlxuXHQgKi9cblx0ZnVuY3Rpb24gaXNQcmludGluZ1BERigpIHtcblxuXHRcdHJldHVybiAoIC9wcmludC1wZGYvZ2kgKS50ZXN0KCB3aW5kb3cubG9jYXRpb24uc2VhcmNoICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIaWRlcyB0aGUgYWRkcmVzcyBiYXIgaWYgd2UncmUgb24gYSBtb2JpbGUgZGV2aWNlLlxuXHQgKi9cblx0ZnVuY3Rpb24gaGlkZUFkZHJlc3NCYXIoKSB7XG5cblx0XHRpZiggY29uZmlnLmhpZGVBZGRyZXNzQmFyICYmIGlzTW9iaWxlRGV2aWNlICkge1xuXHRcdFx0Ly8gRXZlbnRzIHRoYXQgc2hvdWxkIHRyaWdnZXIgdGhlIGFkZHJlc3MgYmFyIHRvIGhpZGVcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIHJlbW92ZUFkZHJlc3NCYXIsIGZhbHNlICk7XG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ29yaWVudGF0aW9uY2hhbmdlJywgcmVtb3ZlQWRkcmVzc0JhciwgZmFsc2UgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDYXVzZXMgdGhlIGFkZHJlc3MgYmFyIHRvIGhpZGUgb24gbW9iaWxlIGRldmljZXMsXG5cdCAqIG1vcmUgdmVydGljYWwgc3BhY2UgZnR3LlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVtb3ZlQWRkcmVzc0JhcigpIHtcblxuXHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0d2luZG93LnNjcm9sbFRvKCAwLCAxICk7XG5cdFx0fSwgMTAgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIERpc3BhdGNoZXMgYW4gZXZlbnQgb2YgdGhlIHNwZWNpZmllZCB0eXBlIGZyb20gdGhlXG5cdCAqIHJldmVhbCBET00gZWxlbWVudC5cblx0ICovXG5cdGZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoIHR5cGUsIHByb3BlcnRpZXMgKSB7XG5cblx0XHR2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCggXCJIVE1MRXZlbnRzXCIsIDEsIDIgKTtcblx0XHRldmVudC5pbml0RXZlbnQoIHR5cGUsIHRydWUsIHRydWUgKTtcblx0XHRleHRlbmQoIGV2ZW50LCBwcm9wZXJ0aWVzICk7XG5cdFx0ZG9tLndyYXBwZXIuZGlzcGF0Y2hFdmVudCggZXZlbnQgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFdyYXAgYWxsIGxpbmtzIGluIDNEIGdvb2RuZXNzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZW5hYmxlUm9sbGluZ0xpbmtzKCkge1xuXG5cdFx0aWYoIGZlYXR1cmVzLnRyYW5zZm9ybXMzZCAmJiAhKCAnbXNQZXJzcGVjdGl2ZScgaW4gZG9jdW1lbnQuYm9keS5zdHlsZSApICkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBTTElERVNfU0VMRUNUT1IgKyAnIGE6bm90KC5pbWFnZSknICk7XG5cblx0XHRcdGZvciggdmFyIGkgPSAwLCBsZW4gPSBhbmNob3JzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0XHR2YXIgYW5jaG9yID0gYW5jaG9yc1tpXTtcblxuXHRcdFx0XHRpZiggYW5jaG9yLnRleHRDb250ZW50ICYmICFhbmNob3IucXVlcnlTZWxlY3RvciggJyonICkgJiYgKCAhYW5jaG9yLmNsYXNzTmFtZSB8fCAhYW5jaG9yLmNsYXNzTGlzdC5jb250YWlucyggYW5jaG9yLCAncm9sbCcgKSApICkge1xuXHRcdFx0XHRcdHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXHRcdFx0XHRcdHNwYW4uc2V0QXR0cmlidXRlKCdkYXRhLXRpdGxlJywgYW5jaG9yLnRleHQpO1xuXHRcdFx0XHRcdHNwYW4uaW5uZXJIVE1MID0gYW5jaG9yLmlubmVySFRNTDtcblxuXHRcdFx0XHRcdGFuY2hvci5jbGFzc0xpc3QuYWRkKCAncm9sbCcgKTtcblx0XHRcdFx0XHRhbmNob3IuaW5uZXJIVE1MID0gJyc7XG5cdFx0XHRcdFx0YW5jaG9yLmFwcGVuZENoaWxkKHNwYW4pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVW53cmFwIGFsbCAzRCBsaW5rcy5cblx0ICovXG5cdGZ1bmN0aW9uIGRpc2FibGVSb2xsaW5nTGlua3MoKSB7XG5cblx0XHR2YXIgYW5jaG9ycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIFNMSURFU19TRUxFQ1RPUiArICcgYS5yb2xsJyApO1xuXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGFuY2hvcnMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHR2YXIgYW5jaG9yID0gYW5jaG9yc1tpXTtcblx0XHRcdHZhciBzcGFuID0gYW5jaG9yLnF1ZXJ5U2VsZWN0b3IoICdzcGFuJyApO1xuXG5cdFx0XHRpZiggc3BhbiApIHtcblx0XHRcdFx0YW5jaG9yLmNsYXNzTGlzdC5yZW1vdmUoICdyb2xsJyApO1xuXHRcdFx0XHRhbmNob3IuaW5uZXJIVE1MID0gc3Bhbi5pbm5lckhUTUw7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQmluZCBwcmV2aWV3IGZyYW1lIGxpbmtzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZW5hYmxlUHJldmlld0xpbmtzKCBzZWxlY3RvciApIHtcblxuXHRcdHZhciBhbmNob3JzID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggc2VsZWN0b3IgPyBzZWxlY3RvciA6ICdhJyApICk7XG5cblx0XHRhbmNob3JzLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0aWYoIC9eKGh0dHB8d3d3KS9naS50ZXN0KCBlbGVtZW50LmdldEF0dHJpYnV0ZSggJ2hyZWYnICkgKSApIHtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvblByZXZpZXdMaW5rQ2xpY2tlZCwgZmFsc2UgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVbmJpbmQgcHJldmlldyBmcmFtZSBsaW5rcy5cblx0ICovXG5cdGZ1bmN0aW9uIGRpc2FibGVQcmV2aWV3TGlua3MoKSB7XG5cblx0XHR2YXIgYW5jaG9ycyA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICdhJyApICk7XG5cblx0XHRhbmNob3JzLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0aWYoIC9eKGh0dHB8d3d3KS9naS50ZXN0KCBlbGVtZW50LmdldEF0dHJpYnV0ZSggJ2hyZWYnICkgKSApIHtcblx0XHRcdFx0ZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvblByZXZpZXdMaW5rQ2xpY2tlZCwgZmFsc2UgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBPcGVucyBhIHByZXZpZXcgd2luZG93IGZvciB0aGUgdGFyZ2V0IFVSTC5cblx0ICovXG5cdGZ1bmN0aW9uIG9wZW5QcmV2aWV3KCB1cmwgKSB7XG5cblx0XHRjbG9zZVByZXZpZXcoKTtcblxuXHRcdGRvbS5wcmV2aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHRkb20ucHJldmlldy5jbGFzc0xpc3QuYWRkKCAncHJldmlldy1saW5rLW92ZXJsYXknICk7XG5cdFx0ZG9tLndyYXBwZXIuYXBwZW5kQ2hpbGQoIGRvbS5wcmV2aWV3ICk7XG5cblx0XHRkb20ucHJldmlldy5pbm5lckhUTUwgPSBbXG5cdFx0XHQnPGhlYWRlcj4nLFxuXHRcdFx0XHQnPGEgY2xhc3M9XCJjbG9zZVwiIGhyZWY9XCIjXCI+PHNwYW4gY2xhc3M9XCJpY29uXCI+PC9zcGFuPjwvYT4nLFxuXHRcdFx0XHQnPGEgY2xhc3M9XCJleHRlcm5hbFwiIGhyZWY9XCInKyB1cmwgKydcIiB0YXJnZXQ9XCJfYmxhbmtcIj48c3BhbiBjbGFzcz1cImljb25cIj48L3NwYW4+PC9hPicsXG5cdFx0XHQnPC9oZWFkZXI+Jyxcblx0XHRcdCc8ZGl2IGNsYXNzPVwic3Bpbm5lclwiPjwvZGl2PicsXG5cdFx0XHQnPGRpdiBjbGFzcz1cInZpZXdwb3J0XCI+Jyxcblx0XHRcdFx0JzxpZnJhbWUgc3JjPVwiJysgdXJsICsnXCI+PC9pZnJhbWU+Jyxcblx0XHRcdCc8L2Rpdj4nXG5cdFx0XS5qb2luKCcnKTtcblxuXHRcdGRvbS5wcmV2aWV3LnF1ZXJ5U2VsZWN0b3IoICdpZnJhbWUnICkuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRkb20ucHJldmlldy5jbGFzc0xpc3QuYWRkKCAnbG9hZGVkJyApO1xuXHRcdH0sIGZhbHNlICk7XG5cblx0XHRkb20ucHJldmlldy5xdWVyeVNlbGVjdG9yKCAnLmNsb3NlJyApLmFkZEV2ZW50TGlzdGVuZXIoICdjbGljaycsIGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdGNsb3NlUHJldmlldygpO1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9LCBmYWxzZSApO1xuXG5cdFx0ZG9tLnByZXZpZXcucXVlcnlTZWxlY3RvciggJy5leHRlcm5hbCcgKS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRjbG9zZVByZXZpZXcoKTtcblx0XHR9LCBmYWxzZSApO1xuXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRkb20ucHJldmlldy5jbGFzc0xpc3QuYWRkKCAndmlzaWJsZScgKTtcblx0XHR9LCAxICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDbG9zZXMgdGhlIGlmcmFtZSBwcmV2aWV3IHdpbmRvdy5cblx0ICovXG5cdGZ1bmN0aW9uIGNsb3NlUHJldmlldygpIHtcblxuXHRcdGlmKCBkb20ucHJldmlldyApIHtcblx0XHRcdGRvbS5wcmV2aWV3LnNldEF0dHJpYnV0ZSggJ3NyYycsICcnICk7XG5cdFx0XHRkb20ucHJldmlldy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKCBkb20ucHJldmlldyApO1xuXHRcdFx0ZG9tLnByZXZpZXcgPSBudWxsO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEFwcGxpZXMgSmF2YVNjcmlwdC1jb250cm9sbGVkIGxheW91dCBydWxlcyB0byB0aGVcblx0ICogcHJlc2VudGF0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gbGF5b3V0KCkge1xuXG5cdFx0aWYoIGRvbS53cmFwcGVyICYmICFpc1ByaW50aW5nUERGKCkgKSB7XG5cblx0XHRcdC8vIEF2YWlsYWJsZSBzcGFjZSB0byBzY2FsZSB3aXRoaW5cblx0XHRcdHZhciBhdmFpbGFibGVXaWR0aCA9IGRvbS53cmFwcGVyLm9mZnNldFdpZHRoLFxuXHRcdFx0XHRhdmFpbGFibGVIZWlnaHQgPSBkb20ud3JhcHBlci5vZmZzZXRIZWlnaHQ7XG5cblx0XHRcdC8vIFJlZHVjZSBhdmFpbGFibGUgc3BhY2UgYnkgbWFyZ2luXG5cdFx0XHRhdmFpbGFibGVXaWR0aCAtPSAoIGF2YWlsYWJsZUhlaWdodCAqIGNvbmZpZy5tYXJnaW4gKTtcblx0XHRcdGF2YWlsYWJsZUhlaWdodCAtPSAoIGF2YWlsYWJsZUhlaWdodCAqIGNvbmZpZy5tYXJnaW4gKTtcblxuXHRcdFx0Ly8gRGltZW5zaW9ucyBvZiB0aGUgY29udGVudFxuXHRcdFx0dmFyIHNsaWRlV2lkdGggPSBjb25maWcud2lkdGgsXG5cdFx0XHRcdHNsaWRlSGVpZ2h0ID0gY29uZmlnLmhlaWdodCxcblx0XHRcdFx0c2xpZGVQYWRkaW5nID0gMjA7IC8vIFRPRE8gRGlnIHRoaXMgb3V0IG9mIERPTVxuXG5cdFx0XHQvLyBMYXlvdXQgdGhlIGNvbnRlbnRzIG9mIHRoZSBzbGlkZXNcblx0XHRcdGxheW91dFNsaWRlQ29udGVudHMoIGNvbmZpZy53aWR0aCwgY29uZmlnLmhlaWdodCwgc2xpZGVQYWRkaW5nICk7XG5cblx0XHRcdC8vIFNsaWRlIHdpZHRoIG1heSBiZSBhIHBlcmNlbnRhZ2Ugb2YgYXZhaWxhYmxlIHdpZHRoXG5cdFx0XHRpZiggdHlwZW9mIHNsaWRlV2lkdGggPT09ICdzdHJpbmcnICYmIC8lJC8udGVzdCggc2xpZGVXaWR0aCApICkge1xuXHRcdFx0XHRzbGlkZVdpZHRoID0gcGFyc2VJbnQoIHNsaWRlV2lkdGgsIDEwICkgLyAxMDAgKiBhdmFpbGFibGVXaWR0aDtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU2xpZGUgaGVpZ2h0IG1heSBiZSBhIHBlcmNlbnRhZ2Ugb2YgYXZhaWxhYmxlIGhlaWdodFxuXHRcdFx0aWYoIHR5cGVvZiBzbGlkZUhlaWdodCA9PT0gJ3N0cmluZycgJiYgLyUkLy50ZXN0KCBzbGlkZUhlaWdodCApICkge1xuXHRcdFx0XHRzbGlkZUhlaWdodCA9IHBhcnNlSW50KCBzbGlkZUhlaWdodCwgMTAgKSAvIDEwMCAqIGF2YWlsYWJsZUhlaWdodDtcblx0XHRcdH1cblxuXHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS53aWR0aCA9IHNsaWRlV2lkdGggKyAncHgnO1xuXHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS5oZWlnaHQgPSBzbGlkZUhlaWdodCArICdweCc7XG5cblx0XHRcdC8vIERldGVybWluZSBzY2FsZSBvZiBjb250ZW50IHRvIGZpdCB3aXRoaW4gYXZhaWxhYmxlIHNwYWNlXG5cdFx0XHRzY2FsZSA9IE1hdGgubWluKCBhdmFpbGFibGVXaWR0aCAvIHNsaWRlV2lkdGgsIGF2YWlsYWJsZUhlaWdodCAvIHNsaWRlSGVpZ2h0ICk7XG5cblx0XHRcdC8vIFJlc3BlY3QgbWF4L21pbiBzY2FsZSBzZXR0aW5nc1xuXHRcdFx0c2NhbGUgPSBNYXRoLm1heCggc2NhbGUsIGNvbmZpZy5taW5TY2FsZSApO1xuXHRcdFx0c2NhbGUgPSBNYXRoLm1pbiggc2NhbGUsIGNvbmZpZy5tYXhTY2FsZSApO1xuXG5cdFx0XHQvLyBQcmVmZXIgYXBwbHlpbmcgc2NhbGUgdmlhIHpvb20gc2luY2UgQ2hyb21lIGJsdXJzIHNjYWxlZCBjb250ZW50XG5cdFx0XHQvLyB3aXRoIG5lc3RlZCB0cmFuc2Zvcm1zXG5cdFx0XHRpZiggdHlwZW9mIGRvbS5zbGlkZXMuc3R5bGUuem9vbSAhPT0gJ3VuZGVmaW5lZCcgJiYgIW5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goIC8oaXBob25lfGlwb2R8aXBhZHxhbmRyb2lkKS9naSApICkge1xuXHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLnpvb20gPSBzY2FsZTtcblx0XHRcdH1cblx0XHRcdC8vIEFwcGx5IHNjYWxlIHRyYW5zZm9ybSBhcyBhIGZhbGxiYWNrXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dHJhbnNmb3JtRWxlbWVudCggZG9tLnNsaWRlcywgJ3RyYW5zbGF0ZSgtNTAlLCAtNTAlKSBzY2FsZSgnKyBzY2FsZSArJykgdHJhbnNsYXRlKDUwJSwgNTAlKScgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU2VsZWN0IGFsbCBzbGlkZXMsIHZlcnRpY2FsIGFuZCBob3Jpem9udGFsXG5cdFx0XHR2YXIgc2xpZGVzID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICkgKTtcblxuXHRcdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IHNsaWRlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdFx0dmFyIHNsaWRlID0gc2xpZGVzWyBpIF07XG5cblx0XHRcdFx0Ly8gRG9uJ3QgYm90aGVyIHVwZGF0aW5nIGludmlzaWJsZSBzbGlkZXNcblx0XHRcdFx0aWYoIHNsaWRlLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJyApIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCBjb25maWcuY2VudGVyIHx8IHNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ2NlbnRlcicgKSApIHtcblx0XHRcdFx0XHQvLyBWZXJ0aWNhbCBzdGFja3MgYXJlIG5vdCBjZW50cmVkIHNpbmNlIHRoZWlyIHNlY3Rpb25cblx0XHRcdFx0XHQvLyBjaGlsZHJlbiB3aWxsIGJlXG5cdFx0XHRcdFx0aWYoIHNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ3N0YWNrJyApICkge1xuXHRcdFx0XHRcdFx0c2xpZGUuc3R5bGUudG9wID0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRzbGlkZS5zdHlsZS50b3AgPSBNYXRoLm1heCggLSAoIGdldEFic29sdXRlSGVpZ2h0KCBzbGlkZSApIC8gMiApIC0gc2xpZGVQYWRkaW5nLCAtc2xpZGVIZWlnaHQgLyAyICkgKyAncHgnO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRzbGlkZS5zdHlsZS50b3AgPSAnJztcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdHVwZGF0ZVByb2dyZXNzKCk7XG5cdFx0XHR1cGRhdGVQYXJhbGxheCgpO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQXBwbGllcyBsYXlvdXQgbG9naWMgdG8gdGhlIGNvbnRlbnRzIG9mIGFsbCBzbGlkZXMgaW5cblx0ICogdGhlIHByZXNlbnRhdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGxheW91dFNsaWRlQ29udGVudHMoIHdpZHRoLCBoZWlnaHQsIHBhZGRpbmcgKSB7XG5cblx0XHQvLyBIYW5kbGUgc2l6aW5nIG9mIGVsZW1lbnRzIHdpdGggdGhlICdzdHJldGNoJyBjbGFzc1xuXHRcdHRvQXJyYXkoIGRvbS5zbGlkZXMucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24gPiAuc3RyZXRjaCcgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXG5cdFx0XHQvLyBEZXRlcm1pbmUgaG93IG11Y2ggdmVydGljYWwgc3BhY2Ugd2UgY2FuIHVzZVxuXHRcdFx0dmFyIHJlbWFpbmluZ0hlaWdodCA9IGdldFJlbWFpbmluZ0hlaWdodCggZWxlbWVudCwgKCBoZWlnaHQgLSAoIHBhZGRpbmcgKiAyICkgKSApO1xuXG5cdFx0XHQvLyBDb25zaWRlciB0aGUgYXNwZWN0IHJhdGlvIG9mIG1lZGlhIGVsZW1lbnRzXG5cdFx0XHRpZiggLyhpbWd8dmlkZW8pL2dpLnRlc3QoIGVsZW1lbnQubm9kZU5hbWUgKSApIHtcblx0XHRcdFx0dmFyIG53ID0gZWxlbWVudC5uYXR1cmFsV2lkdGggfHwgZWxlbWVudC52aWRlb1dpZHRoLFxuXHRcdFx0XHRcdG5oID0gZWxlbWVudC5uYXR1cmFsSGVpZ2h0IHx8IGVsZW1lbnQudmlkZW9IZWlnaHQ7XG5cblx0XHRcdFx0dmFyIGVzID0gTWF0aC5taW4oIHdpZHRoIC8gbncsIHJlbWFpbmluZ0hlaWdodCAvIG5oICk7XG5cblx0XHRcdFx0ZWxlbWVudC5zdHlsZS53aWR0aCA9ICggbncgKiBlcyApICsgJ3B4Jztcblx0XHRcdFx0ZWxlbWVudC5zdHlsZS5oZWlnaHQgPSAoIG5oICogZXMgKSArICdweCc7XG5cblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRlbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuXHRcdFx0XHRlbGVtZW50LnN0eWxlLmhlaWdodCA9IHJlbWFpbmluZ0hlaWdodCArICdweCc7XG5cdFx0XHR9XG5cblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTdG9yZXMgdGhlIHZlcnRpY2FsIGluZGV4IG9mIGEgc3RhY2sgc28gdGhhdCB0aGUgc2FtZVxuXHQgKiB2ZXJ0aWNhbCBzbGlkZSBjYW4gYmUgc2VsZWN0ZWQgd2hlbiBuYXZpZ2F0aW5nIHRvIGFuZFxuXHQgKiBmcm9tIHRoZSBzdGFjay5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gc3RhY2sgVGhlIHZlcnRpY2FsIHN0YWNrIGVsZW1lbnRcblx0ICogQHBhcmFtIHtpbnR9IHYgSW5kZXggdG8gbWVtb3JpemVcblx0ICovXG5cdGZ1bmN0aW9uIHNldFByZXZpb3VzVmVydGljYWxJbmRleCggc3RhY2ssIHYgKSB7XG5cblx0XHRpZiggdHlwZW9mIHN0YWNrID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygc3RhY2suc2V0QXR0cmlidXRlID09PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0c3RhY2suc2V0QXR0cmlidXRlKCAnZGF0YS1wcmV2aW91cy1pbmRleHYnLCB2IHx8IDAgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIHZlcnRpY2FsIGluZGV4IHdoaWNoIHdhcyBzdG9yZWQgdXNpbmdcblx0ICogI3NldFByZXZpb3VzVmVydGljYWxJbmRleCgpIG9yIDAgaWYgbm8gcHJldmlvdXMgaW5kZXhcblx0ICogZXhpc3RzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBzdGFjayBUaGUgdmVydGljYWwgc3RhY2sgZWxlbWVudFxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0UHJldmlvdXNWZXJ0aWNhbEluZGV4KCBzdGFjayApIHtcblxuXHRcdGlmKCB0eXBlb2Ygc3RhY2sgPT09ICdvYmplY3QnICYmIHR5cGVvZiBzdGFjay5zZXRBdHRyaWJ1dGUgPT09ICdmdW5jdGlvbicgJiYgc3RhY2suY2xhc3NMaXN0LmNvbnRhaW5zKCAnc3RhY2snICkgKSB7XG5cdFx0XHQvLyBQcmVmZXIgbWFudWFsbHkgZGVmaW5lZCBzdGFydC1pbmRleHZcblx0XHRcdHZhciBhdHRyaWJ1dGVOYW1lID0gc3RhY2suaGFzQXR0cmlidXRlKCAnZGF0YS1zdGFydC1pbmRleHYnICkgPyAnZGF0YS1zdGFydC1pbmRleHYnIDogJ2RhdGEtcHJldmlvdXMtaW5kZXh2JztcblxuXHRcdFx0cmV0dXJuIHBhcnNlSW50KCBzdGFjay5nZXRBdHRyaWJ1dGUoIGF0dHJpYnV0ZU5hbWUgKSB8fCAwLCAxMCApO1xuXHRcdH1cblxuXHRcdHJldHVybiAwO1xuXG5cdH1cblxuXHQvKipcblx0ICogRGlzcGxheXMgdGhlIG92ZXJ2aWV3IG9mIHNsaWRlcyAocXVpY2sgbmF2KSBieVxuXHQgKiBzY2FsaW5nIGRvd24gYW5kIGFycmFuZ2luZyBhbGwgc2xpZGUgZWxlbWVudHMuXG5cdCAqXG5cdCAqIEV4cGVyaW1lbnRhbCBmZWF0dXJlLCBtaWdodCBiZSBkcm9wcGVkIGlmIHBlcmZcblx0ICogY2FuJ3QgYmUgaW1wcm92ZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBhY3RpdmF0ZU92ZXJ2aWV3KCkge1xuXG5cdFx0Ly8gT25seSBwcm9jZWVkIGlmIGVuYWJsZWQgaW4gY29uZmlnXG5cdFx0aWYoIGNvbmZpZy5vdmVydmlldyApIHtcblxuXHRcdFx0Ly8gRG9uJ3QgYXV0by1zbGlkZSB3aGlsZSBpbiBvdmVydmlldyBtb2RlXG5cdFx0XHRjYW5jZWxBdXRvU2xpZGUoKTtcblxuXHRcdFx0dmFyIHdhc0FjdGl2ZSA9IGRvbS53cmFwcGVyLmNsYXNzTGlzdC5jb250YWlucyggJ292ZXJ2aWV3JyApO1xuXG5cdFx0XHQvLyBWYXJ5IHRoZSBkZXB0aCBvZiB0aGUgb3ZlcnZpZXcgYmFzZWQgb24gc2NyZWVuIHNpemVcblx0XHRcdHZhciBkZXB0aCA9IHdpbmRvdy5pbm5lcldpZHRoIDwgNDAwID8gMTAwMCA6IDI1MDA7XG5cblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoICdvdmVydmlldycgKTtcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoICdvdmVydmlldy1kZWFjdGl2YXRpbmcnICk7XG5cblx0XHRcdGNsZWFyVGltZW91dCggYWN0aXZhdGVPdmVydmlld1RpbWVvdXQgKTtcblx0XHRcdGNsZWFyVGltZW91dCggZGVhY3RpdmF0ZU92ZXJ2aWV3VGltZW91dCApO1xuXG5cdFx0XHQvLyBOb3QgdGhlIHByZXR0aWVzIHNvbHV0aW9uLCBidXQgbmVlZCB0byBsZXQgdGhlIG92ZXJ2aWV3XG5cdFx0XHQvLyBjbGFzcyBhcHBseSBmaXJzdCBzbyB0aGF0IHNsaWRlcyBhcmUgbWVhc3VyZWQgYWNjdXJhdGVseVxuXHRcdFx0Ly8gYmVmb3JlIHdlIGNhbiBwb3NpdGlvbiB0aGVtXG5cdFx0XHRhY3RpdmF0ZU92ZXJ2aWV3VGltZW91dCA9IHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKTtcblxuXHRcdFx0XHRmb3IoIHZhciBpID0gMCwgbGVuMSA9IGhvcml6b250YWxTbGlkZXMubGVuZ3RoOyBpIDwgbGVuMTsgaSsrICkge1xuXHRcdFx0XHRcdHZhciBoc2xpZGUgPSBob3Jpem9udGFsU2xpZGVzW2ldLFxuXHRcdFx0XHRcdFx0aG9mZnNldCA9IGNvbmZpZy5ydGwgPyAtMTA1IDogMTA1O1xuXG5cdFx0XHRcdFx0aHNsaWRlLnNldEF0dHJpYnV0ZSggJ2RhdGEtaW5kZXgtaCcsIGkgKTtcblxuXHRcdFx0XHRcdC8vIEFwcGx5IENTUyB0cmFuc2Zvcm1cblx0XHRcdFx0XHR0cmFuc2Zvcm1FbGVtZW50KCBoc2xpZGUsICd0cmFuc2xhdGVaKC0nKyBkZXB0aCArJ3B4KSB0cmFuc2xhdGUoJyArICggKCBpIC0gaW5kZXhoICkgKiBob2Zmc2V0ICkgKyAnJSwgMCUpJyApO1xuXG5cdFx0XHRcdFx0aWYoIGhzbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoICdzdGFjaycgKSApIHtcblxuXHRcdFx0XHRcdFx0dmFyIHZlcnRpY2FsU2xpZGVzID0gaHNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApO1xuXG5cdFx0XHRcdFx0XHRmb3IoIHZhciBqID0gMCwgbGVuMiA9IHZlcnRpY2FsU2xpZGVzLmxlbmd0aDsgaiA8IGxlbjI7IGorKyApIHtcblx0XHRcdFx0XHRcdFx0dmFyIHZlcnRpY2FsSW5kZXggPSBpID09PSBpbmRleGggPyBpbmRleHYgOiBnZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIGhzbGlkZSApO1xuXG5cdFx0XHRcdFx0XHRcdHZhciB2c2xpZGUgPSB2ZXJ0aWNhbFNsaWRlc1tqXTtcblxuXHRcdFx0XHRcdFx0XHR2c2xpZGUuc2V0QXR0cmlidXRlKCAnZGF0YS1pbmRleC1oJywgaSApO1xuXHRcdFx0XHRcdFx0XHR2c2xpZGUuc2V0QXR0cmlidXRlKCAnZGF0YS1pbmRleC12JywgaiApO1xuXG5cdFx0XHRcdFx0XHRcdC8vIEFwcGx5IENTUyB0cmFuc2Zvcm1cblx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtRWxlbWVudCggdnNsaWRlLCAndHJhbnNsYXRlKDAlLCAnICsgKCAoIGogLSB2ZXJ0aWNhbEluZGV4ICkgKiAxMDUgKSArICclKScgKTtcblxuXHRcdFx0XHRcdFx0XHQvLyBOYXZpZ2F0ZSB0byB0aGlzIHNsaWRlIG9uIGNsaWNrXG5cdFx0XHRcdFx0XHRcdHZzbGlkZS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvbk92ZXJ2aWV3U2xpZGVDbGlja2VkLCB0cnVlICk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cblx0XHRcdFx0XHRcdC8vIE5hdmlnYXRlIHRvIHRoaXMgc2xpZGUgb24gY2xpY2tcblx0XHRcdFx0XHRcdGhzbGlkZS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvbk92ZXJ2aWV3U2xpZGVDbGlja2VkLCB0cnVlICk7XG5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR1cGRhdGVTbGlkZXNWaXNpYmlsaXR5KCk7XG5cblx0XHRcdFx0bGF5b3V0KCk7XG5cblx0XHRcdFx0aWYoICF3YXNBY3RpdmUgKSB7XG5cdFx0XHRcdFx0Ly8gTm90aWZ5IG9ic2VydmVycyBvZiB0aGUgb3ZlcnZpZXcgc2hvd2luZ1xuXHRcdFx0XHRcdGRpc3BhdGNoRXZlbnQoICdvdmVydmlld3Nob3duJywge1xuXHRcdFx0XHRcdFx0J2luZGV4aCc6IGluZGV4aCxcblx0XHRcdFx0XHRcdCdpbmRleHYnOiBpbmRleHYsXG5cdFx0XHRcdFx0XHQnY3VycmVudFNsaWRlJzogY3VycmVudFNsaWRlXG5cdFx0XHRcdFx0fSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0sIDEwICk7XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFeGl0cyB0aGUgc2xpZGUgb3ZlcnZpZXcgYW5kIGVudGVycyB0aGUgY3VycmVudGx5XG5cdCAqIGFjdGl2ZSBzbGlkZS5cblx0ICovXG5cdGZ1bmN0aW9uIGRlYWN0aXZhdGVPdmVydmlldygpIHtcblxuXHRcdC8vIE9ubHkgcHJvY2VlZCBpZiBlbmFibGVkIGluIGNvbmZpZ1xuXHRcdGlmKCBjb25maWcub3ZlcnZpZXcgKSB7XG5cblx0XHRcdGNsZWFyVGltZW91dCggYWN0aXZhdGVPdmVydmlld1RpbWVvdXQgKTtcblx0XHRcdGNsZWFyVGltZW91dCggZGVhY3RpdmF0ZU92ZXJ2aWV3VGltZW91dCApO1xuXG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCAnb3ZlcnZpZXcnICk7XG5cblx0XHRcdC8vIFRlbXBvcmFyaWx5IGFkZCBhIGNsYXNzIHNvIHRoYXQgdHJhbnNpdGlvbnMgY2FuIGRvIGRpZmZlcmVudCB0aGluZ3Ncblx0XHRcdC8vIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZXkgYXJlIGV4aXRpbmcvZW50ZXJpbmcgb3ZlcnZpZXcsIG9yIGp1c3Rcblx0XHRcdC8vIG1vdmluZyBmcm9tIHNsaWRlIHRvIHNsaWRlXG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QuYWRkKCAnb3ZlcnZpZXctZGVhY3RpdmF0aW5nJyApO1xuXG5cdFx0XHRkZWFjdGl2YXRlT3ZlcnZpZXdUaW1lb3V0ID0gc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCAnb3ZlcnZpZXctZGVhY3RpdmF0aW5nJyApO1xuXHRcdFx0fSwgMSApO1xuXG5cdFx0XHQvLyBTZWxlY3QgYWxsIHNsaWRlc1xuXHRcdFx0dG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggc2xpZGUgKSB7XG5cdFx0XHRcdC8vIFJlc2V0cyBhbGwgdHJhbnNmb3JtcyB0byB1c2UgdGhlIGV4dGVybmFsIHN0eWxlc1xuXHRcdFx0XHR0cmFuc2Zvcm1FbGVtZW50KCBzbGlkZSwgJycgKTtcblxuXHRcdFx0XHRzbGlkZS5yZW1vdmVFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvbk92ZXJ2aWV3U2xpZGVDbGlja2VkLCB0cnVlICk7XG5cdFx0XHR9ICk7XG5cblx0XHRcdHNsaWRlKCBpbmRleGgsIGluZGV4diApO1xuXG5cdFx0XHRjdWVBdXRvU2xpZGUoKTtcblxuXHRcdFx0Ly8gTm90aWZ5IG9ic2VydmVycyBvZiB0aGUgb3ZlcnZpZXcgaGlkaW5nXG5cdFx0XHRkaXNwYXRjaEV2ZW50KCAnb3ZlcnZpZXdoaWRkZW4nLCB7XG5cdFx0XHRcdCdpbmRleGgnOiBpbmRleGgsXG5cdFx0XHRcdCdpbmRleHYnOiBpbmRleHYsXG5cdFx0XHRcdCdjdXJyZW50U2xpZGUnOiBjdXJyZW50U2xpZGVcblx0XHRcdH0gKTtcblxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBUb2dnbGVzIHRoZSBzbGlkZSBvdmVydmlldyBtb2RlIG9uIGFuZCBvZmYuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gb3ZlcnJpZGUgT3B0aW9uYWwgZmxhZyB3aGljaCBvdmVycmlkZXMgdGhlXG5cdCAqIHRvZ2dsZSBsb2dpYyBhbmQgZm9yY2libHkgc2V0cyB0aGUgZGVzaXJlZCBzdGF0ZS4gVHJ1ZSBtZWFuc1xuXHQgKiBvdmVydmlldyBpcyBvcGVuLCBmYWxzZSBtZWFucyBpdCdzIGNsb3NlZC5cblx0ICovXG5cdGZ1bmN0aW9uIHRvZ2dsZU92ZXJ2aWV3KCBvdmVycmlkZSApIHtcblxuXHRcdGlmKCB0eXBlb2Ygb3ZlcnJpZGUgPT09ICdib29sZWFuJyApIHtcblx0XHRcdG92ZXJyaWRlID8gYWN0aXZhdGVPdmVydmlldygpIDogZGVhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aXNPdmVydmlldygpID8gZGVhY3RpdmF0ZU92ZXJ2aWV3KCkgOiBhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIHRoZSBvdmVydmlldyBpcyBjdXJyZW50bHkgYWN0aXZlLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIHRoZSBvdmVydmlldyBpcyBhY3RpdmUsXG5cdCAqIGZhbHNlIG90aGVyd2lzZVxuXHQgKi9cblx0ZnVuY3Rpb24gaXNPdmVydmlldygpIHtcblxuXHRcdHJldHVybiBkb20ud3JhcHBlci5jbGFzc0xpc3QuY29udGFpbnMoICdvdmVydmlldycgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiB0aGUgY3VycmVudCBvciBzcGVjaWZpZWQgc2xpZGUgaXMgdmVydGljYWxcblx0ICogKG5lc3RlZCB3aXRoaW4gYW5vdGhlciBzbGlkZSkuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHNsaWRlIFtvcHRpb25hbF0gVGhlIHNsaWRlIHRvIGNoZWNrXG5cdCAqIG9yaWVudGF0aW9uIG9mXG5cdCAqL1xuXHRmdW5jdGlvbiBpc1ZlcnRpY2FsU2xpZGUoIHNsaWRlICkge1xuXG5cdFx0Ly8gUHJlZmVyIHNsaWRlIGFyZ3VtZW50LCBvdGhlcndpc2UgdXNlIGN1cnJlbnQgc2xpZGVcblx0XHRzbGlkZSA9IHNsaWRlID8gc2xpZGUgOiBjdXJyZW50U2xpZGU7XG5cblx0XHRyZXR1cm4gc2xpZGUgJiYgc2xpZGUucGFyZW50Tm9kZSAmJiAhIXNsaWRlLnBhcmVudE5vZGUubm9kZU5hbWUubWF0Y2goIC9zZWN0aW9uL2kgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsaW5nIHRoZSBmdWxsc2NyZWVuIGZ1bmN0aW9uYWxpdHkgdmlhIHRoZSBmdWxsc2NyZWVuIEFQSVxuXHQgKlxuXHQgKiBAc2VlIGh0dHA6Ly9mdWxsc2NyZWVuLnNwZWMud2hhdHdnLm9yZy9cblx0ICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0RPTS9Vc2luZ19mdWxsc2NyZWVuX21vZGVcblx0ICovXG5cdGZ1bmN0aW9uIGVudGVyRnVsbHNjcmVlbigpIHtcblxuXHRcdHZhciBlbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcblxuXHRcdC8vIENoZWNrIHdoaWNoIGltcGxlbWVudGF0aW9uIGlzIGF2YWlsYWJsZVxuXHRcdHZhciByZXF1ZXN0TWV0aG9kID0gZWxlbWVudC5yZXF1ZXN0RnVsbFNjcmVlbiB8fFxuXHRcdFx0XHRcdFx0XHRlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuIHx8XG5cdFx0XHRcdFx0XHRcdGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4gfHxcblx0XHRcdFx0XHRcdFx0ZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbiB8fFxuXHRcdFx0XHRcdFx0XHRlbGVtZW50Lm1zUmVxdWVzdEZ1bGxTY3JlZW47XG5cblx0XHRpZiggcmVxdWVzdE1ldGhvZCApIHtcblx0XHRcdHJlcXVlc3RNZXRob2QuYXBwbHkoIGVsZW1lbnQgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFbnRlcnMgdGhlIHBhdXNlZCBtb2RlIHdoaWNoIGZhZGVzIGV2ZXJ5dGhpbmcgb24gc2NyZWVuIHRvXG5cdCAqIGJsYWNrLlxuXHQgKi9cblx0ZnVuY3Rpb24gcGF1c2UoKSB7XG5cblx0XHR2YXIgd2FzUGF1c2VkID0gZG9tLndyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCAncGF1c2VkJyApO1xuXG5cdFx0Y2FuY2VsQXV0b1NsaWRlKCk7XG5cdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ3BhdXNlZCcgKTtcblxuXHRcdGlmKCB3YXNQYXVzZWQgPT09IGZhbHNlICkge1xuXHRcdFx0ZGlzcGF0Y2hFdmVudCggJ3BhdXNlZCcgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFeGl0cyBmcm9tIHRoZSBwYXVzZWQgbW9kZS5cblx0ICovXG5cdGZ1bmN0aW9uIHJlc3VtZSgpIHtcblxuXHRcdHZhciB3YXNQYXVzZWQgPSBkb20ud3JhcHBlci5jbGFzc0xpc3QuY29udGFpbnMoICdwYXVzZWQnICk7XG5cdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ3BhdXNlZCcgKTtcblxuXHRcdGN1ZUF1dG9TbGlkZSgpO1xuXG5cdFx0aWYoIHdhc1BhdXNlZCApIHtcblx0XHRcdGRpc3BhdGNoRXZlbnQoICdyZXN1bWVkJyApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFRvZ2dsZXMgdGhlIHBhdXNlZCBtb2RlIG9uIGFuZCBvZmYuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b2dnbGVQYXVzZSgpIHtcblxuXHRcdGlmKCBpc1BhdXNlZCgpICkge1xuXHRcdFx0cmVzdW1lKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cGF1c2UoKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgaWYgd2UgYXJlIGN1cnJlbnRseSBpbiB0aGUgcGF1c2VkIG1vZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiBpc1BhdXNlZCgpIHtcblxuXHRcdHJldHVybiBkb20ud3JhcHBlci5jbGFzc0xpc3QuY29udGFpbnMoICdwYXVzZWQnICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTdGVwcyBmcm9tIHRoZSBjdXJyZW50IHBvaW50IGluIHRoZSBwcmVzZW50YXRpb24gdG8gdGhlXG5cdCAqIHNsaWRlIHdoaWNoIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbFxuXHQgKiBpbmRpY2VzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge2ludH0gaCBIb3Jpem9udGFsIGluZGV4IG9mIHRoZSB0YXJnZXQgc2xpZGVcblx0ICogQHBhcmFtIHtpbnR9IHYgVmVydGljYWwgaW5kZXggb2YgdGhlIHRhcmdldCBzbGlkZVxuXHQgKiBAcGFyYW0ge2ludH0gZiBPcHRpb25hbCBpbmRleCBvZiBhIGZyYWdtZW50IHdpdGhpbiB0aGVcblx0ICogdGFyZ2V0IHNsaWRlIHRvIGFjdGl2YXRlXG5cdCAqIEBwYXJhbSB7aW50fSBvIE9wdGlvbmFsIG9yaWdpbiBmb3IgdXNlIGluIG11bHRpbWFzdGVyIGVudmlyb25tZW50c1xuXHQgKi9cblx0ZnVuY3Rpb24gc2xpZGUoIGgsIHYsIGYsIG8gKSB7XG5cblx0XHQvLyBSZW1lbWJlciB3aGVyZSB3ZSB3ZXJlIGF0IGJlZm9yZVxuXHRcdHByZXZpb3VzU2xpZGUgPSBjdXJyZW50U2xpZGU7XG5cblx0XHQvLyBRdWVyeSBhbGwgaG9yaXpvbnRhbCBzbGlkZXMgaW4gdGhlIGRlY2tcblx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICk7XG5cblx0XHQvLyBJZiBubyB2ZXJ0aWNhbCBpbmRleCBpcyBzcGVjaWZpZWQgYW5kIHRoZSB1cGNvbWluZyBzbGlkZSBpcyBhXG5cdFx0Ly8gc3RhY2ssIHJlc3VtZSBhdCBpdHMgcHJldmlvdXMgdmVydGljYWwgaW5kZXhcblx0XHRpZiggdiA9PT0gdW5kZWZpbmVkICkge1xuXHRcdFx0diA9IGdldFByZXZpb3VzVmVydGljYWxJbmRleCggaG9yaXpvbnRhbFNsaWRlc1sgaCBdICk7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgd2Ugd2VyZSBvbiBhIHZlcnRpY2FsIHN0YWNrLCByZW1lbWJlciB3aGF0IHZlcnRpY2FsIGluZGV4XG5cdFx0Ly8gaXQgd2FzIG9uIHNvIHdlIGNhbiByZXN1bWUgYXQgdGhlIHNhbWUgcG9zaXRpb24gd2hlbiByZXR1cm5pbmdcblx0XHRpZiggcHJldmlvdXNTbGlkZSAmJiBwcmV2aW91c1NsaWRlLnBhcmVudE5vZGUgJiYgcHJldmlvdXNTbGlkZS5wYXJlbnROb2RlLmNsYXNzTGlzdC5jb250YWlucyggJ3N0YWNrJyApICkge1xuXHRcdFx0c2V0UHJldmlvdXNWZXJ0aWNhbEluZGV4KCBwcmV2aW91c1NsaWRlLnBhcmVudE5vZGUsIGluZGV4diApO1xuXHRcdH1cblxuXHRcdC8vIFJlbWVtYmVyIHRoZSBzdGF0ZSBiZWZvcmUgdGhpcyBzbGlkZVxuXHRcdHZhciBzdGF0ZUJlZm9yZSA9IHN0YXRlLmNvbmNhdCgpO1xuXG5cdFx0Ly8gUmVzZXQgdGhlIHN0YXRlIGFycmF5XG5cdFx0c3RhdGUubGVuZ3RoID0gMDtcblxuXHRcdHZhciBpbmRleGhCZWZvcmUgPSBpbmRleGggfHwgMCxcblx0XHRcdGluZGV4dkJlZm9yZSA9IGluZGV4diB8fCAwO1xuXG5cdFx0Ly8gQWN0aXZhdGUgYW5kIHRyYW5zaXRpb24gdG8gdGhlIG5ldyBzbGlkZVxuXHRcdGluZGV4aCA9IHVwZGF0ZVNsaWRlcyggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IsIGggPT09IHVuZGVmaW5lZCA/IGluZGV4aCA6IGggKTtcblx0XHRpbmRleHYgPSB1cGRhdGVTbGlkZXMoIFZFUlRJQ0FMX1NMSURFU19TRUxFQ1RPUiwgdiA9PT0gdW5kZWZpbmVkID8gaW5kZXh2IDogdiApO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSB2aXNpYmlsaXR5IG9mIHNsaWRlcyBub3cgdGhhdCB0aGUgaW5kaWNlcyBoYXZlIGNoYW5nZWRcblx0XHR1cGRhdGVTbGlkZXNWaXNpYmlsaXR5KCk7XG5cblx0XHRsYXlvdXQoKTtcblxuXHRcdC8vIEFwcGx5IHRoZSBuZXcgc3RhdGVcblx0XHRzdGF0ZUxvb3A6IGZvciggdmFyIGkgPSAwLCBsZW4gPSBzdGF0ZS5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdC8vIENoZWNrIGlmIHRoaXMgc3RhdGUgZXhpc3RlZCBvbiB0aGUgcHJldmlvdXMgc2xpZGUuIElmIGl0XG5cdFx0XHQvLyBkaWQsIHdlIHdpbGwgYXZvaWQgYWRkaW5nIGl0IHJlcGVhdGVkbHlcblx0XHRcdGZvciggdmFyIGogPSAwOyBqIDwgc3RhdGVCZWZvcmUubGVuZ3RoOyBqKysgKSB7XG5cdFx0XHRcdGlmKCBzdGF0ZUJlZm9yZVtqXSA9PT0gc3RhdGVbaV0gKSB7XG5cdFx0XHRcdFx0c3RhdGVCZWZvcmUuc3BsaWNlKCBqLCAxICk7XG5cdFx0XHRcdFx0Y29udGludWUgc3RhdGVMb29wO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCBzdGF0ZVtpXSApO1xuXG5cdFx0XHQvLyBEaXNwYXRjaCBjdXN0b20gZXZlbnQgbWF0Y2hpbmcgdGhlIHN0YXRlJ3MgbmFtZVxuXHRcdFx0ZGlzcGF0Y2hFdmVudCggc3RhdGVbaV0gKTtcblx0XHR9XG5cblx0XHQvLyBDbGVhbiB1cCB0aGUgcmVtYWlucyBvZiB0aGUgcHJldmlvdXMgc3RhdGVcblx0XHR3aGlsZSggc3RhdGVCZWZvcmUubGVuZ3RoICkge1xuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoIHN0YXRlQmVmb3JlLnBvcCgpICk7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIG92ZXJ2aWV3IGlzIGFjdGl2ZSwgcmUtYWN0aXZhdGUgaXQgdG8gdXBkYXRlIHBvc2l0aW9uc1xuXHRcdGlmKCBpc092ZXJ2aWV3KCkgKSB7XG5cdFx0XHRhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0fVxuXG5cdFx0Ly8gRmluZCB0aGUgY3VycmVudCBob3Jpem9udGFsIHNsaWRlIGFuZCBhbnkgcG9zc2libGUgdmVydGljYWwgc2xpZGVzXG5cdFx0Ly8gd2l0aGluIGl0XG5cdFx0dmFyIGN1cnJlbnRIb3Jpem9udGFsU2xpZGUgPSBob3Jpem9udGFsU2xpZGVzWyBpbmRleGggXSxcblx0XHRcdGN1cnJlbnRWZXJ0aWNhbFNsaWRlcyA9IGN1cnJlbnRIb3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICk7XG5cblx0XHQvLyBTdG9yZSByZWZlcmVuY2VzIHRvIHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCBzbGlkZXNcblx0XHRjdXJyZW50U2xpZGUgPSBjdXJyZW50VmVydGljYWxTbGlkZXNbIGluZGV4diBdIHx8IGN1cnJlbnRIb3Jpem9udGFsU2xpZGU7XG5cblx0XHQvLyBTaG93IGZyYWdtZW50LCBpZiBzcGVjaWZpZWRcblx0XHRpZiggdHlwZW9mIGYgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0bmF2aWdhdGVGcmFnbWVudCggZiApO1xuXHRcdH1cblxuXHRcdC8vIERpc3BhdGNoIGFuIGV2ZW50IGlmIHRoZSBzbGlkZSBjaGFuZ2VkXG5cdFx0dmFyIHNsaWRlQ2hhbmdlZCA9ICggaW5kZXhoICE9PSBpbmRleGhCZWZvcmUgfHwgaW5kZXh2ICE9PSBpbmRleHZCZWZvcmUgKTtcblx0XHRpZiggc2xpZGVDaGFuZ2VkICkge1xuXHRcdFx0ZGlzcGF0Y2hFdmVudCggJ3NsaWRlY2hhbmdlZCcsIHtcblx0XHRcdFx0J2luZGV4aCc6IGluZGV4aCxcblx0XHRcdFx0J2luZGV4dic6IGluZGV4dixcblx0XHRcdFx0J3ByZXZpb3VzU2xpZGUnOiBwcmV2aW91c1NsaWRlLFxuXHRcdFx0XHQnY3VycmVudFNsaWRlJzogY3VycmVudFNsaWRlLFxuXHRcdFx0XHQnb3JpZ2luJzogb1xuXHRcdFx0fSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIEVuc3VyZSB0aGF0IHRoZSBwcmV2aW91cyBzbGlkZSBpcyBuZXZlciB0aGUgc2FtZSBhcyB0aGUgY3VycmVudFxuXHRcdFx0cHJldmlvdXNTbGlkZSA9IG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gU29sdmVzIGFuIGVkZ2UgY2FzZSB3aGVyZSB0aGUgcHJldmlvdXMgc2xpZGUgbWFpbnRhaW5zIHRoZVxuXHRcdC8vICdwcmVzZW50JyBjbGFzcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBhZGphY2VudCB2ZXJ0aWNhbFxuXHRcdC8vIHN0YWNrc1xuXHRcdGlmKCBwcmV2aW91c1NsaWRlICkge1xuXHRcdFx0cHJldmlvdXNTbGlkZS5jbGFzc0xpc3QucmVtb3ZlKCAncHJlc2VudCcgKTtcblxuXHRcdFx0Ly8gUmVzZXQgYWxsIHNsaWRlcyB1cG9uIG5hdmlnYXRlIHRvIGhvbWVcblx0XHRcdC8vIElzc3VlOiAjMjg1XG5cdFx0XHRpZiAoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIEhPTUVfU0xJREVfU0VMRUNUT1IgKS5jbGFzc0xpc3QuY29udGFpbnMoICdwcmVzZW50JyApICkge1xuXHRcdFx0XHQvLyBMYXVuY2ggYXN5bmMgdGFza1xuXHRcdFx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dmFyIHNsaWRlcyA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICsgJy5zdGFjaycpICksIGk7XG5cdFx0XHRcdFx0Zm9yKCBpIGluIHNsaWRlcyApIHtcblx0XHRcdFx0XHRcdGlmKCBzbGlkZXNbaV0gKSB7XG5cdFx0XHRcdFx0XHRcdC8vIFJlc2V0IHN0YWNrXG5cdFx0XHRcdFx0XHRcdHNldFByZXZpb3VzVmVydGljYWxJbmRleCggc2xpZGVzW2ldLCAwICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAwICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSGFuZGxlIGVtYmVkZGVkIGNvbnRlbnRcblx0XHRpZiggc2xpZGVDaGFuZ2VkICkge1xuXHRcdFx0c3RvcEVtYmVkZGVkQ29udGVudCggcHJldmlvdXNTbGlkZSApO1xuXHRcdFx0c3RhcnRFbWJlZGRlZENvbnRlbnQoIGN1cnJlbnRTbGlkZSApO1xuXHRcdH1cblxuXHRcdHVwZGF0ZUNvbnRyb2xzKCk7XG5cdFx0dXBkYXRlUHJvZ3Jlc3MoKTtcblx0XHR1cGRhdGVCYWNrZ3JvdW5kKCk7XG5cdFx0dXBkYXRlUGFyYWxsYXgoKTtcblx0XHR1cGRhdGVTbGlkZU51bWJlcigpO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSBVUkwgaGFzaFxuXHRcdHdyaXRlVVJMKCk7XG5cblx0XHRjdWVBdXRvU2xpZGUoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFN5bmNzIHRoZSBwcmVzZW50YXRpb24gd2l0aCB0aGUgY3VycmVudCBET00uIFVzZWZ1bFxuXHQgKiB3aGVuIG5ldyBzbGlkZXMgb3IgY29udHJvbCBlbGVtZW50cyBhcmUgYWRkZWQgb3Igd2hlblxuXHQgKiB0aGUgY29uZmlndXJhdGlvbiBoYXMgY2hhbmdlZC5cblx0ICovXG5cdGZ1bmN0aW9uIHN5bmMoKSB7XG5cblx0XHQvLyBTdWJzY3JpYmUgdG8gaW5wdXRcblx0XHRyZW1vdmVFdmVudExpc3RlbmVycygpO1xuXHRcdGFkZEV2ZW50TGlzdGVuZXJzKCk7XG5cblx0XHQvLyBGb3JjZSBhIGxheW91dCB0byBtYWtlIHN1cmUgdGhlIGN1cnJlbnQgY29uZmlnIGlzIGFjY291bnRlZCBmb3Jcblx0XHRsYXlvdXQoKTtcblxuXHRcdC8vIFJlZmxlY3QgdGhlIGN1cnJlbnQgYXV0b1NsaWRlIHZhbHVlXG5cdFx0YXV0b1NsaWRlID0gY29uZmlnLmF1dG9TbGlkZTtcblxuXHRcdC8vIFN0YXJ0IGF1dG8tc2xpZGluZyBpZiBpdCdzIGVuYWJsZWRcblx0XHRjdWVBdXRvU2xpZGUoKTtcblxuXHRcdC8vIFJlLWNyZWF0ZSB0aGUgc2xpZGUgYmFja2dyb3VuZHNcblx0XHRjcmVhdGVCYWNrZ3JvdW5kcygpO1xuXG5cdFx0c29ydEFsbEZyYWdtZW50cygpO1xuXG5cdFx0dXBkYXRlQ29udHJvbHMoKTtcblx0XHR1cGRhdGVQcm9ncmVzcygpO1xuXHRcdHVwZGF0ZUJhY2tncm91bmQoIHRydWUgKTtcblx0XHR1cGRhdGVTbGlkZU51bWJlcigpO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmVzZXRzIGFsbCB2ZXJ0aWNhbCBzbGlkZXMgc28gdGhhdCBvbmx5IHRoZSBmaXJzdFxuXHQgKiBpcyB2aXNpYmxlLlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVzZXRWZXJ0aWNhbFNsaWRlcygpIHtcblxuXHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApO1xuXHRcdGhvcml6b250YWxTbGlkZXMuZm9yRWFjaCggZnVuY3Rpb24oIGhvcml6b250YWxTbGlkZSApIHtcblxuXHRcdFx0dmFyIHZlcnRpY2FsU2xpZGVzID0gdG9BcnJheSggaG9yaXpvbnRhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApICk7XG5cdFx0XHR2ZXJ0aWNhbFNsaWRlcy5mb3JFYWNoKCBmdW5jdGlvbiggdmVydGljYWxTbGlkZSwgeSApIHtcblxuXHRcdFx0XHRpZiggeSA+IDAgKSB7XG5cdFx0XHRcdFx0dmVydGljYWxTbGlkZS5jbGFzc0xpc3QucmVtb3ZlKCAncHJlc2VudCcgKTtcblx0XHRcdFx0XHR2ZXJ0aWNhbFNsaWRlLmNsYXNzTGlzdC5yZW1vdmUoICdwYXN0JyApO1xuXHRcdFx0XHRcdHZlcnRpY2FsU2xpZGUuY2xhc3NMaXN0LmFkZCggJ2Z1dHVyZScgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9ICk7XG5cblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTb3J0cyBhbmQgZm9ybWF0cyBhbGwgb2YgZnJhZ21lbnRzIGluIHRoZVxuXHQgKiBwcmVzZW50YXRpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBzb3J0QWxsRnJhZ21lbnRzKCkge1xuXG5cdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApICk7XG5cdFx0aG9yaXpvbnRhbFNsaWRlcy5mb3JFYWNoKCBmdW5jdGlvbiggaG9yaXpvbnRhbFNsaWRlICkge1xuXG5cdFx0XHR2YXIgdmVydGljYWxTbGlkZXMgPSB0b0FycmF5KCBob3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkgKTtcblx0XHRcdHZlcnRpY2FsU2xpZGVzLmZvckVhY2goIGZ1bmN0aW9uKCB2ZXJ0aWNhbFNsaWRlLCB5ICkge1xuXG5cdFx0XHRcdHNvcnRGcmFnbWVudHMoIHZlcnRpY2FsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKSApO1xuXG5cdFx0XHR9ICk7XG5cblx0XHRcdGlmKCB2ZXJ0aWNhbFNsaWRlcy5sZW5ndGggPT09IDAgKSBzb3J0RnJhZ21lbnRzKCBob3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKSApO1xuXG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyBvbmUgZGltZW5zaW9uIG9mIHNsaWRlcyBieSBzaG93aW5nIHRoZSBzbGlkZVxuXHQgKiB3aXRoIHRoZSBzcGVjaWZpZWQgaW5kZXguXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBBIENTUyBzZWxlY3RvciB0aGF0IHdpbGwgZmV0Y2hcblx0ICogdGhlIGdyb3VwIG9mIHNsaWRlcyB3ZSBhcmUgd29ya2luZyB3aXRoXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIHNsaWRlIHRoYXQgc2hvdWxkIGJlXG5cdCAqIHNob3duXG5cdCAqXG5cdCAqIEByZXR1cm4ge051bWJlcn0gVGhlIGluZGV4IG9mIHRoZSBzbGlkZSB0aGF0IGlzIG5vdyBzaG93bixcblx0ICogbWlnaHQgZGlmZmVyIGZyb20gdGhlIHBhc3NlZCBpbiBpbmRleCBpZiBpdCB3YXMgb3V0IG9mXG5cdCAqIGJvdW5kcy5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZVNsaWRlcyggc2VsZWN0b3IsIGluZGV4ICkge1xuXG5cdFx0Ly8gU2VsZWN0IGFsbCBzbGlkZXMgYW5kIGNvbnZlcnQgdGhlIE5vZGVMaXN0IHJlc3VsdCB0b1xuXHRcdC8vIGFuIGFycmF5XG5cdFx0dmFyIHNsaWRlcyA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIHNlbGVjdG9yICkgKSxcblx0XHRcdHNsaWRlc0xlbmd0aCA9IHNsaWRlcy5sZW5ndGg7XG5cblx0XHRpZiggc2xpZGVzTGVuZ3RoICkge1xuXG5cdFx0XHQvLyBTaG91bGQgdGhlIGluZGV4IGxvb3A/XG5cdFx0XHRpZiggY29uZmlnLmxvb3AgKSB7XG5cdFx0XHRcdGluZGV4ICU9IHNsaWRlc0xlbmd0aDtcblxuXHRcdFx0XHRpZiggaW5kZXggPCAwICkge1xuXHRcdFx0XHRcdGluZGV4ID0gc2xpZGVzTGVuZ3RoICsgaW5kZXg7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gRW5mb3JjZSBtYXggYW5kIG1pbmltdW0gaW5kZXggYm91bmRzXG5cdFx0XHRpbmRleCA9IE1hdGgubWF4KCBNYXRoLm1pbiggaW5kZXgsIHNsaWRlc0xlbmd0aCAtIDEgKSwgMCApO1xuXG5cdFx0XHRmb3IoIHZhciBpID0gMDsgaSA8IHNsaWRlc0xlbmd0aDsgaSsrICkge1xuXHRcdFx0XHR2YXIgZWxlbWVudCA9IHNsaWRlc1tpXTtcblxuXHRcdFx0XHR2YXIgcmV2ZXJzZSA9IGNvbmZpZy5ydGwgJiYgIWlzVmVydGljYWxTbGlkZSggZWxlbWVudCApO1xuXG5cdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ3Bhc3QnICk7XG5cdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ3ByZXNlbnQnICk7XG5cdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ2Z1dHVyZScgKTtcblxuXHRcdFx0XHQvLyBodHRwOi8vd3d3LnczLm9yZy9odG1sL3dnL2RyYWZ0cy9odG1sL21hc3Rlci9lZGl0aW5nLmh0bWwjdGhlLWhpZGRlbi1hdHRyaWJ1dGVcblx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUoICdoaWRkZW4nLCAnJyApO1xuXG5cdFx0XHRcdGlmKCBpIDwgaW5kZXggKSB7XG5cdFx0XHRcdFx0Ly8gQW55IGVsZW1lbnQgcHJldmlvdXMgdG8gaW5kZXggaXMgZ2l2ZW4gdGhlICdwYXN0JyBjbGFzc1xuXHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCggcmV2ZXJzZSA/ICdmdXR1cmUnIDogJ3Bhc3QnICk7XG5cblx0XHRcdFx0XHR2YXIgcGFzdEZyYWdtZW50cyA9IHRvQXJyYXkoIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKSApO1xuXG5cdFx0XHRcdFx0Ly8gU2hvdyBhbGwgZnJhZ21lbnRzIG9uIHByaW9yIHNsaWRlc1xuXHRcdFx0XHRcdHdoaWxlKCBwYXN0RnJhZ21lbnRzLmxlbmd0aCApIHtcblx0XHRcdFx0XHRcdHZhciBwYXN0RnJhZ21lbnQgPSBwYXN0RnJhZ21lbnRzLnBvcCgpO1xuXHRcdFx0XHRcdFx0cGFzdEZyYWdtZW50LmNsYXNzTGlzdC5hZGQoICd2aXNpYmxlJyApO1xuXHRcdFx0XHRcdFx0cGFzdEZyYWdtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdjdXJyZW50LWZyYWdtZW50JyApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKCBpID4gaW5kZXggKSB7XG5cdFx0XHRcdFx0Ly8gQW55IGVsZW1lbnQgc3Vic2VxdWVudCB0byBpbmRleCBpcyBnaXZlbiB0aGUgJ2Z1dHVyZScgY2xhc3Ncblx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQoIHJldmVyc2UgPyAncGFzdCcgOiAnZnV0dXJlJyApO1xuXG5cdFx0XHRcdFx0dmFyIGZ1dHVyZUZyYWdtZW50cyA9IHRvQXJyYXkoIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudC52aXNpYmxlJyApICk7XG5cblx0XHRcdFx0XHQvLyBObyBmcmFnbWVudHMgaW4gZnV0dXJlIHNsaWRlcyBzaG91bGQgYmUgdmlzaWJsZSBhaGVhZCBvZiB0aW1lXG5cdFx0XHRcdFx0d2hpbGUoIGZ1dHVyZUZyYWdtZW50cy5sZW5ndGggKSB7XG5cdFx0XHRcdFx0XHR2YXIgZnV0dXJlRnJhZ21lbnQgPSBmdXR1cmVGcmFnbWVudHMucG9wKCk7XG5cdFx0XHRcdFx0XHRmdXR1cmVGcmFnbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAndmlzaWJsZScgKTtcblx0XHRcdFx0XHRcdGZ1dHVyZUZyYWdtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdjdXJyZW50LWZyYWdtZW50JyApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIElmIHRoaXMgZWxlbWVudCBjb250YWlucyB2ZXJ0aWNhbCBzbGlkZXNcblx0XHRcdFx0aWYoIGVsZW1lbnQucXVlcnlTZWxlY3RvciggJ3NlY3Rpb24nICkgKSB7XG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCAnc3RhY2snICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gTWFyayB0aGUgY3VycmVudCBzbGlkZSBhcyBwcmVzZW50XG5cdFx0XHRzbGlkZXNbaW5kZXhdLmNsYXNzTGlzdC5hZGQoICdwcmVzZW50JyApO1xuXHRcdFx0c2xpZGVzW2luZGV4XS5yZW1vdmVBdHRyaWJ1dGUoICdoaWRkZW4nICk7XG5cblx0XHRcdC8vIElmIHRoaXMgc2xpZGUgaGFzIGEgc3RhdGUgYXNzb2NpYXRlZCB3aXRoIGl0LCBhZGQgaXRcblx0XHRcdC8vIG9udG8gdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGRlY2tcblx0XHRcdHZhciBzbGlkZVN0YXRlID0gc2xpZGVzW2luZGV4XS5nZXRBdHRyaWJ1dGUoICdkYXRhLXN0YXRlJyApO1xuXHRcdFx0aWYoIHNsaWRlU3RhdGUgKSB7XG5cdFx0XHRcdHN0YXRlID0gc3RhdGUuY29uY2F0KCBzbGlkZVN0YXRlLnNwbGl0KCAnICcgKSApO1xuXHRcdFx0fVxuXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gU2luY2UgdGhlcmUgYXJlIG5vIHNsaWRlcyB3ZSBjYW4ndCBiZSBhbnl3aGVyZSBiZXlvbmQgdGhlXG5cdFx0XHQvLyB6ZXJvdGggaW5kZXhcblx0XHRcdGluZGV4ID0gMDtcblx0XHR9XG5cblx0XHRyZXR1cm4gaW5kZXg7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBPcHRpbWl6YXRpb24gbWV0aG9kOyBoaWRlIGFsbCBzbGlkZXMgdGhhdCBhcmUgZmFyIGF3YXlcblx0ICogZnJvbSB0aGUgcHJlc2VudCBzbGlkZS5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZVNsaWRlc1Zpc2liaWxpdHkoKSB7XG5cblx0XHQvLyBTZWxlY3QgYWxsIHNsaWRlcyBhbmQgY29udmVydCB0aGUgTm9kZUxpc3QgcmVzdWx0IHRvXG5cdFx0Ly8gYW4gYXJyYXlcblx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlcyA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKSxcblx0XHRcdGhvcml6b250YWxTbGlkZXNMZW5ndGggPSBob3Jpem9udGFsU2xpZGVzLmxlbmd0aCxcblx0XHRcdGRpc3RhbmNlWCxcblx0XHRcdGRpc3RhbmNlWTtcblxuXHRcdGlmKCBob3Jpem9udGFsU2xpZGVzTGVuZ3RoICkge1xuXG5cdFx0XHQvLyBUaGUgbnVtYmVyIG9mIHN0ZXBzIGF3YXkgZnJvbSB0aGUgcHJlc2VudCBzbGlkZSB0aGF0IHdpbGxcblx0XHRcdC8vIGJlIHZpc2libGVcblx0XHRcdHZhciB2aWV3RGlzdGFuY2UgPSBpc092ZXJ2aWV3KCkgPyAxMCA6IGNvbmZpZy52aWV3RGlzdGFuY2U7XG5cblx0XHRcdC8vIExpbWl0IHZpZXcgZGlzdGFuY2Ugb24gd2Vha2VyIGRldmljZXNcblx0XHRcdGlmKCBpc01vYmlsZURldmljZSApIHtcblx0XHRcdFx0dmlld0Rpc3RhbmNlID0gaXNPdmVydmlldygpID8gNiA6IDE7XG5cdFx0XHR9XG5cblx0XHRcdGZvciggdmFyIHggPSAwOyB4IDwgaG9yaXpvbnRhbFNsaWRlc0xlbmd0aDsgeCsrICkge1xuXHRcdFx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlID0gaG9yaXpvbnRhbFNsaWRlc1t4XTtcblxuXHRcdFx0XHR2YXIgdmVydGljYWxTbGlkZXMgPSB0b0FycmF5KCBob3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkgKSxcblx0XHRcdFx0XHR2ZXJ0aWNhbFNsaWRlc0xlbmd0aCA9IHZlcnRpY2FsU2xpZGVzLmxlbmd0aDtcblxuXHRcdFx0XHQvLyBMb29wcyBzbyB0aGF0IGl0IG1lYXN1cmVzIDEgYmV0d2VlbiB0aGUgZmlyc3QgYW5kIGxhc3Qgc2xpZGVzXG5cdFx0XHRcdGRpc3RhbmNlWCA9IE1hdGguYWJzKCAoIGluZGV4aCAtIHggKSAlICggaG9yaXpvbnRhbFNsaWRlc0xlbmd0aCAtIHZpZXdEaXN0YW5jZSApICkgfHwgMDtcblxuXHRcdFx0XHQvLyBTaG93IHRoZSBob3Jpem9udGFsIHNsaWRlIGlmIGl0J3Mgd2l0aGluIHRoZSB2aWV3IGRpc3RhbmNlXG5cdFx0XHRcdGhvcml6b250YWxTbGlkZS5zdHlsZS5kaXNwbGF5ID0gZGlzdGFuY2VYID4gdmlld0Rpc3RhbmNlID8gJ25vbmUnIDogJ2Jsb2NrJztcblxuXHRcdFx0XHRpZiggdmVydGljYWxTbGlkZXNMZW5ndGggKSB7XG5cblx0XHRcdFx0XHR2YXIgb3kgPSBnZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIGhvcml6b250YWxTbGlkZSApO1xuXG5cdFx0XHRcdFx0Zm9yKCB2YXIgeSA9IDA7IHkgPCB2ZXJ0aWNhbFNsaWRlc0xlbmd0aDsgeSsrICkge1xuXHRcdFx0XHRcdFx0dmFyIHZlcnRpY2FsU2xpZGUgPSB2ZXJ0aWNhbFNsaWRlc1t5XTtcblxuXHRcdFx0XHRcdFx0ZGlzdGFuY2VZID0geCA9PT0gaW5kZXhoID8gTWF0aC5hYnMoIGluZGV4diAtIHkgKSA6IE1hdGguYWJzKCB5IC0gb3kgKTtcblxuXHRcdFx0XHRcdFx0dmVydGljYWxTbGlkZS5zdHlsZS5kaXNwbGF5ID0gKCBkaXN0YW5jZVggKyBkaXN0YW5jZVkgKSA+IHZpZXdEaXN0YW5jZSA/ICdub25lJyA6ICdibG9jayc7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIHByb2dyZXNzIGJhciB0byByZWZsZWN0IHRoZSBjdXJyZW50IHNsaWRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlUHJvZ3Jlc3MoKSB7XG5cblx0XHQvLyBVcGRhdGUgcHJvZ3Jlc3MgaWYgZW5hYmxlZFxuXHRcdGlmKCBjb25maWcucHJvZ3Jlc3MgJiYgZG9tLnByb2dyZXNzICkge1xuXG5cdFx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlcyA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKTtcblxuXHRcdFx0Ly8gVGhlIG51bWJlciBvZiBwYXN0IGFuZCB0b3RhbCBzbGlkZXNcblx0XHRcdHZhciB0b3RhbENvdW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICsgJzpub3QoLnN0YWNrKScgKS5sZW5ndGg7XG5cdFx0XHR2YXIgcGFzdENvdW50ID0gMDtcblxuXHRcdFx0Ly8gU3RlcCB0aHJvdWdoIGFsbCBzbGlkZXMgYW5kIGNvdW50IHRoZSBwYXN0IG9uZXNcblx0XHRcdG1haW5Mb29wOiBmb3IoIHZhciBpID0gMDsgaSA8IGhvcml6b250YWxTbGlkZXMubGVuZ3RoOyBpKysgKSB7XG5cblx0XHRcdFx0dmFyIGhvcml6b250YWxTbGlkZSA9IGhvcml6b250YWxTbGlkZXNbaV07XG5cdFx0XHRcdHZhciB2ZXJ0aWNhbFNsaWRlcyA9IHRvQXJyYXkoIGhvcml6b250YWxTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKSApO1xuXG5cdFx0XHRcdGZvciggdmFyIGogPSAwOyBqIDwgdmVydGljYWxTbGlkZXMubGVuZ3RoOyBqKysgKSB7XG5cblx0XHRcdFx0XHQvLyBTdG9wIGFzIHNvb24gYXMgd2UgYXJyaXZlIGF0IHRoZSBwcmVzZW50XG5cdFx0XHRcdFx0aWYoIHZlcnRpY2FsU2xpZGVzW2pdLmNsYXNzTGlzdC5jb250YWlucyggJ3ByZXNlbnQnICkgKSB7XG5cdFx0XHRcdFx0XHRicmVhayBtYWluTG9vcDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRwYXN0Q291bnQrKztcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gU3RvcCBhcyBzb29uIGFzIHdlIGFycml2ZSBhdCB0aGUgcHJlc2VudFxuXHRcdFx0XHRpZiggaG9yaXpvbnRhbFNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ3ByZXNlbnQnICkgKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBEb24ndCBjb3VudCB0aGUgd3JhcHBpbmcgc2VjdGlvbiBmb3IgdmVydGljYWwgc2xpZGVzXG5cdFx0XHRcdGlmKCBob3Jpem9udGFsU2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAnc3RhY2snICkgPT09IGZhbHNlICkge1xuXHRcdFx0XHRcdHBhc3RDb3VudCsrO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdFx0ZG9tLnByb2dyZXNzYmFyLnN0eWxlLndpZHRoID0gKCBwYXN0Q291bnQgLyAoIHRvdGFsQ291bnQgLSAxICkgKSAqIHdpbmRvdy5pbm5lcldpZHRoICsgJ3B4JztcblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIHNsaWRlIG51bWJlciBkaXYgdG8gcmVmbGVjdCB0aGUgY3VycmVudCBzbGlkZS5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZVNsaWRlTnVtYmVyKCkge1xuXG5cdFx0Ly8gVXBkYXRlIHNsaWRlIG51bWJlciBpZiBlbmFibGVkXG5cdFx0aWYoIGNvbmZpZy5zbGlkZU51bWJlciAmJiBkb20uc2xpZGVOdW1iZXIpIHtcblxuXHRcdFx0Ly8gRGlzcGxheSB0aGUgbnVtYmVyIG9mIHRoZSBwYWdlIHVzaW5nICdpbmRleGggLSBpbmRleHYnIGZvcm1hdFxuXHRcdFx0dmFyIGluZGV4U3RyaW5nID0gaW5kZXhoO1xuXHRcdFx0aWYoIGluZGV4diA+IDAgKSB7XG5cdFx0XHRcdGluZGV4U3RyaW5nICs9ICcgLSAnICsgaW5kZXh2O1xuXHRcdFx0fVxuXG5cdFx0XHRkb20uc2xpZGVOdW1iZXIuaW5uZXJIVE1MID0gaW5kZXhTdHJpbmc7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyB0aGUgc3RhdGUgb2YgYWxsIGNvbnRyb2wvbmF2aWdhdGlvbiBhcnJvd3MuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVDb250cm9scygpIHtcblxuXHRcdHZhciByb3V0ZXMgPSBhdmFpbGFibGVSb3V0ZXMoKTtcblx0XHR2YXIgZnJhZ21lbnRzID0gYXZhaWxhYmxlRnJhZ21lbnRzKCk7XG5cblx0XHQvLyBSZW1vdmUgdGhlICdlbmFibGVkJyBjbGFzcyBmcm9tIGFsbCBkaXJlY3Rpb25zXG5cdFx0ZG9tLmNvbnRyb2xzTGVmdC5jb25jYXQoIGRvbS5jb250cm9sc1JpZ2h0IClcblx0XHRcdFx0XHRcdC5jb25jYXQoIGRvbS5jb250cm9sc1VwIClcblx0XHRcdFx0XHRcdC5jb25jYXQoIGRvbS5jb250cm9sc0Rvd24gKVxuXHRcdFx0XHRcdFx0LmNvbmNhdCggZG9tLmNvbnRyb2xzUHJldiApXG5cdFx0XHRcdFx0XHQuY29uY2F0KCBkb20uY29udHJvbHNOZXh0ICkuZm9yRWFjaCggZnVuY3Rpb24oIG5vZGUgKSB7XG5cdFx0XHRub2RlLmNsYXNzTGlzdC5yZW1vdmUoICdlbmFibGVkJyApO1xuXHRcdFx0bm9kZS5jbGFzc0xpc3QucmVtb3ZlKCAnZnJhZ21lbnRlZCcgKTtcblx0XHR9ICk7XG5cblx0XHQvLyBBZGQgdGhlICdlbmFibGVkJyBjbGFzcyB0byB0aGUgYXZhaWxhYmxlIHJvdXRlc1xuXHRcdGlmKCByb3V0ZXMubGVmdCApIGRvbS5jb250cm9sc0xlZnQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZW5hYmxlZCcgKTtcdH0gKTtcblx0XHRpZiggcm91dGVzLnJpZ2h0ICkgZG9tLmNvbnRyb2xzUmlnaHQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZW5hYmxlZCcgKTsgfSApO1xuXHRcdGlmKCByb3V0ZXMudXAgKSBkb20uY29udHJvbHNVcC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdlbmFibGVkJyApO1x0fSApO1xuXHRcdGlmKCByb3V0ZXMuZG93biApIGRvbS5jb250cm9sc0Rvd24uZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZW5hYmxlZCcgKTsgfSApO1xuXG5cdFx0Ly8gUHJldi9uZXh0IGJ1dHRvbnNcblx0XHRpZiggcm91dGVzLmxlZnQgfHwgcm91dGVzLnVwICkgZG9tLmNvbnRyb2xzUHJldi5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdlbmFibGVkJyApOyB9ICk7XG5cdFx0aWYoIHJvdXRlcy5yaWdodCB8fCByb3V0ZXMuZG93biApIGRvbS5jb250cm9sc05leHQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZW5hYmxlZCcgKTsgfSApO1xuXG5cdFx0Ly8gSGlnaGxpZ2h0IGZyYWdtZW50IGRpcmVjdGlvbnNcblx0XHRpZiggY3VycmVudFNsaWRlICkge1xuXG5cdFx0XHQvLyBBbHdheXMgYXBwbHkgZnJhZ21lbnQgZGVjb3JhdG9yIHRvIHByZXYvbmV4dCBidXR0b25zXG5cdFx0XHRpZiggZnJhZ21lbnRzLnByZXYgKSBkb20uY29udHJvbHNQcmV2LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2ZyYWdtZW50ZWQnLCAnZW5hYmxlZCcgKTsgfSApO1xuXHRcdFx0aWYoIGZyYWdtZW50cy5uZXh0ICkgZG9tLmNvbnRyb2xzTmV4dC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdmcmFnbWVudGVkJywgJ2VuYWJsZWQnICk7IH0gKTtcblxuXHRcdFx0Ly8gQXBwbHkgZnJhZ21lbnQgZGVjb3JhdG9ycyB0byBkaXJlY3Rpb25hbCBidXR0b25zIGJhc2VkIG9uXG5cdFx0XHQvLyB3aGF0IHNsaWRlIGF4aXMgdGhleSBhcmUgaW5cblx0XHRcdGlmKCBpc1ZlcnRpY2FsU2xpZGUoIGN1cnJlbnRTbGlkZSApICkge1xuXHRcdFx0XHRpZiggZnJhZ21lbnRzLnByZXYgKSBkb20uY29udHJvbHNVcC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdmcmFnbWVudGVkJywgJ2VuYWJsZWQnICk7IH0gKTtcblx0XHRcdFx0aWYoIGZyYWdtZW50cy5uZXh0ICkgZG9tLmNvbnRyb2xzRG93bi5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdmcmFnbWVudGVkJywgJ2VuYWJsZWQnICk7IH0gKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRpZiggZnJhZ21lbnRzLnByZXYgKSBkb20uY29udHJvbHNMZWZ0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2ZyYWdtZW50ZWQnLCAnZW5hYmxlZCcgKTsgfSApO1xuXHRcdFx0XHRpZiggZnJhZ21lbnRzLm5leHQgKSBkb20uY29udHJvbHNSaWdodC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdmcmFnbWVudGVkJywgJ2VuYWJsZWQnICk7IH0gKTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIGJhY2tncm91bmQgZWxlbWVudHMgdG8gcmVmbGVjdCB0aGUgY3VycmVudFxuXHQgKiBzbGlkZS5cblx0ICpcblx0ICogQHBhcmFtIHtCb29sZWFufSBpbmNsdWRlQWxsIElmIHRydWUsIHRoZSBiYWNrZ3JvdW5kcyBvZlxuXHQgKiBhbGwgdmVydGljYWwgc2xpZGVzIChub3QganVzdCB0aGUgcHJlc2VudCkgd2lsbCBiZSB1cGRhdGVkLlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlQmFja2dyb3VuZCggaW5jbHVkZUFsbCApIHtcblxuXHRcdHZhciBjdXJyZW50QmFja2dyb3VuZCA9IG51bGw7XG5cblx0XHQvLyBSZXZlcnNlIHBhc3QvZnV0dXJlIGNsYXNzZXMgd2hlbiBpbiBSVEwgbW9kZVxuXHRcdHZhciBob3Jpem9udGFsUGFzdCA9IGNvbmZpZy5ydGwgPyAnZnV0dXJlJyA6ICdwYXN0Jyxcblx0XHRcdGhvcml6b250YWxGdXR1cmUgPSBjb25maWcucnRsID8gJ3Bhc3QnIDogJ2Z1dHVyZSc7XG5cblx0XHQvLyBVcGRhdGUgdGhlIGNsYXNzZXMgb2YgYWxsIGJhY2tncm91bmRzIHRvIG1hdGNoIHRoZVxuXHRcdC8vIHN0YXRlcyBvZiB0aGVpciBzbGlkZXMgKHBhc3QvcHJlc2VudC9mdXR1cmUpXG5cdFx0dG9BcnJheSggZG9tLmJhY2tncm91bmQuY2hpbGROb2RlcyApLmZvckVhY2goIGZ1bmN0aW9uKCBiYWNrZ3JvdW5kaCwgaCApIHtcblxuXHRcdFx0aWYoIGggPCBpbmRleGggKSB7XG5cdFx0XHRcdGJhY2tncm91bmRoLmNsYXNzTmFtZSA9ICdzbGlkZS1iYWNrZ3JvdW5kICcgKyBob3Jpem9udGFsUGFzdDtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKCBoID4gaW5kZXhoICkge1xuXHRcdFx0XHRiYWNrZ3JvdW5kaC5jbGFzc05hbWUgPSAnc2xpZGUtYmFja2dyb3VuZCAnICsgaG9yaXpvbnRhbEZ1dHVyZTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRiYWNrZ3JvdW5kaC5jbGFzc05hbWUgPSAnc2xpZGUtYmFja2dyb3VuZCBwcmVzZW50JztcblxuXHRcdFx0XHQvLyBTdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBiYWNrZ3JvdW5kIGVsZW1lbnRcblx0XHRcdFx0Y3VycmVudEJhY2tncm91bmQgPSBiYWNrZ3JvdW5kaDtcblx0XHRcdH1cblxuXHRcdFx0aWYoIGluY2x1ZGVBbGwgfHwgaCA9PT0gaW5kZXhoICkge1xuXHRcdFx0XHR0b0FycmF5KCBiYWNrZ3JvdW5kaC5jaGlsZE5vZGVzICkuZm9yRWFjaCggZnVuY3Rpb24oIGJhY2tncm91bmR2LCB2ICkge1xuXG5cdFx0XHRcdFx0aWYoIHYgPCBpbmRleHYgKSB7XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kdi5jbGFzc05hbWUgPSAnc2xpZGUtYmFja2dyb3VuZCBwYXN0Jztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoIHYgPiBpbmRleHYgKSB7XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kdi5jbGFzc05hbWUgPSAnc2xpZGUtYmFja2dyb3VuZCBmdXR1cmUnO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTmFtZSA9ICdzbGlkZS1iYWNrZ3JvdW5kIHByZXNlbnQnO1xuXG5cdFx0XHRcdFx0XHQvLyBPbmx5IGlmIHRoaXMgaXMgdGhlIHByZXNlbnQgaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgc2xpZGVcblx0XHRcdFx0XHRcdGlmKCBoID09PSBpbmRleGggKSBjdXJyZW50QmFja2dyb3VuZCA9IGJhY2tncm91bmR2O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cblx0XHR9ICk7XG5cblx0XHQvLyBEb24ndCB0cmFuc2l0aW9uIGJldHdlZW4gaWRlbnRpY2FsIGJhY2tncm91bmRzLiBUaGlzXG5cdFx0Ly8gcHJldmVudHMgdW53YW50ZWQgZmxpY2tlci5cblx0XHRpZiggY3VycmVudEJhY2tncm91bmQgKSB7XG5cdFx0XHR2YXIgcHJldmlvdXNCYWNrZ3JvdW5kSGFzaCA9IHByZXZpb3VzQmFja2dyb3VuZCA/IHByZXZpb3VzQmFja2dyb3VuZC5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtaGFzaCcgKSA6IG51bGw7XG5cdFx0XHR2YXIgY3VycmVudEJhY2tncm91bmRIYXNoID0gY3VycmVudEJhY2tncm91bmQuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWhhc2gnICk7XG5cdFx0XHRpZiggY3VycmVudEJhY2tncm91bmRIYXNoICYmIGN1cnJlbnRCYWNrZ3JvdW5kSGFzaCA9PT0gcHJldmlvdXNCYWNrZ3JvdW5kSGFzaCAmJiBjdXJyZW50QmFja2dyb3VuZCAhPT0gcHJldmlvdXNCYWNrZ3JvdW5kICkge1xuXHRcdFx0XHRkb20uYmFja2dyb3VuZC5jbGFzc0xpc3QuYWRkKCAnbm8tdHJhbnNpdGlvbicgKTtcblx0XHRcdH1cblxuXHRcdFx0cHJldmlvdXNCYWNrZ3JvdW5kID0gY3VycmVudEJhY2tncm91bmQ7XG5cdFx0fVxuXG5cdFx0Ly8gQWxsb3cgdGhlIGZpcnN0IGJhY2tncm91bmQgdG8gYXBwbHkgd2l0aG91dCB0cmFuc2l0aW9uXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRkb20uYmFja2dyb3VuZC5jbGFzc0xpc3QucmVtb3ZlKCAnbm8tdHJhbnNpdGlvbicgKTtcblx0XHR9LCAxICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBwb3NpdGlvbiBvZiB0aGUgcGFyYWxsYXggYmFja2dyb3VuZCBiYXNlZFxuXHQgKiBvbiB0aGUgY3VycmVudCBzbGlkZSBpbmRleC5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZVBhcmFsbGF4KCkge1xuXG5cdFx0aWYoIGNvbmZpZy5wYXJhbGxheEJhY2tncm91bmRJbWFnZSApIHtcblxuXHRcdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApLFxuXHRcdFx0XHR2ZXJ0aWNhbFNsaWRlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIFZFUlRJQ0FMX1NMSURFU19TRUxFQ1RPUiApO1xuXG5cdFx0XHR2YXIgYmFja2dyb3VuZFNpemUgPSBkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZS5zcGxpdCggJyAnICksXG5cdFx0XHRcdGJhY2tncm91bmRXaWR0aCwgYmFja2dyb3VuZEhlaWdodDtcblxuXHRcdFx0aWYoIGJhY2tncm91bmRTaXplLmxlbmd0aCA9PT0gMSApIHtcblx0XHRcdFx0YmFja2dyb3VuZFdpZHRoID0gYmFja2dyb3VuZEhlaWdodCA9IHBhcnNlSW50KCBiYWNrZ3JvdW5kU2l6ZVswXSwgMTAgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRiYWNrZ3JvdW5kV2lkdGggPSBwYXJzZUludCggYmFja2dyb3VuZFNpemVbMF0sIDEwICk7XG5cdFx0XHRcdGJhY2tncm91bmRIZWlnaHQgPSBwYXJzZUludCggYmFja2dyb3VuZFNpemVbMV0sIDEwICk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBzbGlkZVdpZHRoID0gZG9tLmJhY2tncm91bmQub2Zmc2V0V2lkdGg7XG5cdFx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlQ291bnQgPSBob3Jpem9udGFsU2xpZGVzLmxlbmd0aDtcblx0XHRcdHZhciBob3Jpem9udGFsT2Zmc2V0ID0gLSggYmFja2dyb3VuZFdpZHRoIC0gc2xpZGVXaWR0aCApIC8gKCBob3Jpem9udGFsU2xpZGVDb3VudC0xICkgKiBpbmRleGg7XG5cblx0XHRcdHZhciBzbGlkZUhlaWdodCA9IGRvbS5iYWNrZ3JvdW5kLm9mZnNldEhlaWdodDtcblx0XHRcdHZhciB2ZXJ0aWNhbFNsaWRlQ291bnQgPSB2ZXJ0aWNhbFNsaWRlcy5sZW5ndGg7XG5cdFx0XHR2YXIgdmVydGljYWxPZmZzZXQgPSB2ZXJ0aWNhbFNsaWRlQ291bnQgPiAwID8gLSggYmFja2dyb3VuZEhlaWdodCAtIHNsaWRlSGVpZ2h0ICkgLyAoIHZlcnRpY2FsU2xpZGVDb3VudC0xICkgKiBpbmRleHYgOiAwO1xuXG5cdFx0XHRkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSBob3Jpem9udGFsT2Zmc2V0ICsgJ3B4ICcgKyB2ZXJ0aWNhbE9mZnNldCArICdweCc7XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgd2hhdCBhdmFpbGFibGUgcm91dGVzIHRoZXJlIGFyZSBmb3IgbmF2aWdhdGlvbi5cblx0ICpcblx0ICogQHJldHVybiB7T2JqZWN0fSBjb250YWluaW5nIGZvdXIgYm9vbGVhbnM6IGxlZnQvcmlnaHQvdXAvZG93blxuXHQgKi9cblx0ZnVuY3Rpb24gYXZhaWxhYmxlUm91dGVzKCkge1xuXG5cdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApLFxuXHRcdFx0dmVydGljYWxTbGlkZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBWRVJUSUNBTF9TTElERVNfU0VMRUNUT1IgKTtcblxuXHRcdHZhciByb3V0ZXMgPSB7XG5cdFx0XHRsZWZ0OiBpbmRleGggPiAwIHx8IGNvbmZpZy5sb29wLFxuXHRcdFx0cmlnaHQ6IGluZGV4aCA8IGhvcml6b250YWxTbGlkZXMubGVuZ3RoIC0gMSB8fCBjb25maWcubG9vcCxcblx0XHRcdHVwOiBpbmRleHYgPiAwLFxuXHRcdFx0ZG93bjogaW5kZXh2IDwgdmVydGljYWxTbGlkZXMubGVuZ3RoIC0gMVxuXHRcdH07XG5cblx0XHQvLyByZXZlcnNlIGhvcml6b250YWwgY29udHJvbHMgZm9yIHJ0bFxuXHRcdGlmKCBjb25maWcucnRsICkge1xuXHRcdFx0dmFyIGxlZnQgPSByb3V0ZXMubGVmdDtcblx0XHRcdHJvdXRlcy5sZWZ0ID0gcm91dGVzLnJpZ2h0O1xuXHRcdFx0cm91dGVzLnJpZ2h0ID0gbGVmdDtcblx0XHR9XG5cblx0XHRyZXR1cm4gcm91dGVzO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBhbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgYXZhaWxhYmxlIGZyYWdtZW50XG5cdCAqIGRpcmVjdGlvbnMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0gdHdvIGJvb2xlYW4gcHJvcGVydGllczogcHJldi9uZXh0XG5cdCAqL1xuXHRmdW5jdGlvbiBhdmFpbGFibGVGcmFnbWVudHMoKSB7XG5cblx0XHRpZiggY3VycmVudFNsaWRlICYmIGNvbmZpZy5mcmFnbWVudHMgKSB7XG5cdFx0XHR2YXIgZnJhZ21lbnRzID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICk7XG5cdFx0XHR2YXIgaGlkZGVuRnJhZ21lbnRzID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQ6bm90KC52aXNpYmxlKScgKTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cHJldjogZnJhZ21lbnRzLmxlbmd0aCAtIGhpZGRlbkZyYWdtZW50cy5sZW5ndGggPiAwLFxuXHRcdFx0XHRuZXh0OiAhIWhpZGRlbkZyYWdtZW50cy5sZW5ndGhcblx0XHRcdH07XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHsgcHJldjogZmFsc2UsIG5leHQ6IGZhbHNlIH07XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogU3RhcnQgcGxheWJhY2sgb2YgYW55IGVtYmVkZGVkIGNvbnRlbnQgaW5zaWRlIG9mXG5cdCAqIHRoZSB0YXJnZXRlZCBzbGlkZS5cblx0ICovXG5cdGZ1bmN0aW9uIHN0YXJ0RW1iZWRkZWRDb250ZW50KCBzbGlkZSApIHtcblxuXHRcdGlmKCBzbGlkZSAmJiAhaXNTcGVha2VyTm90ZXMoKSApIHtcblx0XHRcdC8vIEhUTUw1IG1lZGlhIGVsZW1lbnRzXG5cdFx0XHR0b0FycmF5KCBzbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAndmlkZW8sIGF1ZGlvJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRpZiggZWwuaGFzQXR0cmlidXRlKCAnZGF0YS1hdXRvcGxheScgKSApIHtcblx0XHRcdFx0XHRlbC5wbGF5KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gaWZyYW1lIGVtYmVkc1xuXHRcdFx0dG9BcnJheSggc2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ2lmcmFtZScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0ZWwuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSggJ3NsaWRlOnN0YXJ0JywgJyonICk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gWW91VHViZSBlbWJlZHNcblx0XHRcdHRvQXJyYXkoIHNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWVbc3JjKj1cInlvdXR1YmUuY29tL2VtYmVkL1wiXScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0aWYoIGVsLmhhc0F0dHJpYnV0ZSggJ2RhdGEtYXV0b3BsYXknICkgKSB7XG5cdFx0XHRcdFx0ZWwuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSggJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwbGF5VmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTdG9wIHBsYXliYWNrIG9mIGFueSBlbWJlZGRlZCBjb250ZW50IGluc2lkZSBvZlxuXHQgKiB0aGUgdGFyZ2V0ZWQgc2xpZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiBzdG9wRW1iZWRkZWRDb250ZW50KCBzbGlkZSApIHtcblxuXHRcdGlmKCBzbGlkZSApIHtcblx0XHRcdC8vIEhUTUw1IG1lZGlhIGVsZW1lbnRzXG5cdFx0XHR0b0FycmF5KCBzbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAndmlkZW8sIGF1ZGlvJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRpZiggIWVsLmhhc0F0dHJpYnV0ZSggJ2RhdGEtaWdub3JlJyApICkge1xuXHRcdFx0XHRcdGVsLnBhdXNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gaWZyYW1lIGVtYmVkc1xuXHRcdFx0dG9BcnJheSggc2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ2lmcmFtZScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0ZWwuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSggJ3NsaWRlOnN0b3AnLCAnKicgKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBZb3VUdWJlIGVtYmVkc1xuXHRcdFx0dG9BcnJheSggc2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ2lmcmFtZVtzcmMqPVwieW91dHViZS5jb20vZW1iZWQvXCJdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRpZiggIWVsLmhhc0F0dHJpYnV0ZSggJ2RhdGEtaWdub3JlJyApICYmIHR5cGVvZiBlbC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlID09PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0XHRcdGVsLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoICd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGF1c2VWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonICk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiB0aGlzIHByZXNlbnRhdGlvbiBpcyBydW5uaW5nIGluc2lkZSBvZiB0aGVcblx0ICogc3BlYWtlciBub3RlcyB3aW5kb3cuXG5cdCAqL1xuXHRmdW5jdGlvbiBpc1NwZWFrZXJOb3RlcygpIHtcblxuXHRcdHJldHVybiAhIXdpbmRvdy5sb2NhdGlvbi5zZWFyY2gubWF0Y2goIC9yZWNlaXZlci9naSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmVhZHMgdGhlIGN1cnJlbnQgVVJMIChoYXNoKSBhbmQgbmF2aWdhdGVzIGFjY29yZGluZ2x5LlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVhZFVSTCgpIHtcblxuXHRcdHZhciBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XG5cblx0XHQvLyBBdHRlbXB0IHRvIHBhcnNlIHRoZSBoYXNoIGFzIGVpdGhlciBhbiBpbmRleCBvciBuYW1lXG5cdFx0dmFyIGJpdHMgPSBoYXNoLnNsaWNlKCAyICkuc3BsaXQoICcvJyApLFxuXHRcdFx0bmFtZSA9IGhhc2gucmVwbGFjZSggLyN8XFwvL2dpLCAnJyApO1xuXG5cdFx0Ly8gSWYgdGhlIGZpcnN0IGJpdCBpcyBpbnZhbGlkIGFuZCB0aGVyZSBpcyBhIG5hbWUgd2UgY2FuXG5cdFx0Ly8gYXNzdW1lIHRoYXQgdGhpcyBpcyBhIG5hbWVkIGxpbmtcblx0XHRpZiggaXNOYU4oIHBhcnNlSW50KCBiaXRzWzBdLCAxMCApICkgJiYgbmFtZS5sZW5ndGggKSB7XG5cdFx0XHQvLyBGaW5kIHRoZSBzbGlkZSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZVxuXHRcdFx0dmFyIGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCAnIycgKyBuYW1lICk7XG5cblx0XHRcdGlmKCBlbGVtZW50ICkge1xuXHRcdFx0XHQvLyBGaW5kIHRoZSBwb3NpdGlvbiBvZiB0aGUgbmFtZWQgc2xpZGUgYW5kIG5hdmlnYXRlIHRvIGl0XG5cdFx0XHRcdHZhciBpbmRpY2VzID0gUmV2ZWFsLmdldEluZGljZXMoIGVsZW1lbnQgKTtcblx0XHRcdFx0c2xpZGUoIGluZGljZXMuaCwgaW5kaWNlcy52ICk7XG5cdFx0XHR9XG5cdFx0XHQvLyBJZiB0aGUgc2xpZGUgZG9lc24ndCBleGlzdCwgbmF2aWdhdGUgdG8gdGhlIGN1cnJlbnQgc2xpZGVcblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRzbGlkZSggaW5kZXhoIHx8IDAsIGluZGV4diB8fCAwICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gUmVhZCB0aGUgaW5kZXggY29tcG9uZW50cyBvZiB0aGUgaGFzaFxuXHRcdFx0dmFyIGggPSBwYXJzZUludCggYml0c1swXSwgMTAgKSB8fCAwLFxuXHRcdFx0XHR2ID0gcGFyc2VJbnQoIGJpdHNbMV0sIDEwICkgfHwgMDtcblxuXHRcdFx0aWYoIGggIT09IGluZGV4aCB8fCB2ICE9PSBpbmRleHYgKSB7XG5cdFx0XHRcdHNsaWRlKCBoLCB2ICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyB0aGUgcGFnZSBVUkwgKGhhc2gpIHRvIHJlZmxlY3QgdGhlIGN1cnJlbnRcblx0ICogc3RhdGUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSBUaGUgdGltZSBpbiBtcyB0byB3YWl0IGJlZm9yZVxuXHQgKiB3cml0aW5nIHRoZSBoYXNoXG5cdCAqL1xuXHRmdW5jdGlvbiB3cml0ZVVSTCggZGVsYXkgKSB7XG5cblx0XHRpZiggY29uZmlnLmhpc3RvcnkgKSB7XG5cblx0XHRcdC8vIE1ha2Ugc3VyZSB0aGVyZSdzIG5ldmVyIG1vcmUgdGhhbiBvbmUgdGltZW91dCBydW5uaW5nXG5cdFx0XHRjbGVhclRpbWVvdXQoIHdyaXRlVVJMVGltZW91dCApO1xuXG5cdFx0XHQvLyBJZiBhIGRlbGF5IGlzIHNwZWNpZmllZCwgdGltZW91dCB0aGlzIGNhbGxcblx0XHRcdGlmKCB0eXBlb2YgZGVsYXkgPT09ICdudW1iZXInICkge1xuXHRcdFx0XHR3cml0ZVVSTFRpbWVvdXQgPSBzZXRUaW1lb3V0KCB3cml0ZVVSTCwgZGVsYXkgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR2YXIgdXJsID0gJy8nO1xuXG5cdFx0XHRcdC8vIElmIHRoZSBjdXJyZW50IHNsaWRlIGhhcyBhbiBJRCwgdXNlIHRoYXQgYXMgYSBuYW1lZCBsaW5rXG5cdFx0XHRcdGlmKCBjdXJyZW50U2xpZGUgJiYgdHlwZW9mIGN1cnJlbnRTbGlkZS5nZXRBdHRyaWJ1dGUoICdpZCcgKSA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHRcdFx0dXJsID0gJy8nICsgY3VycmVudFNsaWRlLmdldEF0dHJpYnV0ZSggJ2lkJyApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIE90aGVyd2lzZSB1c2UgdGhlIC9oL3YgaW5kZXhcblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0aWYoIGluZGV4aCA+IDAgfHwgaW5kZXh2ID4gMCApIHVybCArPSBpbmRleGg7XG5cdFx0XHRcdFx0aWYoIGluZGV4diA+IDAgKSB1cmwgKz0gJy8nICsgaW5kZXh2O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0d2luZG93LmxvY2F0aW9uLmhhc2ggPSB1cmw7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSBoL3YgbG9jYXRpb24gb2YgdGhlIGN1cnJlbnQsIG9yIHNwZWNpZmllZCxcblx0ICogc2xpZGUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHNsaWRlIElmIHNwZWNpZmllZCwgdGhlIHJldHVybmVkXG5cdCAqIGluZGV4IHdpbGwgYmUgZm9yIHRoaXMgc2xpZGUgcmF0aGVyIHRoYW4gdGhlIGN1cnJlbnRseVxuXHQgKiBhY3RpdmUgb25lXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0geyBoOiA8aW50PiwgdjogPGludD4sIGY6IDxpbnQ+IH1cblx0ICovXG5cdGZ1bmN0aW9uIGdldEluZGljZXMoIHNsaWRlICkge1xuXG5cdFx0Ly8gQnkgZGVmYXVsdCwgcmV0dXJuIHRoZSBjdXJyZW50IGluZGljZXNcblx0XHR2YXIgaCA9IGluZGV4aCxcblx0XHRcdHYgPSBpbmRleHYsXG5cdFx0XHRmO1xuXG5cdFx0Ly8gSWYgYSBzbGlkZSBpcyBzcGVjaWZpZWQsIHJldHVybiB0aGUgaW5kaWNlcyBvZiB0aGF0IHNsaWRlXG5cdFx0aWYoIHNsaWRlICkge1xuXHRcdFx0dmFyIGlzVmVydGljYWwgPSBpc1ZlcnRpY2FsU2xpZGUoIHNsaWRlICk7XG5cdFx0XHR2YXIgc2xpZGVoID0gaXNWZXJ0aWNhbCA/IHNsaWRlLnBhcmVudE5vZGUgOiBzbGlkZTtcblxuXHRcdFx0Ly8gU2VsZWN0IGFsbCBob3Jpem9udGFsIHNsaWRlc1xuXHRcdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApICk7XG5cblx0XHRcdC8vIE5vdyB0aGF0IHdlIGtub3cgd2hpY2ggdGhlIGhvcml6b250YWwgc2xpZGUgaXMsIGdldCBpdHMgaW5kZXhcblx0XHRcdGggPSBNYXRoLm1heCggaG9yaXpvbnRhbFNsaWRlcy5pbmRleE9mKCBzbGlkZWggKSwgMCApO1xuXG5cdFx0XHQvLyBJZiB0aGlzIGlzIGEgdmVydGljYWwgc2xpZGUsIGdyYWIgdGhlIHZlcnRpY2FsIGluZGV4XG5cdFx0XHRpZiggaXNWZXJ0aWNhbCApIHtcblx0XHRcdFx0diA9IE1hdGgubWF4KCB0b0FycmF5KCBzbGlkZS5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApICkuaW5kZXhPZiggc2xpZGUgKSwgMCApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKCAhc2xpZGUgJiYgY3VycmVudFNsaWRlICkge1xuXHRcdFx0dmFyIGhhc0ZyYWdtZW50cyA9IGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50JyApLmxlbmd0aCA+IDA7XG5cdFx0XHRpZiggaGFzRnJhZ21lbnRzICkge1xuXHRcdFx0XHR2YXIgdmlzaWJsZUZyYWdtZW50cyA9IGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50LnZpc2libGUnICk7XG5cdFx0XHRcdGYgPSB2aXNpYmxlRnJhZ21lbnRzLmxlbmd0aCAtIDE7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgaDogaCwgdjogdiwgZjogZiB9O1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJuIGEgc29ydGVkIGZyYWdtZW50cyBsaXN0LCBvcmRlcmVkIGJ5IGFuIGluY3JlYXNpbmdcblx0ICogXCJkYXRhLWZyYWdtZW50LWluZGV4XCIgYXR0cmlidXRlLlxuXHQgKlxuXHQgKiBGcmFnbWVudHMgd2lsbCBiZSByZXZlYWxlZCBpbiB0aGUgb3JkZXIgdGhhdCB0aGV5IGFyZSByZXR1cm5lZCBieVxuXHQgKiB0aGlzIGZ1bmN0aW9uLCBzbyB5b3UgY2FuIHVzZSB0aGUgaW5kZXggYXR0cmlidXRlcyB0byBjb250cm9sIHRoZVxuXHQgKiBvcmRlciBvZiBmcmFnbWVudCBhcHBlYXJhbmNlLlxuXHQgKlxuXHQgKiBUbyBtYWludGFpbiBhIHNlbnNpYmxlIGRlZmF1bHQgZnJhZ21lbnQgb3JkZXIsIGZyYWdtZW50cyBhcmUgcHJlc3VtZWRcblx0ICogdG8gYmUgcGFzc2VkIGluIGRvY3VtZW50IG9yZGVyLiBUaGlzIGZ1bmN0aW9uIGFkZHMgYSBcImZyYWdtZW50LWluZGV4XCJcblx0ICogYXR0cmlidXRlIHRvIGVhY2ggbm9kZSBpZiBzdWNoIGFuIGF0dHJpYnV0ZSBpcyBub3QgYWxyZWFkeSBwcmVzZW50LFxuXHQgKiBhbmQgc2V0cyB0aGF0IGF0dHJpYnV0ZSB0byBhbiBpbnRlZ2VyIHZhbHVlIHdoaWNoIGlzIHRoZSBwb3NpdGlvbiBvZlxuXHQgKiB0aGUgZnJhZ21lbnQgd2l0aGluIHRoZSBmcmFnbWVudHMgbGlzdC5cblx0ICovXG5cdGZ1bmN0aW9uIHNvcnRGcmFnbWVudHMoIGZyYWdtZW50cyApIHtcblxuXHRcdGZyYWdtZW50cyA9IHRvQXJyYXkoIGZyYWdtZW50cyApO1xuXG5cdFx0dmFyIG9yZGVyZWQgPSBbXSxcblx0XHRcdHVub3JkZXJlZCA9IFtdLFxuXHRcdFx0c29ydGVkID0gW107XG5cblx0XHQvLyBHcm91cCBvcmRlcmVkIGFuZCB1bm9yZGVyZWQgZWxlbWVudHNcblx0XHRmcmFnbWVudHMuZm9yRWFjaCggZnVuY3Rpb24oIGZyYWdtZW50LCBpICkge1xuXHRcdFx0aWYoIGZyYWdtZW50Lmhhc0F0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnICkgKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9IHBhcnNlSW50KCBmcmFnbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JyApLCAxMCApO1xuXG5cdFx0XHRcdGlmKCAhb3JkZXJlZFtpbmRleF0gKSB7XG5cdFx0XHRcdFx0b3JkZXJlZFtpbmRleF0gPSBbXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG9yZGVyZWRbaW5kZXhdLnB1c2goIGZyYWdtZW50ICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dW5vcmRlcmVkLnB1c2goIFsgZnJhZ21lbnQgXSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdC8vIEFwcGVuZCBmcmFnbWVudHMgd2l0aG91dCBleHBsaWNpdCBpbmRpY2VzIGluIHRoZWlyXG5cdFx0Ly8gRE9NIG9yZGVyXG5cdFx0b3JkZXJlZCA9IG9yZGVyZWQuY29uY2F0KCB1bm9yZGVyZWQgKTtcblxuXHRcdC8vIE1hbnVhbGx5IGNvdW50IHRoZSBpbmRleCB1cCBwZXIgZ3JvdXAgdG8gZW5zdXJlIHRoZXJlXG5cdFx0Ly8gYXJlIG5vIGdhcHNcblx0XHR2YXIgaW5kZXggPSAwO1xuXG5cdFx0Ly8gUHVzaCBhbGwgZnJhZ21lbnRzIGluIHRoZWlyIHNvcnRlZCBvcmRlciB0byBhbiBhcnJheSxcblx0XHQvLyB0aGlzIGZsYXR0ZW5zIHRoZSBncm91cHNcblx0XHRvcmRlcmVkLmZvckVhY2goIGZ1bmN0aW9uKCBncm91cCApIHtcblx0XHRcdGdyb3VwLmZvckVhY2goIGZ1bmN0aW9uKCBmcmFnbWVudCApIHtcblx0XHRcdFx0c29ydGVkLnB1c2goIGZyYWdtZW50ICk7XG5cdFx0XHRcdGZyYWdtZW50LnNldEF0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnLCBpbmRleCApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRpbmRleCArKztcblx0XHR9ICk7XG5cblx0XHRyZXR1cm4gc29ydGVkO1xuXG5cdH1cblxuXHQvKipcblx0ICogTmF2aWdhdGUgdG8gdGhlIHNwZWNpZmllZCBzbGlkZSBmcmFnbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZnJhZ21lbnQgdGhhdFxuXHQgKiBzaG91bGQgYmUgc2hvd24sIC0xIG1lYW5zIGFsbCBhcmUgaW52aXNpYmxlXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXQgSW50ZWdlciBvZmZzZXQgdG8gYXBwbHkgdG8gdGhlXG5cdCAqIGZyYWdtZW50IGluZGV4XG5cdCAqXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYSBjaGFuZ2Ugd2FzIG1hZGUgaW4gYW55XG5cdCAqIGZyYWdtZW50cyB2aXNpYmlsaXR5IGFzIHBhcnQgb2YgdGhpcyBjYWxsXG5cdCAqL1xuXHRmdW5jdGlvbiBuYXZpZ2F0ZUZyYWdtZW50KCBpbmRleCwgb2Zmc2V0ICkge1xuXG5cdFx0aWYoIGN1cnJlbnRTbGlkZSAmJiBjb25maWcuZnJhZ21lbnRzICkge1xuXG5cdFx0XHR2YXIgZnJhZ21lbnRzID0gc29ydEZyYWdtZW50cyggY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICkgKTtcblx0XHRcdGlmKCBmcmFnbWVudHMubGVuZ3RoICkge1xuXG5cdFx0XHRcdC8vIElmIG5vIGluZGV4IGlzIHNwZWNpZmllZCwgZmluZCB0aGUgY3VycmVudFxuXHRcdFx0XHRpZiggdHlwZW9mIGluZGV4ICE9PSAnbnVtYmVyJyApIHtcblx0XHRcdFx0XHR2YXIgbGFzdFZpc2libGVGcmFnbWVudCA9IHNvcnRGcmFnbWVudHMoIGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50LnZpc2libGUnICkgKS5wb3AoKTtcblxuXHRcdFx0XHRcdGlmKCBsYXN0VmlzaWJsZUZyYWdtZW50ICkge1xuXHRcdFx0XHRcdFx0aW5kZXggPSBwYXJzZUludCggbGFzdFZpc2libGVGcmFnbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JyApIHx8IDAsIDEwICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0aW5kZXggPSAtMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBJZiBhbiBvZmZzZXQgaXMgc3BlY2lmaWVkLCBhcHBseSBpdCB0byB0aGUgaW5kZXhcblx0XHRcdFx0aWYoIHR5cGVvZiBvZmZzZXQgPT09ICdudW1iZXInICkge1xuXHRcdFx0XHRcdGluZGV4ICs9IG9mZnNldDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBmcmFnbWVudHNTaG93biA9IFtdLFxuXHRcdFx0XHRcdGZyYWdtZW50c0hpZGRlbiA9IFtdO1xuXG5cdFx0XHRcdHRvQXJyYXkoIGZyYWdtZW50cyApLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50LCBpICkge1xuXG5cdFx0XHRcdFx0aWYoIGVsZW1lbnQuaGFzQXR0cmlidXRlKCAnZGF0YS1mcmFnbWVudC1pbmRleCcgKSApIHtcblx0XHRcdFx0XHRcdGkgPSBwYXJzZUludCggZWxlbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JyApLCAxMCApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIFZpc2libGUgZnJhZ21lbnRzXG5cdFx0XHRcdFx0aWYoIGkgPD0gaW5kZXggKSB7XG5cdFx0XHRcdFx0XHRpZiggIWVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCAndmlzaWJsZScgKSApIGZyYWdtZW50c1Nob3duLnB1c2goIGVsZW1lbnQgKTtcblx0XHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ3Zpc2libGUnICk7XG5cdFx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdjdXJyZW50LWZyYWdtZW50JyApO1xuXG5cdFx0XHRcdFx0XHRpZiggaSA9PT0gaW5kZXggKSB7XG5cdFx0XHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ2N1cnJlbnQtZnJhZ21lbnQnICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIEhpZGRlbiBmcmFnbWVudHNcblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGlmKCBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyggJ3Zpc2libGUnICkgKSBmcmFnbWVudHNIaWRkZW4ucHVzaCggZWxlbWVudCApO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAndmlzaWJsZScgKTtcblx0XHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ2N1cnJlbnQtZnJhZ21lbnQnICk7XG5cdFx0XHRcdFx0fVxuXG5cblx0XHRcdFx0fSApO1xuXG5cdFx0XHRcdGlmKCBmcmFnbWVudHNIaWRkZW4ubGVuZ3RoICkge1xuXHRcdFx0XHRcdGRpc3BhdGNoRXZlbnQoICdmcmFnbWVudGhpZGRlbicsIHsgZnJhZ21lbnQ6IGZyYWdtZW50c0hpZGRlblswXSwgZnJhZ21lbnRzOiBmcmFnbWVudHNIaWRkZW4gfSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIGZyYWdtZW50c1Nob3duLmxlbmd0aCApIHtcblx0XHRcdFx0XHRkaXNwYXRjaEV2ZW50KCAnZnJhZ21lbnRzaG93bicsIHsgZnJhZ21lbnQ6IGZyYWdtZW50c1Nob3duWzBdLCBmcmFnbWVudHM6IGZyYWdtZW50c1Nob3duIH0gKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHVwZGF0ZUNvbnRyb2xzKCk7XG5cblx0XHRcdFx0cmV0dXJuICEhKCBmcmFnbWVudHNTaG93bi5sZW5ndGggfHwgZnJhZ21lbnRzSGlkZGVuLmxlbmd0aCApO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBOYXZpZ2F0ZSB0byB0aGUgbmV4dCBzbGlkZSBmcmFnbWVudC5cblx0ICpcblx0ICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiB0aGVyZSB3YXMgYSBuZXh0IGZyYWdtZW50LFxuXHQgKiBmYWxzZSBvdGhlcndpc2Vcblx0ICovXG5cdGZ1bmN0aW9uIG5leHRGcmFnbWVudCgpIHtcblxuXHRcdHJldHVybiBuYXZpZ2F0ZUZyYWdtZW50KCBudWxsLCAxICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBOYXZpZ2F0ZSB0byB0aGUgcHJldmlvdXMgc2xpZGUgZnJhZ21lbnQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgdGhlcmUgd2FzIGEgcHJldmlvdXMgZnJhZ21lbnQsXG5cdCAqIGZhbHNlIG90aGVyd2lzZVxuXHQgKi9cblx0ZnVuY3Rpb24gcHJldmlvdXNGcmFnbWVudCgpIHtcblxuXHRcdHJldHVybiBuYXZpZ2F0ZUZyYWdtZW50KCBudWxsLCAtMSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ3VlcyBhIG5ldyBhdXRvbWF0ZWQgc2xpZGUgaWYgZW5hYmxlZCBpbiB0aGUgY29uZmlnLlxuXHQgKi9cblx0ZnVuY3Rpb24gY3VlQXV0b1NsaWRlKCkge1xuXG5cdFx0Y2FuY2VsQXV0b1NsaWRlKCk7XG5cblx0XHRpZiggY3VycmVudFNsaWRlICkge1xuXG5cdFx0XHR2YXIgcGFyZW50QXV0b1NsaWRlID0gY3VycmVudFNsaWRlLnBhcmVudE5vZGUgPyBjdXJyZW50U2xpZGUucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWF1dG9zbGlkZScgKSA6IG51bGw7XG5cdFx0XHR2YXIgc2xpZGVBdXRvU2xpZGUgPSBjdXJyZW50U2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1hdXRvc2xpZGUnICk7XG5cblx0XHRcdC8vIFBpY2sgdmFsdWUgaW4gdGhlIGZvbGxvd2luZyBwcmlvcml0eSBvcmRlcjpcblx0XHRcdC8vIDEuIEN1cnJlbnQgc2xpZGUncyBkYXRhLWF1dG9zbGlkZVxuXHRcdFx0Ly8gMi4gUGFyZW50IHNsaWRlJ3MgZGF0YS1hdXRvc2xpZGVcblx0XHRcdC8vIDMuIEdsb2JhbCBhdXRvU2xpZGUgc2V0dGluZ1xuXHRcdFx0aWYoIHNsaWRlQXV0b1NsaWRlICkge1xuXHRcdFx0XHRhdXRvU2xpZGUgPSBwYXJzZUludCggc2xpZGVBdXRvU2xpZGUsIDEwICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKCBwYXJlbnRBdXRvU2xpZGUgKSB7XG5cdFx0XHRcdGF1dG9TbGlkZSA9IHBhcnNlSW50KCBwYXJlbnRBdXRvU2xpZGUsIDEwICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0YXV0b1NsaWRlID0gY29uZmlnLmF1dG9TbGlkZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgdGhlcmUgYXJlIG1lZGlhIGVsZW1lbnRzIHdpdGggZGF0YS1hdXRvcGxheSxcblx0XHRcdC8vIGF1dG9tYXRpY2FsbHkgc2V0IHRoZSBhdXRvU2xpZGUgZHVyYXRpb24gdG8gdGhlXG5cdFx0XHQvLyBsZW5ndGggb2YgdGhhdCBtZWRpYVxuXHRcdFx0dG9BcnJheSggY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICd2aWRlbywgYXVkaW8nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdGlmKCBlbC5oYXNBdHRyaWJ1dGUoICdkYXRhLWF1dG9wbGF5JyApICkge1xuXHRcdFx0XHRcdGlmKCBhdXRvU2xpZGUgJiYgZWwuZHVyYXRpb24gKiAxMDAwID4gYXV0b1NsaWRlICkge1xuXHRcdFx0XHRcdFx0YXV0b1NsaWRlID0gKCBlbC5kdXJhdGlvbiAqIDEwMDAgKSArIDEwMDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIEN1ZSB0aGUgbmV4dCBhdXRvLXNsaWRlIGlmOlxuXHRcdFx0Ly8gLSBUaGVyZSBpcyBhbiBhdXRvU2xpZGUgdmFsdWVcblx0XHRcdC8vIC0gQXV0by1zbGlkaW5nIGlzbid0IHBhdXNlZCBieSB0aGUgdXNlclxuXHRcdFx0Ly8gLSBUaGUgcHJlc2VudGF0aW9uIGlzbid0IHBhdXNlZFxuXHRcdFx0Ly8gLSBUaGUgb3ZlcnZpZXcgaXNuJ3QgYWN0aXZlXG5cdFx0XHQvLyAtIFRoZSBwcmVzZW50YXRpb24gaXNuJ3Qgb3ZlclxuXHRcdFx0aWYoIGF1dG9TbGlkZSAmJiAhYXV0b1NsaWRlUGF1c2VkICYmICFpc1BhdXNlZCgpICYmICFpc092ZXJ2aWV3KCkgJiYgKCAhUmV2ZWFsLmlzTGFzdFNsaWRlKCkgfHwgY29uZmlnLmxvb3AgPT09IHRydWUgKSApIHtcblx0XHRcdFx0YXV0b1NsaWRlVGltZW91dCA9IHNldFRpbWVvdXQoIG5hdmlnYXRlTmV4dCwgYXV0b1NsaWRlICk7XG5cdFx0XHRcdGF1dG9TbGlkZVN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCBhdXRvU2xpZGVQbGF5ZXIgKSB7XG5cdFx0XHRcdGF1dG9TbGlkZVBsYXllci5zZXRQbGF5aW5nKCBhdXRvU2xpZGVUaW1lb3V0ICE9PSAtMSApO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2FuY2VscyBhbnkgb25nb2luZyByZXF1ZXN0IHRvIGF1dG8tc2xpZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiBjYW5jZWxBdXRvU2xpZGUoKSB7XG5cblx0XHRjbGVhclRpbWVvdXQoIGF1dG9TbGlkZVRpbWVvdXQgKTtcblx0XHRhdXRvU2xpZGVUaW1lb3V0ID0gLTE7XG5cblx0fVxuXG5cdGZ1bmN0aW9uIHBhdXNlQXV0b1NsaWRlKCkge1xuXG5cdFx0YXV0b1NsaWRlUGF1c2VkID0gdHJ1ZTtcblx0XHRjbGVhclRpbWVvdXQoIGF1dG9TbGlkZVRpbWVvdXQgKTtcblxuXHRcdGlmKCBhdXRvU2xpZGVQbGF5ZXIgKSB7XG5cdFx0XHRhdXRvU2xpZGVQbGF5ZXIuc2V0UGxheWluZyggZmFsc2UgKTtcblx0XHR9XG5cblx0fVxuXG5cdGZ1bmN0aW9uIHJlc3VtZUF1dG9TbGlkZSgpIHtcblxuXHRcdGF1dG9TbGlkZVBhdXNlZCA9IGZhbHNlO1xuXHRcdGN1ZUF1dG9TbGlkZSgpO1xuXG5cdH1cblxuXHRmdW5jdGlvbiBuYXZpZ2F0ZUxlZnQoKSB7XG5cblx0XHQvLyBSZXZlcnNlIGZvciBSVExcblx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBuZXh0RnJhZ21lbnQoKSA9PT0gZmFsc2UgKSAmJiBhdmFpbGFibGVSb3V0ZXMoKS5sZWZ0ICkge1xuXHRcdFx0XHRzbGlkZSggaW5kZXhoICsgMSApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBOb3JtYWwgbmF2aWdhdGlvblxuXHRcdGVsc2UgaWYoICggaXNPdmVydmlldygpIHx8IHByZXZpb3VzRnJhZ21lbnQoKSA9PT0gZmFsc2UgKSAmJiBhdmFpbGFibGVSb3V0ZXMoKS5sZWZ0ICkge1xuXHRcdFx0c2xpZGUoIGluZGV4aCAtIDEgKTtcblx0XHR9XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG5hdmlnYXRlUmlnaHQoKSB7XG5cblx0XHQvLyBSZXZlcnNlIGZvciBSVExcblx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBwcmV2aW91c0ZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkucmlnaHQgKSB7XG5cdFx0XHRcdHNsaWRlKCBpbmRleGggLSAxICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIE5vcm1hbCBuYXZpZ2F0aW9uXG5cdFx0ZWxzZSBpZiggKCBpc092ZXJ2aWV3KCkgfHwgbmV4dEZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkucmlnaHQgKSB7XG5cdFx0XHRzbGlkZSggaW5kZXhoICsgMSApO1xuXHRcdH1cblxuXHR9XG5cblx0ZnVuY3Rpb24gbmF2aWdhdGVVcCgpIHtcblxuXHRcdC8vIFByaW9yaXRpemUgaGlkaW5nIGZyYWdtZW50c1xuXHRcdGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBwcmV2aW91c0ZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkudXAgKSB7XG5cdFx0XHRzbGlkZSggaW5kZXhoLCBpbmRleHYgLSAxICk7XG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiBuYXZpZ2F0ZURvd24oKSB7XG5cblx0XHQvLyBQcmlvcml0aXplIHJldmVhbGluZyBmcmFnbWVudHNcblx0XHRpZiggKCBpc092ZXJ2aWV3KCkgfHwgbmV4dEZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkuZG93biApIHtcblx0XHRcdHNsaWRlKCBpbmRleGgsIGluZGV4diArIDEgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBOYXZpZ2F0ZXMgYmFja3dhcmRzLCBwcmlvcml0aXplZCBpbiB0aGUgZm9sbG93aW5nIG9yZGVyOlxuXHQgKiAxKSBQcmV2aW91cyBmcmFnbWVudFxuXHQgKiAyKSBQcmV2aW91cyB2ZXJ0aWNhbCBzbGlkZVxuXHQgKiAzKSBQcmV2aW91cyBob3Jpem9udGFsIHNsaWRlXG5cdCAqL1xuXHRmdW5jdGlvbiBuYXZpZ2F0ZVByZXYoKSB7XG5cblx0XHQvLyBQcmlvcml0aXplIHJldmVhbGluZyBmcmFnbWVudHNcblx0XHRpZiggcHJldmlvdXNGcmFnbWVudCgpID09PSBmYWxzZSApIHtcblx0XHRcdGlmKCBhdmFpbGFibGVSb3V0ZXMoKS51cCApIHtcblx0XHRcdFx0bmF2aWdhdGVVcCgpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdC8vIEZldGNoIHRoZSBwcmV2aW91cyBob3Jpem9udGFsIHNsaWRlLCBpZiB0aGVyZSBpcyBvbmVcblx0XHRcdFx0dmFyIHByZXZpb3VzU2xpZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiArICcucGFzdDpudGgtY2hpbGQoJyArIGluZGV4aCArICcpJyApO1xuXG5cdFx0XHRcdGlmKCBwcmV2aW91c1NsaWRlICkge1xuXHRcdFx0XHRcdHZhciB2ID0gKCBwcmV2aW91c1NsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApLmxlbmd0aCAtIDEgKSB8fCB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0dmFyIGggPSBpbmRleGggLSAxO1xuXHRcdFx0XHRcdHNsaWRlKCBoLCB2ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTYW1lIGFzICNuYXZpZ2F0ZVByZXYoKSBidXQgbmF2aWdhdGVzIGZvcndhcmRzLlxuXHQgKi9cblx0ZnVuY3Rpb24gbmF2aWdhdGVOZXh0KCkge1xuXG5cdFx0Ly8gUHJpb3JpdGl6ZSByZXZlYWxpbmcgZnJhZ21lbnRzXG5cdFx0aWYoIG5leHRGcmFnbWVudCgpID09PSBmYWxzZSApIHtcblx0XHRcdGF2YWlsYWJsZVJvdXRlcygpLmRvd24gPyBuYXZpZ2F0ZURvd24oKSA6IG5hdmlnYXRlUmlnaHQoKTtcblx0XHR9XG5cblx0XHQvLyBJZiBhdXRvLXNsaWRpbmcgaXMgZW5hYmxlZCB3ZSBuZWVkIHRvIGN1ZSB1cFxuXHRcdC8vIGFub3RoZXIgdGltZW91dFxuXHRcdGN1ZUF1dG9TbGlkZSgpO1xuXG5cdH1cblxuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRVZFTlRTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cblx0LyoqXG5cdCAqIENhbGxlZCBieSBhbGwgZXZlbnQgaGFuZGxlcnMgdGhhdCBhcmUgYmFzZWQgb24gdXNlclxuXHQgKiBpbnB1dC5cblx0ICovXG5cdGZ1bmN0aW9uIG9uVXNlcklucHV0KCBldmVudCApIHtcblxuXHRcdGlmKCBjb25maWcuYXV0b1NsaWRlU3RvcHBhYmxlICkge1xuXHRcdFx0cGF1c2VBdXRvU2xpZGUoKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVyIGZvciB0aGUgZG9jdW1lbnQgbGV2ZWwgJ2tleWRvd24nIGV2ZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25Eb2N1bWVudEtleURvd24oIGV2ZW50ICkge1xuXG5cdFx0b25Vc2VySW5wdXQoIGV2ZW50ICk7XG5cblx0XHQvLyBDaGVjayBpZiB0aGVyZSdzIGEgZm9jdXNlZCBlbGVtZW50IHRoYXQgY291bGQgYmUgdXNpbmdcblx0XHQvLyB0aGUga2V5Ym9hcmRcblx0XHR2YXIgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cdFx0dmFyIGhhc0ZvY3VzID0gISEoIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgJiYgKCBkb2N1bWVudC5hY3RpdmVFbGVtZW50LnR5cGUgfHwgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ocmVmIHx8IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY29udGVudEVkaXRhYmxlICE9PSAnaW5oZXJpdCcgKSApO1xuXG5cdFx0Ly8gRGlzcmVnYXJkIHRoZSBldmVudCBpZiB0aGVyZSdzIGEgZm9jdXNlZCBlbGVtZW50IG9yIGFcblx0XHQvLyBrZXlib2FyZCBtb2RpZmllciBrZXkgaXMgcHJlc2VudFxuXHRcdGlmKCBoYXNGb2N1cyB8fCAoZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQua2V5Q29kZSAhPT0gMzIpIHx8IGV2ZW50LmFsdEtleSB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50Lm1ldGFLZXkgKSByZXR1cm47XG5cblx0XHQvLyBXaGlsZSBwYXVzZWQgb25seSBhbGxvdyBcInVucGF1c2luZ1wiIGtleWJvYXJkIGV2ZW50cyAoYiBhbmQgLilcblx0XHRpZiggaXNQYXVzZWQoKSAmJiBbNjYsMTkwLDE5MV0uaW5kZXhPZiggZXZlbnQua2V5Q29kZSApID09PSAtMSApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHR2YXIgdHJpZ2dlcmVkID0gZmFsc2U7XG5cblx0XHQvLyAxLiBVc2VyIGRlZmluZWQga2V5IGJpbmRpbmdzXG5cdFx0aWYoIHR5cGVvZiBjb25maWcua2V5Ym9hcmQgPT09ICdvYmplY3QnICkge1xuXG5cdFx0XHRmb3IoIHZhciBrZXkgaW4gY29uZmlnLmtleWJvYXJkICkge1xuXG5cdFx0XHRcdC8vIENoZWNrIGlmIHRoaXMgYmluZGluZyBtYXRjaGVzIHRoZSBwcmVzc2VkIGtleVxuXHRcdFx0XHRpZiggcGFyc2VJbnQoIGtleSwgMTAgKSA9PT0gZXZlbnQua2V5Q29kZSApIHtcblxuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IGNvbmZpZy5rZXlib2FyZFsga2V5IF07XG5cblx0XHRcdFx0XHQvLyBDYWxsYmFjayBmdW5jdGlvblxuXHRcdFx0XHRcdGlmKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRcdFx0XHR2YWx1ZS5hcHBseSggbnVsbCwgWyBldmVudCBdICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIFN0cmluZyBzaG9ydGN1dHMgdG8gcmV2ZWFsLmpzIEFQSVxuXHRcdFx0XHRcdGVsc2UgaWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIFJldmVhbFsgdmFsdWUgXSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0XHRcdFJldmVhbFsgdmFsdWUgXS5jYWxsKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dHJpZ2dlcmVkID0gdHJ1ZTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdC8vIDIuIFN5c3RlbSBkZWZpbmVkIGtleSBiaW5kaW5nc1xuXHRcdGlmKCB0cmlnZ2VyZWQgPT09IGZhbHNlICkge1xuXG5cdFx0XHQvLyBBc3N1bWUgdHJ1ZSBhbmQgdHJ5IHRvIHByb3ZlIGZhbHNlXG5cdFx0XHR0cmlnZ2VyZWQgPSB0cnVlO1xuXG5cdFx0XHRzd2l0Y2goIGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHRcdC8vIHAsIHBhZ2UgdXBcblx0XHRcdFx0Y2FzZSA4MDogY2FzZSAzMzogbmF2aWdhdGVQcmV2KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBuLCBwYWdlIGRvd25cblx0XHRcdFx0Y2FzZSA3ODogY2FzZSAzNDogbmF2aWdhdGVOZXh0KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBoLCBsZWZ0XG5cdFx0XHRcdGNhc2UgNzI6IGNhc2UgMzc6IG5hdmlnYXRlTGVmdCgpOyBicmVhaztcblx0XHRcdFx0Ly8gbCwgcmlnaHRcblx0XHRcdFx0Y2FzZSA3NjogY2FzZSAzOTogbmF2aWdhdGVSaWdodCgpOyBicmVhaztcblx0XHRcdFx0Ly8gaywgdXBcblx0XHRcdFx0Y2FzZSA3NTogY2FzZSAzODogbmF2aWdhdGVVcCgpOyBicmVhaztcblx0XHRcdFx0Ly8gaiwgZG93blxuXHRcdFx0XHRjYXNlIDc0OiBjYXNlIDQwOiBuYXZpZ2F0ZURvd24oKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGhvbWVcblx0XHRcdFx0Y2FzZSAzNjogc2xpZGUoIDAgKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGVuZFxuXHRcdFx0XHRjYXNlIDM1OiBzbGlkZSggTnVtYmVyLk1BWF9WQUxVRSApOyBicmVhaztcblx0XHRcdFx0Ly8gc3BhY2Vcblx0XHRcdFx0Y2FzZSAzMjogaXNPdmVydmlldygpID8gZGVhY3RpdmF0ZU92ZXJ2aWV3KCkgOiBldmVudC5zaGlmdEtleSA/IG5hdmlnYXRlUHJldigpIDogbmF2aWdhdGVOZXh0KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyByZXR1cm5cblx0XHRcdFx0Y2FzZSAxMzogaXNPdmVydmlldygpID8gZGVhY3RpdmF0ZU92ZXJ2aWV3KCkgOiB0cmlnZ2VyZWQgPSBmYWxzZTsgYnJlYWs7XG5cdFx0XHRcdC8vIGIsIHBlcmlvZCwgTG9naXRlY2ggcHJlc2VudGVyIHRvb2xzIFwiYmxhY2sgc2NyZWVuXCIgYnV0dG9uXG5cdFx0XHRcdGNhc2UgNjY6IGNhc2UgMTkwOiBjYXNlIDE5MTogdG9nZ2xlUGF1c2UoKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGZcblx0XHRcdFx0Y2FzZSA3MDogZW50ZXJGdWxsc2NyZWVuKCk7IGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdHRyaWdnZXJlZCA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIGlucHV0IHJlc3VsdGVkIGluIGEgdHJpZ2dlcmVkIGFjdGlvbiB3ZSBzaG91bGQgcHJldmVudFxuXHRcdC8vIHRoZSBicm93c2VycyBkZWZhdWx0IGJlaGF2aW9yXG5cdFx0aWYoIHRyaWdnZXJlZCApIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHRcdC8vIEVTQyBvciBPIGtleVxuXHRcdGVsc2UgaWYgKCAoIGV2ZW50LmtleUNvZGUgPT09IDI3IHx8IGV2ZW50LmtleUNvZGUgPT09IDc5ICkgJiYgZmVhdHVyZXMudHJhbnNmb3JtczNkICkge1xuXHRcdFx0aWYoIGRvbS5wcmV2aWV3ICkge1xuXHRcdFx0XHRjbG9zZVByZXZpZXcoKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0b2dnbGVPdmVydmlldygpO1xuXHRcdFx0fVxuXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdC8vIElmIGF1dG8tc2xpZGluZyBpcyBlbmFibGVkIHdlIG5lZWQgdG8gY3VlIHVwXG5cdFx0Ly8gYW5vdGhlciB0aW1lb3V0XG5cdFx0Y3VlQXV0b1NsaWRlKCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVyIGZvciB0aGUgJ3RvdWNoc3RhcnQnIGV2ZW50LCBlbmFibGVzIHN1cHBvcnQgZm9yXG5cdCAqIHN3aXBlIGFuZCBwaW5jaCBnZXN0dXJlcy5cblx0ICovXG5cdGZ1bmN0aW9uIG9uVG91Y2hTdGFydCggZXZlbnQgKSB7XG5cblx0XHR0b3VjaC5zdGFydFggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0dG91Y2guc3RhcnRZID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdHRvdWNoLnN0YXJ0Q291bnQgPSBldmVudC50b3VjaGVzLmxlbmd0aDtcblxuXHRcdC8vIElmIHRoZXJlJ3MgdHdvIHRvdWNoZXMgd2UgbmVlZCB0byBtZW1vcml6ZSB0aGUgZGlzdGFuY2Vcblx0XHQvLyBiZXR3ZWVuIHRob3NlIHR3byBwb2ludHMgdG8gZGV0ZWN0IHBpbmNoaW5nXG5cdFx0aWYoIGV2ZW50LnRvdWNoZXMubGVuZ3RoID09PSAyICYmIGNvbmZpZy5vdmVydmlldyApIHtcblx0XHRcdHRvdWNoLnN0YXJ0U3BhbiA9IGRpc3RhbmNlQmV0d2Vlbigge1xuXHRcdFx0XHR4OiBldmVudC50b3VjaGVzWzFdLmNsaWVudFgsXG5cdFx0XHRcdHk6IGV2ZW50LnRvdWNoZXNbMV0uY2xpZW50WVxuXHRcdFx0fSwge1xuXHRcdFx0XHR4OiB0b3VjaC5zdGFydFgsXG5cdFx0XHRcdHk6IHRvdWNoLnN0YXJ0WVxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSAndG91Y2htb3ZlJyBldmVudC5cblx0ICovXG5cdGZ1bmN0aW9uIG9uVG91Y2hNb3ZlKCBldmVudCApIHtcblxuXHRcdC8vIEVhY2ggdG91Y2ggc2hvdWxkIG9ubHkgdHJpZ2dlciBvbmUgYWN0aW9uXG5cdFx0aWYoICF0b3VjaC5jYXB0dXJlZCApIHtcblx0XHRcdG9uVXNlcklucHV0KCBldmVudCApO1xuXG5cdFx0XHR2YXIgY3VycmVudFggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHR2YXIgY3VycmVudFkgPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFk7XG5cblx0XHRcdC8vIElmIHRoZSB0b3VjaCBzdGFydGVkIHdpdGggdHdvIHBvaW50cyBhbmQgc3RpbGwgaGFzXG5cdFx0XHQvLyB0d28gYWN0aXZlIHRvdWNoZXM7IHRlc3QgZm9yIHRoZSBwaW5jaCBnZXN0dXJlXG5cdFx0XHRpZiggZXZlbnQudG91Y2hlcy5sZW5ndGggPT09IDIgJiYgdG91Y2guc3RhcnRDb3VudCA9PT0gMiAmJiBjb25maWcub3ZlcnZpZXcgKSB7XG5cblx0XHRcdFx0Ly8gVGhlIGN1cnJlbnQgZGlzdGFuY2UgaW4gcGl4ZWxzIGJldHdlZW4gdGhlIHR3byB0b3VjaCBwb2ludHNcblx0XHRcdFx0dmFyIGN1cnJlbnRTcGFuID0gZGlzdGFuY2VCZXR3ZWVuKCB7XG5cdFx0XHRcdFx0eDogZXZlbnQudG91Y2hlc1sxXS5jbGllbnRYLFxuXHRcdFx0XHRcdHk6IGV2ZW50LnRvdWNoZXNbMV0uY2xpZW50WVxuXHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0eDogdG91Y2guc3RhcnRYLFxuXHRcdFx0XHRcdHk6IHRvdWNoLnN0YXJ0WVxuXHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0Ly8gSWYgdGhlIHNwYW4gaXMgbGFyZ2VyIHRoYW4gdGhlIGRlc2lyZSBhbW91bnQgd2UndmUgZ290XG5cdFx0XHRcdC8vIG91cnNlbHZlcyBhIHBpbmNoXG5cdFx0XHRcdGlmKCBNYXRoLmFicyggdG91Y2guc3RhcnRTcGFuIC0gY3VycmVudFNwYW4gKSA+IHRvdWNoLnRocmVzaG9sZCApIHtcblx0XHRcdFx0XHR0b3VjaC5jYXB0dXJlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRpZiggY3VycmVudFNwYW4gPCB0b3VjaC5zdGFydFNwYW4gKSB7XG5cdFx0XHRcdFx0XHRhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZGVhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0fVxuXHRcdFx0Ly8gVGhlcmUgd2FzIG9ubHkgb25lIHRvdWNoIHBvaW50LCBsb29rIGZvciBhIHN3aXBlXG5cdFx0XHRlbHNlIGlmKCBldmVudC50b3VjaGVzLmxlbmd0aCA9PT0gMSAmJiB0b3VjaC5zdGFydENvdW50ICE9PSAyICkge1xuXG5cdFx0XHRcdHZhciBkZWx0YVggPSBjdXJyZW50WCAtIHRvdWNoLnN0YXJ0WCxcblx0XHRcdFx0XHRkZWx0YVkgPSBjdXJyZW50WSAtIHRvdWNoLnN0YXJ0WTtcblxuXHRcdFx0XHRpZiggZGVsdGFYID4gdG91Y2gudGhyZXNob2xkICYmIE1hdGguYWJzKCBkZWx0YVggKSA+IE1hdGguYWJzKCBkZWx0YVkgKSApIHtcblx0XHRcdFx0XHR0b3VjaC5jYXB0dXJlZCA9IHRydWU7XG5cdFx0XHRcdFx0bmF2aWdhdGVMZWZ0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiggZGVsdGFYIDwgLXRvdWNoLnRocmVzaG9sZCAmJiBNYXRoLmFicyggZGVsdGFYICkgPiBNYXRoLmFicyggZGVsdGFZICkgKSB7XG5cdFx0XHRcdFx0dG91Y2guY2FwdHVyZWQgPSB0cnVlO1xuXHRcdFx0XHRcdG5hdmlnYXRlUmlnaHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKCBkZWx0YVkgPiB0b3VjaC50aHJlc2hvbGQgKSB7XG5cdFx0XHRcdFx0dG91Y2guY2FwdHVyZWQgPSB0cnVlO1xuXHRcdFx0XHRcdG5hdmlnYXRlVXAoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKCBkZWx0YVkgPCAtdG91Y2gudGhyZXNob2xkICkge1xuXHRcdFx0XHRcdHRvdWNoLmNhcHR1cmVkID0gdHJ1ZTtcblx0XHRcdFx0XHRuYXZpZ2F0ZURvd24oKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIElmIHdlJ3JlIGVtYmVkZGVkLCBvbmx5IGJsb2NrIHRvdWNoIGV2ZW50cyBpZiB0aGV5IGhhdmVcblx0XHRcdFx0Ly8gdHJpZ2dlcmVkIGFuIGFjdGlvblxuXHRcdFx0XHRpZiggY29uZmlnLmVtYmVkZGVkICkge1xuXHRcdFx0XHRcdGlmKCB0b3VjaC5jYXB0dXJlZCB8fCBpc1ZlcnRpY2FsU2xpZGUoIGN1cnJlbnRTbGlkZSApICkge1xuXHRcdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gTm90IGVtYmVkZGVkPyBCbG9jayB0aGVtIGFsbCB0byBhdm9pZCBuZWVkbGVzcyB0b3NzaW5nXG5cdFx0XHRcdC8vIGFyb3VuZCBvZiB0aGUgdmlld3BvcnQgaW4gaU9TXG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBUaGVyZSdzIGEgYnVnIHdpdGggc3dpcGluZyBvbiBzb21lIEFuZHJvaWQgZGV2aWNlcyB1bmxlc3Ncblx0XHQvLyB0aGUgZGVmYXVsdCBhY3Rpb24gaXMgYWx3YXlzIHByZXZlbnRlZFxuXHRcdGVsc2UgaWYoIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goIC9hbmRyb2lkL2dpICkgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSAndG91Y2hlbmQnIGV2ZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25Ub3VjaEVuZCggZXZlbnQgKSB7XG5cblx0XHR0b3VjaC5jYXB0dXJlZCA9IGZhbHNlO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydCBwb2ludGVyIGRvd24gdG8gdG91Y2ggc3RhcnQuXG5cdCAqL1xuXHRmdW5jdGlvbiBvblBvaW50ZXJEb3duKCBldmVudCApIHtcblxuXHRcdGlmKCBldmVudC5wb2ludGVyVHlwZSA9PT0gZXZlbnQuTVNQT0lOVEVSX1RZUEVfVE9VQ0ggKSB7XG5cdFx0XHRldmVudC50b3VjaGVzID0gW3sgY2xpZW50WDogZXZlbnQuY2xpZW50WCwgY2xpZW50WTogZXZlbnQuY2xpZW50WSB9XTtcblx0XHRcdG9uVG91Y2hTdGFydCggZXZlbnQgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0IHBvaW50ZXIgbW92ZSB0byB0b3VjaCBtb3ZlLlxuXHQgKi9cblx0ZnVuY3Rpb24gb25Qb2ludGVyTW92ZSggZXZlbnQgKSB7XG5cblx0XHRpZiggZXZlbnQucG9pbnRlclR5cGUgPT09IGV2ZW50Lk1TUE9JTlRFUl9UWVBFX1RPVUNIICkge1xuXHRcdFx0ZXZlbnQudG91Y2hlcyA9IFt7IGNsaWVudFg6IGV2ZW50LmNsaWVudFgsIGNsaWVudFk6IGV2ZW50LmNsaWVudFkgfV07XG5cdFx0XHRvblRvdWNoTW92ZSggZXZlbnQgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0IHBvaW50ZXIgdXAgdG8gdG91Y2ggZW5kLlxuXHQgKi9cblx0ZnVuY3Rpb24gb25Qb2ludGVyVXAoIGV2ZW50ICkge1xuXG5cdFx0aWYoIGV2ZW50LnBvaW50ZXJUeXBlID09PSBldmVudC5NU1BPSU5URVJfVFlQRV9UT1VDSCApIHtcblx0XHRcdGV2ZW50LnRvdWNoZXMgPSBbeyBjbGllbnRYOiBldmVudC5jbGllbnRYLCBjbGllbnRZOiBldmVudC5jbGllbnRZIH1dO1xuXHRcdFx0b25Ub3VjaEVuZCggZXZlbnQgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIG1vdXNlIHdoZWVsIHNjcm9sbGluZywgdGhyb3R0bGVkIHRvIGF2b2lkIHNraXBwaW5nXG5cdCAqIG11bHRpcGxlIHNsaWRlcy5cblx0ICovXG5cdGZ1bmN0aW9uIG9uRG9jdW1lbnRNb3VzZVNjcm9sbCggZXZlbnQgKSB7XG5cblx0XHRpZiggRGF0ZS5ub3coKSAtIGxhc3RNb3VzZVdoZWVsU3RlcCA+IDYwMCApIHtcblxuXHRcdFx0bGFzdE1vdXNlV2hlZWxTdGVwID0gRGF0ZS5ub3coKTtcblxuXHRcdFx0dmFyIGRlbHRhID0gZXZlbnQuZGV0YWlsIHx8IC1ldmVudC53aGVlbERlbHRhO1xuXHRcdFx0aWYoIGRlbHRhID4gMCApIHtcblx0XHRcdFx0bmF2aWdhdGVOZXh0KCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0bmF2aWdhdGVQcmV2KCk7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDbGlja2luZyBvbiB0aGUgcHJvZ3Jlc3MgYmFyIHJlc3VsdHMgaW4gYSBuYXZpZ2F0aW9uIHRvIHRoZVxuXHQgKiBjbG9zZXN0IGFwcHJveGltYXRlIGhvcml6b250YWwgc2xpZGUgdXNpbmcgdGhpcyBlcXVhdGlvbjpcblx0ICpcblx0ICogKCBjbGlja1ggLyBwcmVzZW50YXRpb25XaWR0aCApICogbnVtYmVyT2ZTbGlkZXNcblx0ICovXG5cdGZ1bmN0aW9uIG9uUHJvZ3Jlc3NDbGlja2VkKCBldmVudCApIHtcblxuXHRcdG9uVXNlcklucHV0KCBldmVudCApO1xuXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdHZhciBzbGlkZXNUb3RhbCA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKS5sZW5ndGg7XG5cdFx0dmFyIHNsaWRlSW5kZXggPSBNYXRoLmZsb29yKCAoIGV2ZW50LmNsaWVudFggLyBkb20ud3JhcHBlci5vZmZzZXRXaWR0aCApICogc2xpZGVzVG90YWwgKTtcblxuXHRcdHNsaWRlKCBzbGlkZUluZGV4ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFdmVudCBoYW5kbGVyIGZvciBuYXZpZ2F0aW9uIGNvbnRyb2wgYnV0dG9ucy5cblx0ICovXG5cdGZ1bmN0aW9uIG9uTmF2aWdhdGVMZWZ0Q2xpY2tlZCggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IG9uVXNlcklucHV0KCk7IG5hdmlnYXRlTGVmdCgpOyB9XG5cdGZ1bmN0aW9uIG9uTmF2aWdhdGVSaWdodENsaWNrZWQoIGV2ZW50ICkgeyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBvblVzZXJJbnB1dCgpOyBuYXZpZ2F0ZVJpZ2h0KCk7IH1cblx0ZnVuY3Rpb24gb25OYXZpZ2F0ZVVwQ2xpY2tlZCggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IG9uVXNlcklucHV0KCk7IG5hdmlnYXRlVXAoKTsgfVxuXHRmdW5jdGlvbiBvbk5hdmlnYXRlRG93bkNsaWNrZWQoIGV2ZW50ICkgeyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBvblVzZXJJbnB1dCgpOyBuYXZpZ2F0ZURvd24oKTsgfVxuXHRmdW5jdGlvbiBvbk5hdmlnYXRlUHJldkNsaWNrZWQoIGV2ZW50ICkgeyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBvblVzZXJJbnB1dCgpOyBuYXZpZ2F0ZVByZXYoKTsgfVxuXHRmdW5jdGlvbiBvbk5hdmlnYXRlTmV4dENsaWNrZWQoIGV2ZW50ICkgeyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBvblVzZXJJbnB1dCgpOyBuYXZpZ2F0ZU5leHQoKTsgfVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVyIGZvciB0aGUgd2luZG93IGxldmVsICdoYXNoY2hhbmdlJyBldmVudC5cblx0ICovXG5cdGZ1bmN0aW9uIG9uV2luZG93SGFzaENoYW5nZSggZXZlbnQgKSB7XG5cblx0XHRyZWFkVVJMKCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVyIGZvciB0aGUgd2luZG93IGxldmVsICdyZXNpemUnIGV2ZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoIGV2ZW50ICkge1xuXG5cdFx0bGF5b3V0KCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGUgZm9yIHRoZSB3aW5kb3cgbGV2ZWwgJ3Zpc2liaWxpdHljaGFuZ2UnIGV2ZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25QYWdlVmlzaWJpbGl0eUNoYW5nZSggZXZlbnQgKSB7XG5cblx0XHR2YXIgaXNIaWRkZW4gPSAgZG9jdW1lbnQud2Via2l0SGlkZGVuIHx8XG5cdFx0XHRcdFx0XHRkb2N1bWVudC5tc0hpZGRlbiB8fFxuXHRcdFx0XHRcdFx0ZG9jdW1lbnQuaGlkZGVuO1xuXG5cdFx0Ly8gSWYsIGFmdGVyIGNsaWNraW5nIGEgbGluayBvciBzaW1pbGFyIGFuZCB3ZSdyZSBjb21pbmcgYmFjayxcblx0XHQvLyBmb2N1cyB0aGUgZG9jdW1lbnQuYm9keSB0byBlbnN1cmUgd2UgY2FuIHVzZSBrZXlib2FyZCBzaG9ydGN1dHNcblx0XHRpZiggaXNIaWRkZW4gPT09IGZhbHNlICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IGRvY3VtZW50LmJvZHkgKSB7XG5cdFx0XHRkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcblx0XHRcdGRvY3VtZW50LmJvZHkuZm9jdXMoKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBJbnZva2VkIHdoZW4gYSBzbGlkZSBpcyBhbmQgd2UncmUgaW4gdGhlIG92ZXJ2aWV3LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25PdmVydmlld1NsaWRlQ2xpY2tlZCggZXZlbnQgKSB7XG5cblx0XHQvLyBUT0RPIFRoZXJlJ3MgYSBidWcgaGVyZSB3aGVyZSB0aGUgZXZlbnQgbGlzdGVuZXJzIGFyZSBub3Rcblx0XHQvLyByZW1vdmVkIGFmdGVyIGRlYWN0aXZhdGluZyB0aGUgb3ZlcnZpZXcuXG5cdFx0aWYoIGV2ZW50c0FyZUJvdW5kICYmIGlzT3ZlcnZpZXcoKSApIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRcdHZhciBlbGVtZW50ID0gZXZlbnQudGFyZ2V0O1xuXG5cdFx0XHR3aGlsZSggZWxlbWVudCAmJiAhZWxlbWVudC5ub2RlTmFtZS5tYXRjaCggL3NlY3Rpb24vZ2kgKSApIHtcblx0XHRcdFx0ZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcblx0XHRcdH1cblxuXHRcdFx0aWYoIGVsZW1lbnQgJiYgIWVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCAnZGlzYWJsZWQnICkgKSB7XG5cblx0XHRcdFx0ZGVhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cblx0XHRcdFx0aWYoIGVsZW1lbnQubm9kZU5hbWUubWF0Y2goIC9zZWN0aW9uL2dpICkgKSB7XG5cdFx0XHRcdFx0dmFyIGggPSBwYXJzZUludCggZWxlbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LWgnICksIDEwICksXG5cdFx0XHRcdFx0XHR2ID0gcGFyc2VJbnQoIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1pbmRleC12JyApLCAxMCApO1xuXG5cdFx0XHRcdFx0c2xpZGUoIGgsIHYgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogSGFuZGxlcyBjbGlja3Mgb24gbGlua3MgdGhhdCBhcmUgc2V0IHRvIHByZXZpZXcgaW4gdGhlXG5cdCAqIGlmcmFtZSBvdmVybGF5LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25QcmV2aWV3TGlua0NsaWNrZWQoIGV2ZW50ICkge1xuXG5cdFx0dmFyIHVybCA9IGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoICdocmVmJyApO1xuXHRcdGlmKCB1cmwgKSB7XG5cdFx0XHRvcGVuUHJldmlldyggdXJsICk7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgY2xpY2sgb24gdGhlIGF1dG8tc2xpZGluZyBjb250cm9scyBlbGVtZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25BdXRvU2xpZGVQbGF5ZXJDbGljayggZXZlbnQgKSB7XG5cblx0XHQvLyBSZXBsYXlcblx0XHRpZiggUmV2ZWFsLmlzTGFzdFNsaWRlKCkgJiYgY29uZmlnLmxvb3AgPT09IGZhbHNlICkge1xuXHRcdFx0c2xpZGUoIDAsIDAgKTtcblx0XHRcdHJlc3VtZUF1dG9TbGlkZSgpO1xuXHRcdH1cblx0XHQvLyBSZXN1bWVcblx0XHRlbHNlIGlmKCBhdXRvU2xpZGVQYXVzZWQgKSB7XG5cdFx0XHRyZXN1bWVBdXRvU2xpZGUoKTtcblx0XHR9XG5cdFx0Ly8gUGF1c2Vcblx0XHRlbHNlIHtcblx0XHRcdHBhdXNlQXV0b1NsaWRlKCk7XG5cdFx0fVxuXG5cdH1cblxuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBMQVlCQUNLIENPTVBPTkVOVCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cblxuXHQvKipcblx0ICogQ29uc3RydWN0b3IgZm9yIHRoZSBwbGF5YmFjayBjb21wb25lbnQsIHdoaWNoIGRpc3BsYXlzXG5cdCAqIHBsYXkvcGF1c2UvcHJvZ3Jlc3MgY29udHJvbHMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lciBUaGUgY29tcG9uZW50IHdpbGwgYXBwZW5kXG5cdCAqIGl0c2VsZiB0byB0aGlzXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IHByb2dyZXNzQ2hlY2sgQSBtZXRob2Qgd2hpY2ggd2lsbCBiZVxuXHQgKiBjYWxsZWQgZnJlcXVlbnRseSB0byBnZXQgdGhlIGN1cnJlbnQgcHJvZ3Jlc3Mgb24gYSByYW5nZVxuXHQgKiBvZiAwLTFcblx0ICovXG5cdGZ1bmN0aW9uIFBsYXliYWNrKCBjb250YWluZXIsIHByb2dyZXNzQ2hlY2sgKSB7XG5cblx0XHQvLyBDb3NtZXRpY3Ncblx0XHR0aGlzLmRpYW1ldGVyID0gNTA7XG5cdFx0dGhpcy50aGlja25lc3MgPSAzO1xuXG5cdFx0Ly8gRmxhZ3MgaWYgd2UgYXJlIGN1cnJlbnRseSBwbGF5aW5nXG5cdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XG5cblx0XHQvLyBDdXJyZW50IHByb2dyZXNzIG9uIGEgMC0xIHJhbmdlXG5cdFx0dGhpcy5wcm9ncmVzcyA9IDA7XG5cblx0XHQvLyBVc2VkIHRvIGxvb3AgdGhlIGFuaW1hdGlvbiBzbW9vdGhseVxuXHRcdHRoaXMucHJvZ3Jlc3NPZmZzZXQgPSAxO1xuXG5cdFx0dGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG5cdFx0dGhpcy5wcm9ncmVzc0NoZWNrID0gcHJvZ3Jlc3NDaGVjaztcblxuXHRcdHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcblx0XHR0aGlzLmNhbnZhcy5jbGFzc05hbWUgPSAncGxheWJhY2snO1xuXHRcdHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5kaWFtZXRlcjtcblx0XHR0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmRpYW1ldGVyO1xuXHRcdHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoICcyZCcgKTtcblxuXHRcdHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKCB0aGlzLmNhbnZhcyApO1xuXG5cdFx0dGhpcy5yZW5kZXIoKTtcblxuXHR9XG5cblx0UGxheWJhY2sucHJvdG90eXBlLnNldFBsYXlpbmcgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG5cblx0XHR2YXIgd2FzUGxheWluZyA9IHRoaXMucGxheWluZztcblxuXHRcdHRoaXMucGxheWluZyA9IHZhbHVlO1xuXG5cdFx0Ly8gU3RhcnQgcmVwYWludGluZyBpZiB3ZSB3ZXJlbid0IGFscmVhZHlcblx0XHRpZiggIXdhc1BsYXlpbmcgJiYgdGhpcy5wbGF5aW5nICkge1xuXHRcdFx0dGhpcy5hbmltYXRlKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR9XG5cblx0fTtcblxuXHRQbGF5YmFjay5wcm90b3R5cGUuYW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyIHByb2dyZXNzQmVmb3JlID0gdGhpcy5wcm9ncmVzcztcblxuXHRcdHRoaXMucHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzQ2hlY2soKTtcblxuXHRcdC8vIFdoZW4gd2UgbG9vcCwgb2Zmc2V0IHRoZSBwcm9ncmVzcyBzbyB0aGF0IGl0IGVhc2VzXG5cdFx0Ly8gc21vb3RobHkgcmF0aGVyIHRoYW4gaW1tZWRpYXRlbHkgcmVzZXR0aW5nXG5cdFx0aWYoIHByb2dyZXNzQmVmb3JlID4gMC44ICYmIHRoaXMucHJvZ3Jlc3MgPCAwLjIgKSB7XG5cdFx0XHR0aGlzLnByb2dyZXNzT2Zmc2V0ID0gdGhpcy5wcm9ncmVzcztcblx0XHR9XG5cblx0XHR0aGlzLnJlbmRlcigpO1xuXG5cdFx0aWYoIHRoaXMucGxheWluZyApIHtcblx0XHRcdGZlYXR1cmVzLnJlcXVlc3RBbmltYXRpb25GcmFtZU1ldGhvZC5jYWxsKCB3aW5kb3csIHRoaXMuYW5pbWF0ZS5iaW5kKCB0aGlzICkgKTtcblx0XHR9XG5cblx0fTtcblxuXHQvKipcblx0ICogUmVuZGVycyB0aGUgY3VycmVudCBwcm9ncmVzcyBhbmQgcGxheWJhY2sgc3RhdGUuXG5cdCAqL1xuXHRQbGF5YmFjay5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgcHJvZ3Jlc3MgPSB0aGlzLnBsYXlpbmcgPyB0aGlzLnByb2dyZXNzIDogMCxcblx0XHRcdHJhZGl1cyA9ICggdGhpcy5kaWFtZXRlciAvIDIgKSAtIHRoaXMudGhpY2tuZXNzLFxuXHRcdFx0eCA9IHRoaXMuZGlhbWV0ZXIgLyAyLFxuXHRcdFx0eSA9IHRoaXMuZGlhbWV0ZXIgLyAyLFxuXHRcdFx0aWNvblNpemUgPSAxNDtcblxuXHRcdC8vIEVhc2UgdG93YXJkcyAxXG5cdFx0dGhpcy5wcm9ncmVzc09mZnNldCArPSAoIDEgLSB0aGlzLnByb2dyZXNzT2Zmc2V0ICkgKiAwLjE7XG5cblx0XHR2YXIgZW5kQW5nbGUgPSAoIC0gTWF0aC5QSSAvIDIgKSArICggcHJvZ3Jlc3MgKiAoIE1hdGguUEkgKiAyICkgKTtcblx0XHR2YXIgc3RhcnRBbmdsZSA9ICggLSBNYXRoLlBJIC8gMiApICsgKCB0aGlzLnByb2dyZXNzT2Zmc2V0ICogKCBNYXRoLlBJICogMiApICk7XG5cblx0XHR0aGlzLmNvbnRleHQuc2F2ZSgpO1xuXHRcdHRoaXMuY29udGV4dC5jbGVhclJlY3QoIDAsIDAsIHRoaXMuZGlhbWV0ZXIsIHRoaXMuZGlhbWV0ZXIgKTtcblxuXHRcdC8vIFNvbGlkIGJhY2tncm91bmQgY29sb3Jcblx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0dGhpcy5jb250ZXh0LmFyYyggeCwgeSwgcmFkaXVzICsgMiwgMCwgTWF0aC5QSSAqIDIsIGZhbHNlICk7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKCAwLCAwLCAwLCAwLjQgKSc7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGwoKTtcblxuXHRcdC8vIERyYXcgcHJvZ3Jlc3MgdHJhY2tcblx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0dGhpcy5jb250ZXh0LmFyYyggeCwgeSwgcmFkaXVzLCAwLCBNYXRoLlBJICogMiwgZmFsc2UgKTtcblx0XHR0aGlzLmNvbnRleHQubGluZVdpZHRoID0gdGhpcy50aGlja25lc3M7XG5cdFx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gJyM2NjYnO1xuXHRcdHRoaXMuY29udGV4dC5zdHJva2UoKTtcblxuXHRcdGlmKCB0aGlzLnBsYXlpbmcgKSB7XG5cdFx0XHQvLyBEcmF3IHByb2dyZXNzIG9uIHRvcCBvZiB0cmFja1xuXHRcdFx0dGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuXHRcdFx0dGhpcy5jb250ZXh0LmFyYyggeCwgeSwgcmFkaXVzLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSwgZmFsc2UgKTtcblx0XHRcdHRoaXMuY29udGV4dC5saW5lV2lkdGggPSB0aGlzLnRoaWNrbmVzcztcblx0XHRcdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9ICcjZmZmJztcblx0XHRcdHRoaXMuY29udGV4dC5zdHJva2UoKTtcblx0XHR9XG5cblx0XHR0aGlzLmNvbnRleHQudHJhbnNsYXRlKCB4IC0gKCBpY29uU2l6ZSAvIDIgKSwgeSAtICggaWNvblNpemUgLyAyICkgKTtcblxuXHRcdC8vIERyYXcgcGxheS9wYXVzZSBpY29uc1xuXHRcdGlmKCB0aGlzLnBsYXlpbmcgKSB7XG5cdFx0XHR0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJyNmZmYnO1xuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxSZWN0KCAwLCAwLCBpY29uU2l6ZSAvIDIgLSAyLCBpY29uU2l6ZSApO1xuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxSZWN0KCBpY29uU2l6ZSAvIDIgKyAyLCAwLCBpY29uU2l6ZSAvIDIgLSAyLCBpY29uU2l6ZSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdHRoaXMuY29udGV4dC50cmFuc2xhdGUoIDIsIDAgKTtcblx0XHRcdHRoaXMuY29udGV4dC5tb3ZlVG8oIDAsIDAgKTtcblx0XHRcdHRoaXMuY29udGV4dC5saW5lVG8oIGljb25TaXplIC0gMiwgaWNvblNpemUgLyAyICk7XG5cdFx0XHR0aGlzLmNvbnRleHQubGluZVRvKCAwLCBpY29uU2l6ZSApO1xuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICcjZmZmJztcblx0XHRcdHRoaXMuY29udGV4dC5maWxsKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5jb250ZXh0LnJlc3RvcmUoKTtcblxuXHR9O1xuXG5cdFBsYXliYWNrLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKCB0eXBlLCBsaXN0ZW5lciApIHtcblx0XHR0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciwgZmFsc2UgKTtcblx0fTtcblxuXHRQbGF5YmFjay5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oIHR5cGUsIGxpc3RlbmVyICkge1xuXHRcdHRoaXMuY2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoIHR5cGUsIGxpc3RlbmVyLCBmYWxzZSApO1xuXHR9O1xuXG5cdFBsYXliYWNrLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG5cblx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcblxuXHRcdGlmKCB0aGlzLmNhbnZhcy5wYXJlbnROb2RlICkge1xuXHRcdFx0dGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQoIHRoaXMuY2FudmFzICk7XG5cdFx0fVxuXG5cdH07XG5cblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5cblx0cmV0dXJuIHtcblx0XHRpbml0aWFsaXplOiBpbml0aWFsaXplLFxuXHRcdGNvbmZpZ3VyZTogY29uZmlndXJlLFxuXHRcdHN5bmM6IHN5bmMsXG5cblx0XHQvLyBOYXZpZ2F0aW9uIG1ldGhvZHNcblx0XHRzbGlkZTogc2xpZGUsXG5cdFx0bGVmdDogbmF2aWdhdGVMZWZ0LFxuXHRcdHJpZ2h0OiBuYXZpZ2F0ZVJpZ2h0LFxuXHRcdHVwOiBuYXZpZ2F0ZVVwLFxuXHRcdGRvd246IG5hdmlnYXRlRG93bixcblx0XHRwcmV2OiBuYXZpZ2F0ZVByZXYsXG5cdFx0bmV4dDogbmF2aWdhdGVOZXh0LFxuXG5cdFx0Ly8gRnJhZ21lbnQgbWV0aG9kc1xuXHRcdG5hdmlnYXRlRnJhZ21lbnQ6IG5hdmlnYXRlRnJhZ21lbnQsXG5cdFx0cHJldkZyYWdtZW50OiBwcmV2aW91c0ZyYWdtZW50LFxuXHRcdG5leHRGcmFnbWVudDogbmV4dEZyYWdtZW50LFxuXG5cdFx0Ly8gRGVwcmVjYXRlZCBhbGlhc2VzXG5cdFx0bmF2aWdhdGVUbzogc2xpZGUsXG5cdFx0bmF2aWdhdGVMZWZ0OiBuYXZpZ2F0ZUxlZnQsXG5cdFx0bmF2aWdhdGVSaWdodDogbmF2aWdhdGVSaWdodCxcblx0XHRuYXZpZ2F0ZVVwOiBuYXZpZ2F0ZVVwLFxuXHRcdG5hdmlnYXRlRG93bjogbmF2aWdhdGVEb3duLFxuXHRcdG5hdmlnYXRlUHJldjogbmF2aWdhdGVQcmV2LFxuXHRcdG5hdmlnYXRlTmV4dDogbmF2aWdhdGVOZXh0LFxuXG5cdFx0Ly8gRm9yY2VzIGFuIHVwZGF0ZSBpbiBzbGlkZSBsYXlvdXRcblx0XHRsYXlvdXQ6IGxheW91dCxcblxuXHRcdC8vIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGF2YWlsYWJsZSByb3V0ZXMgYXMgYm9vbGVhbnMgKGxlZnQvcmlnaHQvdG9wL2JvdHRvbSlcblx0XHRhdmFpbGFibGVSb3V0ZXM6IGF2YWlsYWJsZVJvdXRlcyxcblxuXHRcdC8vIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGF2YWlsYWJsZSBmcmFnbWVudHMgYXMgYm9vbGVhbnMgKHByZXYvbmV4dClcblx0XHRhdmFpbGFibGVGcmFnbWVudHM6IGF2YWlsYWJsZUZyYWdtZW50cyxcblxuXHRcdC8vIFRvZ2dsZXMgdGhlIG92ZXJ2aWV3IG1vZGUgb24vb2ZmXG5cdFx0dG9nZ2xlT3ZlcnZpZXc6IHRvZ2dsZU92ZXJ2aWV3LFxuXG5cdFx0Ly8gVG9nZ2xlcyB0aGUgXCJibGFjayBzY3JlZW5cIiBtb2RlIG9uL29mZlxuXHRcdHRvZ2dsZVBhdXNlOiB0b2dnbGVQYXVzZSxcblxuXHRcdC8vIFN0YXRlIGNoZWNrc1xuXHRcdGlzT3ZlcnZpZXc6IGlzT3ZlcnZpZXcsXG5cdFx0aXNQYXVzZWQ6IGlzUGF1c2VkLFxuXG5cdFx0Ly8gQWRkcyBvciByZW1vdmVzIGFsbCBpbnRlcm5hbCBldmVudCBsaXN0ZW5lcnMgKHN1Y2ggYXMga2V5Ym9hcmQpXG5cdFx0YWRkRXZlbnRMaXN0ZW5lcnM6IGFkZEV2ZW50TGlzdGVuZXJzLFxuXHRcdHJlbW92ZUV2ZW50TGlzdGVuZXJzOiByZW1vdmVFdmVudExpc3RlbmVycyxcblxuXHRcdC8vIFJldHVybnMgdGhlIGluZGljZXMgb2YgdGhlIGN1cnJlbnQsIG9yIHNwZWNpZmllZCwgc2xpZGVcblx0XHRnZXRJbmRpY2VzOiBnZXRJbmRpY2VzLFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgc2xpZGUgYXQgdGhlIHNwZWNpZmllZCBpbmRleCwgeSBpcyBvcHRpb25hbFxuXHRcdGdldFNsaWRlOiBmdW5jdGlvbiggeCwgeSApIHtcblx0XHRcdHZhciBob3Jpem9udGFsU2xpZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApWyB4IF07XG5cdFx0XHR2YXIgdmVydGljYWxTbGlkZXMgPSBob3Jpem9udGFsU2xpZGUgJiYgaG9yaXpvbnRhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApO1xuXG5cdFx0XHRpZiggdHlwZW9mIHkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRyZXR1cm4gdmVydGljYWxTbGlkZXMgPyB2ZXJ0aWNhbFNsaWRlc1sgeSBdIDogdW5kZWZpbmVkO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gaG9yaXpvbnRhbFNsaWRlO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm5zIHRoZSBwcmV2aW91cyBzbGlkZSBlbGVtZW50LCBtYXkgYmUgbnVsbFxuXHRcdGdldFByZXZpb3VzU2xpZGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHByZXZpb3VzU2xpZGU7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybnMgdGhlIGN1cnJlbnQgc2xpZGUgZWxlbWVudFxuXHRcdGdldEN1cnJlbnRTbGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY3VycmVudFNsaWRlO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm5zIHRoZSBjdXJyZW50IHNjYWxlIG9mIHRoZSBwcmVzZW50YXRpb24gY29udGVudFxuXHRcdGdldFNjYWxlOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBzY2FsZTtcblx0XHR9LFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uIG9iamVjdFxuXHRcdGdldENvbmZpZzogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY29uZmlnO1xuXHRcdH0sXG5cblx0XHQvLyBIZWxwZXIgbWV0aG9kLCByZXRyaWV2ZXMgcXVlcnkgc3RyaW5nIGFzIGEga2V5L3ZhbHVlIGhhc2hcblx0XHRnZXRRdWVyeUhhc2g6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHF1ZXJ5ID0ge307XG5cblx0XHRcdGxvY2F0aW9uLnNlYXJjaC5yZXBsYWNlKCAvW0EtWjAtOV0rPz0oW1xcd1xcLiUtXSopL2dpLCBmdW5jdGlvbihhKSB7XG5cdFx0XHRcdHF1ZXJ5WyBhLnNwbGl0KCAnPScgKS5zaGlmdCgpIF0gPSBhLnNwbGl0KCAnPScgKS5wb3AoKTtcblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gQmFzaWMgZGVzZXJpYWxpemF0aW9uXG5cdFx0XHRmb3IoIHZhciBpIGluIHF1ZXJ5ICkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSBxdWVyeVsgaSBdO1xuXG5cdFx0XHRcdHF1ZXJ5WyBpIF0gPSB1bmVzY2FwZSggdmFsdWUgKTtcblxuXHRcdFx0XHRpZiggdmFsdWUgPT09ICdudWxsJyApIHF1ZXJ5WyBpIF0gPSBudWxsO1xuXHRcdFx0XHRlbHNlIGlmKCB2YWx1ZSA9PT0gJ3RydWUnICkgcXVlcnlbIGkgXSA9IHRydWU7XG5cdFx0XHRcdGVsc2UgaWYoIHZhbHVlID09PSAnZmFsc2UnICkgcXVlcnlbIGkgXSA9IGZhbHNlO1xuXHRcdFx0XHRlbHNlIGlmKCB2YWx1ZS5tYXRjaCggL15cXGQrJC8gKSApIHF1ZXJ5WyBpIF0gPSBwYXJzZUZsb2F0KCB2YWx1ZSApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcXVlcnk7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybnMgdHJ1ZSBpZiB3ZSdyZSBjdXJyZW50bHkgb24gdGhlIGZpcnN0IHNsaWRlXG5cdFx0aXNGaXJzdFNsaWRlOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBTTElERVNfU0VMRUNUT1IgKyAnLnBhc3QnICkgPT0gbnVsbCA/IHRydWUgOiBmYWxzZTtcblx0XHR9LFxuXG5cdFx0Ly8gUmV0dXJucyB0cnVlIGlmIHdlJ3JlIGN1cnJlbnRseSBvbiB0aGUgbGFzdCBzbGlkZVxuXHRcdGlzTGFzdFNsaWRlOiBmdW5jdGlvbigpIHtcblx0XHRcdGlmKCBjdXJyZW50U2xpZGUgKSB7XG5cdFx0XHRcdC8vIERvZXMgdGhpcyBzbGlkZSBoYXMgbmV4dCBhIHNpYmxpbmc/XG5cdFx0XHRcdGlmKCBjdXJyZW50U2xpZGUubmV4dEVsZW1lbnRTaWJsaW5nICkgcmV0dXJuIGZhbHNlO1xuXG5cdFx0XHRcdC8vIElmIGl0J3MgdmVydGljYWwsIGRvZXMgaXRzIHBhcmVudCBoYXZlIGEgbmV4dCBzaWJsaW5nP1xuXHRcdFx0XHRpZiggaXNWZXJ0aWNhbFNsaWRlKCBjdXJyZW50U2xpZGUgKSAmJiBjdXJyZW50U2xpZGUucGFyZW50Tm9kZS5uZXh0RWxlbWVudFNpYmxpbmcgKSByZXR1cm4gZmFsc2U7XG5cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9LFxuXG5cdFx0Ly8gQ2hlY2tzIGlmIHJldmVhbC5qcyBoYXMgYmVlbiBsb2FkZWQgYW5kIGlzIHJlYWR5IGZvciB1c2Vcblx0XHRpc1JlYWR5OiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBsb2FkZWQ7XG5cdFx0fSxcblxuXHRcdC8vIEZvcndhcmQgZXZlbnQgYmluZGluZyB0byB0aGUgcmV2ZWFsIERPTSBlbGVtZW50XG5cdFx0YWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlICkge1xuXHRcdFx0aWYoICdhZGRFdmVudExpc3RlbmVyJyBpbiB3aW5kb3cgKSB7XG5cdFx0XHRcdCggZG9tLndyYXBwZXIgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJy5yZXZlYWwnICkgKS5hZGRFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSApO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlICkge1xuXHRcdFx0aWYoICdhZGRFdmVudExpc3RlbmVyJyBpbiB3aW5kb3cgKSB7XG5cdFx0XHRcdCggZG9tLndyYXBwZXIgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJy5yZXZlYWwnICkgKS5yZW1vdmVFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSApO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZXZlYWw7IiwidmFyIFJldmVhbCA9IHJlcXVpcmUoJ3JldmVhbCcpO1xyXG5cclxuLy8gRnVsbCBsaXN0IG9mIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBhdmFpbGFibGUgaGVyZTogXHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9oYWtpbWVsL3JldmVhbC5qcyNjb25maWd1cmF0aW9uIFxyXG5SZXZlYWwuaW5pdGlhbGl6ZSh7XHJcbiAgY29udHJvbHM6IHRydWUsXHJcbiAgcHJvZ3Jlc3M6IHRydWUsXHJcbiAgaGlzdG9yeTogdHJ1ZSxcclxuICBjZW50ZXI6IHRydWUsXHJcbiAgLy8gZGVmYXVsdC9jdWJlL3BhZ2UvY29uY2F2ZS96b29tL2xpbmVhci9mYWRlL25vbmUgXHJcbiAgdHJhbnNpdGlvbjogJ2xpbmVhcicsXHJcbn0pOyJdfQ==
