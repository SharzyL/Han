/**
 * findAndReplaceDOMText v 0.4.3
 * @author James Padolsey http://james.padolsey.com
 * @license http://unlicense.org/UNLICENSE
 *
 * Matches the text of a DOM node against a regular expression
 * and replaces each match (or node-separated portions of the match)
 * in the specified element.
 */

import { document } from "../vars";

const PORTION_MODE_RETAIN = 'retain'
const PORTION_MODE_FIRST = 'first'
const doc = document

function escapeRegExp(s) {
  return String(s).replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')
}

/**
 * findAndReplaceDOMText
 *
 * Locate matches and replaces with replacementNode
 *
 * @param {Node} node Element or Text node to search within
 * @param options
 * @param {RegExp} options.find The regular expression to match
 * @param {String|Element} [options.wrap] A NodeName, or a Node to clone
 * @param {String|Function} [options.replace='$&'] What to replace each match with
 * @param {Function} [options.filterElements] A Function to be called to check whether to
 *    process an element. (returning true = process element,
 *    returning false = avoid element)
 */
export const NON_PROSE_ELEMENTS = {
  br: 1, hr: 1,
  // Media / Source elements:
  script: 1, style: 1, img: 1, video: 1, audio: 1, canvas: 1, svg: 1, map: 1, object: 1,
  // Input elements
  input: 1, textarea: 1, select: 1, option: 1, optgroup: 1, button: 1
}

export const NON_CONTIGUOUS_PROSE_ELEMENTS = {

  // Elements that will not contain prose or block elements where we don't
  // want prose to be matches across element borders:

  // Block Elements
  address: 1, article: 1, aside: 1, blockquote: 1, dd: 1, div: 1,
  dl: 1, fieldset: 1, figcaption: 1, figure: 1, footer: 1, form: 1, h1: 1, h2: 1, h3: 1,
  h4: 1, h5: 1, h6: 1, header: 1, hgroup: 1, hr: 1, main: 1, nav: 1, noscript: 1, ol: 1,
  output: 1, p: 1, pre: 1, section: 1, ul: 1,
  // Other misc. elements that are not part of continuous inline prose:
  br: 1, li: 1, summary: 1, dt: 1, details: 1, rp: 1, rt: 1, rtc: 1,
  // Media / Source elements:
  script: 1, style: 1, img: 1, video: 1, audio: 1, canvas: 1, svg: 1, map: 1, object: 1,
  // Input elements
  input: 1, textarea: 1, select: 1, option: 1, optgroup: 1, button: 1,
  // Table related elements:
  table: 1, tbody: 1, thead: 1, th: 1, tr: 1, td: 1, caption: 1, col: 1, tfoot: 1, colgroup: 1

}

export const NON_INLINE_PROSE = function (el) {
  return NON_CONTIGUOUS_PROSE_ELEMENTS.hasOwnProperty(el.nodeName.toLowerCase())
}

// Presets accessed via `options.preset` when calling findAndReplaceDOMText():
export const PRESETS = {
  prose: {
    forceContext: NON_INLINE_PROSE,
    filterElements: function (el) {
      return NON_PROSE_ELEMENTS.hasOwnProperty(el.nodeName.toLowerCase())
    }
  }
}

/**
 * Finder -- encapsulates logic to find and replace.
 */
export class DOMFinder {
  constructor(node, options) {

    const preset = options.preset && PRESETS[options.preset]
    options.portionMode = options.portionMode || PORTION_MODE_RETAIN
    if (preset) {
      for (const i in preset) {
        if (preset.hasOwnProperty(i) && options.hasOwnProperty(i)) {
          options[i] = preset[i]
        }
      }
    }

    this.node = node
    this.options = options
    // ENable match-preparation method to be passed as option:
    this.prepMatch = options.prepMatch || this.prepMatch
    this.reverts = []
    this.matches = this.search()
    if (this.matches.length) {
      this.processMatches()
    }

  }

  /**
   * Searches for all matches that comply with the instance's 'match' option
   */
  search() {

    let match
    let matchIndex = 0
    let offset = 0
    let regex = this.options.find
    const textAggregation = this.getAggregateText()
    const matches = []
    const self = this
    regex = typeof regex === 'string' ? RegExp(escapeRegExp(regex), 'g') : regex
    matchAggregation(textAggregation)

    function matchAggregation(textAggregation) {
      for (let i = 0, l = textAggregation.length; i < l; ++i) {

        const text = textAggregation[i]
        if (typeof text !== 'string') {
          // Deal with nested contexts: (recursive)
          matchAggregation(text)
          continue
        }

        if (regex.global) {
          while ((match = regex.exec(text)) !== null) {
            matches.push(self.prepMatch(match, matchIndex++, offset))
          }
        } else {
          match = text.match(regex)
          if (match) {
            matches.push(self.prepMatch(match, 0, offset))
          }
        }

        offset += text.length
      }
    }

    return matches
  }

