(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
var createElement = require("./vdom/create-element.js")

module.exports = createElement

},{"./vdom/create-element.js":10}],4:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":26}],5:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":1}],6:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],7:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],8:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":13}],9:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":17,"is-object":6}],10:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":15,"../vnode/is-vnode.js":18,"../vnode/is-vtext.js":19,"../vnode/is-widget.js":20,"./apply-properties":9,"global/document":5}],11:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],12:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var render = require("./create-element")
var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = render(vText, renderOptions)

        if (parentNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = render(vNode, renderOptions)

    if (parentNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, bIndex) {
    var children = []
    var childNodes = domNode.childNodes
    var len = childNodes.length
    var i
    var reverseIndex = bIndex.reverse

    for (i = 0; i < len; i++) {
        children.push(domNode.childNodes[i])
    }

    var insertOffset = 0
    var move
    var node
    var insertNode
    var chainLength
    var insertedLength
    var nextSibling
    for (i = 0; i < len;) {
        move = bIndex[i]
        chainLength = 1
        if (move !== undefined && move !== i) {
            // try to bring forward as long of a chain as possible
            while (bIndex[i + chainLength] === move + chainLength) {
                chainLength++;
            }

            // the element currently at this index will be moved later so increase the insert offset
            if (reverseIndex[i] > i + chainLength) {
                insertOffset++
            }

            node = children[move]
            insertNode = childNodes[i + insertOffset] || null
            insertedLength = 0
            while (node !== insertNode && insertedLength++ < chainLength) {
                domNode.insertBefore(node, insertNode);
                node = children[move + insertedLength];
            }

            // the moved element came from the front of the array so reduce the insert offset
            if (move + chainLength < i) {
                insertOffset--
            }
        }

        // element at this index is scheduled to be removed so increase insert offset
        if (i in bIndex.removes) {
            insertOffset++
        }

        i += chainLength
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        console.log(oldRoot)
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":20,"../vnode/vpatch.js":23,"./apply-properties":9,"./create-element":10,"./update-widget":14}],13:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches) {
    return patchRecursive(rootNode, patches)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions) {
        renderOptions = { patch: patchRecursive }
        if (ownerDocument !== document) {
            renderOptions.document = ownerDocument
        }
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./dom-index":11,"./patch-op":12,"global/document":5,"x-is-array":7}],14:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":20}],15:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":16,"./is-vnode":18,"./is-vtext":19,"./is-widget":20}],16:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],17:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],18:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":21}],19:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":21}],20:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],21:[function(require,module,exports){
module.exports = "1"

},{}],22:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":16,"./is-vhook":17,"./is-vnode":18,"./is-widget":20,"./version":21}],23:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":21}],24:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":21}],25:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":17,"is-object":6}],26:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true;
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var bChildren = reorder(aChildren, b.children)

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (bChildren.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(VPatch.ORDER, a, bChildren.moves))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b);
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true;
        }
    }

    return false;
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {

    var bKeys = keyIndex(bChildren)

    if (!bKeys) {
        return bChildren
    }

    var aKeys = keyIndex(aChildren)

    if (!aKeys) {
        return bChildren
    }

    var bMatch = {}, aMatch = {}

    for (var aKey in bKeys) {
        bMatch[bKeys[aKey]] = aKeys[aKey]
    }

    for (var bKey in aKeys) {
        aMatch[aKeys[bKey]] = bKeys[bKey]
    }

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen
    var shuffle = []
    var freeIndex = 0
    var i = 0
    var moveIndex = 0
    var moves = {}
    var removes = moves.removes = {}
    var reverse = moves.reverse = {}
    var hasMoves = false

    while (freeIndex < len) {
        var move = aMatch[i]
        if (move !== undefined) {
            shuffle[i] = bChildren[move]
            if (move !== moveIndex) {
                moves[move] = moveIndex
                reverse[moveIndex] = move
                hasMoves = true
            }
            moveIndex++
        } else if (i in aMatch) {
            shuffle[i] = undefined
            removes[i] = moveIndex++
            hasMoves = true
        } else {
            while (bMatch[freeIndex] !== undefined) {
                freeIndex++
            }

            if (freeIndex < len) {
                var freeChild = bChildren[freeIndex]
                if (freeChild) {
                    shuffle[i] = freeChild
                    if (freeIndex !== moveIndex) {
                        hasMoves = true
                        moves[freeIndex] = moveIndex
                        reverse[moveIndex] = freeIndex
                    }
                    moveIndex++
                }
                freeIndex++
            }
        }
        i++
    }

    if (hasMoves) {
        shuffle.moves = moves
    }

    return shuffle
}

