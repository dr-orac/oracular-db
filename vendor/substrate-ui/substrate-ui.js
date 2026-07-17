//#region node_modules/.pnpm/signal-polyfill@0.2.2/node_modules/signal-polyfill/dist/index.js
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField = (obj, key, value) => {
	__defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
	return value;
};
var __accessCheck = (obj, member, msg) => {
	if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateIn = (member, obj) => {
	if (Object(obj) !== obj) throw TypeError("Cannot use the \"in\" operator on this value");
	return member.has(obj);
};
var __privateAdd = (obj, member, value) => {
	if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
	member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateMethod = (obj, member, method) => {
	__accessCheck(obj, member, "access private method");
	return method;
};
/**
* @license
* Copyright Google LLC All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
function defaultEquals(a, b) {
	return Object.is(a, b);
}
/**
* @license
* Copyright Google LLC All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
var activeConsumer = null;
var inNotificationPhase = false;
var epoch = 1;
var SIGNAL = /* @__PURE__ */ Symbol("SIGNAL");
function setActiveConsumer(consumer) {
	const prev = activeConsumer;
	activeConsumer = consumer;
	return prev;
}
function getActiveConsumer() {
	return activeConsumer;
}
function isInNotificationPhase() {
	return inNotificationPhase;
}
var REACTIVE_NODE = {
	version: 0,
	lastCleanEpoch: 0,
	dirty: false,
	producerNode: void 0,
	producerLastReadVersion: void 0,
	producerIndexOfThis: void 0,
	nextProducerIndex: 0,
	liveConsumerNode: void 0,
	liveConsumerIndexOfThis: void 0,
	consumerAllowSignalWrites: false,
	consumerIsAlwaysLive: false,
	producerMustRecompute: () => false,
	producerRecomputeValue: () => {},
	consumerMarkedDirty: () => {},
	consumerOnSignalRead: () => {}
};
function producerAccessed(node) {
	if (inNotificationPhase) throw new Error(typeof ngDevMode !== "undefined" && ngDevMode ? `Assertion error: signal read during notification phase` : "");
	if (activeConsumer === null) return;
	activeConsumer.consumerOnSignalRead(node);
	const idx = activeConsumer.nextProducerIndex++;
	assertConsumerNode(activeConsumer);
	if (idx < activeConsumer.producerNode.length && activeConsumer.producerNode[idx] !== node) {
		if (consumerIsLive(activeConsumer)) {
			const staleProducer = activeConsumer.producerNode[idx];
			producerRemoveLiveConsumerAtIndex(staleProducer, activeConsumer.producerIndexOfThis[idx]);
		}
	}
	if (activeConsumer.producerNode[idx] !== node) {
		activeConsumer.producerNode[idx] = node;
		activeConsumer.producerIndexOfThis[idx] = consumerIsLive(activeConsumer) ? producerAddLiveConsumer(node, activeConsumer, idx) : 0;
	}
	activeConsumer.producerLastReadVersion[idx] = node.version;
}
function producerIncrementEpoch() {
	epoch++;
}
function producerUpdateValueVersion(node) {
	if (!node.dirty && node.lastCleanEpoch === epoch) return;
	if (!node.producerMustRecompute(node) && !consumerPollProducersForChange(node)) {
		node.dirty = false;
		node.lastCleanEpoch = epoch;
		return;
	}
	node.producerRecomputeValue(node);
	node.dirty = false;
	node.lastCleanEpoch = epoch;
}
function producerNotifyConsumers(node) {
	if (node.liveConsumerNode === void 0) return;
	const prev = inNotificationPhase;
	inNotificationPhase = true;
	try {
		for (const consumer of node.liveConsumerNode) if (!consumer.dirty) consumerMarkDirty(consumer);
	} finally {
		inNotificationPhase = prev;
	}
}
function producerUpdatesAllowed() {
	return (activeConsumer == null ? void 0 : activeConsumer.consumerAllowSignalWrites) !== false;
}
function consumerMarkDirty(node) {
	var _a;
	node.dirty = true;
	producerNotifyConsumers(node);
	(_a = node.consumerMarkedDirty) == null || _a.call(node.wrapper ?? node);
}
function consumerBeforeComputation(node) {
	node && (node.nextProducerIndex = 0);
	return setActiveConsumer(node);
}
function consumerAfterComputation(node, prevConsumer) {
	setActiveConsumer(prevConsumer);
	if (!node || node.producerNode === void 0 || node.producerIndexOfThis === void 0 || node.producerLastReadVersion === void 0) return;
	if (consumerIsLive(node)) for (let i = node.nextProducerIndex; i < node.producerNode.length; i++) producerRemoveLiveConsumerAtIndex(node.producerNode[i], node.producerIndexOfThis[i]);
	while (node.producerNode.length > node.nextProducerIndex) {
		node.producerNode.pop();
		node.producerLastReadVersion.pop();
		node.producerIndexOfThis.pop();
	}
}
function consumerPollProducersForChange(node) {
	assertConsumerNode(node);
	for (let i = 0; i < node.producerNode.length; i++) {
		const producer = node.producerNode[i];
		const seenVersion = node.producerLastReadVersion[i];
		if (seenVersion !== producer.version) return true;
		producerUpdateValueVersion(producer);
		if (seenVersion !== producer.version) return true;
	}
	return false;
}
function producerAddLiveConsumer(node, consumer, indexOfThis) {
	var _a;
	assertProducerNode(node);
	assertConsumerNode(node);
	if (node.liveConsumerNode.length === 0) {
		(_a = node.watched) == null || _a.call(node.wrapper);
		for (let i = 0; i < node.producerNode.length; i++) node.producerIndexOfThis[i] = producerAddLiveConsumer(node.producerNode[i], node, i);
	}
	node.liveConsumerIndexOfThis.push(indexOfThis);
	return node.liveConsumerNode.push(consumer) - 1;
}
function producerRemoveLiveConsumerAtIndex(node, idx) {
	var _a;
	assertProducerNode(node);
	assertConsumerNode(node);
	if (typeof ngDevMode !== "undefined" && ngDevMode && idx >= node.liveConsumerNode.length) throw new Error(`Assertion error: active consumer index ${idx} is out of bounds of ${node.liveConsumerNode.length} consumers)`);
	if (node.liveConsumerNode.length === 1) {
		(_a = node.unwatched) == null || _a.call(node.wrapper);
		for (let i = 0; i < node.producerNode.length; i++) producerRemoveLiveConsumerAtIndex(node.producerNode[i], node.producerIndexOfThis[i]);
	}
	const lastIdx = node.liveConsumerNode.length - 1;
	node.liveConsumerNode[idx] = node.liveConsumerNode[lastIdx];
	node.liveConsumerIndexOfThis[idx] = node.liveConsumerIndexOfThis[lastIdx];
	node.liveConsumerNode.length--;
	node.liveConsumerIndexOfThis.length--;
	if (idx < node.liveConsumerNode.length) {
		const idxProducer = node.liveConsumerIndexOfThis[idx];
		const consumer = node.liveConsumerNode[idx];
		assertConsumerNode(consumer);
		consumer.producerIndexOfThis[idxProducer] = idx;
	}
}
function consumerIsLive(node) {
	var _a;
	return node.consumerIsAlwaysLive || (((_a = node == null ? void 0 : node.liveConsumerNode) == null ? void 0 : _a.length) ?? 0) > 0;
}
function assertConsumerNode(node) {
	node.producerNode ?? (node.producerNode = []);
	node.producerIndexOfThis ?? (node.producerIndexOfThis = []);
	node.producerLastReadVersion ?? (node.producerLastReadVersion = []);
}
function assertProducerNode(node) {
	node.liveConsumerNode ?? (node.liveConsumerNode = []);
	node.liveConsumerIndexOfThis ?? (node.liveConsumerIndexOfThis = []);
}
/**
* @license
* Copyright Google LLC All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
function computedGet(node) {
	producerUpdateValueVersion(node);
	producerAccessed(node);
	if (node.value === ERRORED) throw node.error;
	return node.value;
}
function createComputed(computation) {
	const node = Object.create(COMPUTED_NODE);
	node.computation = computation;
	const computed = () => computedGet(node);
	computed[SIGNAL] = node;
	return computed;
}
var UNSET = /* @__PURE__ */ Symbol("UNSET");
var COMPUTING = /* @__PURE__ */ Symbol("COMPUTING");
var ERRORED = /* @__PURE__ */ Symbol("ERRORED");
var COMPUTED_NODE = /* @__PURE__ */ (() => {
	return {
		...REACTIVE_NODE,
		value: UNSET,
		dirty: true,
		error: null,
		equal: defaultEquals,
		producerMustRecompute(node) {
			return node.value === UNSET || node.value === COMPUTING;
		},
		producerRecomputeValue(node) {
			if (node.value === COMPUTING) throw new Error("Detected cycle in computations.");
			const oldValue = node.value;
			node.value = COMPUTING;
			const prevConsumer = consumerBeforeComputation(node);
			let newValue;
			let wasEqual = false;
			try {
				newValue = node.computation.call(node.wrapper);
				wasEqual = oldValue !== UNSET && oldValue !== ERRORED && node.equal.call(node.wrapper, oldValue, newValue);
			} catch (err) {
				newValue = ERRORED;
				node.error = err;
			} finally {
				consumerAfterComputation(node, prevConsumer);
			}
			if (wasEqual) {
				node.value = oldValue;
				return;
			}
			node.value = newValue;
			node.version++;
		}
	};
})();
/**
* @license
* Copyright Google LLC All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
function defaultThrowError() {
	throw new Error();
}
var throwInvalidWriteToSignalErrorFn = defaultThrowError;
function throwInvalidWriteToSignalError() {
	throwInvalidWriteToSignalErrorFn();
}
/**
* @license
* Copyright Google LLC All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
function createSignal(initialValue) {
	const node = Object.create(SIGNAL_NODE);
	node.value = initialValue;
	const getter = () => {
		producerAccessed(node);
		return node.value;
	};
	getter[SIGNAL] = node;
	return getter;
}
function signalGetFn() {
	producerAccessed(this);
	return this.value;
}
function signalSetFn(node, newValue) {
	if (!producerUpdatesAllowed()) throwInvalidWriteToSignalError();
	if (!node.equal.call(node.wrapper, node.value, newValue)) {
		node.value = newValue;
		signalValueChanged(node);
	}
}
var SIGNAL_NODE = /* @__PURE__ */ (() => {
	return {
		...REACTIVE_NODE,
		equal: defaultEquals,
		value: void 0
	};
})();
function signalValueChanged(node) {
	node.version++;
	producerIncrementEpoch();
	producerNotifyConsumers(node);
}
/**
* @license
* Copyright 2024 Bloomberg Finance L.P.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
var NODE = Symbol("node");
var Signal;
((Signal2) => {
	var _a, _brand, _b, _brand2;
	class State {
		constructor(initialValue, options = {}) {
			__privateAdd(this, _brand);
			__publicField(this, _a);
			const node = createSignal(initialValue)[SIGNAL];
			this[NODE] = node;
			node.wrapper = this;
			if (options) {
				const equals = options.equals;
				if (equals) node.equal = equals;
				node.watched = options[Signal2.subtle.watched];
				node.unwatched = options[Signal2.subtle.unwatched];
			}
		}
		get() {
			if (!(0, Signal2.isState)(this)) throw new TypeError("Wrong receiver type for Signal.State.prototype.get");
			return signalGetFn.call(this[NODE]);
		}
		set(newValue) {
			if (!(0, Signal2.isState)(this)) throw new TypeError("Wrong receiver type for Signal.State.prototype.set");
			if (isInNotificationPhase()) throw new Error("Writes to signals not permitted during Watcher callback");
			const ref = this[NODE];
			signalSetFn(ref, newValue);
		}
	}
	_a = NODE;
	_brand = /* @__PURE__ */ new WeakSet();
	Signal2.isState = (s) => typeof s === "object" && __privateIn(_brand, s);
	Signal2.State = State;
	class Computed {
		constructor(computation, options) {
			__privateAdd(this, _brand2);
			__publicField(this, _b);
			const node = createComputed(computation)[SIGNAL];
			node.consumerAllowSignalWrites = true;
			this[NODE] = node;
			node.wrapper = this;
			if (options) {
				const equals = options.equals;
				if (equals) node.equal = equals;
				node.watched = options[Signal2.subtle.watched];
				node.unwatched = options[Signal2.subtle.unwatched];
			}
		}
		get() {
			if (!(0, Signal2.isComputed)(this)) throw new TypeError("Wrong receiver type for Signal.Computed.prototype.get");
			return computedGet(this[NODE]);
		}
	}
	_b = NODE;
	_brand2 = /* @__PURE__ */ new WeakSet();
	Signal2.isComputed = (c) => typeof c === "object" && __privateIn(_brand2, c);
	Signal2.Computed = Computed;
	((subtle2) => {
		var _a2, _brand3, _assertSignals, assertSignals_fn;
		function untrack(cb) {
			let output;
			let prevActiveConsumer = null;
			try {
				prevActiveConsumer = setActiveConsumer(null);
				output = cb();
			} finally {
				setActiveConsumer(prevActiveConsumer);
			}
			return output;
		}
		subtle2.untrack = untrack;
		function introspectSources(sink) {
			var _a3;
			if (!(0, Signal2.isComputed)(sink) && !(0, Signal2.isWatcher)(sink)) throw new TypeError("Called introspectSources without a Computed or Watcher argument");
			return ((_a3 = sink[NODE].producerNode) == null ? void 0 : _a3.map((n) => n.wrapper)) ?? [];
		}
		subtle2.introspectSources = introspectSources;
		function introspectSinks(signal) {
			var _a3;
			if (!(0, Signal2.isComputed)(signal) && !(0, Signal2.isState)(signal)) throw new TypeError("Called introspectSinks without a Signal argument");
			return ((_a3 = signal[NODE].liveConsumerNode) == null ? void 0 : _a3.map((n) => n.wrapper)) ?? [];
		}
		subtle2.introspectSinks = introspectSinks;
		function hasSinks(signal) {
			if (!(0, Signal2.isComputed)(signal) && !(0, Signal2.isState)(signal)) throw new TypeError("Called hasSinks without a Signal argument");
			const liveConsumerNode = signal[NODE].liveConsumerNode;
			if (!liveConsumerNode) return false;
			return liveConsumerNode.length > 0;
		}
		subtle2.hasSinks = hasSinks;
		function hasSources(signal) {
			if (!(0, Signal2.isComputed)(signal) && !(0, Signal2.isWatcher)(signal)) throw new TypeError("Called hasSources without a Computed or Watcher argument");
			const producerNode = signal[NODE].producerNode;
			if (!producerNode) return false;
			return producerNode.length > 0;
		}
		subtle2.hasSources = hasSources;
		class Watcher {
			constructor(notify) {
				__privateAdd(this, _brand3);
				__privateAdd(this, _assertSignals);
				__publicField(this, _a2);
				let node = Object.create(REACTIVE_NODE);
				node.wrapper = this;
				node.consumerMarkedDirty = notify;
				node.consumerIsAlwaysLive = true;
				node.consumerAllowSignalWrites = false;
				node.producerNode = [];
				this[NODE] = node;
			}
			watch(...signals) {
				if (!(0, Signal2.isWatcher)(this)) throw new TypeError("Called unwatch without Watcher receiver");
				__privateMethod(this, _assertSignals, assertSignals_fn).call(this, signals);
				const node = this[NODE];
				node.dirty = false;
				const prev = setActiveConsumer(node);
				for (const signal of signals) producerAccessed(signal[NODE]);
				setActiveConsumer(prev);
			}
			unwatch(...signals) {
				if (!(0, Signal2.isWatcher)(this)) throw new TypeError("Called unwatch without Watcher receiver");
				__privateMethod(this, _assertSignals, assertSignals_fn).call(this, signals);
				const node = this[NODE];
				assertConsumerNode(node);
				for (let i = node.producerNode.length - 1; i >= 0; i--) if (signals.includes(node.producerNode[i].wrapper)) {
					producerRemoveLiveConsumerAtIndex(node.producerNode[i], node.producerIndexOfThis[i]);
					const lastIdx = node.producerNode.length - 1;
					node.producerNode[i] = node.producerNode[lastIdx];
					node.producerIndexOfThis[i] = node.producerIndexOfThis[lastIdx];
					node.producerNode.length--;
					node.producerIndexOfThis.length--;
					node.nextProducerIndex--;
					if (i < node.producerNode.length) {
						const idxConsumer = node.producerIndexOfThis[i];
						const producer = node.producerNode[i];
						assertProducerNode(producer);
						producer.liveConsumerIndexOfThis[idxConsumer] = i;
					}
				}
			}
			getPending() {
				if (!(0, Signal2.isWatcher)(this)) throw new TypeError("Called getPending without Watcher receiver");
				return this[NODE].producerNode.filter((n) => n.dirty).map((n) => n.wrapper);
			}
		}
		_a2 = NODE;
		_brand3 = /* @__PURE__ */ new WeakSet();
		_assertSignals = /* @__PURE__ */ new WeakSet();
		assertSignals_fn = function(signals) {
			for (const signal of signals) if (!(0, Signal2.isComputed)(signal) && !(0, Signal2.isState)(signal)) throw new TypeError("Called watch/unwatch without a Computed or State argument");
		};
		Signal2.isWatcher = (w) => __privateIn(_brand3, w);
		subtle2.Watcher = Watcher;
		function currentComputed() {
			var _a3;
			return (_a3 = getActiveConsumer()) == null ? void 0 : _a3.wrapper;
		}
		subtle2.currentComputed = currentComputed;
		subtle2.watched = Symbol("watched");
		subtle2.unwatched = Symbol("unwatched");
	})(Signal2.subtle || (Signal2.subtle = {}));
})(Signal || (Signal = {}));
//#endregion
//#region node_modules/.pnpm/@lit-labs+signals@0.3.0/node_modules/@lit-labs/signals/lib/signal-watcher.js
/**
* @license
* Copyright 2023 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var i$7 = !1;
var s$5 = new Signal.subtle.Watcher(() => {
	i$7 || (i$7 = !0, queueMicrotask(() => {
		i$7 = !1;
		for (const t of s$5.getPending()) t.get();
		s$5.watch();
	}));
}), h$5 = Symbol("SignalWatcherBrand"), e$7 = new FinalizationRegistry((i) => {
	i.unwatch(...Signal.subtle.introspectSources(i));
}), n$7 = /* @__PURE__ */ new WeakMap();
function o$8(i) {
	return !0 === i[h$5] ? (console.warn("SignalWatcher should not be applied to the same class more than once."), i) : class extends i {
		constructor() {
			super(...arguments), this._$St = /* @__PURE__ */ new Map(), this._$So = new Signal.State(0), this._$Si = !1;
		}
		_$Sl() {
			var t, i;
			const s = [], h = [];
			this._$St.forEach((t, i) => {
				((null == t ? void 0 : t.beforeUpdate) ? s : h).push(i);
			});
			const e = null === (t = this.h) || void 0 === t ? void 0 : t.getPending().filter((t) => t !== this._$Su && !this._$St.has(t));
			s.forEach((t) => t.get()), null === (i = this._$Su) || void 0 === i || i.get(), e.forEach((t) => t.get()), h.forEach((t) => t.get());
		}
		_$Sv() {
			this.isUpdatePending || queueMicrotask(() => {
				this.isUpdatePending || this._$Sl();
			});
		}
		_$S_() {
			if (void 0 !== this.h) return;
			this._$Su = new Signal.Computed(() => {
				this._$So.get(), super.performUpdate();
			});
			const i = this.h = new Signal.subtle.Watcher(function() {
				const t = n$7.get(this);
				void 0 !== t && (!1 === t._$Si && (new Set(this.getPending()).has(t._$Su) ? t.requestUpdate() : t._$Sv()), this.watch());
			});
			n$7.set(i, this), e$7.register(this, i), i.watch(this._$Su), i.watch(...Array.from(this._$St).map(([t]) => t));
		}
		_$Sp() {
			if (void 0 === this.h) return;
			let i = !1;
			this.h.unwatch(...Signal.subtle.introspectSources(this.h).filter((t) => {
				var s;
				const h = !0 !== (null === (s = this._$St.get(t)) || void 0 === s ? void 0 : s.manualDispose);
				return h && this._$St.delete(t), i || (i = !h), h;
			})), i || (this._$Su = void 0, this.h = void 0, this._$St.clear());
		}
		updateEffect(i, s) {
			var h;
			this._$S_();
			const e = new Signal.Computed(() => {
				i();
			});
			return this.h.watch(e), this._$St.set(e, s), null !== (h = null == s ? void 0 : s.beforeUpdate) && void 0 !== h && h ? Signal.subtle.untrack(() => e.get()) : this.updateComplete.then(() => Signal.subtle.untrack(() => e.get())), () => {
				this._$St.delete(e), this.h.unwatch(e), !1 === this.isConnected && this._$Sp();
			};
		}
		performUpdate() {
			this.isUpdatePending && (this._$S_(), this._$Si = !0, this._$So.set(this._$So.get() + 1), this._$Si = !1, this._$Sl());
		}
		connectedCallback() {
			super.connectedCallback(), this.requestUpdate();
		}
		disconnectedCallback() {
			super.disconnectedCallback(), queueMicrotask(() => {
				!1 === this.isConnected && this._$Sp();
			});
		}
	};
}
//#endregion
//#region node_modules/.pnpm/lit-html@3.3.3/node_modules/lit-html/directive.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t$4 = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, t$3 = globalThis, i$5 = (t) => t, s$4 = t$3.trustedTypes, e$5 = s$4 ? s$4.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, h$4 = "$lit$", o$7 = `lit$${Math.random().toFixed(9).slice(2)}$`, n$6 = "?" + o$7, r$8 = `<${n$6}>`, l$4 = document, c$4 = () => l$4.createComment(""), a$1 = (t) => null === t || "object" != typeof t && "function" != typeof t, u$2 = Array.isArray, d$2 = (t) => u$2(t) || "function" == typeof t?.[Symbol.iterator], f$3 = "[ 	\n\f\r]", v$1 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _ = /-->/g, m$2 = />/g, p$2 = RegExp(`>|${f$3}(?:([^\\s"'>=/]+)(${f$3}*=${f$3}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), g = /'/g, $ = /"/g, y$1 = /^(?:script|style|textarea|title)$/i, x = (t) => (i, ...s) => ({
	_$litType$: t,
	strings: i,
	values: s
}), b$1 = x(1), E = Symbol.for("lit-noChange"), A = Symbol.for("lit-nothing"), C = /* @__PURE__ */ new WeakMap(), P = l$4.createTreeWalker(l$4, 129);
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
function V(t, i) {
	if (!u$2(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return void 0 !== e$5 ? e$5.createHTML(i) : i;
}
var N = (t, i) => {
	const s = t.length - 1, e = [];
	let n, l = 2 === i ? "<svg>" : 3 === i ? "<math>" : "", c = v$1;
	for (let i = 0; i < s; i++) {
		const s = t[i];
		let a, u, d = -1, f = 0;
		for (; f < s.length && (c.lastIndex = f, u = c.exec(s), null !== u);) f = c.lastIndex, c === v$1 ? "!--" === u[1] ? c = _ : void 0 !== u[1] ? c = m$2 : void 0 !== u[2] ? (y$1.test(u[2]) && (n = RegExp("</" + u[2], "g")), c = p$2) : void 0 !== u[3] && (c = p$2) : c === p$2 ? ">" === u[0] ? (c = n ?? v$1, d = -1) : void 0 === u[1] ? d = -2 : (d = c.lastIndex - u[2].length, a = u[1], c = void 0 === u[3] ? p$2 : "\"" === u[3] ? $ : g) : c === $ || c === g ? c = p$2 : c === _ || c === m$2 ? c = v$1 : (c = p$2, n = void 0);
		const x = c === p$2 && t[i + 1].startsWith("/>") ? " " : "";
		l += c === v$1 ? s + r$8 : d >= 0 ? (e.push(a), s.slice(0, d) + h$4 + s.slice(d) + o$7 + x) : s + o$7 + (-2 === d ? i : x);
	}
	return [V(t, l + (t[s] || "<?>") + (2 === i ? "</svg>" : 3 === i ? "</math>" : "")), e];
};
var S$1 = class S$1 {
	constructor({ strings: t, _$litType$: i }, e) {
		let r;
		this.parts = [];
		let l = 0, a = 0;
		const u = t.length - 1, d = this.parts, [f, v] = N(t, i);
		if (this.el = S$1.createElement(f, e), P.currentNode = this.el.content, 2 === i || 3 === i) {
			const t = this.el.content.firstChild;
			t.replaceWith(...t.childNodes);
		}
		for (; null !== (r = P.nextNode()) && d.length < u;) {
			if (1 === r.nodeType) {
				if (r.hasAttributes()) for (const t of r.getAttributeNames()) if (t.endsWith(h$4)) {
					const i = v[a++], s = r.getAttribute(t).split(o$7), e = /([.?@])?(.*)/.exec(i);
					d.push({
						type: 1,
						index: l,
						name: e[2],
						strings: s,
						ctor: "." === e[1] ? I : "?" === e[1] ? L : "@" === e[1] ? z : H
					}), r.removeAttribute(t);
				} else t.startsWith(o$7) && (d.push({
					type: 6,
					index: l
				}), r.removeAttribute(t));
				if (y$1.test(r.tagName)) {
					const t = r.textContent.split(o$7), i = t.length - 1;
					if (i > 0) {
						r.textContent = s$4 ? s$4.emptyScript : "";
						for (let s = 0; s < i; s++) r.append(t[s], c$4()), P.nextNode(), d.push({
							type: 2,
							index: ++l
						});
						r.append(t[i], c$4());
					}
				}
			} else if (8 === r.nodeType) if (r.data === n$6) d.push({
				type: 2,
				index: l
			});
			else {
				let t = -1;
				for (; -1 !== (t = r.data.indexOf(o$7, t + 1));) d.push({
					type: 7,
					index: l
				}), t += o$7.length - 1;
			}
			l++;
		}
	}
	static createElement(t, i) {
		const s = l$4.createElement("template");
		return s.innerHTML = t, s;
	}
};
function M$1(t, i, s = t, e) {
	if (i === E) return i;
	let h = void 0 !== e ? s._$Co?.[e] : s._$Cl;
	const o = a$1(i) ? void 0 : i._$litDirective$;
	return h?.constructor !== o && (h?._$AO?.(!1), void 0 === o ? h = void 0 : (h = new o(t), h._$AT(t, s, e)), void 0 !== e ? (s._$Co ??= [])[e] = h : s._$Cl = h), void 0 !== h && (i = M$1(t, h._$AS(t, i.values), h, e)), i;
}
var R = class {
	constructor(t, i) {
		this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(t) {
		const { el: { content: i }, parts: s } = this._$AD, e = (t?.creationScope ?? l$4).importNode(i, !0);
		P.currentNode = e;
		let h = P.nextNode(), o = 0, n = 0, r = s[0];
		for (; void 0 !== r;) {
			if (o === r.index) {
				let i;
				2 === r.type ? i = new k(h, h.nextSibling, this, t) : 1 === r.type ? i = new r.ctor(h, r.name, r.strings, this, t) : 6 === r.type && (i = new Z(h, this, t)), this._$AV.push(i), r = s[++n];
			}
			o !== r?.index && (h = P.nextNode(), o++);
		}
		return P.currentNode = l$4, e;
	}
	p(t) {
		let i = 0;
		for (const s of this._$AV) void 0 !== s && (void 0 !== s.strings ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
	}
};
var k = class k {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(t, i, s, e) {
		this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = e, this._$Cv = e?.isConnected ?? !0;
	}
	get parentNode() {
		let t = this._$AA.parentNode;
		const i = this._$AM;
		return void 0 !== i && 11 === t?.nodeType && (t = i.parentNode), t;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(t, i = this) {
		t = M$1(this, t, i), a$1(t) ? t === A || null == t || "" === t ? (this._$AH !== A && this._$AR(), this._$AH = A) : t !== this._$AH && t !== E && this._(t) : void 0 !== t._$litType$ ? this.$(t) : void 0 !== t.nodeType ? this.T(t) : d$2(t) ? this.k(t) : this._(t);
	}
	O(t) {
		return this._$AA.parentNode.insertBefore(t, this._$AB);
	}
	T(t) {
		this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
	}
	_(t) {
		this._$AH !== A && a$1(this._$AH) ? this._$AA.nextSibling.data = t : this.T(l$4.createTextNode(t)), this._$AH = t;
	}
	$(t) {
		const { values: i, _$litType$: s } = t, e = "number" == typeof s ? this._$AC(t) : (void 0 === s.el && (s.el = S$1.createElement(V(s.h, s.h[0]), this.options)), s);
		if (this._$AH?._$AD === e) this._$AH.p(i);
		else {
			const t = new R(e, this), s = t.u(this.options);
			t.p(i), this.T(s), this._$AH = t;
		}
	}
	_$AC(t) {
		let i = C.get(t.strings);
		return void 0 === i && C.set(t.strings, i = new S$1(t)), i;
	}
	k(t) {
		u$2(this._$AH) || (this._$AH = [], this._$AR());
		const i = this._$AH;
		let s, e = 0;
		for (const h of t) e === i.length ? i.push(s = new k(this.O(c$4()), this.O(c$4()), this, this.options)) : s = i[e], s._$AI(h), e++;
		e < i.length && (this._$AR(s && s._$AB.nextSibling, e), i.length = e);
	}
	_$AR(t = this._$AA.nextSibling, s) {
		for (this._$AP?.(!1, !0, s); t !== this._$AB;) {
			const s = i$5(t).nextSibling;
			i$5(t).remove(), t = s;
		}
	}
	setConnected(t) {
		void 0 === this._$AM && (this._$Cv = t, this._$AP?.(t));
	}
};
var H = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(t, i, s, e, h) {
		this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t, this.name = i, this._$AM = e, this.options = h, s.length > 2 || "" !== s[0] || "" !== s[1] ? (this._$AH = Array(s.length - 1).fill(/* @__PURE__ */ new String()), this.strings = s) : this._$AH = A;
	}
	_$AI(t, i = this, s, e) {
		const h = this.strings;
		let o = !1;
		if (void 0 === h) t = M$1(this, t, i, 0), o = !a$1(t) || t !== this._$AH && t !== E, o && (this._$AH = t);
		else {
			const e = t;
			let n, r;
			for (t = h[0], n = 0; n < h.length - 1; n++) r = M$1(this, e[s + n], i, n), r === E && (r = this._$AH[n]), o ||= !a$1(r) || r !== this._$AH[n], r === A ? t = A : t !== A && (t += (r ?? "") + h[n + 1]), this._$AH[n] = r;
		}
		o && !e && this.j(t);
	}
	j(t) {
		t === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
	}
};
var I = class extends H {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(t) {
		this.element[this.name] = t === A ? void 0 : t;
	}
};
var L = class extends H {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(t) {
		this.element.toggleAttribute(this.name, !!t && t !== A);
	}
};
var z = class extends H {
	constructor(t, i, s, e, h) {
		super(t, i, s, e, h), this.type = 5;
	}
	_$AI(t, i = this) {
		if ((t = M$1(this, t, i, 0) ?? A) === E) return;
		const s = this._$AH, e = t === A && s !== A || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, h = t !== A && (s === A || e);
		e && this.element.removeEventListener(this.name, this, s), h && this.element.addEventListener(this.name, this, t), this._$AH = t;
	}
	handleEvent(t) {
		"function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
	}
};
var Z = class {
	constructor(t, i, s) {
		this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(t) {
		M$1(this, t);
	}
};
var j$1 = {
	M: h$4,
	P: o$7,
	A: n$6,
	C: 1,
	L: N,
	R,
	D: d$2,
	V: M$1,
	I: k,
	H,
	N: L,
	U: z,
	B: I,
	F: Z
}, B = t$3.litHtmlPolyfillSupport;
B?.(S$1, k), (t$3.litHtmlVersions ??= []).push("3.3.3");
var D = (t, i, s) => {
	const e = s?.renderBefore ?? i;
	let h = e._$litPart$;
	if (void 0 === h) {
		const t = s?.renderBefore ?? null;
		e._$litPart$ = h = new k(i.insertBefore(c$4(), t), t, void 0, s ?? {});
	}
	return h._$AI(t), h;
}, { I: t$2 } = j$1;
/**
* @license
* Copyright 2020 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
//#endregion
//#region node_modules/.pnpm/lit-html@3.3.3/node_modules/lit-html/async-directive.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var s$2 = (i, t) => {
	const e = i._$AN;
	if (void 0 === e) return !1;
	for (const i of e) i._$AO?.(t, !1), s$2(i, t);
	return !0;
}, o$6 = (i) => {
	let t, e;
	do {
		if (void 0 === (t = i._$AM)) break;
		e = t._$AN, e.delete(i), i = t;
	} while (0 === e?.size);
}, r$6 = (i) => {
	for (let t; t = i._$AM; i = t) {
		let e = t._$AN;
		if (void 0 === e) t._$AN = e = /* @__PURE__ */ new Set();
		else if (e.has(i)) break;
		e.add(i), c$2(t);
	}
};
function h$2(i) {
	void 0 !== this._$AN ? (o$6(this), this._$AM = i, r$6(this)) : this._$AM = i;
}
function n$4(i, t = !1, e = 0) {
	const r = this._$AH, h = this._$AN;
	if (void 0 !== h && 0 !== h.size) if (t) if (Array.isArray(r)) for (let i = e; i < r.length; i++) s$2(r[i], !1), o$6(r[i]);
	else null != r && (s$2(r, !1), o$6(r));
	else s$2(this, i);
}
var c$2 = (i) => {
	i.type == t$4.CHILD && (i._$AP ??= n$4, i._$AQ ??= h$2);
};
//#endregion
//#region node_modules/.pnpm/@lit-labs+signals@0.3.0/node_modules/@lit-labs/signals/lib/watch.js
/**
* @license
* Copyright 2023 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var o$5 = !1, n$3 = new Signal.subtle.Watcher(async () => {
	o$5 || (o$5 = !0, queueMicrotask(() => {
		o$5 = !1;
		for (const i of n$3.getPending()) i.get();
		n$3.watch();
	}));
});
/**
* @license
* Copyright 2023 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
/**
* @license
* Copyright 2023 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
Signal.State;
Signal.Computed;
//#endregion
//#region node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/css-tag.js
/**
* @license
* Copyright 2019 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t$1 = globalThis, e$3 = t$1.ShadowRoot && (void 0 === t$1.ShadyCSS || t$1.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, s$1 = Symbol(), o$3 = /* @__PURE__ */ new WeakMap();
var n$2 = class {
	constructor(t, e, o) {
		if (this._$cssResult$ = !0, o !== s$1) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = t, this.t = e;
	}
	get styleSheet() {
		let t = this.o;
		const s = this.t;
		if (e$3 && void 0 === t) {
			const e = void 0 !== s && 1 === s.length;
			e && (t = o$3.get(s)), void 0 === t && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), e && o$3.set(s, t));
		}
		return t;
	}
	toString() {
		return this.cssText;
	}
};
var r$2 = (t) => new n$2("string" == typeof t ? t : t + "", void 0, s$1), i$2 = (t, ...e) => {
	return new n$2(1 === t.length ? t[0] : e.reduce((e, s, o) => e + ((t) => {
		if (!0 === t._$cssResult$) return t.cssText;
		if ("number" == typeof t) return t;
		throw Error("Value passed to 'css' function must be a 'css' function result: " + t + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
	})(s) + t[o + 1], t[0]), t, s$1);
}, S = (s, o) => {
	if (e$3) s.adoptedStyleSheets = o.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
	else for (const e of o) {
		const o = document.createElement("style"), n = t$1.litNonce;
		void 0 !== n && o.setAttribute("nonce", n), o.textContent = e.cssText, s.appendChild(o);
	}
}, c$1 = e$3 ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((t) => {
	let e = "";
	for (const s of t.cssRules) e += s.cssText;
	return r$2(e);
})(t) : t;
//#endregion
//#region node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/reactive-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var { is: i$1, defineProperty: e$2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r$1, getOwnPropertySymbols: o$2, getPrototypeOf: n$1 } = Object, a = globalThis, c = a.trustedTypes, l = c ? c.emptyScript : "", p = a.reactiveElementPolyfillSupport, d = (t, s) => t, u = {
	toAttribute(t, s) {
		switch (s) {
			case Boolean:
				t = t ? l : null;
				break;
			case Object:
			case Array: t = null == t ? t : JSON.stringify(t);
		}
		return t;
	},
	fromAttribute(t, s) {
		let i = t;
		switch (s) {
			case Boolean:
				i = null !== t;
				break;
			case Number:
				i = null === t ? null : Number(t);
				break;
			case Object:
			case Array: try {
				i = JSON.parse(t);
			} catch (t) {
				i = null;
			}
		}
		return i;
	}
}, f = (t, s) => !i$1(t, s), b = {
	attribute: !0,
	type: String,
	converter: u,
	reflect: !1,
	useDefault: !1,
	hasChanged: f
};
Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
	static addInitializer(t) {
		this._$Ei(), (this.l ??= []).push(t);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(t, s = b) {
		if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
			const i = Symbol(), h = this.getPropertyDescriptor(t, i, s);
			void 0 !== h && e$2(this.prototype, t, h);
		}
	}
	static getPropertyDescriptor(t, s, i) {
		const { get: e, set: r } = h(this.prototype, t) ?? {
			get() {
				return this[s];
			},
			set(t) {
				this[s] = t;
			}
		};
		return {
			get: e,
			set(s) {
				const h = e?.call(this);
				r?.call(this, s), this.requestUpdate(t, h, i);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(t) {
		return this.elementProperties.get(t) ?? b;
	}
	static _$Ei() {
		if (this.hasOwnProperty(d("elementProperties"))) return;
		const t = n$1(this);
		t.finalize(), void 0 !== t.l && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(d("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(d("properties"))) {
			const t = this.properties, s = [...r$1(t), ...o$2(t)];
			for (const i of s) this.createProperty(i, t[i]);
		}
		const t = this[Symbol.metadata];
		if (null !== t) {
			const s = litPropertyMetadata.get(t);
			if (void 0 !== s) for (const [t, i] of s) this.elementProperties.set(t, i);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (const [t, s] of this.elementProperties) {
			const i = this._$Eu(t, s);
			void 0 !== i && this._$Eh.set(i, t);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(s) {
		const i = [];
		if (Array.isArray(s)) {
			const e = new Set(s.flat(Infinity).reverse());
			for (const s of e) i.unshift(c$1(s));
		} else void 0 !== s && i.push(c$1(s));
		return i;
	}
	static _$Eu(t, s) {
		const i = s.attribute;
		return !1 === i ? void 0 : "string" == typeof i ? i : "string" == typeof t ? t.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
	}
	addController(t) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(t), void 0 !== this.renderRoot && this.isConnected && t.hostConnected?.();
	}
	removeController(t) {
		this._$EO?.delete(t);
	}
	_$E_() {
		const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
		for (const i of s.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
		t.size > 0 && (this._$Ep = t);
	}
	createRenderRoot() {
		const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return S(t, this.constructor.elementStyles), t;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
	}
	enableUpdating(t) {}
	disconnectedCallback() {
		this._$EO?.forEach((t) => t.hostDisconnected?.());
	}
	attributeChangedCallback(t, s, i) {
		this._$AK(t, i);
	}
	_$ET(t, s) {
		const i = this.constructor.elementProperties.get(t), e = this.constructor._$Eu(t, i);
		if (void 0 !== e && !0 === i.reflect) {
			const h = (void 0 !== i.converter?.toAttribute ? i.converter : u).toAttribute(s, i.type);
			this._$Em = t, null == h ? this.removeAttribute(e) : this.setAttribute(e, h), this._$Em = null;
		}
	}
	_$AK(t, s) {
		const i = this.constructor, e = i._$Eh.get(t);
		if (void 0 !== e && this._$Em !== e) {
			const t = i.getPropertyOptions(e), h = "function" == typeof t.converter ? { fromAttribute: t.converter } : void 0 !== t.converter?.fromAttribute ? t.converter : u;
			this._$Em = e;
			const r = h.fromAttribute(s, t.type);
			this[e] = r ?? this._$Ej?.get(e) ?? r, this._$Em = null;
		}
	}
	requestUpdate(t, s, i, e = !1, h) {
		if (void 0 !== t) {
			const r = this.constructor;
			if (!1 === e && (h = this[t]), i ??= r.getPropertyOptions(t), !((i.hasChanged ?? f)(h, s) || i.useDefault && i.reflect && h === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, i)))) return;
			this.C(t, s, i);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(t, s, { useDefault: i, reflect: e, wrapped: h }, r) {
		i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, r ?? s ?? this[t]), !0 !== h || void 0 !== r) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), !0 === e && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (t) {
			Promise.reject(t);
		}
		const t = this.scheduleUpdate();
		return null != t && await t, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (const [t, s] of this._$Ep) this[t] = s;
				this._$Ep = void 0;
			}
			const t = this.constructor.elementProperties;
			if (t.size > 0) for (const [s, i] of t) {
				const { wrapped: t } = i, e = this[s];
				!0 !== t || this._$AL.has(s) || void 0 === e || this.C(s, void 0, i, e);
			}
		}
		let t = !1;
		const s = this._$AL;
		try {
			t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((t) => t.hostUpdate?.()), this.update(s)) : this._$EM();
		} catch (s) {
			throw t = !1, this._$EM(), s;
		}
		t && this._$AE(s);
	}
	willUpdate(t) {}
	_$AE(t) {
		this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(t) {
		return !0;
	}
	update(t) {
		this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
	}
	updated(t) {}
	firstUpdated(t) {}
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/.pnpm/lit-element@4.2.2/node_modules/lit-element/lit-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var s = globalThis;
var i = class extends y {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		const t = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= t.firstChild, t;
	}
	update(t) {
		const r = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = D(r, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return E;
	}
};
i._$litElement$ = !0, i["finalized"] = !0, s.litElementHydrateSupport?.({ LitElement: i });
var o$1 = s.litElementPolyfillSupport;
o$1?.({ LitElement: i });
(s.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region packages/ui/src/base.ts
var SuiteElement = class extends o$8(i) {};
//#endregion
//#region node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/decorators/custom-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t = (t) => (e, o) => {
	void 0 !== o ? o.addInitializer(() => {
		customElements.define(t, e);
	}) : customElements.define(t, e);
};
//#endregion
//#region node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/decorators/property.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var o = {
	attribute: !0,
	type: String,
	converter: u,
	reflect: !1,
	hasChanged: f
}, r = (t = o, e, r) => {
	const { kind: n, metadata: i } = r;
	let s = globalThis.litPropertyMetadata.get(i);
	if (void 0 === s && globalThis.litPropertyMetadata.set(i, s = /* @__PURE__ */ new Map()), "setter" === n && ((t = Object.create(t)).wrapped = !0), s.set(r.name, t), "accessor" === n) {
		const { name: o } = r;
		return {
			set(r) {
				const n = e.get.call(this);
				e.set.call(this, r), this.requestUpdate(o, n, t, !0, r);
			},
			init(e) {
				return void 0 !== e && this.C(o, void 0, t, e), e;
			}
		};
	}
	if ("setter" === n) {
		const { name: o } = r;
		return function(r) {
			const n = this[o];
			e.call(this, r), this.requestUpdate(o, n, t, !0, r);
		};
	}
	throw Error("Unsupported decorator location: " + n);
};
function n(t) {
	return (e, o) => "object" == typeof o ? r(t, e, o) : ((t, e, o) => {
		const r = e.hasOwnProperty(o);
		return e.constructor.createProperty(o, t), r ? Object.getOwnPropertyDescriptor(e, o) : void 0;
	})(t, e, o);
}
//#endregion
//#region node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/decorators/state.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
//#endregion
//#region node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/decorators/base.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var e$1 = (e, t, c) => (c.configurable = !0, c.enumerable = !0, Reflect.decorate && "object" != typeof t && Object.defineProperty(e, t, c), c);
//#endregion
//#region node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/decorators/query.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ function e(e, r) {
	return (n, s, i) => {
		const o = (t) => t.renderRoot?.querySelector(e) ?? null;
		if (r) {
			const { get: e, set: r } = "object" == typeof s ? n : i ?? (() => {
				const t = Symbol();
				return {
					get() {
						return this[t];
					},
					set(e) {
						this[t] = e;
					}
				};
			})();
			return e$1(n, s, { get() {
				let t = e.call(this);
				return void 0 === t && (t = o(this), (null !== t || this.hasUpdated) && r.call(this, t)), t;
			} });
		}
		return e$1(n, s, { get() {
			return o(this);
		} });
	};
}
//#endregion
//#region \0@oxc-project+runtime@0.138.0/helpers/esm/decorate.js
function __decorate(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
}
//#endregion
//#region packages/ui/src/box.ts
var SuiteBox = class SuiteBox extends SuiteElement {
	constructor(..._args) {
		super(..._args);
		this.pad = "4";
		this.border = false;
	}
	static {
		this.styles = i$2`
    :host {
      --_pad: var(--sub-space-4);
      display: block;
      box-sizing: border-box;
      padding: var(--_pad);
    }
    :host([pad='0']) { --_pad: var(--sub-space-0); }
    :host([pad='1']) { --_pad: var(--sub-space-1); }
    :host([pad='2']) { --_pad: var(--sub-space-2); }
    :host([pad='3']) { --_pad: var(--sub-space-3); }
    :host([pad='4']) { --_pad: var(--sub-space-4); }
    :host([pad='5']) { --_pad: var(--sub-space-5); }
    :host([pad='6']) { --_pad: var(--sub-space-6); }
    :host([pad='8']) { --_pad: var(--sub-space-8); }

    :host([surface='base']) { background: var(--sub-color-surface); }
    :host([surface='raised']) { background: var(--sub-color-surface-raised); }

    :host([border]) { border: 1px solid var(--sub-color-border); }

    :host([radius='sm']) { border-radius: var(--sub-radius-sm); }
    :host([radius='md']) { border-radius: var(--sub-radius-md); }
    :host([radius='lg']) { border-radius: var(--sub-radius-lg); }
    :host([radius='full']) { border-radius: var(--sub-radius-full); }
  `;
	}
	render() {
		return b$1`<slot></slot>`;
	}
};
__decorate([n({ reflect: true })], SuiteBox.prototype, "pad", void 0);
__decorate([n({ reflect: true })], SuiteBox.prototype, "surface", void 0);
__decorate([n({
	type: Boolean,
	reflect: true
})], SuiteBox.prototype, "border", void 0);
__decorate([n({ reflect: true })], SuiteBox.prototype, "radius", void 0);
SuiteBox = __decorate([t("sub-box")], SuiteBox);
//#endregion
//#region packages/ui/src/button.ts
var SuiteButton = class SuiteButton extends SuiteElement {
	constructor(..._args) {
		super(..._args);
		this.variant = "neutral";
		this.disabled = false;
	}
	static {
		this.styles = i$2`
    :host {
      display: inline-block;
    }

    button {
      font-family: var(--sub-font-family-sans);
      font-size: var(--sub-font-size-2);
      font-weight: var(--sub-font-weight-medium);
      padding: var(--sub-space-2) var(--sub-space-3);
      border: 1px solid var(--sub-color-border);
      border-radius: var(--sub-radius-md);
      background: var(--sub-color-surface-raised);
      color: var(--sub-color-text);
      cursor: pointer;
    }

    :host([variant='primary']) button {
      background: var(--sub-color-accent);
      color: var(--sub-color-on-accent);
      border-color: transparent;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;
	}
	render() {
		return b$1`<button part="button" ?disabled=${this.disabled}><slot></slot></button>`;
	}
};
__decorate([n({ reflect: true })], SuiteButton.prototype, "variant", void 0);
__decorate([n({
	type: Boolean,
	reflect: true
})], SuiteButton.prototype, "disabled", void 0);
SuiteButton = __decorate([t("sub-button")], SuiteButton);
//#endregion
//#region packages/ui/src/center.ts
var SuiteCenter = class SuiteCenter extends SuiteElement {
	constructor(..._args) {
		super(..._args);
		this.gutters = "4";
		this.max = "60ch";
		this.intrinsic = false;
	}
	static {
		this.styles = i$2`
    :host {
      --_max: 60ch;
      --_gutters: var(--sub-space-4);
      box-sizing: content-box;
      display: block;
      max-inline-size: var(--_max);
      margin-inline: auto;
      padding-inline: var(--_gutters);
    }
    :host([gutters='0']) { --_gutters: var(--sub-space-0); }
    :host([gutters='1']) { --_gutters: var(--sub-space-1); }
    :host([gutters='2']) { --_gutters: var(--sub-space-2); }
    :host([gutters='3']) { --_gutters: var(--sub-space-3); }
    :host([gutters='4']) { --_gutters: var(--sub-space-4); }
    :host([gutters='5']) { --_gutters: var(--sub-space-5); }
    :host([gutters='6']) { --_gutters: var(--sub-space-6); }
    :host([gutters='8']) { --_gutters: var(--sub-space-8); }

    :host([intrinsic]) {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `;
	}
	updated(changed) {
		if (changed.has("max")) this.style.setProperty("--_max", this.max);
	}
	render() {
		return b$1`<slot></slot>`;
	}
};
__decorate([n({ reflect: true })], SuiteCenter.prototype, "gutters", void 0);
__decorate([n({
	attribute: "max",
	reflect: true
})], SuiteCenter.prototype, "max", void 0);
__decorate([n({
	type: Boolean,
	reflect: true
})], SuiteCenter.prototype, "intrinsic", void 0);
SuiteCenter = __decorate([t("sub-center")], SuiteCenter);
//#endregion
//#region packages/ui/src/cluster.ts
var SuiteCluster = class SuiteCluster extends SuiteElement {
	constructor(..._args) {
		super(..._args);
		this.gap = "2";
		this.align = "center";
	}
	static {
		this.styles = i$2`
    :host {
      --_gap: var(--sub-space-2);
      display: flex;
      flex-wrap: wrap;
      gap: var(--_gap);
      align-items: center;
      justify-content: flex-start;
    }
    :host([gap='0']) { --_gap: var(--sub-space-0); }
    :host([gap='1']) { --_gap: var(--sub-space-1); }
    :host([gap='2']) { --_gap: var(--sub-space-2); }
    :host([gap='3']) { --_gap: var(--sub-space-3); }
    :host([gap='4']) { --_gap: var(--sub-space-4); }
    :host([gap='5']) { --_gap: var(--sub-space-5); }
    :host([gap='6']) { --_gap: var(--sub-space-6); }
    :host([gap='8']) { --_gap: var(--sub-space-8); }

    :host([justify='start']) { justify-content: flex-start; }
    :host([justify='center']) { justify-content: center; }
    :host([justify='end']) { justify-content: flex-end; }
    :host([justify='between']) { justify-content: space-between; }

    :host([align='start']) { align-items: flex-start; }
    :host([align='center']) { align-items: center; }
    :host([align='end']) { align-items: flex-end; }
  `;
	}
	render() {
		return b$1`<slot></slot>`;
	}
};
__decorate([n({ reflect: true })], SuiteCluster.prototype, "gap", void 0);
__decorate([n({ reflect: true })], SuiteCluster.prototype, "justify", void 0);
__decorate([n({ reflect: true })], SuiteCluster.prototype, "align", void 0);
SuiteCluster = __decorate([t("sub-cluster")], SuiteCluster);
//#endregion
//#region packages/ui/src/dialog.ts
var SuiteDialog = class SuiteDialog extends SuiteElement {
	constructor(..._args) {
		super(..._args);
		this.open = false;
		this._handleClose = () => {
			this.open = false;
			this.dispatchEvent(new Event("close"));
		};
	}
	static {
		this.styles = i$2`
    dialog {
      background: var(--sub-color-surface);
      color: var(--sub-color-text);
      border: 1px solid var(--sub-color-border);
      border-radius: var(--sub-radius-lg);
      padding: var(--sub-space-4);
    }

    dialog::backdrop {
      background: color-mix(in srgb, var(--sub-color-text) 40%, transparent);
    }
  `;
	}
	show() {
		this._dialogEl.showModal();
		this.open = true;
	}
	close(returnValue) {
		this._dialogEl.close(returnValue);
	}
	render() {
		return b$1`
      <dialog part="dialog" @close=${this._handleClose}>
        <slot name="header"></slot>
        <slot></slot>
        <slot name="footer"></slot>
      </dialog>
    `;
	}
};
__decorate([n({
	type: Boolean,
	reflect: true
})], SuiteDialog.prototype, "open", void 0);
__decorate([e("dialog")], SuiteDialog.prototype, "_dialogEl", void 0);
SuiteDialog = __decorate([t("sub-dialog")], SuiteDialog);
//#endregion
//#region packages/ui/src/grid.ts
var SuiteGrid = class SuiteGrid extends SuiteElement {
	constructor(..._args) {
		super(..._args);
		this.gap = "3";
		this.minItemWidth = "16rem";
	}
	static {
		this.styles = i$2`
    :host {
      --_gap: var(--sub-space-3);
      --_min: 16rem;
      display: grid;
      gap: var(--_gap);
      grid-template-columns: repeat(auto-fill, minmax(min(var(--_min), 100%), 1fr));
    }
    :host([gap='0']) { --_gap: var(--sub-space-0); }
    :host([gap='1']) { --_gap: var(--sub-space-1); }
    :host([gap='2']) { --_gap: var(--sub-space-2); }
    :host([gap='3']) { --_gap: var(--sub-space-3); }
    :host([gap='4']) { --_gap: var(--sub-space-4); }
    :host([gap='5']) { --_gap: var(--sub-space-5); }
    :host([gap='6']) { --_gap: var(--sub-space-6); }
    :host([gap='8']) { --_gap: var(--sub-space-8); }
  `;
	}
	updated(changed) {
		if (changed.has("minItemWidth")) this.style.setProperty("--_min", this.minItemWidth);
	}
	render() {
		return b$1`<slot></slot>`;
	}
};
__decorate([n({ reflect: true })], SuiteGrid.prototype, "gap", void 0);
__decorate([n({
	attribute: "min-item-width",
	reflect: true
})], SuiteGrid.prototype, "minItemWidth", void 0);
SuiteGrid = __decorate([t("sub-grid")], SuiteGrid);
//#endregion
//#region packages/ui/src/sidebar.ts
var SuiteSidebar = class SuiteSidebar extends SuiteElement {
	constructor(..._args) {
		super(..._args);
		this.side = "start";
		this.sideWidth = "16rem";
		this.contentMin = "50%";
		this.gap = "3";
	}
	static {
		this.styles = i$2`
    :host {
      --_gap: var(--sub-space-3);
      --_side-width: 16rem;
      --_content-min: 50%;
      display: flex;
      flex-wrap: wrap;
      gap: var(--_gap);
    }
    :host([gap='0']) { --_gap: var(--sub-space-0); }
    :host([gap='1']) { --_gap: var(--sub-space-1); }
    :host([gap='2']) { --_gap: var(--sub-space-2); }
    :host([gap='3']) { --_gap: var(--sub-space-3); }
    :host([gap='4']) { --_gap: var(--sub-space-4); }
    :host([gap='5']) { --_gap: var(--sub-space-5); }
    :host([gap='6']) { --_gap: var(--sub-space-6); }
    :host([gap='8']) { --_gap: var(--sub-space-8); }

    .side {
      flex-basis: var(--_side-width);
      flex-grow: 1;
    }
    .content {
      flex-basis: 0;
      flex-grow: 999;
      min-inline-size: var(--_content-min);
    }
    :host([side='end']) .side { order: 1; }
  `;
	}
	updated(changed) {
		if (changed.has("sideWidth")) this.style.setProperty("--_side-width", this.sideWidth);
		if (changed.has("contentMin")) this.style.setProperty("--_content-min", this.contentMin);
	}
	render() {
		return b$1`
      <div class="side" part="side"><slot name="side"></slot></div>
      <div class="content" part="content"><slot></slot></div>
    `;
	}
};
__decorate([n({ reflect: true })], SuiteSidebar.prototype, "side", void 0);
__decorate([n({
	attribute: "side-width",
	reflect: true
})], SuiteSidebar.prototype, "sideWidth", void 0);
__decorate([n({
	attribute: "content-min",
	reflect: true
})], SuiteSidebar.prototype, "contentMin", void 0);
__decorate([n({ reflect: true })], SuiteSidebar.prototype, "gap", void 0);
SuiteSidebar = __decorate([t("sub-sidebar")], SuiteSidebar);
//#endregion
//#region packages/ui/src/stack.ts
var SuiteStack = class SuiteStack extends SuiteElement {
	constructor(..._args) {
		super(..._args);
		this.gap = "3";
		this.align = "stretch";
	}
	static {
		this.styles = i$2`
    :host {
      --_gap: var(--sub-space-3);
      display: flex;
      flex-direction: column;
      gap: var(--_gap);
      align-items: stretch;
    }
    :host([gap='0']) { --_gap: var(--sub-space-0); }
    :host([gap='1']) { --_gap: var(--sub-space-1); }
    :host([gap='2']) { --_gap: var(--sub-space-2); }
    :host([gap='3']) { --_gap: var(--sub-space-3); }
    :host([gap='4']) { --_gap: var(--sub-space-4); }
    :host([gap='5']) { --_gap: var(--sub-space-5); }
    :host([gap='6']) { --_gap: var(--sub-space-6); }
    :host([gap='8']) { --_gap: var(--sub-space-8); }

    :host([align='start']) { align-items: flex-start; }
    :host([align='center']) { align-items: center; }
    :host([align='end']) { align-items: flex-end; }
    :host([align='stretch']) { align-items: stretch; }
  `;
	}
	render() {
		return b$1`<slot></slot>`;
	}
};
__decorate([n({ reflect: true })], SuiteStack.prototype, "gap", void 0);
__decorate([n({ reflect: true })], SuiteStack.prototype, "align", void 0);
SuiteStack = __decorate([t("sub-stack")], SuiteStack);
//#endregion
//#region packages/ui/src/list-detail.ts
var SuiteListDetail = class SuiteListDetail extends SuiteElement {
	constructor(..._args) {
		super(..._args);
		this.listWidth = "16rem";
		this.collapsed = false;
	}
	static {
		this.styles = i$2`
    :host {
      display: block;
    }
    /* Slot-wiring only (L3 guardrail): flow-root makes each region a
       containment box so slotted default margins (ul, p, …) cannot collapse
       through and shift the region; min-inline-size keeps pane content from
       forcing the sidebar's panes wider than their flex bases. */
    .header,
    .list,
    .detail {
      display: flow-root;
      min-inline-size: 0;
    }
    /* Fill wiring (gap found by L4, the notes retrofit): when the app sizes
       the shell (e.g. height: 100vh), the body region grows to fill the
       remaining height under the header and the panes inherit it, so pane
       content can scroll internally. All no-ops when the host is unsized. */
    sub-stack {
      block-size: 100%;
    }
    sub-sidebar,
    sub-stack > .detail {
      flex: 1;
      min-block-size: 0;
    }
    .list,
    .detail {
      block-size: 100%;
    }
  `;
	}
	render() {
		const detail = b$1`
      <div class="detail" part="detail"><slot name="detail"></slot></div>
    `;
		return b$1`
      <sub-stack gap="0">
        <div class="header" part="header"><slot name="header"></slot></div>
        ${this.collapsed ? detail : b$1`
              <sub-sidebar side="start" side-width=${this.listWidth} gap="0">
                <div slot="side" class="list" part="list"><slot name="list"></slot></div>
                ${detail}
              </sub-sidebar>
            `}
      </sub-stack>
    `;
	}
};
__decorate([n({
	attribute: "list-width",
	reflect: true
})], SuiteListDetail.prototype, "listWidth", void 0);
__decorate([n({
	type: Boolean,
	reflect: true
})], SuiteListDetail.prototype, "collapsed", void 0);
SuiteListDetail = __decorate([t("sub-list-detail")], SuiteListDetail);
//#endregion
export { SuiteBox, SuiteButton, SuiteCenter, SuiteCluster, SuiteDialog, SuiteElement, SuiteGrid, SuiteListDetail, SuiteSidebar, SuiteStack };