  /**
   * Prepares a single match with useful meta info:
   */
  prepMatch(match, matchIndex, characterOffset) {

    if (!match[0]) {
      throw new Error('findAndReplaceDOMText cannot handle zero-length matches')
    }

    match.endIndex = characterOffset + match.index + match[0].length
    match.startIndex = characterOffset + match.index
    match.index = matchIndex
    return match
  }

  /**
   * Gets aggregate text within subject node
   */
  getAggregateText() {

    const elementFilter = this.options.filterElements
    const forceContext = this.options.forceContext
    const text = getText(this.node)
    return text

    /**
     * Gets aggregate text of a node without resorting
     * to broken innerText/textContent
     */
    function getText(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return [node.data]
      }

      if (elementFilter && !elementFilter(node)) {
        return []
      }

      const txt = ['']
      let i = 0
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          txt[i] += child.data
          continue
        }

        const innerText = getText(child)
        if (forceContext && child.nodeType === Node.ELEMENT_NODE && (forceContext === true || forceContext(child))) {
          txt[++i] = innerText
          txt[++i] = ''
        } else {
          if (typeof innerText[0] === 'string') {
            // Bridge nested text-node data so that they're
            // not considered their own contexts:
            // I.e. ['some', ['thing']] -> ['something']
            txt[i] += innerText.shift()
          }
          if (innerText.length) {
            txt[++i] = innerText
            txt[++i] = ''
          }
        }
      }
      return txt
    }
  }

  /**
   * Steps through the target node, looking for matches, and
   * calling replaceFn when a match is found.
   */
  processMatches() {

    const matches = this.matches
    const node = this.node
    const elementFilter = this.options.filterElements
    let startPortion,
      endPortion,
      innerPortions = [],
      curNode = node,
      match = matches.shift(),
      atIndex = 0, // i.e. nodeAtIndex
      portionIndex = 0,
      doAvoidNode,
      nodeStack = [node]
    out: while (true) {

      if (curNode.nodeType === 3) {

        if (!endPortion && curNode.length + atIndex >= match.endIndex) {

          // We've found the ending
          endPortion = {
            node: curNode,
            index: portionIndex++,
            text: curNode.data.substring(match.startIndex - atIndex, match.endIndex - atIndex),
            indexInMatch: atIndex - match.startIndex,
            indexInNode: match.startIndex - atIndex, // always zero for end-portions
            endIndexInNode: match.endIndex - atIndex,
            isEnd: true
          }
        } else if (startPortion) {
          // Intersecting node
          innerPortions.push({
            node: curNode,
            index: portionIndex++,
            text: curNode.data,
            indexInMatch: atIndex - match.startIndex,
            indexInNode: 0 // always zero for inner-portions
          })
        }

        if (!startPortion && curNode.length + atIndex > match.startIndex) {
          // We've found the match start
          startPortion = {
            node: curNode,
            index: portionIndex++,
            indexInMatch: 0,
            indexInNode: match.startIndex - atIndex,
            endIndexInNode: match.endIndex - atIndex,
            text: curNode.data.substring(match.startIndex - atIndex, match.endIndex - atIndex)
          }
        }

        atIndex += curNode.data.length
      }

      doAvoidNode = curNode.nodeType === 1 && elementFilter && !elementFilter(curNode)
      if (startPortion && endPortion) {

        curNode = this.replaceMatch(match, startPortion, innerPortions, endPortion)
        // processMatches has to return the node that replaced the endNode
        // and then we step back so we can continue from the end of the
        // match:

        atIndex -= (endPortion.node.data.length - endPortion.endIndexInNode)
        startPortion = null
        endPortion = null
        innerPortions = []
        match = matches.shift()
        portionIndex = 0
        if (!match) {
          break; // no more matches
        }

      } else if (
        !doAvoidNode &&
        (curNode.firstChild || curNode.nextSibling)
      ) {
        // Move down or forward:
        if (curNode.firstChild) {
          nodeStack.push(curNode)
          curNode = curNode.firstChild
        } else {
          curNode = curNode.nextSibling
        }
        continue
      }

      // Move forward or up:
      while (true) {
        if (curNode.nextSibling) {
          curNode = curNode.nextSibling
          break
        }
        curNode = nodeStack.pop()
        if (curNode === node) {
          break out
        }
      }

    }

  }

  /**
   * Reverts ... TODO
   */
  revert() {
    // Reversion occurs backwards to avoid nodes subsequently
    // replaced during the matching phase (a forward process):
    for (let l = this.reverts.length; l--;) {
      this.reverts[l]()
    }
    this.reverts = []
  }

  prepareReplacementString(string, portion, match) {
    const portionMode = this.options.portionMode;
    if (
      portionMode === PORTION_MODE_FIRST &&
      portion.indexInMatch > 0
    ) {
      return ''
    }
    string = string.replace(/\$(\d+|&|`|')/g, function ($0, t) {
      let replacement;
      switch (t) {
        case '&':
          replacement = match[0]
          break
        case '`':
          replacement = match.input.substring(0, match.startIndex)
          break
        case '\'':
          replacement = match.input.substring(match.endIndex)
          break
        default:
          replacement = match[+t]
      }
      return replacement
    })
    if (portionMode === PORTION_MODE_FIRST) {
      return string
    }

    if (portion.isEnd) {
      return string.substring(portion.indexInMatch)
    }

    return string.substring(portion.indexInMatch, portion.indexInMatch + portion.text.length)
  }

  getPortionReplacementNode(portion, match, matchIndex) {

    let replacement = this.options.replace || '$&'
    let wrapper = this.options.wrap
    if (wrapper && wrapper.nodeType) {
      // Wrapper has been provided as a stencil-node for us to clone:
      const clone = doc.createElement('div')
      clone.innerHTML = wrapper.outerHTML || new XMLSerializer().serializeToString(wrapper)
      wrapper = clone.firstChild
    }

    if (typeof replacement == 'function') {
      replacement = replacement(portion, match, matchIndex)
      if (replacement && replacement.nodeType) {
        return replacement
      }
      return doc.createTextNode(String(replacement))
    }

    const el = typeof wrapper == 'string' ? doc.createElement(wrapper) : wrapper
    replacement = doc.createTextNode(
      this.prepareReplacementString(
        replacement, portion, match, matchIndex
      )
    )
    if (!replacement.data) {
      return replacement
    }

    if (!el) {
      return replacement
    }

    el.appendChild(replacement)
    return el
  }

  replaceMatch(match, startPortion, innerPortions, endPortion) {

    const matchStartNode = startPortion.node
    const matchEndNode = endPortion.node
    let preceedingTextNode
    let followingTextNode
    if (matchStartNode === matchEndNode) {

      const node = matchStartNode
      if (startPortion.indexInNode > 0) {
        // Add `before` text node (before the match)
        preceedingTextNode = doc.createTextNode(node.data.substring(0, startPortion.indexInNode))
        node.parentNode.insertBefore(preceedingTextNode, node)
      }

      // Create the replacement node:
      const newNode = this.getPortionReplacementNode(
        endPortion,
        match
      )
      node.parentNode.insertBefore(newNode, node)
      if (endPortion.endIndexInNode < node.length) { // ?????
        // Add `after` text node (after the match)
        followingTextNode = doc.createTextNode(node.data.substring(endPortion.endIndexInNode))
        node.parentNode.insertBefore(followingTextNode, node)
      }

      node.parentNode.removeChild(node)
      this.reverts.push(function () {
        if (preceedingTextNode === newNode.previousSibling) {
          preceedingTextNode.parentNode.removeChild(preceedingTextNode)
        }
        if (followingTextNode === newNode.nextSibling) {
          followingTextNode.parentNode.removeChild(followingTextNode)
        }
        newNode.parentNode.replaceChild(node, newNode)
      })
      return newNode
    } else {
      // Replace matchStartNode -> [innerMatchNodes...] -> matchEndNode (in that order)


      preceedingTextNode = doc.createTextNode(
        matchStartNode.data.substring(0, startPortion.indexInNode)
      )
      followingTextNode = doc.createTextNode(
        matchEndNode.data.substring(endPortion.endIndexInNode)
      )
      const firstNode = this.getPortionReplacementNode(
        startPortion,
        match
      )
      for (let i = 0, l = innerPortions.length; i < l; ++i) {
        const portion = innerPortions[i]
        const innerNode = this.getPortionReplacementNode(
          portion,
          match
        )
        portion.node.parentNode.replaceChild(innerNode, portion.node)
        this.reverts.push((function (portion, innerNode) {
          return function () {
            innerNode.parentNode.replaceChild(portion.node, innerNode)
          }
        }(portion, innerNode)))
      }

      const lastNode = this.getPortionReplacementNode(
        endPortion,
        match
      )
      matchStartNode.parentNode.insertBefore(preceedingTextNode, matchStartNode)
      matchStartNode.parentNode.insertBefore(firstNode, matchStartNode)
      matchStartNode.parentNode.removeChild(matchStartNode)
      matchEndNode.parentNode.insertBefore(lastNode, matchEndNode)
      matchEndNode.parentNode.insertBefore(followingTextNode, matchEndNode)
      matchEndNode.parentNode.removeChild(matchEndNode)
      this.reverts.push(function () {
        preceedingTextNode.parentNode.removeChild(preceedingTextNode)
        firstNode.parentNode.replaceChild(matchStartNode, firstNode)
        followingTextNode.parentNode.removeChild(followingTextNode)
        lastNode.parentNode.replaceChild(matchEndNode, lastNode)
      })
      return lastNode
    }
  }

}