function keyIndex(children) {
    var i, keys

    for (i = 0; i < children.length; i++) {
        var child = children[i]

        if (child.key !== undefined) {
            keys = keys || {}
            keys[child.key] = i
        }
    }

    return keys
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":15,"../vnode/is-thunk":16,"../vnode/is-vnode":18,"../vnode/is-vtext":19,"../vnode/is-widget":20,"../vnode/vpatch":23,"./diff-props":25,"x-is-array":7}],27:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Alt = function ($less$bar$greater, __superclass_Prelude$dotFunctor_0) {
    this["<|>"] = $less$bar$greater;
    this["__superclass_Prelude.Functor_0"] = __superclass_Prelude$dotFunctor_0;
};
var $less$bar$greater = function (dict) {
    return dict["<|>"];
};
module.exports = {
    Alt: Alt, 
    "<|>": $less$bar$greater
};

},{"Prelude":55}],28:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Control_Lazy = require("Control.Lazy");
var Control_Alt = require("Control.Alt");
var Control_Plus = require("Control.Plus");
var Alternative = function (__superclass_Control$dotPlus$dotPlus_1, __superclass_Prelude$dotApplicative_0) {
    this["__superclass_Control.Plus.Plus_1"] = __superclass_Control$dotPlus$dotPlus_1;
    this["__superclass_Prelude.Applicative_0"] = __superclass_Prelude$dotApplicative_0;
};
var some = function (__dict_Alternative_0) {
    return function (__dict_Lazy1_1) {
        return function (v) {
            return Prelude["<*>"]((__dict_Alternative_0["__superclass_Prelude.Applicative_0"]())["__superclass_Prelude.Apply_0"]())(Prelude["<$>"](((__dict_Alternative_0["__superclass_Control.Plus.Plus_1"]())["__superclass_Control.Alt.Alt_0"]())["__superclass_Prelude.Functor_0"]())(Prelude[":"])(v))(Control_Lazy.defer1(__dict_Lazy1_1)(function (_) {
                return many(__dict_Alternative_0)(__dict_Lazy1_1)(v);
            }));
        };
    };
};
var many = function (__dict_Alternative_2) {
    return function (__dict_Lazy1_3) {
        return function (v) {
            return Control_Alt["<|>"]((__dict_Alternative_2["__superclass_Control.Plus.Plus_1"]())["__superclass_Control.Alt.Alt_0"]())(some(__dict_Alternative_2)(__dict_Lazy1_3)(v))(Prelude.pure(__dict_Alternative_2["__superclass_Prelude.Applicative_0"]())([  ]));
        };
    };
};
module.exports = {
    Alternative: Alternative, 
    many: many, 
    some: some
};

},{"Control.Alt":27,"Control.Lazy":32,"Control.Plus":37,"Prelude":55}],29:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var $less$times = function (__dict_Apply_0) {
    return function (a) {
        return function (b) {
            return Prelude["<*>"](__dict_Apply_0)(Prelude["<$>"](__dict_Apply_0["__superclass_Prelude.Functor_0"]())(Prelude["const"])(a))(b);
        };
    };
};
var $times$greater = function (__dict_Apply_1) {
    return function (a) {
        return function (b) {
            return Prelude["<*>"](__dict_Apply_1)(Prelude["<$>"](__dict_Apply_1["__superclass_Prelude.Functor_0"]())(Prelude["const"](Prelude.id(Prelude.categoryArr)))(a))(b);
        };
    };
};
var lift5 = function (__dict_Apply_2) {
    return function (f) {
        return function (a) {
            return function (b) {
                return function (c) {
                    return function (d) {
                        return function (e) {
                            return Prelude["<*>"](__dict_Apply_2)(Prelude["<*>"](__dict_Apply_2)(Prelude["<*>"](__dict_Apply_2)(Prelude["<*>"](__dict_Apply_2)(Prelude["<$>"](__dict_Apply_2["__superclass_Prelude.Functor_0"]())(f)(a))(b))(c))(d))(e);
                        };
                    };
                };
            };
        };
    };
};
var lift4 = function (__dict_Apply_3) {
    return function (f) {
        return function (a) {
            return function (b) {
                return function (c) {
                    return function (d) {
                        return Prelude["<*>"](__dict_Apply_3)(Prelude["<*>"](__dict_Apply_3)(Prelude["<*>"](__dict_Apply_3)(Prelude["<$>"](__dict_Apply_3["__superclass_Prelude.Functor_0"]())(f)(a))(b))(c))(d);
                    };
                };
            };
        };
    };
};
var lift3 = function (__dict_Apply_4) {
    return function (f) {
        return function (a) {
            return function (b) {
                return function (c) {
                    return Prelude["<*>"](__dict_Apply_4)(Prelude["<*>"](__dict_Apply_4)(Prelude["<$>"](__dict_Apply_4["__superclass_Prelude.Functor_0"]())(f)(a))(b))(c);
                };
            };
        };
    };
};
var lift2 = function (__dict_Apply_5) {
    return function (f) {
        return function (a) {
            return function (b) {
                return Prelude["<*>"](__dict_Apply_5)(Prelude["<$>"](__dict_Apply_5["__superclass_Prelude.Functor_0"]())(f)(a))(b);
            };
        };
    };
};
var forever = function (__dict_Apply_6) {
    return function (a) {
        return $times$greater(__dict_Apply_6)(a)(forever(__dict_Apply_6)(a));
    };
};
module.exports = {
    forever: forever, 
    lift5: lift5, 
    lift4: lift4, 
    lift3: lift3, 
    lift2: lift2, 
    "*>": $times$greater, 
    "<*": $less$times
};

},{"Prelude":55}],30:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Control_Extend = require("Control.Extend");
var Comonad = function (__superclass_Control$dotExtend$dotExtend_0, extract) {
    this["__superclass_Control.Extend.Extend_0"] = __superclass_Control$dotExtend$dotExtend_0;
    this.extract = extract;
};
var extract = function (dict) {
    return dict.extract;
};
module.exports = {
    Comonad: Comonad, 
    extract: extract
};

},{"Control.Extend":31,"Prelude":55}],31:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Extend = function ($less$less$eq, __superclass_Prelude$dotFunctor_0) {
    this["<<="] = $less$less$eq;
    this["__superclass_Prelude.Functor_0"] = __superclass_Prelude$dotFunctor_0;
};
var $less$less$eq = function (dict) {
    return dict["<<="];
};
var $eq$less$eq = function (__dict_Extend_0) {
    return function (f) {
        return function (g) {
            return function (w) {
                return f($less$less$eq(__dict_Extend_0)(g)(w));
            };
        };
    };
};
var $eq$greater$eq = function (__dict_Extend_1) {
    return function (f) {
        return function (g) {
            return function (w) {
                return g($less$less$eq(__dict_Extend_1)(f)(w));
            };
        };
    };
};
var $eq$greater$greater = function (__dict_Extend_2) {
    return function (w) {
        return function (f) {
            return $less$less$eq(__dict_Extend_2)(f)(w);
        };
    };
};
var extendArr = function (__dict_Semigroup_3) {
    return new Extend(function (f) {
        return function (g) {
            return function (w) {
                return f(function (w$prime) {
                    return g(Prelude["<>"](__dict_Semigroup_3)(w)(w$prime));
                });
            };
        };
    }, function () {
        return Prelude.functorArr;
    });
};
var duplicate = function (__dict_Extend_4) {
    return function (w) {
        return $less$less$eq(__dict_Extend_4)(Prelude.id(Prelude.categoryArr))(w);
    };
};
module.exports = {
    Extend: Extend, 
    duplicate: duplicate, 
    "=<=": $eq$less$eq, 
    "=>=": $eq$greater$eq, 
    "=>>": $eq$greater$greater, 
    "<<=": $less$less$eq, 
    extendArr: extendArr
};

},{"Prelude":55}],32:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Lazy = function (defer) {
    this.defer = defer;
};
var Lazy1 = function (defer1) {
    this.defer1 = defer1;
};
var Lazy2 = function (defer2) {
    this.defer2 = defer2;
};
var defer2 = function (dict) {
    return dict.defer2;
};
var fix2 = function (__dict_Lazy2_0) {
    return function (f) {
        return defer2(__dict_Lazy2_0)(function (_) {
            return f(fix2(__dict_Lazy2_0)(f));
        });
    };
};
var defer1 = function (dict) {
    return dict.defer1;
};
var fix1 = function (__dict_Lazy1_1) {
    return function (f) {
        return defer1(__dict_Lazy1_1)(function (_) {
            return f(fix1(__dict_Lazy1_1)(f));
        });
    };
};
var defer = function (dict) {
    return dict.defer;
};
var fix = function (__dict_Lazy_2) {
    return function (f) {
        return defer(__dict_Lazy_2)(function (_) {
            return f(fix(__dict_Lazy_2)(f));
        });
    };
};
module.exports = {
    Lazy2: Lazy2, 
    Lazy1: Lazy1, 
    Lazy: Lazy, 
    fix2: fix2, 
    fix1: fix1, 
    fix: fix, 
    defer2: defer2, 
    defer1: defer1, 
    defer: defer
};

},{"Prelude":55}],33:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Control_Monad_Eff = require("Control.Monad.Eff");
function random() {  return Math.random();};
module.exports = {
    random: random
};

},{"Control.Monad.Eff":34,"Prelude":55}],34:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
function returnE(a) {  return function() {    return a;  };};
function bindE(a) {  return function(f) {    return function() {      return f(a())();    };  };};
function runPure(f) {  return f();};
function untilE(f) {  return function() {    while (!f());    return {};  };};
function whileE(f) {  return function(a) {    return function() {      while (f()) {        a();      }      return {};    };  };};
function forE(lo) {  return function(hi) {    return function(f) {      return function() {        for (var i = lo; i < hi; i++) {          f(i)();        }      };    };  };};
function foreachE(as) {  return function(f) {    return function() {      for (var i = 0; i < as.length; i++) {        f(as[i])();      }    };  };};
var monadEff = new Prelude.Monad(function () {
    return applicativeEff;
}, function () {
    return bindEff;
});
var bindEff = new Prelude.Bind(bindE, function () {
    return applyEff;
});
var applyEff = new Prelude.Apply(Prelude.ap(monadEff), function () {
    return functorEff;
});
var applicativeEff = new Prelude.Applicative(function () {
    return applyEff;
}, returnE);
var functorEff = new Prelude.Functor(Prelude.liftA1(applicativeEff));
module.exports = {
    foreachE: foreachE, 
    forE: forE, 
    whileE: whileE, 
    untilE: untilE, 
    runPure: runPure, 
    bindE: bindE, 
    returnE: returnE, 
    functorEff: functorEff, 
    applyEff: applyEff, 
    applicativeEff: applicativeEff, 
    bindEff: bindEff, 
    monadEff: monadEff
};

},{"Prelude":55}],35:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var when = function (__dict_Monad_0) {
    return function (_39) {
        return function (_40) {
            if (_39) {
                return _40;
            };
            if (!_39) {
                return Prelude["return"](__dict_Monad_0)(Prelude.unit);
            };
            throw new Error("Failed pattern match");
        };
    };
};
var unless = function (__dict_Monad_1) {
    return function (_41) {
        return function (_42) {
            if (!_41) {
                return _42;
            };
            if (_41) {
                return Prelude["return"](__dict_Monad_1)(Prelude.unit);
            };
            throw new Error("Failed pattern match");
        };
    };
};
var replicateM = function (__dict_Monad_2) {
    return function (_34) {
        return function (_35) {
            if (_34 === 0) {
                return Prelude["return"](__dict_Monad_2)([  ]);
            };
            return Prelude[">>="](__dict_Monad_2["__superclass_Prelude.Bind_1"]())(_35)(function (_4) {
                return Prelude[">>="](__dict_Monad_2["__superclass_Prelude.Bind_1"]())(replicateM(__dict_Monad_2)(_34 - 1)(_35))(function (_3) {
                    return Prelude["return"](__dict_Monad_2)(Prelude[":"](_4)(_3));
                });
            });
        };
    };
};
var foldM = function (__dict_Monad_3) {
    return function (_36) {
        return function (_37) {
            return function (_38) {
                if (_38.length === 0) {
                    return Prelude["return"](__dict_Monad_3)(_37);
                };
                if (_38.length >= 1) {
                    var _146 = _38.slice(1);
                    return Prelude[">>="](__dict_Monad_3["__superclass_Prelude.Bind_1"]())(_36(_37)(_38[0]))(function (a$prime) {
                        return foldM(__dict_Monad_3)(_36)(a$prime)(_146);
                    });
                };
                throw new Error("Failed pattern match");
            };
        };
    };
};
module.exports = {
    unless: unless, 
    when: when, 
    foldM: foldM, 
    replicateM: replicateM
};

},{"Prelude":55}],36:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Control_Plus = require("Control.Plus");
var Control_Alternative = require("Control.Alternative");
var MonadPlus = function (__superclass_Control$dotAlternative$dotAlternative_1, __superclass_Prelude$dotMonad_0) {
    this["__superclass_Control.Alternative.Alternative_1"] = __superclass_Control$dotAlternative$dotAlternative_1;
    this["__superclass_Prelude.Monad_0"] = __superclass_Prelude$dotMonad_0;
};
var guard = function (__dict_MonadPlus_0) {
    return function (_43) {
        if (_43) {
            return Prelude["return"](__dict_MonadPlus_0["__superclass_Prelude.Monad_0"]())(Prelude.unit);
        };
        if (!_43) {
            return Control_Plus.empty((__dict_MonadPlus_0["__superclass_Control.Alternative.Alternative_1"]())["__superclass_Control.Plus.Plus_1"]());
        };
        throw new Error("Failed pattern match");
    };
};
module.exports = {
    MonadPlus: MonadPlus, 
    guard: guard
};

},{"Control.Alternative":28,"Control.Plus":37,"Prelude":55}],37:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Control_Alt = require("Control.Alt");
var Plus = function (__superclass_Control$dotAlt$dotAlt_0, empty) {
    this["__superclass_Control.Alt.Alt_0"] = __superclass_Control$dotAlt$dotAlt_0;
    this.empty = empty;
};
var empty = function (dict) {
    return dict.empty;
};
module.exports = {
    Plus: Plus, 
    empty: empty
};

},{"Control.Alt":27,"Prelude":55}],38:[function(require,module,exports){
(function (global){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Control_Monad_Eff = require("Control.Monad.Eff");
var globalEnv = typeof window === 'undefined' ? global : window;

  function timeout(time){
    return function(fn){
      return function(){
        return globalEnv.setTimeout(function(){
          fn();
        }, time);
      };
    };
  }
;

  function clearTimeout(timer){
    return function(){
      return globalEnv.clearTimeout(timer);
    };
  }
;

  function interval(time){
    return function(fn){
      return function(){
        return globalEnv.setInterval(function(){
          fn();
        }, time);
      };
    };
  }
;

  function clearInterval(timer){
    return function(){
      return globalEnv.clearInterval(timer);
    };
  }
;
module.exports = {
    clearInterval: clearInterval, 
    interval: interval, 
    clearTimeout: clearTimeout, 
    timeout: timeout
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"Control.Monad.Eff":34,"Prelude":55}],39:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
module.exports = {};

},{"Prelude":55}],40:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Data_Maybe = require("Data.Maybe");
var Control_Alt = require("Control.Alt");
var Control_Plus = require("Control.Plus");
var Control_Alternative = require("Control.Alternative");
var Control_MonadPlus = require("Control.MonadPlus");
var Prelude_Unsafe = require("Prelude.Unsafe");
function snoc(l) {  return function (e) {    var l1 = l.slice();    l1.push(e);     return l1;  };};
function length (xs) {  return xs.length;};
function findIndex (f) {  return function (arr) {    for (var i = 0, l = arr.length; i < l; i++) {      if (f(arr[i])) {        return i;      }    }    return -1;  };};
function findLastIndex (f) {  return function (arr) {    for (var i = arr.length - 1; i >= 0; i--) {      if (f(arr[i])) {        return i;      }    }    return -1;  };};
function append (l1) {  return function (l2) {    return l1.concat(l2);  };};
function concat (xss) {  var result = [];  for (var i = 0, l = xss.length; i < l; i++) {    result.push.apply(result, xss[i]);  }  return result;};
function reverse (l) {  return l.slice().reverse();};
function drop (n) {  return function (l) {    return l.slice(n);  };};
function slice (s) {  return function (e) {    return function (l) {      return l.slice(s, e);    };  };};
function insertAt (index) {  return function (a) {    return function (l) {      var l1 = l.slice();      l1.splice(index, 0, a);      return l1;    };   };};
function deleteAt (index) {  return function (n) {    return function (l) {      var l1 = l.slice();      l1.splice(index, n);      return l1;    };   };};
function updateAt (index) {  return function (a) {    return function (l) {      var i = ~~index;      if (i < 0 || i >= l.length) return l;      var l1 = l.slice();      l1[i] = a;      return l1;    };   };};
function concatMap (f) {  return function (arr) {    var result = [];    for (var i = 0, l = arr.length; i < l; i++) {      Array.prototype.push.apply(result, f(arr[i]));    }    return result;  };};
function map (f) {  return function (arr) {    var l = arr.length;    var result = new Array(l);    for (var i = 0; i < l; i++) {      result[i] = f(arr[i]);    }    return result;  };};
function filter (f) {  return function (arr) {    var n = 0;    var result = [];    for (var i = 0, l = arr.length; i < l; i++) {      if (f(arr[i])) {        result[n++] = arr[i];      }    }    return result;  };};
function range (start) {  return function (end) {    var i = ~~start, e = ~~end;    var step = i > e ? -1 : 1;    var result = [i], n = 1;    while (i !== e) {      i += step;      result[n++] = i;    }    return result;  };};
function zipWith (f) {  return function (xs) {    return function (ys) {      var l = xs.length < ys.length ? xs.length : ys.length;      var result = new Array(l);      for (var i = 0; i < l; i++) {        result[i] = f(xs[i])(ys[i]);      }      return result;    };  };};
function sortJS (f) {  return function (l) {    return l.slice().sort(function (x, y) {      return f(x)(y);    });  };};
var $dot$dot = range;
var $bang$bang = function (xs) {
    return function (n) {
        var isInt = function (n_1) {
            return n_1 !== ~~n_1;
        };
        var _236 = n < 0 || (n >= length(xs) || isInt(n));
        if (_236) {
            return Data_Maybe.Nothing.value;
        };
        if (!_236) {
            return new Data_Maybe.Just(xs[n]);
        };
        throw new Error("Failed pattern match");
    };
};
var take = function (n) {
    return slice(0)(n);
};
var tail = function (_24) {
    if (_24.length >= 1) {
        var _239 = _24.slice(1);
        return new Data_Maybe.Just(_239);
    };
    return Data_Maybe.Nothing.value;
};
var span = (function () {
    var go = function (__copy__40) {
        return function (__copy__41) {
            return function (__copy__42) {
                var _40 = __copy__40;
                var _41 = __copy__41;
                var _42 = __copy__42;
                tco: while (true) {
                    if (_42.length >= 1) {
                        var _244 = _42.slice(1);
                        if (_41(_42[0])) {
                            var __tco__40 = Prelude[":"](_42[0])(_40);
                            var __tco__41 = _41;
                            _40 = __tco__40;
                            _41 = __tco__41;
                            _42 = _244;
                            continue tco;
                        };
                    };
                    return {
                        init: reverse(_40), 
                        rest: _42
                    };
                };
            };
        };
    };
    return go([  ]);
})();
var takeWhile = function (p) {
    return function (xs) {
        return (span(p)(xs)).init;
    };
};
var sortBy = function (comp) {
    return function (xs) {
        var comp$prime = function (x) {
            return function (y) {
                var _245 = comp(x)(y);
                if (_245 instanceof Prelude.GT) {
                    return 1;
                };
                if (_245 instanceof Prelude.EQ) {
                    return 0;
                };
                if (_245 instanceof Prelude.LT) {
                    return -1;
                };
                throw new Error("Failed pattern match");
            };
        };
        return sortJS(comp$prime)(xs);
    };
};
var sort = function (__dict_Ord_0) {
    return function (xs) {
        return sortBy(Prelude.compare(__dict_Ord_0))(xs);
    };
};
var singleton = function (a) {
    return [ a ];
};
var semigroupArray = new Prelude.Semigroup(append);
var $$null = function (_26) {
    if (_26.length === 0) {
        return true;
    };
    return false;
};
var nubBy = function (_33) {
    return function (_34) {
        if (_34.length === 0) {
            return [  ];
        };
        if (_34.length >= 1) {
            var _250 = _34.slice(1);
            return Prelude[":"](_34[0])(nubBy(_33)(filter(function (y) {
                return !_33(_34[0])(y);
            })(_250)));
        };
        throw new Error("Failed pattern match");
    };
};
var nub = function (__dict_Eq_1) {
    return nubBy(Prelude["=="](__dict_Eq_1));
};
var mapMaybe = function (f) {
    return concatMap(Prelude["<<<"](Prelude.semigroupoidArr)(Data_Maybe.maybe([  ])(singleton))(f));
};
var last = function (__copy__23) {
    var _23 = __copy__23;
    tco: while (true) {
        if (_23.length >= 1) {
            var _253 = _23.slice(1);
            if (_253.length === 0) {
                return new Data_Maybe.Just(_23[0]);
            };
        };
        if (_23.length >= 1) {
            var _255 = _23.slice(1);
            _23 = _255;
            continue tco;
        };
        return Data_Maybe.Nothing.value;
    };
};
var intersectBy = function (_30) {
    return function (_31) {
        return function (_32) {
            if (_31.length === 0) {
                return [  ];
            };
            if (_32.length === 0) {
                return [  ];
            };
            var el = function (x) {
                return findIndex(_30(x))(_32) >= 0;
            };
            return filter(el)(_31);
        };
    };
};
var intersect = function (__dict_Eq_2) {
    return intersectBy(Prelude["=="](__dict_Eq_2));
};
var init = function (_25) {
    if (_25.length === 0) {
        return Data_Maybe.Nothing.value;
    };
    return new Data_Maybe.Just(slice(0)(length(_25) - 1)(_25));
};
var head = function (_22) {
    if (_22.length >= 1) {
        var _262 = _22.slice(1);
        return new Data_Maybe.Just(_22[0]);
    };
    return Data_Maybe.Nothing.value;
};
var groupBy = (function () {
    var go = function (__copy__37) {
        return function (__copy__38) {
            return function (__copy__39) {
                var _37 = __copy__37;
                var _38 = __copy__38;
                var _39 = __copy__39;
                tco: while (true) {
                    if (_39.length === 0) {
                        return reverse(_37);
                    };
                    if (_39.length >= 1) {
                        var _267 = _39.slice(1);
                        var sp = span(_38(_39[0]))(_267);
                        var __tco__37 = Prelude[":"](Prelude[":"](_39[0])(sp.init))(_37);
                        var __tco__38 = _38;
                        _37 = __tco__37;
                        _38 = __tco__38;
                        _39 = sp.rest;
                        continue tco;
                    };
                    throw new Error("Failed pattern match");
                };
            };
        };
    };
    return go([  ]);
})();
var group = function (__dict_Eq_3) {
    return function (xs) {
        return groupBy(Prelude["=="](__dict_Eq_3))(xs);
    };
};

/**
 *  | Performs a sorting first.
 */
var group$prime = function (__dict_Ord_4) {
    return Prelude["<<<"](Prelude.semigroupoidArr)(group(__dict_Ord_4["__superclass_Prelude.Eq_0"]()))(sort(__dict_Ord_4));
};
var functorArray = new Prelude.Functor(map);
var elemLastIndex = function (__dict_Eq_5) {
    return function (x) {
        return findLastIndex(Prelude["=="](__dict_Eq_5)(x));
    };
};
var elemIndex = function (__dict_Eq_6) {
    return function (x) {
        return findIndex(Prelude["=="](__dict_Eq_6)(x));
    };
};
var dropWhile = function (p) {
    return function (xs) {
        return (span(p)(xs)).rest;
    };
};
var deleteBy = function (_27) {
    return function (_28) {
        return function (_29) {
            if (_29.length === 0) {
                return [  ];
            };
            var _271 = findIndex(_27(_28))(_29);
            if (_271 < 0) {
                return _29;
            };
            return deleteAt(_271)(1)(_29);
        };
    };
};
var $$delete = function (__dict_Eq_7) {
    return deleteBy(Prelude["=="](__dict_Eq_7));
};
var $bslash$bslash = function (__dict_Eq_8) {
    return function (xs) {
        return function (ys) {
            var go = function (__copy__35) {
                return function (__copy__36) {
                    var _35 = __copy__35;
                    var _36 = __copy__36;
                    tco: while (true) {
                        if (_36.length === 0) {
                            return _35;
                        };
                        if (_35.length === 0) {
                            return [  ];
                        };
                        if (_36.length >= 1) {
                            var _275 = _36.slice(1);
                            var __tco__35 = $$delete(__dict_Eq_8)(_36[0])(_35);
                            _35 = __tco__35;
                            _36 = _275;
                            continue tco;
                        };
                        throw new Error("Failed pattern match");
                    };
                };
            };
            return go(xs)(ys);
        };
    };
};
var catMaybes = concatMap(Data_Maybe.maybe([  ])(singleton));
var monadArray = new Prelude.Monad(function () {
    return applicativeArray;
}, function () {
    return bindArray;
});
var bindArray = new Prelude.Bind(Prelude.flip(concatMap), function () {
    return applyArray;
});
var applyArray = new Prelude.Apply(Prelude.ap(monadArray), function () {
    return functorArray;
});
var applicativeArray = new Prelude.Applicative(function () {
    return applyArray;
}, singleton);
var altArray = new Control_Alt.Alt(append, function () {
    return functorArray;
});
var plusArray = new Control_Plus.Plus(function () {
    return altArray;
}, [  ]);
var alternativeArray = new Control_Alternative.Alternative(function () {
    return plusArray;
}, function () {
    return applicativeArray;
});
var monadPlusArray = new Control_MonadPlus.MonadPlus(function () {
    return alternativeArray;
}, function () {
    return monadArray;
});
module.exports = {
    takeWhile: takeWhile, 
    dropWhile: dropWhile, 
    span: span, 
    groupBy: groupBy, 
    "group'": group$prime, 
    group: group, 
    sortBy: sortBy, 
    sort: sort, 
    nubBy: nubBy, 
    nub: nub, 
    zipWith: zipWith, 
    range: range, 
    filter: filter, 
    concatMap: concatMap, 
    intersect: intersect, 
    intersectBy: intersectBy, 
    "\\\\": $bslash$bslash, 
    "delete": $$delete, 
    deleteBy: deleteBy, 
    updateAt: updateAt, 
    deleteAt: deleteAt, 
    insertAt: insertAt, 
    take: take, 
    drop: drop, 
    reverse: reverse, 
    concat: concat, 
    append: append, 
    elemLastIndex: elemLastIndex, 
    elemIndex: elemIndex, 
    findLastIndex: findLastIndex, 
    findIndex: findIndex, 
    length: length, 
    catMaybes: catMaybes, 
    mapMaybe: mapMaybe, 
    map: map, 
    "null": $$null, 
    init: init, 
    tail: tail, 
    last: last, 
    head: head, 
    singleton: singleton, 
    snoc: snoc, 
    "..": $dot$dot, 
    "!!": $bang$bang, 
    functorArray: functorArray, 
    applyArray: applyArray, 
    applicativeArray: applicativeArray, 
    bindArray: bindArray, 
    monadArray: monadArray, 
    semigroupArray: semigroupArray, 
    altArray: altArray, 
    plusArray: plusArray, 
    alternativeArray: alternativeArray, 
    monadPlusArray: monadPlusArray
};

},{"Control.Alt":27,"Control.Alternative":28,"Control.MonadPlus":36,"Control.Plus":37,"Data.Maybe":45,"Prelude":55,"Prelude.Unsafe":54}],41:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Control_Alt = require("Control.Alt");
var Left = (function () {
    function Left(value0) {
        this.value0 = value0;
    };
    Left.create = function (value0) {
        return new Left(value0);
    };
    return Left;
})();
var Right = (function () {
    function Right(value0) {
        this.value0 = value0;
    };
    Right.create = function (value0) {
        return new Right(value0);
    };
    return Right;
})();
var showEither = function (__dict_Show_0) {
    return function (__dict_Show_1) {
        return new Prelude.Show(function (_17) {
            if (_17 instanceof Left) {
                return "Left (" + (Prelude.show(__dict_Show_0)(_17.value0) + ")");
            };
            if (_17 instanceof Right) {
                return "Right (" + (Prelude.show(__dict_Show_1)(_17.value0) + ")");
            };
            throw new Error("Failed pattern match");
        });
    };
};
var functorEither = new Prelude.Functor(function (_11) {
    return function (_12) {
        if (_12 instanceof Left) {
            return new Left(_12.value0);
        };
        if (_12 instanceof Right) {
            return new Right(_11(_12.value0));
        };
        throw new Error("Failed pattern match");
    };
});
var eqEither = function (__dict_Eq_4) {
    return function (__dict_Eq_5) {
        return new Prelude.Eq(function (a) {
            return function (b) {
                return !Prelude["=="](eqEither(__dict_Eq_4)(__dict_Eq_5))(a)(b);
            };
        }, function (_18) {
            return function (_19) {
                if (_18 instanceof Left && _19 instanceof Left) {
                    return Prelude["=="](__dict_Eq_4)(_18.value0)(_19.value0);
                };
                if (_18 instanceof Right && _19 instanceof Right) {
                    return Prelude["=="](__dict_Eq_5)(_18.value0)(_19.value0);
                };
                return false;
            };
        });
    };
};
var ordEither = function (__dict_Ord_2) {
    return function (__dict_Ord_3) {
        return new Prelude.Ord(function () {
            return eqEither(__dict_Ord_2["__superclass_Prelude.Eq_0"]())(__dict_Ord_3["__superclass_Prelude.Eq_0"]());
        }, function (_20) {
            return function (_21) {
                if (_20 instanceof Left && _21 instanceof Left) {
                    return Prelude.compare(__dict_Ord_2)(_20.value0)(_21.value0);
                };
                if (_20 instanceof Right && _21 instanceof Right) {
                    return Prelude.compare(__dict_Ord_3)(_20.value0)(_21.value0);
                };
                if (_20 instanceof Left) {
                    return Prelude.LT.value;
                };
                if (_21 instanceof Left) {
                    return Prelude.GT.value;
                };
                throw new Error("Failed pattern match");
            };
        });
    };
};
var either = function (_8) {
    return function (_9) {
        return function (_10) {
            if (_10 instanceof Left) {
                return _8(_10.value0);
            };
            if (_10 instanceof Right) {
                return _9(_10.value0);
            };
            throw new Error("Failed pattern match");
        };
    };
};
var isLeft = either(Prelude["const"](true))(Prelude["const"](false));
var isRight = either(Prelude["const"](false))(Prelude["const"](true));
var applyEither = new Prelude.Apply(function (_13) {
    return function (_14) {
        if (_13 instanceof Left) {
            return new Left(_13.value0);
        };
        if (_13 instanceof Right) {
            return Prelude["<$>"](functorEither)(_13.value0)(_14);
        };
        throw new Error("Failed pattern match");
    };
}, function () {
    return functorEither;
});
var bindEither = new Prelude.Bind(either(function (e) {
    return function (_) {
        return new Left(e);
    };
})(function (a) {
    return function (f) {
        return f(a);
    };
}), function () {
    return applyEither;
});
var applicativeEither = new Prelude.Applicative(function () {
    return applyEither;
}, Right.create);
var monadEither = new Prelude.Monad(function () {
    return applicativeEither;
}, function () {
    return bindEither;
});
var altEither = new Control_Alt.Alt(function (_15) {
    return function (_16) {
        if (_15 instanceof Left) {
            return _16;
        };
        return _15;
    };
}, function () {
    return functorEither;
});
module.exports = {
    Left: Left, 
    Right: Right, 
    isRight: isRight, 
    isLeft: isLeft, 
    either: either, 
    functorEither: functorEither, 
    applyEither: applyEither, 
    applicativeEither: applicativeEither, 
    altEither: altEither, 
    bindEither: bindEither, 
    monadEither: monadEither, 
    showEither: showEither, 
    eqEither: eqEither, 
    ordEither: ordEither
};

},{"Control.Alt":27,"Prelude":55}],42:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Data_Monoid = require("Data.Monoid");
var Prelude = require("Prelude");
var Control_Apply = require("Control.Apply");
var Data_Monoid_First = require("Data.Monoid.First");
var Data_Either = require("Data.Either");
var Data_Maybe = require("Data.Maybe");
var Data_Tuple = require("Data.Tuple");

  function foldrArray(f) {
    return function(z) {
      return function(xs) {
        var acc = z;
        for (var i = xs.length - 1; i >= 0; --i) {
          acc = f(xs[i])(acc);
        }
        return acc;
      }
    }
  };

  function foldlArray(f) {
    return function(z) {
      return function(xs) {
        var acc = z;
        for (var i = 0, len = xs.length; i < len; ++i) {
          acc = f(acc)(xs[i]);
        }
        return acc;
      }
    }
  };
