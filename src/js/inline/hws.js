import $ from "../method"
import { Finder } from "../find";
import { TYPESET } from "../regex";

const hws = '<<hws>>'

function $hws() {
  const ret = $.create('h-hws')
  ret.setAttribute('hidden', '')
  ret.innerHTML = ' '
  return ret
}

function sharingSameParent($a, $b) {
  return $a && $b && $a.parentNode === $b.parentNode
}

function properlyPlaceHWSBehind($node, text) {
  let $elmt = $node
  text = text || ''

  if (
    $.isElmt($node.nextSibling) ||
    sharingSameParent($node, $node.nextSibling)
  ) {
    return text + hws
  } else {
    // One of the parental elements of the current text
    // node would definitely have a next sibling, since
    // it is of the first portion and not `isEnd`.
    while (!$elmt.nextSibling) {
      $elmt = $elmt.parentNode
    }
    if ($node !== $elmt) {
      $elmt.insertAdjacentHTML('afterend', '<h-hws hidden> </h-hws>')
    }
  }
  return text
}

function firstStepLabel(portion, mat) {
  return portion.isEnd && portion.index === 0
    ? mat[1] + hws + mat[2]
    : portion.index === 0
      ? properlyPlaceHWSBehind(portion.node, portion.text)
      : portion.text
}

function real$hwsElmt(portion) {
  return portion.index === 0
    ? $hws()
    : ''
}

let last$hwsIdx
function apostrophe(portion) {
  const $elmt = portion.node.parentNode

  if (portion.index === 0) {
    last$hwsIdx = portion.endIndexInNode - 2
  }

  if (
    $elmt.nodeName.toLowerCase() === 'h-hws' && (
      portion.index === 1 || portion.indexInMatch === last$hwsIdx
    )) {
    $elmt.classList.add('quote-inner')
  }
  return portion.text
}

function curveQuote(portion) {
  const $elmt = portion.node.parentNode

  if ($elmt.nodeName.toLowerCase() === 'h-hws') {
    $elmt.classList.add('quote-outer')
  }
  return portion.text
}

function _renderHWS(context, strict) {
  // Elements to be filtered according to the
  // HWS rendering mode.
  const AVOID = strict
    ? 'textarea, code, kbd, samp, pre'
    : 'textarea'

  const mode = strict ? 'strict' : 'base'
  context = context || document
  const finder = new Finder(context)

  finder
    .avoid(AVOID)

    // Basic situations:
    // - 字a => 字<hws/>a
    // - A字 => A<hws/>字
    .replace(TYPESET.hws[mode][0], firstStepLabel)
    .replace(TYPESET.hws[mode][1], firstStepLabel)

    // Convert text nodes `<hws/>` into real element nodes:
    .replace(new RegExp('(' + hws + ')+', 'g'), real$hwsElmt)

    // Deal with:
    // - '<hws/>字<hws/>' => '字'
    // - "<hws/>字<hws/>" => "字"
    .replace(/(['"])\s(.+?)\s\1/g, apostrophe)

    // Deal with:
    // - <hws/>“字”<hws/>
    // - <hws/>‘字’<hws/>
    .replace(/\s[‘“]/g, curveQuote)
    .replace(/[’”]\s/g, curveQuote)
    .normalize()

  // Return the finder instance for future usage
  return finder
}

export function renderHWS(context) {
  _renderHWS(context, false)
}

export function renderHWSStrict(context) {
  _renderHWS(context, true)
}
