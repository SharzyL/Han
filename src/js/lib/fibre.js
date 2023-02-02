/*!
 * Fibre.js v0.2.1 | MIT License | github.com/ethantw/fibre.js
 * Based on findAndReplaceDOMText
 */

import { DOMFinder, NON_INLINE_PROSE, PRESETS } from "./findAndReplaceDomText";

const VERSION = '0.2.1'
const AVOID_NON_PROSE = PRESETS.prose.filterElements

export class Fibre {
  version = VERSION
  finder = []
  context = undefined
  portionMode = 'retain'
  selector = {}
  preset = 'prose'

  constructor(context) {
    this.init(context, true)
  }

  static matches(node, selector) {
    return node.matches(selector)
  }

  init(context, noPreset) {
    if (!!noPreset) this.preset = null

    this.selector = {
      context: null,
      filter: [],
      avoid: [],
      boundary: []
    }

    if (!context) {
      throw new Error('A context is required for Fibre to initialise.')
    } else if (context instanceof Node) {
      if (context instanceof Document) this.context = context.body || context
      else this.context = context
    } else if (typeof context === 'string') {
      this.context = document.querySelector(context)
      this.selector.context = context
    }
    return this
  }

  filterFn(node) {
    const filter = this.selector.filter.join(', ') || '*'
    const avoid = this.selector.avoid.join(', ') || null
    const result = Fibre.matches(node, filter, true) && !Fibre.matches(node, avoid)
    return (this.preset === 'prose') ? AVOID_NON_PROSE(node) && result : result
  }

  boundaryFn(node) {
    const boundary = this.selector.boundary.join(', ') || null
    const result = Fibre.matches(node, boundary)
    return (this.preset === 'prose') ? NON_INLINE_PROSE(node) || result : result
  }

  filter(selector) {
    if (typeof selector === 'string') {
      this.selector.filter.push(selector)
    }
    return this
  }

  endFilter(all) {
    if (all) {
      this.selector.filter = []
    } else {
      this.selector.filter.pop()
    }
    return this
  }

  avoid(selector) {
    this.selector.avoid.push(selector)
    return this
  }

  endAvoid(all) {
    if (all) {
      this.selector.avoid = []
    } else {
      this.selector.avoid.pop()
    }
    return this
  }

  addBoundary(selector) {
    this.selector.boundary.push(selector)
    return this
  }

  removeBoundary() {
    this.selector.boundary = []
    return this
  }

  setMode(portionMode) {
    this.portionMode = portionMode === 'first' ? 'first' : 'retain'
    return this
  }

  replace(regexp, newSubStr) {
    this.finder.push(new DOMFinder(this.context, {
      find: regexp,
      replace: newSubStr,
      filterElements: currentNode => {
        return this.filterFn(currentNode)
      },
      forceContext: currentNode => {
        return this.boundaryFn(currentNode)
      },
      portionMode: this.portionMode
    }))
    return this
  }

  wrap(regexp, strElemName) {
    const it = this
    it.finder.push(new DOMFinder(it.context, {
      find: regexp,
      wrap: strElemName,
      filterElements: function (currentNode) {
        return it.filterFn(currentNode)
      },
      forceContext: function (currentNode) {
        return it.boundaryFn(currentNode)
      },
      portionMode: it.portionMode
    }))
    return it
  }

  revert(level) {
    const max = this.finder.length
    level = Number(level) || (level === 0 ? Number(0) :
      (level === 'all' ? max : 1))

    if (typeof max === 'undefined' || max === 0) return this
    else if (level > max) level = max

    for (let i = level; i > 0; i--) {
      this.finder.pop().revert()
    }
    return this
  }
}