var Foldable = function (foldMap, foldl, foldr) {
    this.foldMap = foldMap;
    this.foldl = foldl;
    this.foldr = foldr;
};
var foldr = function (dict) {
    return dict.foldr;
};
var traverse_ = function (__dict_Applicative_0) {
    return function (__dict_Foldable_1) {
        return function (f) {
            return foldr(__dict_Foldable_1)(Prelude["<<<"](Prelude.semigroupoidArr)(Control_Apply["*>"](__dict_Applicative_0["__superclass_Prelude.Apply_0"]()))(f))(Prelude.pure(__dict_Applicative_0)(Prelude.unit));
        };
    };
};
var for_ = function (__dict_Applicative_2) {
    return function (__dict_Foldable_3) {
        return Prelude.flip(traverse_(__dict_Applicative_2)(__dict_Foldable_3));
    };
};
var sequence_ = function (__dict_Applicative_4) {
    return function (__dict_Foldable_5) {
        return traverse_(__dict_Applicative_4)(__dict_Foldable_5)(Prelude.id(Prelude.categoryArr));
    };
};
var foldl = function (dict) {
    return dict.foldl;
};
var intercalate = function (__dict_Foldable_6) {
    return function (__dict_Monoid_7) {
        return function (sep) {
            return function (xs) {
                var go = function (_161) {
                    return function (_162) {
                        if (_161.init) {
                            return {
                                init: false, 
                                acc: _162
                            };
                        };
                        return {
                            init: false, 
                            acc: Prelude["<>"](__dict_Monoid_7["__superclass_Prelude.Semigroup_0"]())(_161.acc)(Prelude["<>"](__dict_Monoid_7["__superclass_Prelude.Semigroup_0"]())(sep)(_162))
                        };
                    };
                };
                return (foldl(__dict_Foldable_6)(go)({
                    init: true, 
                    acc: Data_Monoid.mempty(__dict_Monoid_7)
                })(xs)).acc;
            };
        };
    };
};
var mconcat = function (__dict_Foldable_8) {
    return function (__dict_Monoid_9) {
        return foldl(__dict_Foldable_8)(Prelude["<>"](__dict_Monoid_9["__superclass_Prelude.Semigroup_0"]()))(Data_Monoid.mempty(__dict_Monoid_9));
    };
};
var or = function (__dict_Foldable_10) {
    return foldl(__dict_Foldable_10)(Prelude["||"](Prelude.boolLikeBoolean))(false);
};
var product = function (__dict_Foldable_11) {
    return foldl(__dict_Foldable_11)(Prelude["*"](Prelude.numNumber))(1);
};
var sum = function (__dict_Foldable_12) {
    return foldl(__dict_Foldable_12)(Prelude["+"](Prelude.numNumber))(0);
};
var foldableTuple = new Foldable(function (__dict_Monoid_13) {
    return function (_159) {
        return function (_160) {
            return _159(_160.value1);
        };
    };
}, function (_156) {
    return function (_157) {
        return function (_158) {
            return _156(_157)(_158.value1);
        };
    };
}, function (_153) {
    return function (_154) {
        return function (_155) {
            return _153(_155.value1)(_154);
        };
    };
});
var foldableMaybe = new Foldable(function (__dict_Monoid_14) {
    return function (_151) {
        return function (_152) {
            if (_152 instanceof Data_Maybe.Nothing) {
                return Data_Monoid.mempty(__dict_Monoid_14);
            };
            if (_152 instanceof Data_Maybe.Just) {
                return _151(_152.value0);
            };
            throw new Error("Failed pattern match");
        };
    };
}, function (_148) {
    return function (_149) {
        return function (_150) {
            if (_150 instanceof Data_Maybe.Nothing) {
                return _149;
            };
            if (_150 instanceof Data_Maybe.Just) {
                return _148(_149)(_150.value0);
            };
            throw new Error("Failed pattern match");
        };
    };
}, function (_145) {
    return function (_146) {
        return function (_147) {
            if (_147 instanceof Data_Maybe.Nothing) {
                return _146;
            };
            if (_147 instanceof Data_Maybe.Just) {
                return _145(_147.value0)(_146);
            };
            throw new Error("Failed pattern match");
        };
    };
});
var foldableEither = new Foldable(function (__dict_Monoid_15) {
    return function (_143) {
        return function (_144) {
            if (_144 instanceof Data_Either.Left) {
                return Data_Monoid.mempty(__dict_Monoid_15);
            };
            if (_144 instanceof Data_Either.Right) {
                return _143(_144.value0);
            };
            throw new Error("Failed pattern match");
        };
    };
}, function (_140) {
    return function (_141) {
        return function (_142) {
            if (_142 instanceof Data_Either.Left) {
                return _141;
            };
            if (_142 instanceof Data_Either.Right) {
                return _140(_141)(_142.value0);
            };
            throw new Error("Failed pattern match");
        };
    };
}, function (_137) {
    return function (_138) {
        return function (_139) {
            if (_139 instanceof Data_Either.Left) {
                return _138;
            };
            if (_139 instanceof Data_Either.Right) {
                return _137(_139.value0)(_138);
            };
            throw new Error("Failed pattern match");
        };
    };
});
var foldableArray = new Foldable(function (__dict_Monoid_16) {
    return function (f) {
        return function (xs) {
            return foldr(foldableArray)(function (x) {
                return function (acc) {
                    return Prelude["<>"](__dict_Monoid_16["__superclass_Prelude.Semigroup_0"]())(f(x))(acc);
                };
            })(Data_Monoid.mempty(__dict_Monoid_16))(xs);
        };
    };
}, function (f) {
    return function (z) {
        return function (xs) {
            return foldlArray(f)(z)(xs);
        };
    };
}, function (f) {
    return function (z) {
        return function (xs) {
            return foldrArray(f)(z)(xs);
        };
    };
});
var foldMap = function (dict) {
    return dict.foldMap;
};
var lookup = function (__dict_Eq_17) {
    return function (__dict_Foldable_18) {
        return function (a) {
            return function (f) {
                return Data_Monoid_First.runFirst(foldMap(__dict_Foldable_18)(Data_Monoid_First.monoidFirst)(function (_136) {
                    var _555 = Prelude["=="](__dict_Eq_17)(a)(_136.value0);
                    if (_555) {
                        return new Data_Maybe.Just(_136.value1);
                    };
                    if (!_555) {
                        return Data_Maybe.Nothing.value;
                    };
                    throw new Error("Failed pattern match");
                })(f));
            };
        };
    };
};
var fold = function (__dict_Foldable_19) {
    return function (__dict_Monoid_20) {
        return foldMap(__dict_Foldable_19)(__dict_Monoid_20)(Prelude.id(Prelude.categoryArr));
    };
};
var find = function (__dict_Foldable_21) {
    return function (p) {
        return function (f) {
            var _559 = foldMap(__dict_Foldable_21)(Data_Monoid.monoidArray)(function (x) {
                var _558 = p(x);
                if (_558) {
                    return [ x ];
                };
                if (!_558) {
                    return [  ];
                };
                throw new Error("Failed pattern match");
            })(f);
            if (_559.length >= 1) {
                var _561 = _559.slice(1);
                return new Data_Maybe.Just(_559[0]);
            };
            if (_559.length === 0) {
                return Data_Maybe.Nothing.value;
            };
            throw new Error("Failed pattern match");
        };
    };
};
var any = function (__dict_Foldable_22) {
    return function (p) {
        return Prelude["<<<"](Prelude.semigroupoidArr)(or(foldableArray))(foldMap(__dict_Foldable_22)(Data_Monoid.monoidArray)(function (x) {
            return [ p(x) ];
        }));
    };
};
var elem = function (__dict_Eq_23) {
    return function (__dict_Foldable_24) {
        return Prelude["<<<"](Prelude.semigroupoidArr)(any(__dict_Foldable_24))(Prelude["=="](__dict_Eq_23));
    };
};
var notElem = function (__dict_Eq_25) {
    return function (__dict_Foldable_26) {
        return function (x) {
            return Prelude["<<<"](Prelude.semigroupoidArr)(Prelude.not(Prelude.boolLikeBoolean))(elem(__dict_Eq_25)(__dict_Foldable_26)(x));
        };
    };
};
var and = function (__dict_Foldable_27) {
    return foldl(__dict_Foldable_27)(Prelude["&&"](Prelude.boolLikeBoolean))(true);
};
var all = function (__dict_Foldable_28) {
    return function (p) {
        return Prelude["<<<"](Prelude.semigroupoidArr)(and(foldableArray))(foldMap(__dict_Foldable_28)(Data_Monoid.monoidArray)(function (x) {
            return [ p(x) ];
        }));
    };
};
module.exports = {
    Foldable: Foldable, 
    foldlArray: foldlArray, 
    foldrArray: foldrArray, 
    lookup: lookup, 
    find: find, 
    notElem: notElem, 
    elem: elem, 
    product: product, 
    sum: sum, 
    all: all, 
    any: any, 
    or: or, 
    and: and, 
    intercalate: intercalate, 
    mconcat: mconcat, 
    sequence_: sequence_, 
    for_: for_, 
    traverse_: traverse_, 
    fold: fold, 
    foldMap: foldMap, 
    foldl: foldl, 
    foldr: foldr, 
    foldableArray: foldableArray, 
    foldableEither: foldableEither, 
    foldableMaybe: foldableMaybe, 
    foldableTuple: foldableTuple
};

},{"Control.Apply":29,"Data.Either":41,"Data.Maybe":45,"Data.Monoid":47,"Data.Monoid.First":46,"Data.Tuple":48,"Prelude":55}],43:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
function mkFn0(fn) {  return function() {    return fn({});  };};
function mkFn1(fn) {  return function(a) {    return fn(a);  };};
function mkFn2(fn) {  return function(a, b) {    return fn(a)(b);  };};
function mkFn3(fn) {  return function(a, b, c) {    return fn(a)(b)(c);  };};
function mkFn4(fn) {  return function(a, b, c, d) {    return fn(a)(b)(c)(d);  };};
function mkFn5(fn) {  return function(a, b, c, d, e) {    return fn(a)(b)(c)(d)(e);  };};
function mkFn6(fn) {  return function(a, b, c, d, e, f) {    return fn(a)(b)(c)(d)(e)(f);  };};
function mkFn7(fn) {  return function(a, b, c, d, e, f, g) {    return fn(a)(b)(c)(d)(e)(f)(g);  };};
function mkFn8(fn) {  return function(a, b, c, d, e, f, g, h) {    return fn(a)(b)(c)(d)(e)(f)(g)(h);  };};
function mkFn9(fn) {  return function(a, b, c, d, e, f, g, h, i) {    return fn(a)(b)(c)(d)(e)(f)(g)(h)(i);  };};
function mkFn10(fn) {  return function(a, b, c, d, e, f, g, h, i, j) {    return fn(a)(b)(c)(d)(e)(f)(g)(h)(i)(j);  };};
function runFn0(fn) {  return fn();};
function runFn1(fn) {  return function(a) {    return fn(a);  };};
function runFn2(fn) {  return function(a) {    return function(b) {      return fn(a, b);    };  };};
function runFn3(fn) {  return function(a) {    return function(b) {      return function(c) {        return fn(a, b, c);      };    };  };};
function runFn4(fn) {  return function(a) {    return function(b) {      return function(c) {        return function(d) {          return fn(a, b, c, d);        };      };    };  };};
function runFn5(fn) {  return function(a) {    return function(b) {      return function(c) {        return function(d) {          return function(e) {            return fn(a, b, c, d, e);          };        };      };    };  };};
function runFn6(fn) {  return function(a) {    return function(b) {      return function(c) {        return function(d) {          return function(e) {            return function(f) {              return fn(a, b, c, d, e, f);            };          };        };      };    };  };};
function runFn7(fn) {  return function(a) {    return function(b) {      return function(c) {        return function(d) {          return function(e) {            return function(f) {              return function(g) {                return fn(a, b, c, d, e, f, g);              };            };          };        };      };    };  };};
function runFn8(fn) {  return function(a) {    return function(b) {      return function(c) {        return function(d) {          return function(e) {            return function(f) {              return function(g) {                return function(h) {                  return fn(a, b, c, d, e, f, g, h);                };              };            };          };        };      };    };  };};
function runFn9(fn) {  return function(a) {    return function(b) {      return function(c) {        return function(d) {          return function(e) {            return function(f) {              return function(g) {                return function(h) {                  return function(i) {                    return fn(a, b, c, d, e, f, g, h, i);                  };                };              };            };          };        };      };    };  };};
function runFn10(fn) {  return function(a) {    return function(b) {      return function(c) {        return function(d) {          return function(e) {            return function(f) {              return function(g) {                return function(h) {                  return function(i) {                    return function(j) {                      return fn(a, b, c, d, e, f, g, h, i, j);                    };                  };                };              };            };          };        };      };    };  };};
var on = function (f) {
    return function (g) {
        return function (x) {
            return function (y) {
                return f(g(x))(g(y));
            };
        };
    };
};
module.exports = {
    runFn10: runFn10, 
    runFn9: runFn9, 
    runFn8: runFn8, 
    runFn7: runFn7, 
    runFn6: runFn6, 
    runFn5: runFn5, 
    runFn4: runFn4, 
    runFn3: runFn3, 
    runFn2: runFn2, 
    runFn1: runFn1, 
    runFn0: runFn0, 
    mkFn10: mkFn10, 
    mkFn9: mkFn9, 
    mkFn8: mkFn8, 
    mkFn7: mkFn7, 
    mkFn6: mkFn6, 
    mkFn5: mkFn5, 
    mkFn4: mkFn4, 
    mkFn3: mkFn3, 
    mkFn2: mkFn2, 
    mkFn1: mkFn1, 
    mkFn0: mkFn0, 
    on: on
};

},{"Prelude":55}],44:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Data_Maybe = require("Data.Maybe");
var fromJust = function (_85) {
    if (_85 instanceof Data_Maybe.Just) {
        return _85.value0;
    };
    throw new Error("Failed pattern match");
};
module.exports = {
    fromJust: fromJust
};

},{"Data.Maybe":45,"Prelude":55}],45:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Control_Alt = require("Control.Alt");
var Control_Alternative = require("Control.Alternative");
var Control_Extend = require("Control.Extend");
var Control_MonadPlus = require("Control.MonadPlus");
var Control_Plus = require("Control.Plus");
var Nothing = (function () {
    function Nothing() {

    };
    Nothing.value = new Nothing();
    return Nothing;
})();
var Just = (function () {
    function Just(value0) {
        this.value0 = value0;
    };
    Just.create = function (value0) {
        return new Just(value0);
    };
    return Just;
})();
var showMaybe = function (__dict_Show_0) {
    return new Prelude.Show(function (_59) {
        if (_59 instanceof Just) {
            return "Just (" + (Prelude.show(__dict_Show_0)(_59.value0) + ")");
        };
        if (_59 instanceof Nothing) {
            return "Nothing";
        };
        throw new Error("Failed pattern match");
    });
};
var semigroupMaybe = function (__dict_Semigroup_1) {
    return new Prelude.Semigroup(function (_57) {
        return function (_58) {
            if (_57 instanceof Nothing) {
                return _58;
            };
            if (_58 instanceof Nothing) {
                return _57;
            };
            if (_57 instanceof Just && _58 instanceof Just) {
                return new Just(Prelude["<>"](__dict_Semigroup_1)(_57.value0)(_58.value0));
            };
            throw new Error("Failed pattern match");
        };
    });
};
var maybe = function (_44) {
    return function (_45) {
        return function (_46) {
            if (_46 instanceof Nothing) {
                return _44;
            };
            if (_46 instanceof Just) {
                return _45(_46.value0);
            };
            throw new Error("Failed pattern match");
        };
    };
};
var isNothing = maybe(true)(Prelude["const"](false));
var isJust = maybe(false)(Prelude["const"](true));
var functorMaybe = new Prelude.Functor(function (_47) {
    return function (_48) {
        if (_48 instanceof Just) {
            return new Just(_47(_48.value0));
        };
        return Nothing.value;
    };
});
var fromMaybe = function (a) {
    return maybe(a)(Prelude.id(Prelude.categoryArr));
};
var extendMaybe = new Control_Extend.Extend(function (_55) {
    return function (_56) {
        if (_56 instanceof Nothing) {
            return Nothing.value;
        };
        return Just.create(_55(_56));
    };
}, function () {
    return functorMaybe;
});
var eqMaybe = function (__dict_Eq_3) {
    return new Prelude.Eq(function (a) {
        return function (b) {
            return !Prelude["=="](eqMaybe(__dict_Eq_3))(a)(b);
        };
    }, function (_60) {
        return function (_61) {
            if (_60 instanceof Nothing && _61 instanceof Nothing) {
                return true;
            };
            if (_60 instanceof Just && _61 instanceof Just) {
                return Prelude["=="](__dict_Eq_3)(_60.value0)(_61.value0);
            };
            return false;
        };
    });
};
var ordMaybe = function (__dict_Ord_2) {
    return new Prelude.Ord(function () {
        return eqMaybe(__dict_Ord_2["__superclass_Prelude.Eq_0"]());
    }, function (_62) {
        return function (_63) {
            if (_62 instanceof Just && _63 instanceof Just) {
                return Prelude.compare(__dict_Ord_2)(_62.value0)(_63.value0);
            };
            if (_62 instanceof Nothing && _63 instanceof Nothing) {
                return Prelude.EQ.value;
            };
            if (_62 instanceof Nothing) {
                return Prelude.LT.value;
            };
            if (_63 instanceof Nothing) {
                return Prelude.GT.value;
            };
            throw new Error("Failed pattern match");
        };
    });
};
var applyMaybe = new Prelude.Apply(function (_49) {
    return function (_50) {
        if (_49 instanceof Just) {
            return Prelude["<$>"](functorMaybe)(_49.value0)(_50);
        };
        if (_49 instanceof Nothing) {
            return Nothing.value;
        };
        throw new Error("Failed pattern match");
    };
}, function () {
    return functorMaybe;
});
var bindMaybe = new Prelude.Bind(function (_53) {
    return function (_54) {
        if (_53 instanceof Just) {
            return _54(_53.value0);
        };
        if (_53 instanceof Nothing) {
            return Nothing.value;
        };
        throw new Error("Failed pattern match");
    };
}, function () {
    return applyMaybe;
});
var applicativeMaybe = new Prelude.Applicative(function () {
    return applyMaybe;
}, Just.create);
var monadMaybe = new Prelude.Monad(function () {
    return applicativeMaybe;
}, function () {
    return bindMaybe;
});
var altMaybe = new Control_Alt.Alt(function (_51) {
    return function (_52) {
        if (_51 instanceof Nothing) {
            return _52;
        };
        return _51;
    };
}, function () {
    return functorMaybe;
});
var plusMaybe = new Control_Plus.Plus(function () {
    return altMaybe;
}, Nothing.value);
var alternativeMaybe = new Control_Alternative.Alternative(function () {
    return plusMaybe;
}, function () {
    return applicativeMaybe;
});
var monadPlusMaybe = new Control_MonadPlus.MonadPlus(function () {
    return alternativeMaybe;
}, function () {
    return monadMaybe;
});
module.exports = {
    Nothing: Nothing, 
    Just: Just, 
    isNothing: isNothing, 
    isJust: isJust, 
    fromMaybe: fromMaybe, 
    maybe: maybe, 
    functorMaybe: functorMaybe, 
    applyMaybe: applyMaybe, 
    applicativeMaybe: applicativeMaybe, 
    altMaybe: altMaybe, 
    plusMaybe: plusMaybe, 
    alternativeMaybe: alternativeMaybe, 
    bindMaybe: bindMaybe, 
    monadMaybe: monadMaybe, 
    monadPlusMaybe: monadPlusMaybe, 
    extendMaybe: extendMaybe, 
    semigroupMaybe: semigroupMaybe, 
    showMaybe: showMaybe, 
    eqMaybe: eqMaybe, 
    ordMaybe: ordMaybe
};

},{"Control.Alt":27,"Control.Alternative":28,"Control.Extend":31,"Control.MonadPlus":36,"Control.Plus":37,"Prelude":55}],46:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Data_Maybe = require("Data.Maybe");
var Data_Monoid = require("Data.Monoid");
var First = function (x) {
    return x;
};
var showFirst = function (__dict_Show_0) {
    return new Prelude.Show(function (_133) {
        return "First (" + (Prelude.show(Data_Maybe.showMaybe(__dict_Show_0))(_133) + ")");
    });
};
var semigroupFirst = new Prelude.Semigroup(function (_134) {
    return function (_135) {
        if (_134 instanceof Data_Maybe.Just) {
            return _134;
        };
        return _135;
    };
});
var runFirst = function (_126) {
    return _126;
};
var monoidFirst = new Data_Monoid.Monoid(function () {
    return semigroupFirst;
}, Data_Maybe.Nothing.value);
var eqFirst = function (__dict_Eq_2) {
    return new Prelude.Eq(function (_129) {
        return function (_130) {
            return Prelude["/="](Data_Maybe.eqMaybe(__dict_Eq_2))(_129)(_130);
        };
    }, function (_127) {
        return function (_128) {
            return Prelude["=="](Data_Maybe.eqMaybe(__dict_Eq_2))(_127)(_128);
        };
    });
};
var ordFirst = function (__dict_Ord_1) {
    return new Prelude.Ord(function () {
        return eqFirst(__dict_Ord_1["__superclass_Prelude.Eq_0"]());
    }, function (_131) {
        return function (_132) {
            return Prelude.compare(Data_Maybe.ordMaybe(__dict_Ord_1))(_131)(_132);
        };
    });
};
module.exports = {
    First: First, 
    runFirst: runFirst, 
    eqFirst: eqFirst, 
    ordFirst: ordFirst, 
    showFirst: showFirst, 
    semigroupFirst: semigroupFirst, 
    monoidFirst: monoidFirst
};

},{"Data.Maybe":45,"Data.Monoid":47,"Prelude":55}],47:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Data_Array = require("Data.Array");
var Data_Maybe = require("Data.Maybe");
var Monoid = function (__superclass_Prelude$dotSemigroup_0, mempty) {
    this["__superclass_Prelude.Semigroup_0"] = __superclass_Prelude$dotSemigroup_0;
    this.mempty = mempty;
};
var monoidUnit = new Monoid(function () {
    return Prelude.semigroupUnit;
}, Prelude.unit);
var monoidString = new Monoid(function () {
    return Prelude.semigroupString;
}, "");
var monoidMaybe = function (__dict_Semigroup_0) {
    return new Monoid(function () {
        return Data_Maybe.semigroupMaybe(__dict_Semigroup_0);
    }, Data_Maybe.Nothing.value);
};
var monoidArray = new Monoid(function () {
    return Data_Array.semigroupArray;
}, [  ]);
var mempty = function (dict) {
    return dict.mempty;
};
var monoidArr = function (__dict_Monoid_1) {
    return new Monoid(function () {
        return Prelude.semigroupArr(__dict_Monoid_1["__superclass_Prelude.Semigroup_0"]());
    }, Prelude["const"](mempty(__dict_Monoid_1)));
};
module.exports = {
    Monoid: Monoid, 
    mempty: mempty, 
    monoidString: monoidString, 
    monoidArray: monoidArray, 
    monoidUnit: monoidUnit, 
    monoidArr: monoidArr, 
    monoidMaybe: monoidMaybe
};

},{"Data.Array":40,"Data.Maybe":45,"Prelude":55}],48:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Data_Monoid = require("Data.Monoid");
var Control_Lazy = require("Control.Lazy");
var Data_Array = require("Data.Array");
var Control_Comonad = require("Control.Comonad");
var Control_Extend = require("Control.Extend");
var Tuple = (function () {
    function Tuple(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    Tuple.create = function (value0) {
        return function (value1) {
            return new Tuple(value0, value1);
        };
    };
    return Tuple;
})();
var zip = Data_Array.zipWith(Tuple.create);
var unzip = function (_98) {
    if (_98.length >= 1) {
        var _338 = _98.slice(1);
        var _332 = unzip(_338);
        return new Tuple(Prelude[":"]((_98[0]).value0)(_332.value0), Prelude[":"]((_98[0]).value1)(_332.value1));
    };
    if (_98.length === 0) {
        return new Tuple([  ], [  ]);
    };
    throw new Error("Failed pattern match");
};
var uncurry = function (_96) {
    return function (_97) {
        return _96(_97.value0)(_97.value1);
    };
};
var swap = function (_99) {
    return new Tuple(_99.value1, _99.value0);
};
var snd = function (_95) {
    return _95.value1;
};
var showTuple = function (__dict_Show_0) {
    return function (__dict_Show_1) {
        return new Prelude.Show(function (_100) {
            return "Tuple (" + (Prelude.show(__dict_Show_0)(_100.value0) + (") (" + (Prelude.show(__dict_Show_1)(_100.value1) + ")")));
        });
    };
};
var semigroupoidTuple = new Prelude.Semigroupoid(function (_105) {
    return function (_106) {
        return new Tuple(_106.value0, _105.value1);
    };
});
var semigroupTuple = function (__dict_Semigroup_2) {
    return function (__dict_Semigroup_3) {
        return new Prelude.Semigroup(function (_107) {
            return function (_108) {
                return new Tuple(Prelude["<>"](__dict_Semigroup_2)(_107.value0)(_108.value0), Prelude["<>"](__dict_Semigroup_3)(_107.value1)(_108.value1));
            };
        });
    };
};
var monoidTuple = function (__dict_Monoid_6) {
    return function (__dict_Monoid_7) {
        return new Data_Monoid.Monoid(function () {
            return semigroupTuple(__dict_Monoid_6["__superclass_Prelude.Semigroup_0"]())(__dict_Monoid_7["__superclass_Prelude.Semigroup_0"]());
        }, new Tuple(Data_Monoid.mempty(__dict_Monoid_6), Data_Monoid.mempty(__dict_Monoid_7)));
    };
};
var functorTuple = new Prelude.Functor(function (_109) {
    return function (_110) {
        return new Tuple(_110.value0, _109(_110.value1));
    };
});
var fst = function (_94) {
    return _94.value0;
};
var lazyLazy1Tuple = function (__dict_Lazy1_9) {
    return function (__dict_Lazy1_10) {
        return new Control_Lazy.Lazy(function (f) {
            return new Tuple(Control_Lazy.defer1(__dict_Lazy1_9)(function (_) {
                return fst(f(Prelude.unit));
            }), Control_Lazy.defer1(__dict_Lazy1_10)(function (_) {
                return snd(f(Prelude.unit));
            }));
        });
    };
};
var lazyLazy2Tuple = function (__dict_Lazy2_11) {
    return function (__dict_Lazy2_12) {
        return new Control_Lazy.Lazy(function (f) {
            return new Tuple(Control_Lazy.defer2(__dict_Lazy2_11)(function (_) {
                return fst(f(Prelude.unit));
            }), Control_Lazy.defer2(__dict_Lazy2_12)(function (_) {
                return snd(f(Prelude.unit));
            }));
        });
    };
};
var lazyTuple = function (__dict_Lazy_13) {
    return function (__dict_Lazy_14) {
        return new Control_Lazy.Lazy(function (f) {
            return new Tuple(Control_Lazy.defer(__dict_Lazy_13)(function (_) {
                return fst(f(Prelude.unit));
            }), Control_Lazy.defer(__dict_Lazy_14)(function (_) {
                return snd(f(Prelude.unit));
            }));
        });
    };
};
var extendTuple = new Control_Extend.Extend(function (_115) {
    return function (_116) {
        return new Tuple(_116.value0, _115(_116));
    };
}, function () {
    return functorTuple;
});
var eqTuple = function (__dict_Eq_15) {
    return function (__dict_Eq_16) {
        return new Prelude.Eq(function (t1) {
            return function (t2) {
                return !Prelude["=="](eqTuple(__dict_Eq_15)(__dict_Eq_16))(t1)(t2);
            };
        }, function (_101) {
            return function (_102) {
                return Prelude["=="](__dict_Eq_15)(_101.value0)(_102.value0) && Prelude["=="](__dict_Eq_16)(_101.value1)(_102.value1);
            };
        });
    };
};
var ordTuple = function (__dict_Ord_4) {
    return function (__dict_Ord_5) {
        return new Prelude.Ord(function () {
            return eqTuple(__dict_Ord_4["__superclass_Prelude.Eq_0"]())(__dict_Ord_5["__superclass_Prelude.Eq_0"]());
        }, function (_103) {
            return function (_104) {
                var _383 = Prelude.compare(__dict_Ord_4)(_103.value0)(_104.value0);
                if (_383 instanceof Prelude.EQ) {
                    return Prelude.compare(__dict_Ord_5)(_103.value1)(_104.value1);
                };
                return _383;
            };
        });
    };
};
var curry = function (f) {
    return function (a) {
        return function (b) {
            return f(new Tuple(a, b));
        };
    };
};
var comonadTuple = new Control_Comonad.Comonad(function () {
    return extendTuple;
}, snd);
var applyTuple = function (__dict_Semigroup_18) {
    return new Prelude.Apply(function (_111) {
        return function (_112) {
            return new Tuple(Prelude["<>"](__dict_Semigroup_18)(_111.value0)(_112.value0), _111.value1(_112.value1));
        };
    }, function () {
        return functorTuple;
    });
};
var bindTuple = function (__dict_Semigroup_17) {
    return new Prelude.Bind(function (_113) {
        return function (_114) {
            var _396 = _114(_113.value1);
            return new Tuple(Prelude["<>"](__dict_Semigroup_17)(_113.value0)(_396.value0), _396.value1);
        };
    }, function () {
        return applyTuple(__dict_Semigroup_17);
    });
};
var applicativeTuple = function (__dict_Monoid_19) {
    return new Prelude.Applicative(function () {
        return applyTuple(__dict_Monoid_19["__superclass_Prelude.Semigroup_0"]());
    }, Tuple.create(Data_Monoid.mempty(__dict_Monoid_19)));
};
var monadTuple = function (__dict_Monoid_8) {
    return new Prelude.Monad(function () {
        return applicativeTuple(__dict_Monoid_8);
    }, function () {
        return bindTuple(__dict_Monoid_8["__superclass_Prelude.Semigroup_0"]());
    });
};
module.exports = {
    Tuple: Tuple, 
    swap: swap, 
    unzip: unzip, 
    zip: zip, 
    uncurry: uncurry, 
    curry: curry, 
    snd: snd, 
    fst: fst, 
    showTuple: showTuple, 
    eqTuple: eqTuple, 
    ordTuple: ordTuple, 
    semigroupoidTuple: semigroupoidTuple, 
    semigroupTuple: semigroupTuple, 
    monoidTuple: monoidTuple, 
    functorTuple: functorTuple, 
    applyTuple: applyTuple, 
    applicativeTuple: applicativeTuple, 
    bindTuple: bindTuple, 
    monadTuple: monadTuple, 
    extendTuple: extendTuple, 
    comonadTuple: comonadTuple, 
    lazyTuple: lazyTuple, 
    lazyLazy1Tuple: lazyLazy1Tuple, 
    lazyLazy2Tuple: lazyLazy2Tuple
};

},{"Control.Comonad":30,"Control.Extend":31,"Control.Lazy":32,"Data.Array":40,"Data.Monoid":47,"Prelude":55}],49:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Control_Monad_Eff = require("Control.Monad.Eff");
function trace(s) {  return function() {    console.log(s);    return {};  };};
var print = function (__dict_Show_0) {
    return function (o) {
        return trace(Prelude.show(__dict_Show_0)(o));
    };
};
module.exports = {
    print: print, 
    trace: trace
};

},{"Control.Monad.Eff":34,"Prelude":55}],50:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Model = require("Model");
var View = require("View");
var Signal = require("Signal");
var intent = function (_9) {
    if (_9 instanceof View.Init) {
        return [  ];
    };
    if (_9 instanceof View.PieceClicked) {
        return [ new Model.TogglePiece(_9.value0) ];
    };
    if (_9 instanceof View.SquareEntered) {
        return [ new Model.TargetDrop(_9.value0, _9.value1) ];
    };
    if (_9 instanceof View.SquareExited) {
        return [ new Model.DiscardDrop(_9.value0, _9.value1) ];
    };
    if (_9 instanceof View.SquareClicked) {
        return [ new Model.Drop(_9.value0, _9.value1) ];
    };
    if (_9 instanceof View.SquareDblClicked) {
        return [ new Model.Remove(_9.value0, _9.value1, _9.value2) ];
    };
    if (_9 instanceof View.HintClicked) {
        return [ Model.Hint.value ];
    };
    if (_9 instanceof View.GiveUpClicked) {
        return [ Model.GiveUp.value ];
    };
    throw new Error("Failed pattern match");
};
module.exports = {
    intent: intent
};

},{"Model":53,"Prelude":55,"Signal":58,"View":59}],51:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Model = require("Model");
var Signal_Channel = require("Signal.Channel");
var Intent = require("Intent");
var Signal = require("Signal");
var View = require("View");
var Control_Monad_Eff = require("Control.Monad.Eff");
var VirtualDOM_VTree = require("VirtualDOM.VTree");
var Signal_Time = require("Signal.Time");
var main = function __do() {
    var _2 = Model.mkBoard(10)(10)(4)();
    var _1 = Signal_Channel.channel(View.Init.value)();
    return (function () {
        var actions = Signal["<~"](Signal.functorSignal)(Intent.intent)(Signal_Channel.subscribe(_1));
        var states = Signal.foldp(Model.processUpdates)(Model.gameInit(_2))(actions);
        var views = Signal["<~"](Signal.functorSignal)(View.puzzlerView(_1))(Signal["distinct'"](states));
        return View.windowOnLoad(View.viewRender(View.puzzlerInit)(views));
    })()();
};
module.exports = {
    main: main
};

},{"Control.Monad.Eff":34,"Intent":50,"Model":53,"Prelude":55,"Signal":58,"Signal.Channel":56,"Signal.Time":57,"View":59,"VirtualDOM.VTree":60}],52:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Data_Array = require("Data.Array");
var Data_Maybe = require("Data.Maybe");
var Data_Maybe_Unsafe = require("Data.Maybe.Unsafe");
var Data_Function = require("Data.Function");
var Data_Foldable = require("Data.Foldable");

  function updateAtImpl(r,c,gIn,gBase) {
    var gNew = gBase.slice();
    for (var i = 0; i < gNew.length; i++) {
        gNew[i] = gBase[i].slice();
    }
    for (var i = 0; i < gIn.length; i++) {
      var rowIn = gIn[i];
      for (var j = 0; j < rowIn.length; j++) {
        var tR = r + i; var tC = j + c;
        if (tR >= 0 && tR < gBase.length && tC >= 0 && tC < gBase[tR].length)
           gNew[tR][tC] = gIn[i][j];
      }
    }
    return gNew;
  };;

  function findIndex$prime(just, nothing, eq, needle, haystack) {
    for (var r = 0; r < haystack.length; r++) {
      colsearch:
      for (var c = 0; c < haystack[r].length; c++) {
        for (var rn = 0; rn < needle.length; rn++) {
          for (var cn = 0; cn < needle[rn].length; cn++) {
            if (! eq(needle[rn][cn])(haystack[r+rn][c+cn])) {
               continue colsearch;
            }
          }
        }
        return just({r:r, c:c});
      }
    }
    return nothing;
  };
