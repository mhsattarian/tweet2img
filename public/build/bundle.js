
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
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

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
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
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
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
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    const context = {
      subscribe: null,
      addNotification: null,
      removeNotification: null,
      clearNotifications: null,
    };

    const getNotificationsContext = () => getContext(context);

    /* node_modules/svelte-notifications/src/components/Notification.svelte generated by Svelte v3.23.2 */

    function create_fragment(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*item*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: {
    				notification: /*notification*/ ctx[1],
    				withoutStyles: /*withoutStyles*/ ctx[2],
    				onRemove: /*removeNotificationHandler*/ ctx[3]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*notification*/ 2) switch_instance_changes.notification = /*notification*/ ctx[1];
    			if (dirty & /*withoutStyles*/ 4) switch_instance_changes.withoutStyles = /*withoutStyles*/ ctx[2];

    			if (switch_value !== (switch_value = /*item*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
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
    	let { item } = $$props;
    	let { notification = {} } = $$props;
    	let { withoutStyles = false } = $$props;
    	const { removeNotification } = getNotificationsContext();
    	const { id, removeAfter, customClass = "" } = notification;
    	const removeNotificationHandler = () => removeNotification(id);
    	let timeout = null;

    	if (removeAfter) {
    		timeout = setTimeout(removeNotificationHandler, removeAfter);
    	}

    	onDestroy(() => {
    		if (removeAfter && timeout) clearTimeout(timeout);
    	});

    	const writable_props = ["item", "notification", "withoutStyles"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notification> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Notification", $$slots, []);

    	$$self.$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("notification" in $$props) $$invalidate(1, notification = $$props.notification);
    		if ("withoutStyles" in $$props) $$invalidate(2, withoutStyles = $$props.withoutStyles);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		fade,
    		getNotificationsContext,
    		item,
    		notification,
    		withoutStyles,
    		removeNotification,
    		id,
    		removeAfter,
    		customClass,
    		removeNotificationHandler,
    		timeout
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("notification" in $$props) $$invalidate(1, notification = $$props.notification);
    		if ("withoutStyles" in $$props) $$invalidate(2, withoutStyles = $$props.withoutStyles);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, notification, withoutStyles, removeNotificationHandler];
    }

    class Notification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			item: 0,
    			notification: 1,
    			withoutStyles: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<Notification> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get notification() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set notification(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get withoutStyles() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set withoutStyles(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-notifications/src/components/DefaultNotification.svelte generated by Svelte v3.23.2 */
    const file = "node_modules/svelte-notifications/src/components/DefaultNotification.svelte";

    // (102:10) {text}
    function fallback_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*text*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(102:10) {text}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let div0_class_value;
    	let t0;
    	let button;
    	let t1;
    	let button_class_value;
    	let div1_class_value;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			t0 = space();
    			button = element("button");
    			t1 = text("×");
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*getClass*/ ctx[2]("content")) + " svelte-4t58gn"));
    			add_location(div0, file, 100, 2, 2227);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*getClass*/ ctx[2]("button")) + " svelte-4t58gn"));
    			attr_dev(button, "aria-label", "delete notification");
    			add_location(button, file, 103, 2, 2296);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*getClass*/ ctx[2]()) + " svelte-4t58gn"));
    			attr_dev(div1, "role", "status");
    			attr_dev(div1, "aria-live", "polite");
    			add_location(div1, file, 93, 0, 2139);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(div0, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*onRemove*/ ctx[0])) /*onRemove*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				if (!div1_intro) div1_intro = create_in_transition(div1, fade, {});
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			dispose();
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
    	let { notification = {} } = $$props;
    	let { withoutStyles = false } = $$props;
    	let { onRemove = null } = $$props;
    	const { id, text, type } = notification;

    	const getClass = suffix => {
    		const defaultSuffix = suffix ? `-${suffix}` : "";
    		const defaultNotificationClass = ` default-notification-style${defaultSuffix}`;
    		const defaultNotificationType = type && !suffix ? ` default-notification-${type}` : "";
    		return `notification${defaultSuffix}${withoutStyles ? "" : defaultNotificationClass}${defaultNotificationType}`;
    	};

    	const writable_props = ["notification", "withoutStyles", "onRemove"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DefaultNotification> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DefaultNotification", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("notification" in $$props) $$invalidate(3, notification = $$props.notification);
    		if ("withoutStyles" in $$props) $$invalidate(4, withoutStyles = $$props.withoutStyles);
    		if ("onRemove" in $$props) $$invalidate(0, onRemove = $$props.onRemove);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		notification,
    		withoutStyles,
    		onRemove,
    		id,
    		text,
    		type,
    		getClass
    	});

    	$$self.$inject_state = $$props => {
    		if ("notification" in $$props) $$invalidate(3, notification = $$props.notification);
    		if ("withoutStyles" in $$props) $$invalidate(4, withoutStyles = $$props.withoutStyles);
    		if ("onRemove" in $$props) $$invalidate(0, onRemove = $$props.onRemove);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onRemove, text, getClass, notification, withoutStyles, $$scope, $$slots];
    }

    class DefaultNotification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			notification: 3,
    			withoutStyles: 4,
    			onRemove: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DefaultNotification",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get notification() {
    		throw new Error("<DefaultNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set notification(value) {
    		throw new Error("<DefaultNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get withoutStyles() {
    		throw new Error("<DefaultNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set withoutStyles(value) {
    		throw new Error("<DefaultNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onRemove() {
    		throw new Error("<DefaultNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onRemove(value) {
    		throw new Error("<DefaultNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const positions = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ];

    const isNotificationValid = notification => {
      if (!notification || !notification.text) return false;
      if (typeof notification.text !== 'string') return false;
      if (!positions.includes(notification.position)) return false;

      return true;
    };

    const addNotification = (notification, update) => {
      if (!isNotificationValid(notification)) throw new Error('Notification object is not valid');

      const {
        id = new Date().getTime(),
        removeAfter = +notification.removeAfter,
        ...rest
      } = notification;

      update((notifications) => {
        return [...notifications, {
          id,
          removeAfter,
          ...rest,
        }];
      });
    };

    const removeNotification = (notificationId, update) => update((notifications) => {
      return notifications.filter(n => n.id !== notificationId);
    });

    const clearNotifications = set => set([]);

    const createNotificationsStore = () => {
      const {
        subscribe,
        set,
        update,
      } = writable([]);

      return {
        subscribe,
        addNotification: notification => addNotification(notification, update),
        removeNotification: notificationId => removeNotification(notificationId, update),
        clearNotifications: () => clearNotifications(set),
      };
    };

    var store = createNotificationsStore();

    /* node_modules/svelte-notifications/src/components/Notifications.svelte generated by Svelte v3.23.2 */
    const file$1 = "node_modules/svelte-notifications/src/components/Notifications.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (71:8) {#if notification.position === position}
    function create_if_block(ctx) {
    	let notification;
    	let current;

    	notification = new Notification({
    			props: {
    				notification: /*notification*/ ctx[9],
    				withoutStyles: /*withoutStyles*/ ctx[1],
    				item: /*item*/ ctx[0] ? /*item*/ ctx[0] : DefaultNotification
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(notification.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(notification, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const notification_changes = {};
    			if (dirty & /*$store*/ 4) notification_changes.notification = /*notification*/ ctx[9];
    			if (dirty & /*withoutStyles*/ 2) notification_changes.withoutStyles = /*withoutStyles*/ ctx[1];
    			if (dirty & /*item*/ 1) notification_changes.item = /*item*/ ctx[0] ? /*item*/ ctx[0] : DefaultNotification;
    			notification.$set(notification_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notification.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notification.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notification, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(71:8) {#if notification.position === position}",
    		ctx
    	});

    	return block;
    }

    // (70:6) {#each $store as notification (notification.id)}
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = /*notification*/ ctx[9].position === /*position*/ ctx[6] && create_if_block(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*notification*/ ctx[9].position === /*position*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$store*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(70:6) {#each $store as notification (notification.id)}",
    		ctx
    	});

    	return block;
    }

    // (68:2) {#each positions as position}
    function create_each_block(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let div_class_value;
    	let current;
    	let each_value_1 = /*$store*/ ctx[2];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*notification*/ ctx[9].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*getClass*/ ctx[3](/*position*/ ctx[6])) + " svelte-7avcjj"));
    			add_location(div, file$1, 68, 4, 1447);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$store, withoutStyles, item, DefaultNotification, positions*/ 7) {
    				const each_value_1 = /*$store*/ ctx[2];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, outro_and_destroy_block, create_each_block_1, t, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(68:2) {#each positions as position}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t;
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let each_value = positions;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "notifications");
    			add_location(div, file$1, 66, 0, 1383);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			if (dirty & /*getClass, positions, $store, withoutStyles, item, DefaultNotification*/ 15) {
    				each_value = positions;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    	let $store;
    	validate_store(store, "store");
    	component_subscribe($$self, store, $$value => $$invalidate(2, $store = $$value));
    	let { item = null } = $$props;
    	let { withoutStyles = false } = $$props;

    	const getClass = (position = "") => {
    		const defaultPositionClass = ` default-position-style-${position}`;
    		return `position-${position}${withoutStyles ? "" : defaultPositionClass}`;
    	};

    	setContext(context, store);
    	const writable_props = ["item", "withoutStyles"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notifications> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Notifications", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("withoutStyles" in $$props) $$invalidate(1, withoutStyles = $$props.withoutStyles);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		Notification,
    		DefaultNotification,
    		context,
    		store,
    		positions,
    		item,
    		withoutStyles,
    		getClass,
    		$store
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("withoutStyles" in $$props) $$invalidate(1, withoutStyles = $$props.withoutStyles);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, withoutStyles, $store, getClass, $$scope, $$slots];
    }

    class Notifications extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { item: 0, withoutStyles: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notifications",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get item() {
    		throw new Error("<Notifications>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Notifications>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get withoutStyles() {
    		throw new Error("<Notifications>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set withoutStyles(value) {
    		throw new Error("<Notifications>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
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

    /* node_modules/svelte-feather-icons/src/icons/CopyIcon.svelte generated by Svelte v3.23.2 */

    const file$2 = "node_modules/svelte-feather-icons/src/icons/CopyIcon.svelte";

    function create_fragment$3(ctx) {
    	let svg;
    	let rect;
    	let path;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			path = svg_element("path");
    			attr_dev(rect, "x", "9");
    			attr_dev(rect, "y", "9");
    			attr_dev(rect, "width", "13");
    			attr_dev(rect, "height", "13");
    			attr_dev(rect, "rx", "2");
    			attr_dev(rect, "ry", "2");
    			add_location(rect, file$2, 12, 229, 485);
    			attr_dev(path, "d", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1");
    			add_location(path, file$2, 12, 291, 547);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", svg_class_value = "feather feather-copy " + /*customClass*/ ctx[1]);
    			add_location(svg, file$2, 12, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*customClass*/ 2 && svg_class_value !== (svg_class_value = "feather feather-copy " + /*customClass*/ ctx[1])) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CopyIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CopyIcon", $$slots, []);

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

    class CopyIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CopyIcon",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get size() {
    		throw new Error("<CopyIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<CopyIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<CopyIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<CopyIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-feather-icons/src/icons/GithubIcon.svelte generated by Svelte v3.23.2 */

    const file$3 = "node_modules/svelte-feather-icons/src/icons/GithubIcon.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let path;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22");
    			add_location(path, file$3, 12, 231, 487);
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
    			add_location(svg, file$3, 12, 0, 256);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GithubIcon",
    			options,
    			id: create_fragment$4.name
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

    const file$4 = "node_modules/svelte-feather-icons/src/icons/TwitterIcon.svelte";

    function create_fragment$5(ctx) {
    	let svg;
    	let path;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z");
    			add_location(path, file$4, 12, 232, 488);
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
    			add_location(svg, file$4, 12, 0, 256);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TwitterIcon",
    			options,
    			id: create_fragment$5.name
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

    const file$5 = "node_modules/svelte-feather-icons/src/icons/ZapIcon.svelte";

    function create_fragment$6(ctx) {
    	let svg;
    	let polygon;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			polygon = svg_element("polygon");
    			attr_dev(polygon, "points", "13 2 3 14 12 14 11 22 21 10 12 10 13 2");
    			add_location(polygon, file$5, 12, 228, 484);
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
    			add_location(svg, file$5, 12, 0, 256);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { size: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ZapIcon",
    			options,
    			id: create_fragment$6.name
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

    /* src/components/imageView.svelte generated by Svelte v3.23.2 */
    const file$6 = "src/components/imageView.svelte";

    // (58:4) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Example";
    			add_location(p, file$6, 58, 6, 1337);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(58:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (56:4) {#if src.length}
    function create_if_block$1(ctx) {
    	let p;
    	let t0;
    	let a;
    	let copyicon;
    	let t1;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	copyicon = new CopyIcon({ props: { size: "1x" }, $$inline: true });

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("click image to download - ");
    			a = element("a");
    			create_component(copyicon.$$.fragment);
    			t1 = space();
    			t2 = text(/*copyText*/ ctx[3]);
    			attr_dev(a, "href", /*url*/ ctx[2]);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$6, 56, 35, 1216);
    			add_location(p, file$6, 56, 6, 1187);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, a);
    			mount_component(copyicon, a, null);
    			append_dev(a, t1);
    			append_dev(a, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*copy*/ ctx[5]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*copyText*/ 8) set_data_dev(t2, /*copyText*/ ctx[3]);

    			if (!current || dirty & /*url*/ 4) {
    				attr_dev(a, "href", /*url*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(copyicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(copyicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			destroy_component(copyicon);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(56:4) {#if src.length}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let article;
    	let div;
    	let a;
    	let img;
    	let img_src_value;
    	let a_href_value;
    	let a_download_value;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*src*/ ctx[0].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			article = element("article");
    			div = element("div");
    			a = element("a");
    			img = element("img");
    			t = space();
    			if_block.c();
    			if (img.src !== (img_src_value = /*src*/ ctx[0] || /*exampleSrc*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-wwc3d6");
    			add_location(img, file$6, 54, 80, 1124);
    			attr_dev(a, "href", a_href_value = /*downloadLink*/ ctx[1] || "#");
    			attr_dev(a, "download", a_download_value = /*downloadLink*/ ctx[1] ? "tweet.jpg" : null);
    			add_location(a, file$6, 54, 4, 1048);
    			attr_dev(div, "id", "image-wrapper");
    			attr_dev(div, "class", "svelte-wwc3d6");
    			add_location(div, file$6, 53, 2, 1019);
    			attr_dev(article, "id", "image");
    			attr_dev(article, "class", "svelte-wwc3d6");
    			add_location(article, file$6, 52, 0, 996);
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
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0] || /*exampleSrc*/ ctx[4])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*downloadLink*/ 2 && a_href_value !== (a_href_value = /*downloadLink*/ ctx[1] || "#")) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (!current || dirty & /*downloadLink*/ 2 && a_download_value !== (a_download_value = /*downloadLink*/ ctx[1] ? "tweet.jpg" : null)) {
    				attr_dev(a, "download", a_download_value);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if_blocks[current_block_type_index].d();
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
    	let { src } = $$props;
    	let { downloadLink } = $$props;
    	let { url } = $$props;
    	let exampleSrc = "/img?url=https://twitter.com/fermatslibrary/status/1273977843937169413";
    	let copyText = "Permalink";

    	function copy() {
    		let prevCopyText = copyText;

    		navigator.clipboard.writeText(location.origin + url).then(
    			function () {
    				$$invalidate(3, copyText = "Copied!"); /* clipboard write failed */

    				setTimeout(
    					() => {
    						$$invalidate(3, copyText = prevCopyText);
    					},
    					700
    				);
    			},
    			function () {
    				$$invalidate(3, copyText = "Copy failed! :("); /* clipboard successfully set */

    				setTimeout(
    					() => {
    						$$invalidate(3, copyText = prevCopyText);
    					},
    					700
    				);
    			}
    		); /* clipboard write failed */
    	}

    	const writable_props = ["src", "downloadLink", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ImageView", $$slots, []);

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("downloadLink" in $$props) $$invalidate(1, downloadLink = $$props.downloadLink);
    		if ("url" in $$props) $$invalidate(2, url = $$props.url);
    	};

    	$$self.$capture_state = () => ({
    		CopyIcon,
    		src,
    		downloadLink,
    		url,
    		exampleSrc,
    		copyText,
    		copy
    	});

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("downloadLink" in $$props) $$invalidate(1, downloadLink = $$props.downloadLink);
    		if ("url" in $$props) $$invalidate(2, url = $$props.url);
    		if ("exampleSrc" in $$props) $$invalidate(4, exampleSrc = $$props.exampleSrc);
    		if ("copyText" in $$props) $$invalidate(3, copyText = $$props.copyText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, downloadLink, url, copyText, exampleSrc, copy];
    }

    class ImageView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { src: 0, downloadLink: 1, url: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageView",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*src*/ ctx[0] === undefined && !("src" in props)) {
    			console.warn("<ImageView> was created without expected prop 'src'");
    		}

    		if (/*downloadLink*/ ctx[1] === undefined && !("downloadLink" in props)) {
    			console.warn("<ImageView> was created without expected prop 'downloadLink'");
    		}

    		if (/*url*/ ctx[2] === undefined && !("url" in props)) {
    			console.warn("<ImageView> was created without expected prop 'url'");
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

    	get url() {
    		throw new Error("<ImageView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<ImageView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/footer.svelte generated by Svelte v3.23.2 */
    const file$7 = "src/components/footer.svelte";

    function create_fragment$8(ctx) {
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
    			add_location(i, file$7, 33, 38, 694);
    			attr_dev(a0, "href", "https://mhsattarian.com");
    			add_location(a0, file$7, 33, 4, 660);
    			attr_dev(a1, "href", "https://twitter.com/mh_sattarian");
    			add_location(a1, file$7, 34, 4, 718);
    			attr_dev(a2, "href", "https://github.com/mhsattarian/tweet2img");
    			add_location(a2, file$7, 35, 4, 797);
    			attr_dev(a3, "href", "https://t.me/tweet2img_bot");
    			add_location(a3, file$7, 36, 4, 883);
    			attr_dev(div, "id", "creds");
    			attr_dev(div, "class", "svelte-kixs6l");
    			add_location(div, file$7, 32, 2, 639);
    			attr_dev(footer, "class", "svelte-kixs6l");
    			add_location(footer, file$7, 31, 0, 628);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/header.svelte generated by Svelte v3.23.2 */
    const file$8 = "src/components/header.svelte";

    function create_fragment$9(ctx) {
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
    			add_location(h1, file$8, 25, 2, 374);
    			attr_dev(p, "class", "svelte-1wca9ps");
    			add_location(p, file$8, 26, 2, 395);
    			attr_dev(header, "class", "svelte-1wca9ps");
    			add_location(header, file$8, 24, 0, 363);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/form.svelte generated by Svelte v3.23.2 */
    const file$9 = "src/components/form.svelte";

    function create_fragment$a(ctx) {
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
    			attr_dev(input0, "placeholder", "Tweet link e.g., https://twitter.com/fermatslibrary/status/1273977843937169413");
    			attr_dev(input0, "autocomplete", "url");
    			input0.autofocus = true;
    			attr_dev(input0, "class", "svelte-gofb8l");
    			add_location(input0, file$9, 124, 6, 2445);
    			attr_dev(span, "class", "icon svelte-gofb8l");
    			add_location(span, file$9, 131, 8, 2688);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-gofb8l");
    			add_location(button, file$9, 130, 6, 2657);
    			attr_dev(div0, "id", "url");
    			attr_dev(div0, "class", "svelte-gofb8l");
    			add_location(div0, file$9, 123, 4, 2424);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$9, 136, 8, 2815);
    			attr_dev(label0, "title", "enables dark theme");
    			add_location(label0, file$9, 135, 6, 2772);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$9, 140, 8, 2937);
    			attr_dev(label1, "title", "makes tweet liked");
    			add_location(label1, file$9, 139, 6, 2895);
    			attr_dev(input3, "type", "checkbox");
    			add_location(input3, file$9, 144, 8, 3068);
    			attr_dev(label2, "title", "removes comments section");
    			add_location(label2, file$9, 143, 6, 3019);
    			attr_dev(div1, "id", "options");
    			attr_dev(div1, "class", "svelte-gofb8l");
    			add_location(div1, file$9, 134, 4, 2747);
    			attr_dev(form, "class", "svelte-gofb8l");
    			add_location(form, file$9, 122, 2, 2375);
    			attr_dev(article, "id", "query");
    			attr_dev(article, "class", "svelte-gofb8l");
    			add_location(article, file$9, 119, 0, 2338);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/main.svelte generated by Svelte v3.23.2 */
    const file$a = "src/components/main.svelte";

    function create_fragment$b(ctx) {
    	let main;
    	let form;
    	let t;
    	let imageview;
    	let current;
    	form = new Form({ $$inline: true });
    	form.$on("formsubmit", /*handleSubmit*/ ctx[3]);

    	imageview = new ImageView({
    			props: {
    				src: /*imgSrc*/ ctx[0],
    				downloadLink: /*downloadLink*/ ctx[1],
    				url: /*url*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(form.$$.fragment);
    			t = space();
    			create_component(imageview.$$.fragment);
    			attr_dev(main, "class", "svelte-1r82w8z");
    			add_location(main, file$a, 73, 0, 1731);
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
    			if (dirty & /*url*/ 4) imageview_changes.url = /*url*/ ctx[2];
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	const { addNotification } = getNotificationsContext();
    	let imgSrc = "";
    	let downloadLink = "";
    	let url = "";

    	async function handleSubmit(e) {
    		const { tweetUrl, liked, dark, removeComments } = e.detail;

    		if (!tweetUrl.length) return; else if (!new URL(tweetUrl).hostname.endsWith("twitter.com")) {
    			addNotification({
    				text: "Invalid URL",
    				type: "danger",
    				position: "bottom-right",
    				removeAfter: 1500
    			});

    			return;
    		}

    		if (!imgSrc.length) URL.revokeObjectURL(imgSrc);
    		nprogress.start();
    		$$invalidate(2, url = `/img?url=${tweetUrl}${dark ? "&theme=dark" : ""}${liked ? "&liked=true" : ""}${removeComments ? "&removeComments=true" : ""}`);

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Main", $$slots, []);

    	$$self.$capture_state = () => ({
    		nprogress,
    		ImageView,
    		Form,
    		getNotificationsContext,
    		addNotification,
    		imgSrc,
    		downloadLink,
    		url,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("imgSrc" in $$props) $$invalidate(0, imgSrc = $$props.imgSrc);
    		if ("downloadLink" in $$props) $$invalidate(1, downloadLink = $$props.downloadLink);
    		if ("url" in $$props) $$invalidate(2, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [imgSrc, downloadLink, url, handleSubmit];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.23.2 */

    // (9:0) <Notifications>
    function create_default_slot(ctx) {
    	let main;
    	let current;
    	main = new Main({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(main.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(main, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(main.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(main.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(main, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(9:0) <Notifications>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let notifications;
    	let current;

    	notifications = new Notifications({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(notifications.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(notifications, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const notifications_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				notifications_changes.$$scope = { dirty, ctx };
    			}

    			notifications.$set(notifications_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notifications.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notifications.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notifications, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Notifications, Main });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
