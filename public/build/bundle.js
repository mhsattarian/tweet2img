
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var nprogress = createCommonjsModule(function (module, exports) {
    (function(root, factory) {

      {
        module.exports = factory();
      }

    })(commonjsGlobal, function() {
      var NProgress = {};

      NProgress.version = '0.2.0';

      var Settings = NProgress.settings = {
        minimum: 0.08,
        easing: 'ease',
        positionUsing: '',
        speed: 200,
        trickle: true,
        trickleRate: 0.02,
        trickleSpeed: 800,
        showSpinner: true,
        barSelector: '[role="bar"]',
        spinnerSelector: '[role="spinner"]',
        parent: 'body',
        template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
      };

      /**
       * Updates configuration.
       *
       *     NProgress.configure({
       *       minimum: 0.1
       *     });
       */
      NProgress.configure = function(options) {
        var key, value;
        for (key in options) {
          value = options[key];
          if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
        }

        return this;
      };

      /**
       * Last number.
       */

      NProgress.status = null;

      /**
       * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
       *
       *     NProgress.set(0.4);
       *     NProgress.set(1.0);
       */

      NProgress.set = function(n) {
        var started = NProgress.isStarted();

        n = clamp(n, Settings.minimum, 1);
        NProgress.status = (n === 1 ? null : n);

        var progress = NProgress.render(!started),
            bar      = progress.querySelector(Settings.barSelector),
            speed    = Settings.speed,
            ease     = Settings.easing;

        progress.offsetWidth; /* Repaint */

        queue(function(next) {
          // Set positionUsing if it hasn't already been set
          if (Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();

          // Add transition
          css(bar, barPositionCSS(n, speed, ease));

          if (n === 1) {
            // Fade out
            css(progress, { 
              transition: 'none', 
              opacity: 1 
            });
            progress.offsetWidth; /* Repaint */

            setTimeout(function() {
              css(progress, { 
                transition: 'all ' + speed + 'ms linear', 
                opacity: 0 
              });
              setTimeout(function() {
                NProgress.remove();
                next();
              }, speed);
            }, speed);
          } else {
            setTimeout(next, speed);
          }
        });

        return this;
      };

      NProgress.isStarted = function() {
        return typeof NProgress.status === 'number';
      };

      /**
       * Shows the progress bar.
       * This is the same as setting the status to 0%, except that it doesn't go backwards.
       *
       *     NProgress.start();
       *
       */
      NProgress.start = function() {
        if (!NProgress.status) NProgress.set(0);

        var work = function() {
          setTimeout(function() {
            if (!NProgress.status) return;
            NProgress.trickle();
            work();
          }, Settings.trickleSpeed);
        };

        if (Settings.trickle) work();

        return this;
      };

      /**
       * Hides the progress bar.
       * This is the *sort of* the same as setting the status to 100%, with the
       * difference being `done()` makes some placebo effect of some realistic motion.
       *
       *     NProgress.done();
       *
       * If `true` is passed, it will show the progress bar even if its hidden.
       *
       *     NProgress.done(true);
       */

      NProgress.done = function(force) {
        if (!force && !NProgress.status) return this;

        return NProgress.inc(0.3 + 0.5 * Math.random()).set(1);
      };

      /**
       * Increments by a random amount.
       */

      NProgress.inc = function(amount) {
        var n = NProgress.status;

        if (!n) {
          return NProgress.start();
        } else {
          if (typeof amount !== 'number') {
            amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
          }

          n = clamp(n + amount, 0, 0.994);
          return NProgress.set(n);
        }
      };

      NProgress.trickle = function() {
        return NProgress.inc(Math.random() * Settings.trickleRate);
      };

      /**
       * Waits for all supplied jQuery promises and
       * increases the progress as the promises resolve.
       *
       * @param $promise jQUery Promise
       */
      (function() {
        var initial = 0, current = 0;

        NProgress.promise = function($promise) {
          if (!$promise || $promise.state() === "resolved") {
            return this;
          }

          if (current === 0) {
            NProgress.start();
          }

          initial++;
          current++;

          $promise.always(function() {
            current--;
            if (current === 0) {
                initial = 0;
                NProgress.done();
            } else {
                NProgress.set((initial - current) / initial);
            }
          });

          return this;
        };

      })();

      /**
       * (Internal) renders the progress bar markup based on the `template`
       * setting.
       */

      NProgress.render = function(fromStart) {
        if (NProgress.isRendered()) return document.getElementById('nprogress');

        addClass(document.documentElement, 'nprogress-busy');
        
        var progress = document.createElement('div');
        progress.id = 'nprogress';
        progress.innerHTML = Settings.template;

        var bar      = progress.querySelector(Settings.barSelector),
            perc     = fromStart ? '-100' : toBarPerc(NProgress.status || 0),
            parent   = document.querySelector(Settings.parent),
            spinner;
        
        css(bar, {
          transition: 'all 0 linear',
          transform: 'translate3d(' + perc + '%,0,0)'
        });

        if (!Settings.showSpinner) {
          spinner = progress.querySelector(Settings.spinnerSelector);
          spinner && removeElement(spinner);
        }

        if (parent != document.body) {
          addClass(parent, 'nprogress-custom-parent');
        }

        parent.appendChild(progress);
        return progress;
      };

      /**
       * Removes the element. Opposite of render().
       */

      NProgress.remove = function() {
        removeClass(document.documentElement, 'nprogress-busy');
        removeClass(document.querySelector(Settings.parent), 'nprogress-custom-parent');
        var progress = document.getElementById('nprogress');
        progress && removeElement(progress);
      };

      /**
       * Checks if the progress bar is rendered.
       */

      NProgress.isRendered = function() {
        return !!document.getElementById('nprogress');
      };

      /**
       * Determine which positioning CSS rule to use.
       */

      NProgress.getPositioningCSS = function() {
        // Sniff on document.body.style
        var bodyStyle = document.body.style;

        // Sniff prefixes
        var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
                           ('MozTransform' in bodyStyle) ? 'Moz' :
                           ('msTransform' in bodyStyle) ? 'ms' :
                           ('OTransform' in bodyStyle) ? 'O' : '';

        if (vendorPrefix + 'Perspective' in bodyStyle) {
          // Modern browsers with 3D support, e.g. Webkit, IE10
          return 'translate3d';
        } else if (vendorPrefix + 'Transform' in bodyStyle) {
          // Browsers without 3D support, e.g. IE9
          return 'translate';
        } else {
          // Browsers without translate() support, e.g. IE7-8
          return 'margin';
        }
      };

      /**
       * Helpers
       */

      function clamp(n, min, max) {
        if (n < min) return min;
        if (n > max) return max;
        return n;
      }

      /**
       * (Internal) converts a percentage (`0..1`) to a bar translateX
       * percentage (`-100%..0%`).
       */

      function toBarPerc(n) {
        return (-1 + n) * 100;
      }


      /**
       * (Internal) returns the correct CSS for changing the bar's
       * position given an n percentage, and speed and ease from Settings
       */

      function barPositionCSS(n, speed, ease) {
        var barCSS;

        if (Settings.positionUsing === 'translate3d') {
          barCSS = { transform: 'translate3d('+toBarPerc(n)+'%,0,0)' };
        } else if (Settings.positionUsing === 'translate') {
          barCSS = { transform: 'translate('+toBarPerc(n)+'%,0)' };
        } else {
          barCSS = { 'margin-left': toBarPerc(n)+'%' };
        }

        barCSS.transition = 'all '+speed+'ms '+ease;

        return barCSS;
      }

      /**
       * (Internal) Queues a function to be executed.
       */

      var queue = (function() {
        var pending = [];
        
        function next() {
          var fn = pending.shift();
          if (fn) {
            fn(next);
          }
        }

        return function(fn) {
          pending.push(fn);
          if (pending.length == 1) next();
        };
      })();

      /**
       * (Internal) Applies css properties to an element, similar to the jQuery 
       * css method.
       *
       * While this helper does assist with vendor prefixed property names, it 
       * does not perform any manipulation of values prior to setting styles.
       */

      var css = (function() {
        var cssPrefixes = [ 'Webkit', 'O', 'Moz', 'ms' ],
            cssProps    = {};

        function camelCase(string) {
          return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function(match, letter) {
            return letter.toUpperCase();
          });
        }

        function getVendorProp(name) {
          var style = document.body.style;
          if (name in style) return name;

          var i = cssPrefixes.length,
              capName = name.charAt(0).toUpperCase() + name.slice(1),
              vendorName;
          while (i--) {
            vendorName = cssPrefixes[i] + capName;
            if (vendorName in style) return vendorName;
          }

          return name;
        }

        function getStyleProp(name) {
          name = camelCase(name);
          return cssProps[name] || (cssProps[name] = getVendorProp(name));
        }

        function applyCss(element, prop, value) {
          prop = getStyleProp(prop);
          element.style[prop] = value;
        }

        return function(element, properties) {
          var args = arguments,
              prop, 
              value;

          if (args.length == 2) {
            for (prop in properties) {
              value = properties[prop];
              if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
            }
          } else {
            applyCss(element, args[1], args[2]);
          }
        }
      })();

      /**
       * (Internal) Determines if an element or space separated list of class names contains a class name.
       */

      function hasClass(element, name) {
        var list = typeof element == 'string' ? element : classList(element);
        return list.indexOf(' ' + name + ' ') >= 0;
      }

      /**
       * (Internal) Adds a class to an element.
       */

      function addClass(element, name) {
        var oldList = classList(element),
            newList = oldList + name;

        if (hasClass(oldList, name)) return; 

        // Trim the opening space.
        element.className = newList.substring(1);
      }

      /**
       * (Internal) Removes a class from an element.
       */

      function removeClass(element, name) {
        var oldList = classList(element),
            newList;

        if (!hasClass(element, name)) return;

        // Replace the class name.
        newList = oldList.replace(' ' + name + ' ', ' ');

        // Trim the opening and closing spaces.
        element.className = newList.substring(1, newList.length - 1);
      }

      /**
       * (Internal) Gets a space separated list of the class names on the element. 
       * The list is wrapped with a single space on each end to facilitate finding 
       * matches within the list.
       */

      function classList(element) {
        return (' ' + (element.className || '') + ' ').replace(/\s+/gi, ' ');
      }

      /**
       * (Internal) Removes an element from the DOM.
       */

      function removeElement(element) {
        element && element.parentNode && element.parentNode.removeChild(element);
      }

      return NProgress;
    });
    });

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z = "/* Make clicks pass-through */\n#nprogress {\n  pointer-events: none;\n}\n\n#nprogress .bar {\n  background: #29d;\n\n  position: fixed;\n  z-index: 1031;\n  top: 0;\n  left: 0;\n\n  width: 100%;\n  height: 2px;\n}\n\n/* Fancy blur effect */\n#nprogress .peg {\n  display: block;\n  position: absolute;\n  right: 0px;\n  width: 100px;\n  height: 100%;\n  box-shadow: 0 0 10px #29d, 0 0 5px #29d;\n  opacity: 1.0;\n\n  -webkit-transform: rotate(3deg) translate(0px, -4px);\n      -ms-transform: rotate(3deg) translate(0px, -4px);\n          transform: rotate(3deg) translate(0px, -4px);\n}\n\n/* Remove these to get rid of the spinner */\n#nprogress .spinner {\n  display: block;\n  position: fixed;\n  z-index: 1031;\n  top: 15px;\n  right: 15px;\n}\n\n#nprogress .spinner-icon {\n  width: 18px;\n  height: 18px;\n  box-sizing: border-box;\n\n  border: solid 2px transparent;\n  border-top-color: #29d;\n  border-left-color: #29d;\n  border-radius: 50%;\n\n  -webkit-animation: nprogress-spinner 400ms linear infinite;\n          animation: nprogress-spinner 400ms linear infinite;\n}\n\n.nprogress-custom-parent {\n  overflow: hidden;\n  position: relative;\n}\n\n.nprogress-custom-parent #nprogress .spinner,\n.nprogress-custom-parent #nprogress .bar {\n  position: absolute;\n}\n\n@-webkit-keyframes nprogress-spinner {\n  0%   { -webkit-transform: rotate(0deg); }\n  100% { -webkit-transform: rotate(360deg); }\n}\n@keyframes nprogress-spinner {\n  0%   { transform: rotate(0deg); }\n  100% { transform: rotate(360deg); }\n}\n\n";
    styleInject(css_248z);

    /* src/components/imageView.svelte generated by Svelte v3.23.2 */

    const file = "src/components/imageView.svelte";

    // (36:4) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Example";
    			add_location(p, file, 36, 6, 722);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(36:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (34:4) {#if src.length}
    function create_if_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "click image to download";
    			add_location(p, file, 34, 6, 673);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(34:4) {#if src.length}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let article;
    	let div;
    	let a;
    	let img;
    	let img_src_value;
    	let a_href_value;
    	let a_download_value;
    	let t;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*src*/ ctx[0].length) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			article = element("article");
    			div = element("div");
    			a = element("a");
    			img = element("img");
    			t = space();
    			if_block.c();
    			if (img.src !== (img_src_value = /*src*/ ctx[0] || /*exampleSrc*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-wwc3d6");
    			add_location(img, file, 32, 80, 601);
    			attr_dev(a, "href", a_href_value = /*downloadLink*/ ctx[1] || "#");
    			attr_dev(a, "download", a_download_value = /*downloadLink*/ ctx[1] ? "tweet.jpg" : null);
    			add_location(a, file, 32, 4, 525);
    			attr_dev(div, "id", "image-wrapper");
    			attr_dev(div, "class", "svelte-wwc3d6");
    			add_location(div, file, 31, 2, 496);
    			attr_dev(article, "id", "image");
    			attr_dev(article, "class", "svelte-wwc3d6");
    			add_location(article, file, 30, 0, 473);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div);
    			append_dev(div, a);
    			append_dev(a, img);
    			append_dev(div, t);
    			if_block.m(div, null);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0] || /*exampleSrc*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*downloadLink*/ 2 && a_href_value !== (a_href_value = /*downloadLink*/ ctx[1] || "#")) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*downloadLink*/ 2 && a_download_value !== (a_download_value = /*downloadLink*/ ctx[1] ? "tweet.jpg" : null)) {
    				attr_dev(a, "download", a_download_value);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { src } = $$props;
    	let { downloadLink } = $$props;
    	let exampleSrc = "/img?url=https://twitter.com/fermatslibrary/status/1273977843937169413";
    	const writable_props = ["src", "downloadLink"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ImageView", $$slots, []);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("downloadLink" in $$props) $$invalidate(1, downloadLink = $$props.downloadLink);
    	};

    	$$self.$capture_state = () => ({ src, downloadLink, exampleSrc });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("downloadLink" in $$props) $$invalidate(1, downloadLink = $$props.downloadLink);
    		if ("exampleSrc" in $$props) $$invalidate(2, exampleSrc = $$props.exampleSrc);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, downloadLink, exampleSrc, click_handler];
    }

    class ImageView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { src: 0, downloadLink: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageView",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*src*/ ctx[0] === undefined && !("src" in props)) {
    			console.warn("<ImageView> was created without expected prop 'src'");
    		}

    		if (/*downloadLink*/ ctx[1] === undefined && !("downloadLink" in props)) {
    			console.warn("<ImageView> was created without expected prop 'downloadLink'");
    		}
    	}

    	get src() {
    		throw new Error("<ImageView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<ImageView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get downloadLink() {
    		throw new Error("<ImageView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set downloadLink(value) {
    		throw new Error("<ImageView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/GithubIcon.svelte generated by Svelte v3.23.2 */

    const file$1 = "node_modules/svelte-feather-icons/src/icons/GithubIcon.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let path;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22");
    			add_location(path, file$1, 12, 231, 487);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-github " + /*customClass*/ ctx[1]);
    			add_location(svg, file$1, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-github " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GithubIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GithubIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class GithubIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GithubIcon",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get size() {
    		throw new Error("<GithubIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<GithubIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<GithubIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<GithubIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/TwitterIcon.svelte generated by Svelte v3.23.2 */

    const file$2 = "node_modules/svelte-feather-icons/src/icons/TwitterIcon.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z");
    			add_location(path, file$2, 12, 232, 488);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-twitter " + /*customClass*/ ctx[1]);
    			add_location(svg, file$2, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-twitter " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TwitterIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TwitterIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class TwitterIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TwitterIcon",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get size() {
    		throw new Error("<TwitterIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<TwitterIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<TwitterIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<TwitterIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/ZapIcon.svelte generated by Svelte v3.23.2 */

    const file$3 = "node_modules/svelte-feather-icons/src/icons/ZapIcon.svelte";

    function create_fragment$3(ctx) {
    	let svg;
    	let polygon;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			polygon = svg_element("polygon");
    			attr_dev(polygon, "points", "13 2 3 14 12 14 11 22 21 10 12 10 13 2");
    			add_location(polygon, file$3, 12, 228, 484);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-zap " + /*customClass*/ ctx[1]);
    			add_location(svg, file$3, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, polygon);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-zap " + /*customClass*/ ctx[1])) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { size = "100%" } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		size = size.slice(-1) === "x"
    		? size.slice(0, size.length - 1) + "em"
    		: parseInt(size) + "px";
    	}

    	const writable_props = ["size", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ZapIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ZapIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("class" in $$props) $$invalidate(1, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ size, customClass });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(1, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, customClass];
    }

    class ZapIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ZapIcon",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get size() {
    		throw new Error("<ZapIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<ZapIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<ZapIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ZapIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/footer.svelte generated by Svelte v3.23.2 */
    const file$4 = "src/components/footer.svelte";

    function create_fragment$4(ctx) {
    	let footer;
    	let div;
    	let a0;
    	let i;
    	let t0;
    	let a1;
    	let twittericon;
    	let t1;
    	let a2;
    	let githubicon;
    	let t2;
    	let a3;
    	let zapicon;
    	let current;
    	twittericon = new TwitterIcon({ props: { size: "1.5x" }, $$inline: true });
    	githubicon = new GithubIcon({ props: { size: "1.5x" }, $$inline: true });
    	zapicon = new ZapIcon({ props: { size: "1.5x" }, $$inline: true });

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			a0 = element("a");
    			i = element("i");
    			t0 = space();
    			a1 = element("a");
    			create_component(twittericon.$$.fragment);
    			t1 = space();
    			a2 = element("a");
    			create_component(githubicon.$$.fragment);
    			t2 = space();
    			a3 = element("a");
    			create_component(zapicon.$$.fragment);
    			attr_dev(i, "id", "logo");
    			attr_dev(i, "class", "svelte-kixs6l");
    			add_location(i, file$4, 33, 38, 694);
    			attr_dev(a0, "href", "https://mhsattarian.com");
    			add_location(a0, file$4, 33, 4, 660);
    			attr_dev(a1, "href", "https://twitter.com/mh_sattarian");
    			add_location(a1, file$4, 34, 4, 718);
    			attr_dev(a2, "href", "https://github.com/mhsattarian/tweet2img");
    			add_location(a2, file$4, 35, 4, 797);
    			attr_dev(a3, "href", "https://t.me/tweet2img_bot");
    			add_location(a3, file$4, 36, 4, 883);
    			attr_dev(div, "id", "creds");
    			attr_dev(div, "class", "svelte-kixs6l");
    			add_location(div, file$4, 32, 2, 639);
    			attr_dev(footer, "class", "svelte-kixs6l");
    			add_location(footer, file$4, 31, 0, 628);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, a0);
    			append_dev(a0, i);
    			append_dev(div, t0);
    			append_dev(div, a1);
    			mount_component(twittericon, a1, null);
    			append_dev(div, t1);
    			append_dev(div, a2);
    			mount_component(githubicon, a2, null);
    			append_dev(div, t2);
    			append_dev(div, a3);
    			mount_component(zapicon, a3, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(twittericon.$$.fragment, local);
    			transition_in(githubicon.$$.fragment, local);
    			transition_in(zapicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(twittericon.$$.fragment, local);
    			transition_out(githubicon.$$.fragment, local);
    			transition_out(zapicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			destroy_component(twittericon);
    			destroy_component(githubicon);
    			destroy_component(zapicon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);
    	$$self.$capture_state = () => ({ TwitterIcon, GithubIcon, ZapIcon });
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/header.svelte generated by Svelte v3.23.2 */
    const file$5 = "src/components/header.svelte";

    function create_fragment$5(ctx) {
    	let header;
    	let h1;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Tweet2Img";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Convert Tweets to Image!";
    			attr_dev(h1, "class", "svelte-1wca9ps");
    			add_location(h1, file$5, 25, 2, 374);
    			attr_dev(p, "class", "svelte-1wca9ps");
    			add_location(p, file$5, 26, 2, 395);
    			attr_dev(header, "class", "svelte-1wca9ps");
    			add_location(header, file$5, 24, 0, 363);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(header, t1);
    			append_dev(header, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	$$self.$capture_state = () => ({ TwitterIcon, GithubIcon, ZapIcon });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/form.svelte generated by Svelte v3.23.2 */
    const file$6 = "src/components/form.svelte";

    function create_fragment$6(ctx) {
    	let article;
    	let header;
    	let t0;
    	let form;
    	let div0;
    	let input0;
    	let t1;
    	let button;
    	let span;
    	let t3;
    	let div1;
    	let label0;
    	let input1;
    	let t4;
    	let t5;
    	let label1;
    	let input2;
    	let t6;
    	let t7;
    	let label2;
    	let input3;
    	let t8;
    	let t9;
    	let footer;
    	let current;
    	let mounted;
    	let dispose;
    	header = new Header({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			article = element("article");
    			create_component(header.$$.fragment);
    			t0 = space();
    			form = element("form");
    			div0 = element("div");
    			input0 = element("input");
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			span.textContent = "I";
    			t3 = space();
    			div1 = element("div");
    			label0 = element("label");
    			input1 = element("input");
    			t4 = text("\n        Dark");
    			t5 = space();
    			label1 = element("label");
    			input2 = element("input");
    			t6 = text("\n        liked");
    			t7 = space();
    			label2 = element("label");
    			input3 = element("input");
    			t8 = text("\n        remove Comments");
    			t9 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Tweet link");
    			attr_dev(input0, "autocomplete", "url");
    			input0.autofocus = true;
    			attr_dev(input0, "class", "svelte-gofb8l");
    			add_location(input0, file$6, 124, 6, 2445);
    			attr_dev(span, "class", "icon svelte-gofb8l");
    			add_location(span, file$6, 131, 8, 2620);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-gofb8l");
    			add_location(button, file$6, 130, 6, 2589);
    			attr_dev(div0, "id", "url");
    			attr_dev(div0, "class", "svelte-gofb8l");
    			add_location(div0, file$6, 123, 4, 2424);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$6, 136, 8, 2746);
    			attr_dev(label0, "title", "enable dark theme");
    			add_location(label0, file$6, 135, 6, 2704);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$6, 140, 8, 2867);
    			attr_dev(label1, "title", "make tweet liked");
    			add_location(label1, file$6, 139, 6, 2826);
    			attr_dev(input3, "type", "checkbox");
    			add_location(input3, file$6, 144, 8, 2990);
    			attr_dev(label2, "title", "make tweet liked");
    			add_location(label2, file$6, 143, 6, 2949);
    			attr_dev(div1, "id", "options");
    			attr_dev(div1, "class", "svelte-gofb8l");
    			add_location(div1, file$6, 134, 4, 2679);
    			attr_dev(form, "class", "svelte-gofb8l");
    			add_location(form, file$6, 122, 2, 2375);
    			attr_dev(article, "id", "query");
    			attr_dev(article, "class", "svelte-gofb8l");
    			add_location(article, file$6, 119, 0, 2338);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			mount_component(header, article, null);
    			append_dev(article, t0);
    			append_dev(article, form);
    			append_dev(form, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*tweetUrl*/ ctx[0]);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(button, span);
    			append_dev(form, t3);
    			append_dev(form, div1);
    			append_dev(div1, label0);
    			append_dev(label0, input1);
    			input1.checked = /*dark*/ ctx[1];
    			append_dev(label0, t4);
    			append_dev(div1, t5);
    			append_dev(div1, label1);
    			append_dev(label1, input2);
    			input2.checked = /*liked*/ ctx[2];
    			append_dev(label1, t6);
    			append_dev(div1, t7);
    			append_dev(div1, label2);
    			append_dev(label2, input3);
    			input3.checked = /*removeComments*/ ctx[3];
    			append_dev(label2, t8);
    			append_dev(article, t9);
    			mount_component(footer, article, null);
    			current = true;
    			input0.focus();

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[6]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[7]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[8]),
    					listen_dev(form, "submit", prevent_default(/*emitSubmit*/ ctx[4]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tweetUrl*/ 1 && input0.value !== /*tweetUrl*/ ctx[0]) {
    				set_input_value(input0, /*tweetUrl*/ ctx[0]);
    			}

    			if (dirty & /*dark*/ 2) {
    				input1.checked = /*dark*/ ctx[1];
    			}

    			if (dirty & /*liked*/ 4) {
    				input2.checked = /*liked*/ ctx[2];
    			}

    			if (dirty & /*removeComments*/ 8) {
    				input3.checked = /*removeComments*/ ctx[3];
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_component(header);
    			destroy_component(footer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let tweetUrl = "";
    	let dark = false;
    	let liked = false;
    	let removeComments = false;

    	function emitSubmit() {
    		dispatch("formsubmit", { tweetUrl, dark, liked, removeComments });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Form> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Form", $$slots, []);

    	function input0_input_handler() {
    		tweetUrl = this.value;
    		$$invalidate(0, tweetUrl);
    	}

    	function input1_change_handler() {
    		dark = this.checked;
    		$$invalidate(1, dark);
    	}

    	function input2_change_handler() {
    		liked = this.checked;
    		$$invalidate(2, liked);
    	}

    	function input3_change_handler() {
    		removeComments = this.checked;
    		$$invalidate(3, removeComments);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Footer,
    		Header,
    		dispatch,
    		tweetUrl,
    		dark,
    		liked,
    		removeComments,
    		emitSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("tweetUrl" in $$props) $$invalidate(0, tweetUrl = $$props.tweetUrl);
    		if ("dark" in $$props) $$invalidate(1, dark = $$props.dark);
    		if ("liked" in $$props) $$invalidate(2, liked = $$props.liked);
    		if ("removeComments" in $$props) $$invalidate(3, removeComments = $$props.removeComments);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tweetUrl,
    		dark,
    		liked,
    		removeComments,
    		emitSubmit,
    		input0_input_handler,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler
    	];
    }

    class Form extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.23.2 */

    const { console: console_1 } = globals;
    const file$7 = "src/App.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let form;
    	let t;
    	let imageview;
    	let current;
    	form = new Form({ $$inline: true });
    	form.$on("formsubmit", /*handleSubmit*/ ctx[2]);

    	imageview = new ImageView({
    			props: {
    				src: /*imgSrc*/ ctx[0],
    				downloadLink: /*downloadLink*/ ctx[1]
    			},
    			$$inline: true
    		});

    	imageview.$on("click", /*downloadImage*/ ctx[3]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(form.$$.fragment);
    			t = space();
    			create_component(imageview.$$.fragment);
    			attr_dev(main, "class", "svelte-1r82w8z");
    			add_location(main, file$7, 62, 0, 1479);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(form, main, null);
    			append_dev(main, t);
    			mount_component(imageview, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const imageview_changes = {};
    			if (dirty & /*imgSrc*/ 1) imageview_changes.src = /*imgSrc*/ ctx[0];
    			if (dirty & /*downloadLink*/ 2) imageview_changes.downloadLink = /*downloadLink*/ ctx[1];
    			imageview.$set(imageview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(form.$$.fragment, local);
    			transition_in(imageview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(form.$$.fragment, local);
    			transition_out(imageview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(form);
    			destroy_component(imageview);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let imgSrc = "";
    	let downloadLink = "";

    	async function handleSubmit(e) {
    		const { tweetUrl, liked, dark, removeComments } = e.detail;
    		console.log({ tweetUrl, liked, dark, removeComments });
    		if (!tweetUrl.length) return;
    		nprogress.start();
    		let url = `/img?url=${tweetUrl}${dark ? "&theme=dark" : ""}${liked ? "&liked=true" : ""}${removeComments ? "&removeComments=true" : ""}`;

    		fetch(url).then(response => response.blob()).then(blob => {
    			$$invalidate(0, imgSrc = URL.createObjectURL(blob));
    			nprogress.done();
    			$$invalidate(1, downloadLink = imgSrc);
    		}); // var reader = new FileReader();
    		// reader.addEventListener("loadend", () => {
    		//   let contents = reader.result;
    		//   imgSrc = contents;
    	} //   nprogress.done();
    	// });

    	// reader.readAsDataURL(blob);
    	function downloadImage() {
    		if (!imgSrc.length) return;
    		URL.revokeObjectURL(imgSrc);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		nprogress,
    		ImageView,
    		Form,
    		imgSrc,
    		downloadLink,
    		handleSubmit,
    		downloadImage
    	});

    	$$self.$inject_state = $$props => {
    		if ("imgSrc" in $$props) $$invalidate(0, imgSrc = $$props.imgSrc);
    		if ("downloadLink" in $$props) $$invalidate(1, downloadLink = $$props.downloadLink);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [imgSrc, downloadLink, handleSubmit, downloadImage];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