var $dot$dot = Data_Array[".."];

/**
 *  Operate element by element across two grids.
 */
var zipWith = function (f) {
    return Data_Array.zipWith(Data_Array.zipWith(f));
};

/**
 *  Insert the contents of a Grid A into another Grid B.  Parts of Grid A will
 *  be cut off if they don't fit in B.
 */
var updateAt = Data_Function.runFn4(updateAtImpl);

/**
 *  Return all Grid elements in groups of rows.
 */
var toArray = Data_Array.concat;

/**
 *  Take leading rows and columns.
 */
var take = function (r) {
    return function (c) {
        return Prelude[">>>"](Prelude.semigroupoidArr)(Data_Array.take(r))(Data_Array.map(Data_Array.take(c)));
    };
};
var singleton = function (a) {
    return [ [ a ] ];
};
var rows = function (a) {
    return Data_Array.length(a);
};
var row = function (r) {
    return function (g) {
        return Data_Maybe.fromMaybe([  ])(Data_Array["!!"](g)(r));
    };
};
var $$null = Prelude[">>>"](Prelude.semigroupoidArr)(Data_Array.length)(Prelude["=="](Prelude.eqNumber)(0));

/**
 *  Maximal row index
 */
var mrow = function (g) {
    return rows(g) - 1;
};
var map = function (f) {
    return Prelude["<$>"](Data_Array.functorArray)(Prelude["<$>"](Data_Array.functorArray)(f));
};

/**
 *  Examine the contents of a single Grid cell.
 */
var lkup = function (r) {
    return function (c) {
        return function (grid) {
            return Data_Maybe.maybe(Data_Maybe.Nothing.value)(Prelude.flip(Data_Array["!!"])(c))(Data_Array["!!"](grid)(r));
        };
    };
};

/**
 *  Flip up/down
 */
var fud = Data_Array.reverse;
var foreach = Prelude.flip(Data_Array.map);
var initWith = function (fn) {
    return function (nr) {
        return function (nc) {
            return foreach($dot$dot(0)(nr - 1))(function (r) {
                return foreach($dot$dot(0)(nc - 1))(function (c) {
                    return fn(r)(c);
                });
            });
        };
    };
};
var init = function (val) {
    return initWith(function (_) {
        return function (__1) {
            return val;
        };
    });
};

/**
 *  Flip left/right
 */
var flr = Data_Array.map(Data_Array.reverse);
var findIndex = function (__dict_Eq_0) {
    return function (_13) {
        return function (_14) {
            if (_13.length === 1 && (_13[0]).length === 0) {
                return Data_Maybe.Nothing.value;
            };
            return findIndex$prime(Data_Maybe.Just.create, Data_Maybe.Nothing.value, Prelude["=="](__dict_Eq_0), _13, _14);
        };
    };
};

/**
 *  Drop leading rows and columns.
 */
var drop = function (r) {
    return function (c) {
        return Prelude[">>>"](Prelude.semigroupoidArr)(Data_Array.drop(r))(Data_Array.map(Data_Array.drop(c)));
    };
};

/**
 *  Take a subsection out of a grid, specifying first and end points to be include
 */
var extract = function (r1) {
    return function (c1) {
        return function (r2) {
            return function (c2) {
                return Prelude[">>>"](Prelude.semigroupoidArr)(drop(r1)(c1))(take((r2 - r1) + 1)((c2 - c1) + 1));
            };
        };
    };
};
var cols = function (_12) {
    if (_12.length === 0) {
        return 0;
    };
    if (_12.length >= 1) {
        var _54 = _12.slice(1);
        return Data_Array.length(_12[0]);
    };
    throw new Error("Failed pattern match");
};

/**
 *  Maximal col index
 */
var mcol = function (g) {
    return cols(g) - 1;
};

/**
 *  Return the smallest Grid containing all elements satisfying a predicate.
 */
var filter = function (f) {
    return function (g) {
        var collect = function (acc) {
            return function (row_1) {
                var p = {
                    "c1'": Data_Array.findIndex(f)(row_1), 
                    "c2'": Data_Array.findLastIndex(f)(row_1)
                };
                var found = p["c1'"] >= 0;
                return {
                    curRow: acc.curRow + 1, 
                    r1: (function () {
                        var _55 = found && acc.curRow < acc.r1;
                        if (_55) {
                            return acc.curRow;
                        };
                        if (!_55) {
                            return acc.r1;
                        };
                        throw new Error("Failed pattern match");
                    })(), 
                    r2: (function () {
                        var _56 = found && acc.curRow > acc.r2;
                        if (_56) {
                            return acc.curRow;
                        };
                        if (!_56) {
                            return acc.r2;
                        };
                        throw new Error("Failed pattern match");
                    })(), 
                    c1: (function () {
                        var _57 = found && p["c1'"] < acc.c1;
                        if (_57) {
                            return p["c1'"];
                        };
                        if (!_57) {
                            return acc.c1;
                        };
                        throw new Error("Failed pattern match");
                    })(), 
                    c2: (function () {
                        var _58 = found && p["c2'"] > acc.c2;
                        if (_58) {
                            return p["c2'"];
                        };
                        if (!_58) {
                            return acc.c2;
                        };
                        throw new Error("Failed pattern match");
                    })()
                };
            };
        };
        var acc = {
            curRow: 0, 
            r1: mrow(g), 
            r2: 0, 
            c1: mcol(g), 
            c2: 0
        };
        return (function (s) {
            return extract(s.r1)(s.c1)(s.r2)(s.c2)(g);
        })(Data_Foldable.foldl(Data_Foldable.foldableArray)(collect)(acc)(g));
    };
};

/**
 *  Rotate counter clockwise
 */
var rccw = function (g) {
    return foreach($dot$dot(mcol(g))(0))(function (c) {
        return foreach(g)(Prelude["<<<"](Prelude.semigroupoidArr)(Data_Maybe_Unsafe.fromJust)(Prelude.flip(Data_Array["!!"])(c)));
    });
};

/**
 *  Rotate clockwise
 */
var rcw = function (g) {
    return foreach($dot$dot(0)(mcol(g)))(function (c) {
        return foreach(fud(g))(Prelude["<<<"](Prelude.semigroupoidArr)(Data_Maybe_Unsafe.fromJust)(Prelude.flip(Data_Array["!!"])(c)));
    });
};
var col = function (c) {
    return function (g) {
        return Data_Array.catMaybes(Data_Array.map(Prelude.flip(Data_Array["!!"])(c))(g));
    };
};
module.exports = {
    findIndex: findIndex, 
    zipWith: zipWith, 
    filter: filter, 
    toArray: toArray, 
    updateAt: updateAt, 
    lkup: lkup, 
    extract: extract, 
    take: take, 
    drop: drop, 
    rccw: rccw, 
    rcw: rcw, 
    flr: flr, 
    fud: fud, 
    mcol: mcol, 
    col: col, 
    cols: cols, 
    mrow: mrow, 
    row: row, 
    rows: rows, 
    map: map, 
    singleton: singleton, 
    "null": $$null, 
    init: init, 
    initWith: initWith
};

},{"Data.Array":40,"Data.Foldable":42,"Data.Function":43,"Data.Maybe":45,"Data.Maybe.Unsafe":44,"Prelude":55}],53:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
var Data_Foldable = require("Data.Foldable");
var Data_Maybe = require("Data.Maybe");
var Data_Array = require("Data.Array");
var Data_Maybe_Unsafe = require("Data.Maybe.Unsafe");
var Model_Grid = require("Model.Grid");
var Control_Monad = require("Control.Monad");
var Control_Monad_Eff = require("Control.Monad.Eff");
var Control_Monad_Eff_Random = require("Control.Monad.Eff.Random");

  var shuffle = function(orig){ 
    return function() {
      var o = orig.slice();
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    };
  }; ;
var P = (function () {
    function P(value0) {
        this.value0 = value0;
    };
    P.create = function (value0) {
        return new P(value0);
    };
    return P;
})();
var Obstacle = (function () {
    function Obstacle() {

    };
    Obstacle.value = new Obstacle();
    return Obstacle;
})();
var Empty = (function () {
    function Empty() {

    };
    Empty.value = new Empty();
    return Empty;
})();
var TogglePiece = (function () {
    function TogglePiece(value0) {
        this.value0 = value0;
    };
    TogglePiece.create = function (value0) {
        return new TogglePiece(value0);
    };
    return TogglePiece;
})();
var TargetDrop = (function () {
    function TargetDrop(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    TargetDrop.create = function (value0) {
        return function (value1) {
            return new TargetDrop(value0, value1);
        };
    };
    return TargetDrop;
})();
var DiscardDrop = (function () {
    function DiscardDrop(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    DiscardDrop.create = function (value0) {
        return function (value1) {
            return new DiscardDrop(value0, value1);
        };
    };
    return DiscardDrop;
})();
var Drop = (function () {
    function Drop(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    Drop.create = function (value0) {
        return function (value1) {
            return new Drop(value0, value1);
        };
    };
    return Drop;
})();
var Remove = (function () {
    function Remove(value0, value1, value2) {
        this.value0 = value0;
        this.value1 = value1;
        this.value2 = value2;
    };
    Remove.create = function (value0) {
        return function (value1) {
            return function (value2) {
                return new Remove(value0, value1, value2);
            };
        };
    };
    return Remove;
})();
var Hint = (function () {
    function Hint() {

    };
    Hint.value = new Hint();
    return Hint;
})();
var GiveUp = (function () {
    function GiveUp() {

    };
    GiveUp.value = new GiveUp();
    return GiveUp;
})();
var DropCandidate = (function () {
    function DropCandidate(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    DropCandidate.create = function (value0) {
        return function (value1) {
            return new DropCandidate(value0, value1);
        };
    };
    return DropCandidate;
})();
var whenJust = function (_14) {
    return function (_15) {
        return function (_16) {
            if (Data_Maybe.isJust(_14)) {
                return _15;
            };
            if (Prelude.otherwise) {
                return _16;
            };
            throw new Error("Failed pattern match");
        };
    };
};

/**
 *  Get the location of a piece on the grid
 */
var targetArea = function (r) {
    return function (c) {
        return function (p) {
            var isEmpty = function (_38) {
                var _50 = Data_Maybe_Unsafe.fromJust(Model_Grid.lkup(_38.r - r)(_38.c - c)(p));
                if (_50 instanceof Empty) {
                    return true;
                };
                return false;
            };
            var coords = Prelude[">>="](Data_Array.bindArray)(Data_Array[".."](r)(r + Model_Grid.mrow(p)))(function (_8) {
                return Prelude[">>="](Data_Array.bindArray)(Data_Array[".."](c)(c + Model_Grid.mcol(p)))(function (_7) {
                    return Prelude["return"](Data_Array.monadArray)({
                        r: _8, 
                        c: _7
                    });
                });
            });
            return Data_Array.filter(Prelude["<<<"](Prelude.semigroupoidArr)(Prelude.not(Prelude.boolLikeBoolean))(isEmpty))(coords);
        };
    };
};
var status = Model_Grid.lkup;
var showSquare = new Prelude.Show(function (_24) {
    if (_24 instanceof P) {
        return "P" + Prelude.show(Prelude.showNumber)(_24.value0);
    };
    if (_24 instanceof Obstacle) {
        return "O";
    };
    if (_24 instanceof Empty) {
        return "E";
    };
    throw new Error("Failed pattern match");
});

/**
 *  Attempt to place a piece on the board, returning updated board if successful.
 */
var place = function (r) {
    return function (c) {
        return function (p) {
            return function (b) {
                
                /**
                 *  Either the piece square or the board square must be empty to be valid
                 *  move
                 *  Otherwise, piece square wins
                 */
                var rowEdge = r + Model_Grid.mrow(p);
                var isValid = function (_30) {
                    return function (_31) {
                        if (_30 instanceof Empty) {
                            return true;
                        };
                        if (_31 instanceof Empty) {
                            return true;
                        };
                        return false;
                    };
                };
                var insertPiece = function (_32) {
                    return function (_33) {
                        if (_32 instanceof Empty) {
                            return _33;
                        };
                        return _32;
                    };
                };
                var colEdge = c + Model_Grid.mcol(p);
                var loc = Model_Grid.extract(r)(c)(rowEdge)(colEdge)(b);
                var loc$prime = Model_Grid.zipWith(insertPiece)(p)(loc);
                var validMove = rowEdge <= Model_Grid.mrow(b) && (colEdge <= Model_Grid.mcol(b) && Prelude["<<<"](Prelude.semigroupoidArr)(Data_Foldable.all(Data_Foldable.foldableArray)(Prelude.id(Prelude.categoryArr)))(Model_Grid.toArray)(Model_Grid.zipWith(isValid)(p)(loc)));
                var _61 = !validMove;
                if (_61) {
                    return Data_Maybe.Nothing.value;
                };
                if (!_61) {
                    return Data_Maybe.Just.create(Model_Grid.updateAt(r)(c)(loc$prime)(b));
                };
                throw new Error("Failed pattern match");
            };
        };
    };
};
var isP = function (_22) {
    if (_22 instanceof P) {
        return true;
    };
    return false;
};
var isOpen = function (r) {
    return function (c) {
        return function (grid) {
            var _64 = Model_Grid.lkup(r)(c)(grid);
            if (_64 instanceof Data_Maybe.Nothing) {
                return false;
            };
            if (_64 instanceof Data_Maybe.Just && _64.value0 instanceof Empty) {
                return true;
            };
            if (_64 instanceof Data_Maybe.Just) {
                return false;
            };
            throw new Error("Failed pattern match");
        };
    };
};
var eqSquare = new Prelude.Eq(function (a) {
    return function (b) {
        return !Prelude["=="](eqSquare)(a)(b);
    };
}, function (_25) {
    return function (_26) {
        if (_25 instanceof P && _26 instanceof P) {
            return _25.value0 === _26.value0;
        };
        if (_25 instanceof Obstacle && _26 instanceof Obstacle) {
            return true;
        };
        if (_25 instanceof Empty && _26 instanceof Empty) {
            return true;
        };
        return false;
    };
});

/**
 *  Build a Piece by taking its shape from the board.
 */
var findPiece = function (p) {
    return function (b) {
        return Model_Grid.map(function (s) {
            var _71 = Prelude["=="](eqSquare)(s)(p);
            if (_71) {
                return p;
            };
            if (!_71) {
                return Empty.value;
            };
            throw new Error("Failed pattern match");
        })(Model_Grid.filter(Prelude["=="](eqSquare)(p))(b));
    };
};
var ordSquare = new Prelude.Ord(function () {
    return eqSquare;
}, function (_27) {
    return function (_28) {
        if (_27 instanceof Empty && _28 instanceof Empty) {
            return Prelude.EQ.value;
        };
        if (_27 instanceof Empty) {
            return Prelude.LT.value;
        };
        if (_27 instanceof P && _28 instanceof P) {
            return Prelude.compare(Prelude.ordNumber)(_27.value0)(_28.value0);
        };
        if (_27 instanceof P && _28 instanceof Empty) {
            return Prelude.GT.value;
        };
        if (_27 instanceof P && _28 instanceof Obstacle) {
            return Prelude.LT.value;
        };
        if (_27 instanceof Obstacle && _28 instanceof Obstacle) {
            return Prelude.EQ.value;
        };
        if (_27 instanceof Obstacle) {
            return Prelude.GT.value;
        };
        throw new Error("Failed pattern match");
    };
});

/**
 *  Search through the board to find all pieces, each represented as its own grid.
 */
var pieces = function (b) {
    var uniquePs = Prelude["<<<"](Prelude.semigroupoidArr)(Data_Array.filter(isP))(Prelude["<<<"](Prelude.semigroupoidArr)(Data_Array.map(Prelude["<<<"](Prelude.semigroupoidArr)(Data_Maybe_Unsafe.fromJust)(Data_Array.head)))(Data_Array["group'"](ordSquare)))(Model_Grid.toArray(b));
    return Prelude.flip(Data_Array.map)(uniquePs)(Prelude.flip(findPiece)(b));
};

/**
 *  Replace all connected P cells with the same ID with Empty cells
 */
var remove = function (r) {
    return function (c) {
        return function (b) {
            var go = function (_34) {
                return function (_35) {
                    return function (_36) {
                        return function (_37) {
                            if (_34 instanceof Data_Maybe.Nothing) {
                                return _37;
                            };
                            if (_34 instanceof Data_Maybe.Just) {
                                var _82 = Model_Grid.lkup(_35)(_36)(_37);
                                if (_82 instanceof Data_Maybe.Nothing) {
                                    return _37;
                                };
                                if (_82 instanceof Data_Maybe.Just && _82.value0 instanceof Empty) {
                                    return _37;
                                };
                                if (_82 instanceof Data_Maybe.Just && _82.value0 instanceof Obstacle) {
                                    return _37;
                                };
                                if (_82 instanceof Data_Maybe.Just) {
                                    var _85 = Prelude["/="](eqSquare)(_82.value0)(_34.value0);
                                    if (_85) {
                                        return _37;
                                    };
                                    if (!_85) {
                                        return go(_34)(_35)(_36 - 1)(go(_34)(_35)(_36 + 1)(go(_34)(_35 - 1)(_36)(go(_34)(_35 + 1)(_36)(Model_Grid.updateAt(_35)(_36)(Model_Grid.singleton(Empty.value))(_37)))));
                                    };
                                    throw new Error("Failed pattern match");
                                };
                                throw new Error("Failed pattern match");
                            };
                            throw new Error("Failed pattern match");
                        };
                    };
                };
            };
            return go(Model_Grid.lkup(r)(c)(b))(r)(c)(b);
        };
    };
};
var updateGame = function (_12) {
    return function (_13) {
        if (_12 instanceof TogglePiece) {
            if (_13.selectedPiece instanceof Data_Maybe.Nothing) {
                var _91 = {};
                for (var _92 in _13) {
                    if (_13.hasOwnProperty(_92)) {
                        _91[_92] = _13[_92];
                    };
                };
                _91.selectedPiece = new Data_Maybe.Just(_12.value0);
                return _91;
            };
            if (_13.selectedPiece instanceof Data_Maybe.Just) {
                if (Prelude["=="](Prelude.eqArray(Prelude.eqArray(eqSquare)))(_12.value0)(_13.selectedPiece.value0)) {
                    var _93 = {};
                    for (var _94 in _13) {
                        if (_13.hasOwnProperty(_94)) {
                            _93[_94] = _13[_94];
                        };
                    };
                    _93.selectedPiece = Data_Maybe.Nothing.value;
                    return _93;
                };
                if (Prelude.otherwise) {
                    var _95 = {};
                    for (var _96 in _13) {
                        if (_13.hasOwnProperty(_96)) {
                            _95[_96] = _13[_96];
                        };
                    };
                    _95.selectedPiece = new Data_Maybe.Just(_12.value0);
                    return _95;
                };
            };
            throw new Error("Failed pattern match");
        };
        if (_12 instanceof TargetDrop) {
            if (_13.selectedPiece instanceof Data_Maybe.Nothing) {
                return _13;
            };
            if (_13.selectedPiece instanceof Data_Maybe.Just) {
                var _100 = {};
                for (var _101 in _13) {
                    if (_13.hasOwnProperty(_101)) {
                        _100[_101] = _13[_101];
                    };
                };
                _100.dropTarget = new DropCandidate(targetArea(_12.value0)(_12.value1)(_13.selectedPiece.value0), Data_Maybe.isJust(place(_12.value0)(_12.value1)(_13.selectedPiece.value0)(_13.board)));
                return _100;
            };
            throw new Error("Failed pattern match");
        };
        if (_12 instanceof DiscardDrop) {
            if (_13.dropTarget.value0.length === 0) {
                return _13;
            };
            var _108 = {};
            for (var _109 in _13) {
                if (_13.hasOwnProperty(_109)) {
                    _108[_109] = _13[_109];
                };
            };
            _108.dropTarget = new DropCandidate([  ], true);
            return _108;
        };
        if (_12 instanceof Drop) {
            var _112 = Prelude[">>="](Data_Maybe.bindMaybe)(_13.selectedPiece)(Prelude.flip(place(_12.value0)(_12.value1))(_13.board));
            if (_112 instanceof Data_Maybe.Nothing) {
                return _13;
            };
            if (_112 instanceof Data_Maybe.Just) {
                var piecesLeft = Data_Array["delete"](Prelude.eqArray(Prelude.eqArray(eqSquare)))(Data_Maybe_Unsafe.fromJust(_13.selectedPiece))(_13.piecesLeft);
                var _114 = {};
                for (var _115 in _13) {
                    if (_13.hasOwnProperty(_115)) {
                        _114[_115] = _13[_115];
                    };
                };
                _114.board = _112.value0;
                _114.selectedPiece = Data_Maybe.Nothing.value;
                _114.piecesLeft = piecesLeft;
                _114.dropTarget = new DropCandidate([  ], true);
                _114.victory = (function () {
                    var _113 = Data_Array.length(piecesLeft) === 0;
                    if (_113) {
                        return new Data_Maybe.Just(true);
                    };
                    if (!_113) {
                        return Data_Maybe.Nothing.value;
                    };
                    throw new Error("Failed pattern match");
                })();
                return _114;
            };
            throw new Error("Failed pattern match");
        };
        if (_12 instanceof Remove) {
            var _119 = {};
            for (var _120 in _13) {
                if (_13.hasOwnProperty(_120)) {
                    _119[_120] = _13[_120];
                };
            };
            _119.board = remove(_12.value0)(_12.value1)(_13.board);
            _119.piecesLeft = Prelude[":"](findPiece(new P(_12.value2))(_13.board))(_13.piecesLeft);
            return _119;
        };
        if (_12 instanceof Hint) {
            if (_13.selectedPiece instanceof Data_Maybe.Nothing) {
                return _13;
            };
            if (_13.selectedPiece instanceof Data_Maybe.Just) {
                var sel = Data_Maybe_Unsafe.fromJust(Data_Foldable.find(Data_Foldable.foldableArray)(isP)(Model_Grid.toArray(_13.selectedPiece.value0)));
                var noObs = function (_23) {
                    if (_23 instanceof Obstacle) {
                        return Empty.value;
                    };
                    if (Prelude["/="](eqSquare)(sel)(_23)) {
                        return Empty.value;
                    };
                    if (Prelude.otherwise) {
                        return _23;
                    };
                    throw new Error("Failed pattern match");
                };
                var newPieces = Data_Array["delete"](Prelude.eqArray(Prelude.eqArray(eqSquare)))(Data_Maybe_Unsafe.fromJust(_13.selectedPiece))(_13.piecesLeft);
                var cleanObs = Model_Grid.map(noObs)(_13.solution);
                var loc = Data_Maybe_Unsafe.fromJust(Model_Grid.findIndex(eqSquare)(_13.selectedPiece.value0)(cleanObs));
                var newBoard = place(loc.r)(loc.c)(_13.selectedPiece.value0)(_13.board);
                if (newBoard instanceof Data_Maybe.Nothing) {
                    return _13;
                };
                if (newBoard instanceof Data_Maybe.Just) {
                    var _127 = {};
                    for (var _128 in _13) {
                        if (_13.hasOwnProperty(_128)) {
                            _127[_128] = _13[_128];
                        };
                    };
                    _127.board = newBoard.value0;
                    _127.piecesLeft = newPieces;
                    _127.dropTarget = new DropCandidate([  ], true);
                    _127.selectedPiece = Data_Maybe.Nothing.value;
                    return _127;
                };
                throw new Error("Failed pattern match");
            };
            throw new Error("Failed pattern match");
        };
        if (_12 instanceof GiveUp) {
            var _131 = {};
            for (var _132 in _13) {
                if (_13.hasOwnProperty(_132)) {
                    _131[_132] = _13[_132];
                };
            };
            _131.board = _13.solution;
            _131.victory = new Data_Maybe.Just(false);
            _131.selectedPiece = Data_Maybe.Nothing.value;
            _131.piecesLeft = [  ];
            return _131;
        };
        throw new Error("Failed pattern match");
    };
};
var processUpdates = Prelude.flip(Data_Foldable.foldl(Data_Foldable.foldableArray)(Prelude.flip(updateGame)));
var directions = [ {
    dr: 0, 
    dc: 1
}, {
    dr: 1, 
    dc: 0
}, {
    dr: 0, 
    dc: -1
}, {
    dr: -1, 
    dc: 0
} ];
var generateAt = function (_17) {
    return function (_18) {
        return function (_19) {
            return function (_20) {
                return function (_21) {
                    if (!isOpen(_17)(_18)(_21)) {
                        return Prelude["return"](Control_Monad_Eff.monadEff)({
                            g: _21, 
                            sCnt: 0
                        });
                    };
                    if (_20 === 0) {
                        return Prelude["return"](Control_Monad_Eff.monadEff)({
                            g: _21, 
                            sCnt: 0
                        });
                    };
                    return function __do() {
                        var _1 = shuffle(directions)();
                        return (function () {
                            var go = function (acc) {
                                return function (d) {
                                    return function __do() {
                                        var _0 = generateAt(_17 + d.dr)(_18 + d.dc)(_19)(_20 - acc.sCnt)(acc.g)();
                                        var _140 = {};
                                        for (var _141 in _0) {
                                            if (_0.hasOwnProperty(_141)) {
                                                _140[_141] = _0[_141];
                                            };
                                        };
                                        _140.sCnt = acc.sCnt + _0.sCnt;
                                        return _140;
                                    };
                                };
                            };
                            return Control_Monad.foldM(Control_Monad_Eff.monadEff)(go)({
                                g: Model_Grid.updateAt(_17)(_18)(Model_Grid.singleton(new P(_19)))(_21), 
                                sCnt: 1
                            })(_1);
                        })()();
                    };
                };
            };
        };
    };
};

/**
 *  Fill a nr x nc grid with connected simple shapes up to maximum length
 */
var mkBoard = function (nr) {
    return function (nc) {
        return function (pieceLength) {
            var g = Model_Grid.init(Empty.value)(nr)(nc);
            var go = function (acc) {
                return function (p) {
                    return function __do() {
                        var _2 = generateAt(p.r)(p.c)(acc.i)(pieceLength)(acc.g)();
                        return {
                            g: _2.g, 
                            i: (function () {
                                var _143 = _2.sCnt === 0;
                                if (_143) {
                                    return acc.i;
                                };
                                if (!_143) {
                                    return acc.i + 1;
                                };
                                throw new Error("Failed pattern match");
                            })(), 
                            incompletes: (function () {
                                var _144 = _2.sCnt > 0 && _2.sCnt < pieceLength;
                                if (_144) {
                                    return Prelude[":"](acc.i)(acc.incompletes);
                                };
                                if (!_144) {
                                    return acc.incompletes;
                                };
                                throw new Error("Failed pattern match");
                            })()
                        };
                    };
                };
            };
            return function __do() {
                var _6 = shuffle(Prelude[">>="](Data_Array.bindArray)(Data_Array[".."](0)(nr - 1))(function (_4) {
                    return Prelude[">>="](Data_Array.bindArray)(Data_Array[".."](0)(nc - 1))(function (_3) {
                        return Prelude["return"](Data_Array.monadArray)({
                            r: _4, 
                            c: _3
                        });
                    });
                }))();
                var _5 = Control_Monad.foldM(Control_Monad_Eff.monadEff)(go)({
                    g: g, 
                    i: 0, 
                    incompletes: [  ]
                })(_6)();
                return (function () {
                    var replacer = function (_29) {
                        if (_29 instanceof P) {
                            var _152 = Data_Array.elemIndex(Prelude.eqNumber)(_29.value0)(_5.incompletes) !== -1;
                            if (_152) {
                                return Obstacle.value;
                            };
                            if (!_152) {
                                return _29;
                            };
                            throw new Error("Failed pattern match");
                        };
                        return _29;
                    };
                    var withObstacles = Model_Grid.map(replacer)(_5.g);
                    return Prelude["return"](Control_Monad_Eff.monadEff)(withObstacles);
                })()();
            };
        };
    };
};

/**
 *  Clear pieces off the board.
 */
var clear = Model_Grid.map(function (p) {
    var _154 = isP(p);
    if (_154) {
        return Empty.value;
    };
    if (!_154) {
        return p;
    };
    throw new Error("Failed pattern match");
});
var gameInit = function (b) {
    return {
        board: clear(b), 
        solution: b, 
        piecesLeft: pieces(b), 
        selectedPiece: Data_Maybe.Nothing.value, 
        dropTarget: new DropCandidate([  ], true), 
        victory: Data_Maybe.Nothing.value
    };
};
module.exports = {
    P: P, 
    Obstacle: Obstacle, 
    Empty: Empty, 
    TogglePiece: TogglePiece, 
    TargetDrop: TargetDrop, 
    DiscardDrop: DiscardDrop, 
    Drop: Drop, 
    Remove: Remove, 
    Hint: Hint, 
    GiveUp: GiveUp, 
    DropCandidate: DropCandidate, 
    targetArea: targetArea, 
    remove: remove, 
    place: place, 
    clear: clear, 
    findPiece: findPiece, 
    pieces: pieces, 
    isP: isP, 
    mkBoard: mkBoard, 
    generateAt: generateAt, 
    status: status, 
    isOpen: isOpen, 
    directions: directions, 
    shuffle: shuffle, 
    whenJust: whenJust, 
    updateGame: updateGame, 
    processUpdates: processUpdates, 
    gameInit: gameInit, 
    showSquare: showSquare, 
    eqSquare: eqSquare, 
    ordSquare: ordSquare
};

},{"Control.Monad":35,"Control.Monad.Eff":34,"Control.Monad.Eff.Random":33,"Data.Array":40,"Data.Foldable":42,"Data.Maybe":45,"Data.Maybe.Unsafe":44,"Model.Grid":52,"Prelude":55}],54:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Prelude = require("Prelude");
function unsafeIndex(xs) {  return function(n) {    return xs[n];  };};
module.exports = {
    unsafeIndex: unsafeIndex
};

},{"Prelude":55}],55:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
function cons(e) {  return function(l) {    return [e].concat(l);  };};
function showStringImpl(s) {  return JSON.stringify(s);};
function showNumberImpl(n) {  return n.toString();};
function showArrayImpl(f) {  return function(xs) {    var ss = [];    for (var i = 0, l = xs.length; i < l; i++) {      ss[i] = f(xs[i]);    }    return '[' + ss.join(',') + ']';  };};
function numAdd(n1) {  return function(n2) {    return n1 + n2;  };};
function numSub(n1) {  return function(n2) {    return n1 - n2;  };};
function numMul(n1) {  return function(n2) {    return n1 * n2;  };};
function numDiv(n1) {  return function(n2) {    return n1 / n2;  };};
function numMod(n1) {  return function(n2) {    return n1 % n2;  };};
function numNegate(n) {  return -n;};
function refEq(r1) {  return function(r2) {    return r1 === r2;  };};
function refIneq(r1) {  return function(r2) {    return r1 !== r2;  };};
function eqArrayImpl(f) {  return function(xs) {    return function(ys) {      if (xs.length !== ys.length) return false;      for (var i = 0; i < xs.length; i++) {        if (!f(xs[i])(ys[i])) return false;      }      return true;    };  };};
function unsafeCompareImpl(lt) {  return function(eq) {    return function(gt) {      return function(x) {        return function(y) {          return x < y ? lt : x > y ? gt : eq;        };      };    };  };};
function numShl(n1) {  return function(n2) {    return n1 << n2;  };};
function numShr(n1) {  return function(n2) {    return n1 >> n2;  };};
function numZshr(n1) {  return function(n2) {    return n1 >>> n2;  };};
function numAnd(n1) {  return function(n2) {    return n1 & n2;  };};
function numOr(n1) {  return function(n2) {    return n1 | n2;  };};
function numXor(n1) {  return function(n2) {    return n1 ^ n2;  };};
function numComplement(n) {  return ~n;};
function boolAnd(b1) {  return function(b2) {    return b1 && b2;  };};
function boolOr(b1) {  return function(b2) {    return b1 || b2;  };};
function boolNot(b) {  return !b;};
function concatString(s1) {  return function(s2) {    return s1 + s2;  };};
var Unit = function (x) {
    return x;
};
var LT = (function () {
    function LT() {

    };
    LT.value = new LT();
    return LT;
})();
var GT = (function () {
    function GT() {

    };
    GT.value = new GT();
    return GT;
})();
var EQ = (function () {
    function EQ() {

    };
    EQ.value = new EQ();
    return EQ;
})();
var Semigroupoid = function ($less$less$less) {
    this["<<<"] = $less$less$less;
};
var Category = function (__superclass_Prelude$dotSemigroupoid_0, id) {
    this["__superclass_Prelude.Semigroupoid_0"] = __superclass_Prelude$dotSemigroupoid_0;
    this.id = id;
};
var Show = function (show) {
    this.show = show;
};
var Functor = function ($less$dollar$greater) {
    this["<$>"] = $less$dollar$greater;
};
var Apply = function ($less$times$greater, __superclass_Prelude$dotFunctor_0) {
    this["<*>"] = $less$times$greater;
    this["__superclass_Prelude.Functor_0"] = __superclass_Prelude$dotFunctor_0;
};
var Applicative = function (__superclass_Prelude$dotApply_0, pure) {
    this["__superclass_Prelude.Apply_0"] = __superclass_Prelude$dotApply_0;
    this.pure = pure;
};
var Bind = function ($greater$greater$eq, __superclass_Prelude$dotApply_0) {
    this[">>="] = $greater$greater$eq;
    this["__superclass_Prelude.Apply_0"] = __superclass_Prelude$dotApply_0;
};
var Monad = function (__superclass_Prelude$dotApplicative_0, __superclass_Prelude$dotBind_1) {
    this["__superclass_Prelude.Applicative_0"] = __superclass_Prelude$dotApplicative_0;
    this["__superclass_Prelude.Bind_1"] = __superclass_Prelude$dotBind_1;
};
var Num = function ($percent, $times, $plus, $minus, $div, negate) {
    this["%"] = $percent;
    this["*"] = $times;
    this["+"] = $plus;
    this["-"] = $minus;
    this["/"] = $div;
    this.negate = negate;
};
var Eq = function ($div$eq, $eq$eq) {
    this["/="] = $div$eq;
    this["=="] = $eq$eq;
};
var Ord = function (__superclass_Prelude$dotEq_0, compare) {
    this["__superclass_Prelude.Eq_0"] = __superclass_Prelude$dotEq_0;
    this.compare = compare;
};
var Bits = function ($dot$amp$dot, $dot$up$dot, $dot$bar$dot, complement, shl, shr, zshr) {
    this[".&."] = $dot$amp$dot;
    this[".^."] = $dot$up$dot;
    this[".|."] = $dot$bar$dot;
    this.complement = complement;
    this.shl = shl;
    this.shr = shr;
    this.zshr = zshr;
};
var BoolLike = function ($amp$amp, not, $bar$bar) {
    this["&&"] = $amp$amp;
    this.not = not;
    this["||"] = $bar$bar;
};
var Semigroup = function ($less$greater) {
    this["<>"] = $less$greater;
};
var $bar$bar = function (dict) {
    return dict["||"];
};
var $greater$greater$eq = function (dict) {
    return dict[">>="];
};
var $eq$eq = function (dict) {
    return dict["=="];
};
var $less$greater = function (dict) {
    return dict["<>"];
};
var $less$less$less = function (dict) {
    return dict["<<<"];
};
var $greater$greater$greater = function (__dict_Semigroupoid_0) {
    return function (f) {
        return function (g) {
            return $less$less$less(__dict_Semigroupoid_0)(g)(f);
        };
    };
};
var $less$times$greater = function (dict) {
    return dict["<*>"];
};
var $less$dollar$greater = function (dict) {
    return dict["<$>"];
};
var $less$hash$greater = function (__dict_Functor_1) {
    return function (fa) {
        return function (f) {
            return $less$dollar$greater(__dict_Functor_1)(f)(fa);
        };
    };
};
var $colon = cons;
var $div$eq = function (dict) {
    return dict["/="];
};
var $div = function (dict) {
    return dict["/"];
};
var $dot$bar$dot = function (dict) {
    return dict[".|."];
};
var $dot$up$dot = function (dict) {
    return dict[".^."];
};
var $dot$amp$dot = function (dict) {
    return dict[".&."];
};
var $minus = function (dict) {
    return dict["-"];
};
var $plus$plus = function (__dict_Semigroup_2) {
    return $less$greater(__dict_Semigroup_2);
};
var $plus = function (dict) {
    return dict["+"];
};
var $times = function (dict) {
    return dict["*"];
};
var $amp$amp = function (dict) {
    return dict["&&"];
};
var $percent = function (dict) {
    return dict["%"];
};
var $dollar = function (f) {
    return function (x) {
        return f(x);
    };
};
var $hash = function (x) {
    return function (f) {
        return f(x);
    };
};
var zshr = function (dict) {
    return dict.zshr;
};
var unsafeCompare = unsafeCompareImpl(LT.value)(EQ.value)(GT.value);
var unit = {};
var shr = function (dict) {
    return dict.shr;
};
var showUnit = new Show(function (_12) {
    return "Unit {}";
});
var showString = new Show(showStringImpl);
var showOrdering = new Show(function (_20) {
    if (_20 instanceof LT) {
        return "LT";
    };
    if (_20 instanceof GT) {
        return "GT";
    };
    if (_20 instanceof EQ) {
        return "EQ";
    };
    throw new Error("Failed pattern match");
});
var showNumber = new Show(showNumberImpl);
var showBoolean = new Show(function (_13) {
    if (_13) {
        return "true";
    };
    if (!_13) {
        return "false";
    };
    throw new Error("Failed pattern match");
});
var show = function (dict) {
    return dict.show;
};
var showArray = function (__dict_Show_3) {
    return new Show(showArrayImpl(show(__dict_Show_3)));
};
var shl = function (dict) {
    return dict.shl;
};
var semigroupoidArr = new Semigroupoid(function (f) {
    return function (g) {
        return function (x) {
            return f(g(x));
        };
    };
});
var semigroupUnit = new Semigroup(function (_27) {
    return function (_28) {
        return {};
    };
});
var semigroupString = new Semigroup(concatString);
var semigroupArr = function (__dict_Semigroup_4) {
    return new Semigroup(function (f) {
        return function (g) {
            return function (x) {
                return $less$greater(__dict_Semigroup_4)(f(x))(g(x));
            };
        };
    });
};
var pure = function (dict) {
    return dict.pure;
};
var $$return = function (__dict_Monad_5) {
    return pure(__dict_Monad_5["__superclass_Prelude.Applicative_0"]());
};
var otherwise = true;
var numNumber = new Num(numMod, numMul, numAdd, numSub, numDiv, numNegate);
var not = function (dict) {
    return dict.not;
};
var negate = function (dict) {
    return dict.negate;
};
var liftM1 = function (__dict_Monad_6) {
    return function (f) {
        return function (a) {
            return $greater$greater$eq(__dict_Monad_6["__superclass_Prelude.Bind_1"]())(a)(function (_0) {
                return $$return(__dict_Monad_6)(f(_0));
            });
        };
    };
};
var liftA1 = function (__dict_Applicative_7) {
    return function (f) {
        return function (a) {
            return $less$times$greater(__dict_Applicative_7["__superclass_Prelude.Apply_0"]())(pure(__dict_Applicative_7)(f))(a);
        };
    };
};
var id = function (dict) {
    return dict.id;
};
var functorArr = new Functor($less$less$less(semigroupoidArr));
var flip = function (f) {
    return function (b) {
        return function (a) {
            return f(a)(b);
        };
    };
};
var eqUnit = new Eq(function (_16) {
    return function (_17) {
        return false;
    };
}, function (_14) {
    return function (_15) {
        return true;
    };
});
var ordUnit = new Ord(function () {
    return eqUnit;
}, function (_21) {
    return function (_22) {
        return EQ.value;
    };
});
var eqString = new Eq(refIneq, refEq);
var ordString = new Ord(function () {
    return eqString;
}, unsafeCompare);
var eqNumber = new Eq(refIneq, refEq);
var ordNumber = new Ord(function () {
    return eqNumber;
}, unsafeCompare);
var eqBoolean = new Eq(refIneq, refEq);
var ordBoolean = new Ord(function () {
    return eqBoolean;
}, function (_23) {
    return function (_24) {
        if (!_23 && !_24) {
            return EQ.value;
        };
        if (!_23 && _24) {
            return LT.value;
        };
        if (_23 && _24) {
            return EQ.value;
        };
        if (_23 && !_24) {
            return GT.value;
        };
        throw new Error("Failed pattern match");
    };
});
var $$const = function (_8) {
    return function (_9) {
        return _8;
    };
};
var $$void = function (__dict_Functor_9) {
    return function (fa) {
        return $less$dollar$greater(__dict_Functor_9)($$const(unit))(fa);
    };
};
var complement = function (dict) {
    return dict.complement;
};
var compare = function (dict) {
    return dict.compare;
};
var $less = function (__dict_Ord_11) {
    return function (a1) {
        return function (a2) {
            var _112 = compare(__dict_Ord_11)(a1)(a2);
            if (_112 instanceof LT) {
                return true;
            };
            return false;
        };
    };
};
var $less$eq = function (__dict_Ord_12) {
    return function (a1) {
        return function (a2) {
            var _113 = compare(__dict_Ord_12)(a1)(a2);
            if (_113 instanceof GT) {
                return false;
            };
            return true;
        };
    };
};
var $greater = function (__dict_Ord_13) {
    return function (a1) {
        return function (a2) {
            var _114 = compare(__dict_Ord_13)(a1)(a2);
            if (_114 instanceof GT) {
                return true;
            };
            return false;
        };
    };
};
var $greater$eq = function (__dict_Ord_14) {
    return function (a1) {
        return function (a2) {
            var _115 = compare(__dict_Ord_14)(a1)(a2);
            if (_115 instanceof LT) {
                return false;
            };
            return true;
        };
    };
};
var categoryArr = new Category(function () {
    return semigroupoidArr;
}, function (x) {
    return x;
});
var boolLikeBoolean = new BoolLike(boolAnd, boolNot, boolOr);
var eqArray = function (__dict_Eq_8) {
    return new Eq(function (xs) {
        return function (ys) {
            return not(boolLikeBoolean)($eq$eq(eqArray(__dict_Eq_8))(xs)(ys));
        };
    }, function (xs) {
        return function (ys) {
            return eqArrayImpl($eq$eq(__dict_Eq_8))(xs)(ys);
        };
    });
};
var ordArray = function (__dict_Ord_10) {
    return new Ord(function () {
        return eqArray(__dict_Ord_10["__superclass_Prelude.Eq_0"]());
    }, function (_25) {
        return function (_26) {
            if (_25.length === 0 && _26.length === 0) {
                return EQ.value;
            };
            if (_25.length === 0) {
                return LT.value;
            };
            if (_26.length === 0) {
                return GT.value;
            };
            if (_25.length >= 1) {
                var _122 = _25.slice(1);
                if (_26.length >= 1) {
                    var _120 = _26.slice(1);
                    var _118 = compare(__dict_Ord_10)(_25[0])(_26[0]);
                    if (_118 instanceof EQ) {
                        return compare(ordArray(__dict_Ord_10))(_122)(_120);
                    };
                    return _118;
                };
            };
            throw new Error("Failed pattern match");
        };
    });
};
var eqOrdering = new Eq(function (x) {
    return function (y) {
        return not(boolLikeBoolean)($eq$eq(eqOrdering)(x)(y));
    };
}, function (_18) {
    return function (_19) {
        if (_18 instanceof LT && _19 instanceof LT) {
            return true;
        };
        if (_18 instanceof GT && _19 instanceof GT) {
            return true;
        };
        if (_18 instanceof EQ && _19 instanceof EQ) {
            return true;
        };
        return false;
    };
});
var bitsNumber = new Bits(numAnd, numXor, numOr, numComplement, numShl, numShr, numZshr);
var asTypeOf = function (_10) {
    return function (_11) {
        return _10;
    };
};
var applyArr = new Apply(function (f) {
    return function (g) {
        return function (x) {
            return f(x)(g(x));
        };
    };
}, function () {
    return functorArr;
});
var bindArr = new Bind(function (m) {
    return function (f) {
        return function (x) {
            return f(m(x))(x);
        };
    };
}, function () {
    return applyArr;
});
var applicativeArr = new Applicative(function () {
    return applyArr;
}, $$const);
var monadArr = new Monad(function () {
    return applicativeArr;
}, function () {
    return bindArr;
});
var ap = function (__dict_Monad_15) {
    return function (f) {
        return function (a) {
            return $greater$greater$eq(__dict_Monad_15["__superclass_Prelude.Bind_1"]())(f)(function (_2) {
                return $greater$greater$eq(__dict_Monad_15["__superclass_Prelude.Bind_1"]())(a)(function (_1) {
                    return $$return(__dict_Monad_15)(_2(_1));
                });
            });
        };
    };
};
module.exports = {
    Unit: Unit, 
    LT: LT, 
    GT: GT, 
    EQ: EQ, 
    Semigroup: Semigroup, 
    BoolLike: BoolLike, 
    Bits: Bits, 
    Ord: Ord, 
    Eq: Eq, 
    Num: Num, 
    Monad: Monad, 
    Bind: Bind, 
    Applicative: Applicative, 
    Apply: Apply, 
    Functor: Functor, 
    Show: Show, 
    Category: Category, 
    Semigroupoid: Semigroupoid, 
    unit: unit, 
    "++": $plus$plus, 
    "<>": $less$greater, 
    not: not, 
    "||": $bar$bar, 
    "&&": $amp$amp, 
    complement: complement, 
    zshr: zshr, 
    shr: shr, 
    shl: shl, 
    ".^.": $dot$up$dot, 
    ".|.": $dot$bar$dot, 
    ".&.": $dot$amp$dot, 
    ">=": $greater$eq, 
    "<=": $less$eq, 
    ">": $greater, 
    "<": $less, 
    compare: compare, 
    refIneq: refIneq, 
    refEq: refEq, 
    "/=": $div$eq, 
    "==": $eq$eq, 
    negate: negate, 
    "%": $percent, 
    "/": $div, 
    "*": $times, 
    "-": $minus, 
    "+": $plus, 
    ap: ap, 
    liftM1: liftM1, 
    "return": $$return, 
    ">>=": $greater$greater$eq, 
    liftA1: liftA1, 
    pure: pure, 
    "<*>": $less$times$greater, 
    "void": $$void, 
    "<#>": $less$hash$greater, 
    "<$>": $less$dollar$greater, 
    show: show, 
    cons: cons, 
    ":": $colon, 
    "#": $hash, 
    "$": $dollar, 
    id: id, 
    ">>>": $greater$greater$greater, 
    "<<<": $less$less$less, 
    asTypeOf: asTypeOf, 
    "const": $$const, 
    flip: flip, 
    otherwise: otherwise, 
    semigroupoidArr: semigroupoidArr, 
    categoryArr: categoryArr, 
    showUnit: showUnit, 
    showString: showString, 
    showBoolean: showBoolean, 
    showNumber: showNumber, 
    showArray: showArray, 
    functorArr: functorArr, 
    applyArr: applyArr, 
    applicativeArr: applicativeArr, 
    bindArr: bindArr, 
    monadArr: monadArr, 
    numNumber: numNumber, 
    eqUnit: eqUnit, 
    eqString: eqString, 
    eqNumber: eqNumber, 
    eqBoolean: eqBoolean, 
    eqArray: eqArray, 
    eqOrdering: eqOrdering, 
    showOrdering: showOrdering, 
    ordUnit: ordUnit, 
    ordBoolean: ordBoolean, 
    ordNumber: ordNumber, 
    ordString: ordString, 
    ordArray: ordArray, 
    bitsNumber: bitsNumber, 
    boolLikeBoolean: boolLikeBoolean, 
    semigroupUnit: semigroupUnit, 
    semigroupString: semigroupString, 
    semigroupArr: semigroupArr
};

},{}],56:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Data_Function = require("Data.Function");
var Signal = require("Signal");
var Prelude = require("Prelude");
var Control_Monad_Eff = require("Control.Monad.Eff");

  function channelP(constant, v) {
    return function() {
      return constant(v);
    };
  };

  function sendP(chan, v) {
    return function() {
      chan.set(v);
    };
  };

  function subscribe(chan) {
    return chan;
  };
var send = Data_Function.runFn2(sendP);
var channel = Data_Function.runFn2(channelP)(Signal.constant);
module.exports = {
    subscribe: subscribe, 
    send: send, 
    channel: channel
};

},{"Control.Monad.Eff":34,"Data.Function":43,"Prelude":55,"Signal":58}],57:[function(require,module,exports){
(function (process){
// Generated by psc-make version 0.6.3
"use strict";
var Data_Function = require("Data.Function");
var Signal = require("Signal");
var Prelude = require("Prelude");
var Control_Monad_Eff = require("Control.Monad.Eff");
var Control_Timer = require("Control.Timer");

  function everyP(constant, now, t) {
    var out = constant(now());
    setInterval(function() {
      out.set(now());
    }, t);
    return out;
  };

  function now() {
    var perf = typeof performance !== 'undefined' ? performance : null;
    return (
      perf && (perf.now || perf.webkitNow || perf.msNow || perf.oNow || perf.mozNow) ||
      (process && process.hrtime && function() {
        var t = process.hrtime();
        return (t[0] * 1e9 + t[1]) / 1e6;
      }) ||
      Date.now
    ).call(perf);
  };
var second = 1000;
var millisecond = 1;
var every = Data_Function.runFn3(everyP)(Signal.constant)(now);
module.exports = {
    second: second, 
    now: now, 
    millisecond: millisecond, 
    every: every
};

}).call(this,require('_process'))
},{"Control.Monad.Eff":34,"Control.Timer":38,"Data.Function":43,"Prelude":55,"Signal":58,"_process":2}],58:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Data_Function = require("Data.Function");
var Prelude = require("Prelude");
var Control_Monad_Eff = require("Control.Monad.Eff");

  function constant(initial) {
    var subs = [];
    var val = initial;
    var sig = {
      subscribe: function(sub) {
        subs.push(sub);
        sub(val);
      },
      get: function() { return val; },
      set: function(newval) {
        val = newval;
        subs.forEach(function(sub) { sub(newval); });
      }
    };
    return sig;
  };

  function mapP(constant, fun, sig) {
    var out = constant(fun(sig.get()));
    sig.subscribe(function(val) { out.set(fun(val)); });
    return out;
  };

  function applySigP(constant, fun, sig) {
    var out = constant(fun.get()(sig.get()));
    var produce = function() { out.set(fun.get()(sig.get())); };
    fun.subscribe(produce);
    sig.subscribe(produce);
    return out;
  };

  function mergeP(constant, sig1, sig2) {
    var out = constant(sig1.get());
    sig1.subscribe(out.set);
    sig2.subscribe(out.set);
    return out;
  };

  function foldpP(constant, fun, seed, sig) {
    var acc = seed;
    var out = constant(acc);
    sig.subscribe(function(val) {
      acc = fun(val)(acc);
      out.set(acc);
    });
    return out;
  };

  function sampleOnP(constant, sig1, sig2) {
    var out = constant(sig2.get());
    sig1.subscribe(function() {
      out.set(sig2.get());
    });
    return out;
  };

  function distinctP(eq) {
  return function(constant) {
  return function(sig) {
    var val = sig.get();
    var out = constant(val);
    sig.subscribe(function(newval) {
      if (eq['/='](val)(newval)) {
        val = newval;
        out.set(val);
      }
    });
    return out;
  };};};

  function distinctRefP(constant, sig) {
    var val = sig.get();
    var out = constant(val);
    sig.subscribe(function(newval) {
      if (val !== newval) {
        val = newval;
        out.set(val);
      }
    });
    return out;
  };

  function zipP(constant, f, sig1, sig2) {
    var val1 = sig1.get(), val2 = sig2.get();
    var out = constant(f(val1)(val2));
    sig1.subscribe(function(v) {
      val1 = v;
      out.set(f(val1)(val2));
    });
    sig2.subscribe(function(v) {
      val2 = v;
      out.set(f(val1)(val2));
    });
    return out;
  };

  function runSignal(sig) {
    return function() {
      sig.subscribe(function(val) {
        val();
      });
      return {};
    };
  };

  function unwrapP(constant, sig) {
    return function() {
      var out = constant(sig.get()());
      sig.subscribe(function(val) { out.set(val()); });
      return out;
    };
  };

  function keepIfP(constant, fn, seed, sig) {
    var out = constant(fn(sig.get()) ? sig.get() : seed);
    sig.subscribe(function(val) { if (fn(val)) out.set(val); });
    return out;
  };
var $tilde$greater = function (__dict_Functor_0) {
    return Prelude.flip(Prelude["<$>"](__dict_Functor_0));
};
var $tilde = function (__dict_Apply_1) {
    return Prelude["<*>"](__dict_Apply_1);
};
var $less$tilde = function (__dict_Functor_2) {
    return Prelude["<$>"](__dict_Functor_2);
};
var zip = function (f) {
    return function (a) {
        return function (b) {
            return zipP(constant, f, a, b);
        };
    };
};
var unwrap = Data_Function.runFn2(unwrapP)(constant);
var sampleOn = Data_Function.runFn3(sampleOnP)(constant);
var merge = Data_Function.runFn3(mergeP)(constant);
var semigroupSignal = new Prelude.Semigroup(merge);
var map = Data_Function.runFn3(mapP)(constant);
var keepIf = Data_Function.runFn4(keepIfP)(constant);
var functorSignal = new Prelude.Functor(map);
var foldp = Data_Function.runFn4(foldpP)(constant);
var distinct$prime = Data_Function.runFn2(distinctRefP)(constant);
var distinct = function (__dict_Eq_3) {
    return distinctP(__dict_Eq_3)(constant);
};
var applySig = Data_Function.runFn3(applySigP)(constant);
var applySignal = new Prelude.Apply(applySig, function () {
    return functorSignal;
});
var map2 = function (f) {
    return function (a) {
        return function (b) {
            return $tilde(applySignal)($less$tilde(functorSignal)(f)(a))(b);
        };
    };
};
var map3 = function (f) {
    return function (a) {
        return function (b) {
            return function (c) {
                return $tilde(applySignal)($tilde(applySignal)($less$tilde(functorSignal)(f)(a))(b))(c);
            };
        };
    };
};
var map4 = function (f) {
    return function (a) {
        return function (b) {
            return function (c) {
                return function (d) {
                    return $tilde(applySignal)($tilde(applySignal)($tilde(applySignal)($less$tilde(functorSignal)(f)(a))(b))(c))(d);
                };
            };
        };
    };
};
var map5 = function (f) {
    return function (a) {
        return function (b) {
            return function (c) {
                return function (d) {
                    return function (e) {
                        return $tilde(applySignal)($tilde(applySignal)($tilde(applySignal)($tilde(applySignal)($less$tilde(functorSignal)(f)(a))(b))(c))(d))(e);
                    };
                };
            };
        };
    };
};
var applicativeSignal = new Prelude.Applicative(function () {
    return applySignal;
}, constant);
module.exports = {
    "~": $tilde, 
    "~>": $tilde$greater, 
    "<~": $less$tilde, 
    keepIf: keepIf, 
    unwrap: unwrap, 
    runSignal: runSignal, 
    zip: zip, 
    "distinct'": distinct$prime, 
    distinct: distinct, 
    sampleOn: sampleOn, 
    foldp: foldp, 
    merge: merge, 
    applySig: applySig, 
    map: map, 
    constant: constant, 
    functorSignal: functorSignal, 
    applySignal: applySignal, 
    applicativeSignal: applicativeSignal, 
    semigroupSignal: semigroupSignal
};

},{"Control.Monad.Eff":34,"Data.Function":43,"Prelude":55}],59:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Data_Function = require("Data.Function");
var Signal = require("Signal");
var VirtualDOM = require("VirtualDOM");
var Prelude = require("Prelude");
var VirtualDOM_VTree = require("VirtualDOM.VTree");
var Data_Array = require("Data.Array");
var Model = require("Model");
var Data_Maybe_Unsafe = require("Data.Maybe.Unsafe");
var Data_Foldable = require("Data.Foldable");
var Signal_Channel = require("Signal.Channel");
var Model_Grid = require("Model.Grid");
var Data_Maybe = require("Data.Maybe");
var Control_Monad_Eff = require("Control.Monad.Eff");
var DOM = require("DOM");
var Signal_Time = require("Signal.Time");
var Debug_Trace = require("Debug.Trace");

  function windowOnLoad(callback) {
    return function() {
      window.onload = function() {
        callback();
      };
    };
  }
;

  function bodyAppend(node) {
    return function() {
      document.body.appendChild(node);;
    };
  }
;

  function foldpEP (constant, upd, seed, sig) {
    return function () {
      var acc = seed;
      var out = constant(acc);
      sig.subscribe(function(val) {
        acc = upd(val)(acc)();
        out.set(acc);
      });
      return out;
    };
  };

    var undef = undefined;
   ;

    var def = "";
  ;

  function mkCallback (act) {
    return function (event) {
      act(event)();
    };
  } ;

  function dataTransfer (format) {
    return function (data) {
      return function (event) {
        return function() {
          event.dataTransfer.setData(format, data);
        };
      };
    };
  } ;

  function listen (l) {
    return function (node, prop) {
      node.addEventListener(l.event, l.callback);
    };
  };;

  function ignore (l) {
    return function (node, prop) {
      node.removeEventListener(l.event, l.callback);
    };
  };
var Init = (function () {
    function Init() {

    };
    Init.value = new Init();
    return Init;
})();
var PieceClicked = (function () {
    function PieceClicked(value0) {
        this.value0 = value0;
    };
    PieceClicked.create = function (value0) {
        return new PieceClicked(value0);
    };
    return PieceClicked;
})();
var SquareEntered = (function () {
    function SquareEntered(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    SquareEntered.create = function (value0) {
        return function (value1) {
            return new SquareEntered(value0, value1);
        };
    };
    return SquareEntered;
})();
var SquareExited = (function () {
    function SquareExited(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    SquareExited.create = function (value0) {
        return function (value1) {
            return new SquareExited(value0, value1);
        };
    };
    return SquareExited;
})();
var SquareClicked = (function () {
    function SquareClicked(value0, value1) {
        this.value0 = value0;
        this.value1 = value1;
    };
    SquareClicked.create = function (value0) {
        return function (value1) {
            return new SquareClicked(value0, value1);
        };
    };
    return SquareClicked;
})();
var SquareDblClicked = (function () {
    function SquareDblClicked(value0, value1, value2) {
        this.value0 = value0;
        this.value1 = value1;
        this.value2 = value2;
    };
    SquareDblClicked.create = function (value0) {
        return function (value1) {
            return function (value2) {
                return new SquareDblClicked(value0, value1, value2);
            };
        };
    };
    return SquareDblClicked;
})();
var HintClicked = (function () {
    function HintClicked() {

    };
    HintClicked.value = new HintClicked();
    return HintClicked;
})();
var GiveUpClicked = (function () {
    function GiveUpClicked() {

    };
    GiveUpClicked.value = new GiveUpClicked();
    return GiveUpClicked;
})();
var viewInstructions = VirtualDOM_VTree.vnode("div")({
    id: "instructions"
})([ VirtualDOM_VTree.vnode("p")({})([ VirtualDOM_VTree.vtext("Place the pieces on the board to solve the puzzle!") ]), VirtualDOM_VTree.vnode("p")({})([ VirtualDOM_VTree.vtext("Click: Select/place piece.") ]), VirtualDOM_VTree.vnode("p")({})([ VirtualDOM_VTree.vtext("Double click: Remove piece from board.") ]), VirtualDOM_VTree.vnode("p")({})([ VirtualDOM_VTree.vtext("Hint: Place the selected block in correct location if available.") ]), VirtualDOM_VTree.vnode("p")({})([ VirtualDOM_VTree.vtext("Give up: Show a solution.") ]) ]);
var svgn = "http://www.w3.org/2000/svg";
var svgGrid = function (nr) {
    return function (nc) {
        return function (cellFun) {
            var mkRow = function (rNum) {
                return Prelude.flip(Data_Array.map)(Data_Array[".."](0)(nc - 1))(cellFun(20)(rNum));
            };
            return VirtualDOM_VTree.vnode("svg")({
                namespace: svgn, 
                attributes: {
                    width: nc * 20, 
                    height: nr * 20
                }
            })(Prelude["<<<"](Prelude.semigroupoidArr)(Data_Array.catMaybes)(Data_Array.concat)(Prelude.flip(Data_Array.map)(Data_Array[".."](0)(nr - 1))(mkRow)));
        };
    };
};
var puzzlerInit = VirtualDOM_VTree.vtext("Loading...");
var listener = function (s) {
    return function (a) {
        return {
            event: s, 
            callback: mkCallback(a)
        };
    };
};
var hook = function (s) {
    return function (act) {
        var l = listener(s)(act);
        return VirtualDOM_VTree.vhook({
            hook: listen(l), 
            unhook: ignore(l)
        });
    };
};
var viewButtons = function (chan) {
    return function (mSel) {
        return VirtualDOM_VTree.vnode("div")({
            id: "buttons"
        })([ VirtualDOM_VTree.vnode("button")({
            attributes: {
                disabled: (function () {
                    var _10 = Data_Maybe.isNothing(mSel);
                    if (_10) {
                        return def;
                    };
                    if (!_10) {
                        return undef;
                    };
                    throw new Error("Failed pattern match");
                })()
            }, 
            click: hook("click")(Prelude["const"](Signal_Channel.send(chan)(HintClicked.value)))
        })([ VirtualDOM_VTree.vtext("Hint") ]), VirtualDOM_VTree.vnode("button")({
            click: hook("click")(Prelude["const"](Signal_Channel.send(chan)(GiveUpClicked.value)))
        })([ VirtualDOM_VTree.vtext("Give up") ]) ]);
    };
};
var foldpE = Data_Function.runFn4(foldpEP)(Signal.constant);
var viewRender = function (init) {
    return function (svt) {
        var n = VirtualDOM.createElement(init);
        var updateDOM = function (_7) {
            return function (_8) {
                return function __do() {
                    var _0 = VirtualDOM.patch(VirtualDOM.diff(_8.t)(_7))(_8.n)();
                    return {
                        n: _0, 
                        t: _7
                    };
                };
            };
        };
        return function __do() {
            bodyAppend(n)();
            return Prelude["void"](Control_Monad_Eff.functorEff)(foldpE(updateDOM)({
                n: n, 
                t: init
            })(svt))();
        };
    };
};
var colorMap = function (n) {
    var colors = [ "red", "blue", "green", "orange", "yellow", "magenta", "cyan", "gray" ];
    return Data_Maybe_Unsafe.fromJust(Data_Array["!!"](colors)(n % Data_Array.length(colors)));
};
var viewBoard = function (_4) {
    return function (_5) {
        return function (_6) {
            var inTarget = function (r) {
                return function (c) {
                    return Data_Foldable.any(Data_Foldable.foldableArray)(function (_3) {
                        return r === _3.r && c === _3.c;
                    })(_5.value0);
                };
            };
            var mkAttr = function (s) {
                return function (r) {
                    return function (c) {
                        return function (clss) {
                            return {
                                x: c * s, 
                                y: r * s, 
                                width: s, 
                                height: s, 
                                "class": (function () {
                                    var _22 = inTarget(r)(c);
                                    if (_22) {
                                        return clss + (function () {
                                            if (_5.value1) {
                                                return " valid";
                                            };
                                            if (!_5.value1) {
                                                return " invalid";
                                            };
                                            throw new Error("Failed pattern match");
                                        })();
                                    };
                                    if (!_22) {
                                        return clss;
                                    };
                                    throw new Error("Failed pattern match");
                                })()
                            };
                        };
                    };
                };
            };
            var getCell = function (r) {
                return function (c) {
                    return Data_Maybe_Unsafe.fromJust(Model.status(r)(c)(_6));
                };
            };
            var exitHook = function (r) {
                return function (c) {
                    return hook("mouseleave")(Prelude["const"](Signal_Channel.send(_4)(new SquareExited(r, c))));
                };
            };
            var enterHook = function (r) {
                return function (c) {
                    return hook("mouseenter")(Prelude["const"](Signal_Channel.send(_4)(new SquareEntered(r, c))));
                };
            };
            var clickHook = function (r) {
                return function (c) {
                    return hook("click")(Prelude["const"](Signal_Channel.send(_4)(new SquareClicked(r, c))));
                };
            };
            var boardCell = function (s) {
                return function (r) {
                    return function (c) {
                        var _24 = getCell(r)(c);
                        if (_24 instanceof Model.Empty) {
                            return Data_Maybe.Just.create(VirtualDOM_VTree.vnode("rect")({
                                attributes: mkAttr(s)(r)(c)("empty"), 
                                namespace: svgn, 
                                enter: enterHook(r)(c), 
                                exit: exitHook(r)(c), 
                                click: clickHook(r)(c)
                            })([  ]));
                        };
                        if (_24 instanceof Model.Obstacle) {
                            return Data_Maybe.Just.create(VirtualDOM_VTree.vnode("rect")({
                                attributes: mkAttr(s)(r)(c)("obstacle"), 
                                namespace: svgn, 
                                enter: enterHook(r)(c), 
                                exit: exitHook(r)(c), 
                                click: clickHook(r)(c)
                            })([  ]));
                        };
                        if (_24 instanceof Model.P) {
                            return Data_Maybe.Just.create(VirtualDOM_VTree.vnode("rect")({
                                attributes: {
                                    x: c * s, 
                                    y: r * s, 
                                    width: s, 
                                    height: s, 
                                    fill: colorMap(_24.value0), 
                                    "class": "psquare"
                                }, 
                                enter: enterHook(r)(c), 
                                exit: exitHook(r)(c), 
                                click: clickHook(r)(c), 
                                namespace: svgn, 
                                dblclick: hook("dblclick")(Prelude["const"](Signal_Channel.send(_4)(new SquareDblClicked(r, c, _24.value0))))
                            })([  ]));
                        };
                        throw new Error("Failed pattern match");
                    };
                };
            };
            return VirtualDOM_VTree.vnode("div")({
                id: "board"
            })([ svgGrid(Model_Grid.rows(_6))(Model_Grid.cols(_6))(boardCell) ]);
        };
    };
};
var viewPieces = function (chan) {
    return function (mSel) {
        return function (ps) {
            var getCell = function (r) {
                return function (c) {
                    return function (p) {
                        return Data_Maybe_Unsafe.fromJust(Model.status(r)(c)(p));
                    };
                };
            };
            var pieceCell = function (p) {
                return function (s) {
                    return function (r) {
                        return function (c) {
                            var _28 = getCell(r)(c)(p);
                            if (_28 instanceof Model.Empty) {
                                return Data_Maybe.Nothing.value;
                            };
                            if (_28 instanceof Model.Obstacle) {
                                return Data_Maybe.Nothing.value;
                            };
                            if (_28 instanceof Model.P) {
                                return Data_Maybe.Just.create(VirtualDOM_VTree.vnode("rect")({
                                    attributes: {
                                        x: c * s, 
                                        y: r * s, 
                                        width: s, 
                                        height: s, 
                                        fill: colorMap(_28.value0), 
                                        "class": "psquare"
                                    }, 
                                    namespace: svgn
                                })([  ]));
                            };
                            throw new Error("Failed pattern match");
                        };
                    };
                };
            };
            var pieces = Data_Array.map(function (p) {
                return VirtualDOM_VTree.vnode("div")({
                    attributes: {
                        "class": (function () {
                            var _30 = Prelude["=="](Data_Maybe.eqMaybe(Prelude.eqArray(Prelude.eqArray(Model.eqSquare))))(new Data_Maybe.Just(p))(mSel);
                            if (_30) {
                                return "piece selected";
                            };
                            if (!_30) {
                                return "piece";
                            };
                            throw new Error("Failed pattern match");
                        })()
                    }, 
                    clicked: hook("click")(Prelude["const"](Signal_Channel.send(chan)(new PieceClicked(p))))
                })([ svgGrid(Model_Grid.rows(p))(Model_Grid.cols(p))(pieceCell(p)) ]);
            })(ps);
            return VirtualDOM_VTree.vnode("div")({
                id: "pieces-area"
            })([ VirtualDOM_VTree.vnode("div")({
                attributes: {
                    "class": "header"
                }
            })([ VirtualDOM_VTree.vtext("Pieces (" + (Prelude.show(Prelude.showNumber)(Data_Array.length(ps)) + ")")) ]), VirtualDOM_VTree.vnode("div")({
                id: "pieces"
            })(pieces) ]);
        };
    };
};
var puzzlerView = function (chan) {
    return function (gs) {
        return VirtualDOM_VTree.vnode("div")({
            id: "view"
        })([ VirtualDOM_VTree.vnode("div")({
            attributes: {
                "class": "header"
            }, 
            id: "title"
        })([ (function () {
            if (gs.victory instanceof Data_Maybe.Nothing) {
                return VirtualDOM_VTree.vtext("Purescript Puzzler!");
            };
            if (gs.victory instanceof Data_Maybe.Just && gs.victory.value0) {
                return VirtualDOM_VTree.vtext("You win!!!!!!");
            };
            if (gs.victory instanceof Data_Maybe.Just && !gs.victory.value0) {
                return VirtualDOM_VTree.vtext("You looooose.... :'(");
            };
            throw new Error("Failed pattern match");
        })() ]), viewBoard(chan)(gs.dropTarget)(gs.board), viewPieces(chan)(gs.selectedPiece)(gs.piecesLeft), viewInstructions, viewButtons(chan)(gs.selectedPiece) ]);
    };
};
module.exports = {
    Init: Init, 
    PieceClicked: PieceClicked, 
    SquareEntered: SquareEntered, 
    SquareExited: SquareExited, 
    SquareClicked: SquareClicked, 
    SquareDblClicked: SquareDblClicked, 
    HintClicked: HintClicked, 
    GiveUpClicked: GiveUpClicked, 
    puzzlerInit: puzzlerInit, 
    windowOnLoad: windowOnLoad, 
    viewRender: viewRender, 
    puzzlerView: puzzlerView
};

},{"Control.Monad.Eff":34,"DOM":39,"Data.Array":40,"Data.Foldable":42,"Data.Function":43,"Data.Maybe":45,"Data.Maybe.Unsafe":44,"Debug.Trace":49,"Model":53,"Model.Grid":52,"Prelude":55,"Signal":58,"Signal.Channel":56,"Signal.Time":57,"VirtualDOM":61,"VirtualDOM.VTree":60}],60:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Data_Function = require("Data.Function");
var Prelude = require("Prelude");
var Data_Maybe = require("Data.Maybe");
var showVTreeImpl = JSON.stringify;;

  var vnode$prime = (function() {
    var VNode = require('virtual-dom/vnode/vnode');
   
    return function (name, props, children) {
      var key = undefined;
      var ns = undefined;

      if(props.namespace) {
        ns = props.namespace;
        props.namespace = undefined;
      }

      if(props.key) {
        key = props.key;
        props.key = undefined;
      }

      return new VNode(name, props, children, key, ns);
    };
  }());
  ;

  var vtext = (function() {
    var VText = require('virtual-dom/vnode/vtext');
    return function (text) {
      return new VText(text);
    };
  }());
  ;

  var widget = (function() { 
    return function (props) {
      var rWidget = { type: 'Widget'};
       
      if(props.init)    { rWidget.init    = props.init };
      if(props.update)  { rWidget.update  = props.update }; 
      if(props.destroy) { rWidget.destroy = props.destroy };

      return rWidget;
    };
  }());
  ;

  var thunk$prime  = (function() { 
    return function (renderFn, nothing, just) {
      var rThunk  = { type: 'Thunk'
                    , render: function(prevNode) { 
                                if (prevNode === null)
                                  return renderFn(nothing);
                                else
                                  return renderFn(just(prevNode));
                              }
                    };
      // No need for vnode here.  It is used internally by virtual-dom to cache
      // the result of render.
      return rThunk;
    };
  }());
  ;

  var vhook  = (function() { 
    return function (props) {
      var rVHook  = function () { };
      if(props.hook)   { rVHook.prototype.hook    = props.hook };
      if(props.unhook) { rVHook.prototype.unhook  = props.unhook }; 
      return new rVHook;
    };
  }());
  ;
var showVHookImpl = JSON.stringify;;
var vnode = function (name) {
    return function (props) {
        return function (children) {
            return vnode$prime(name, props, children);
        };
    };
};

/**
 *  Render a VTree using custom logic function.  The logic can examine the 
 *  previous VTree before returning the new (or same) one.  The result of the 
 *  render function must be a vnode, vtext, or widget.  This constraint is not
 *  enforced by the types.
 */
var thunk = function (render) {
    return thunk$prime(render, Data_Maybe.Nothing.value, Data_Maybe.Just.create);
};
var showVTree = new Prelude.Show(showVTreeImpl);
var showVHook = new Prelude.Show(showVHookImpl);
module.exports = {
    vhook: vhook, 
    thunk: thunk, 
    widget: widget, 
    vtext: vtext, 
    vnode: vnode, 
    showVTree: showVTree, 
    showVHook: showVHook
};

},{"Data.Function":43,"Data.Maybe":45,"Prelude":55,"virtual-dom/vnode/vnode":22,"virtual-dom/vnode/vtext":24}],61:[function(require,module,exports){
// Generated by psc-make version 0.6.3
"use strict";
var Data_Function = require("Data.Function");
var Prelude = require("Prelude");
var Control_Monad_Eff = require("Control.Monad.Eff");
var DOM = require("DOM");
var VirtualDOM_VTree = require("VirtualDOM.VTree");
var showPatchObjectImpl = JSON.stringify;;
var createElement = require('virtual-dom/create-element');;
var diff$prime = require('virtual-dom/diff');;
var patch$prime = require('virtual-dom/patch');;

  function mkEff(action) {
    return action;
  }
  ;
var showPatchObject = new Prelude.Show(showPatchObjectImpl);
var patch = function (p) {
    return function (n) {
        return mkEff(function (_) {
            return patch$prime(n, p);
        });
    };
};
var diff = Data_Function.runFn2(diff$prime);
module.exports = {
    patch: patch, 
    diff: diff, 
    createElement: createElement, 
    showPatchObject: showPatchObject
};

},{"Control.Monad.Eff":34,"DOM":39,"Data.Function":43,"Prelude":55,"VirtualDOM.VTree":60,"virtual-dom/create-element":3,"virtual-dom/diff":4,"virtual-dom/patch":8}],62:[function(require,module,exports){
require('Main').main();

},{"Main":51}]},{},[62]);
