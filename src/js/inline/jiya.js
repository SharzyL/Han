import $ from "../method"
import { Finder } from "../find";
import { createBDChar } from "../find";
import { TYPESET } from "../regex";

const JIYA_CLASS = 'bd-jiya'
const JIYA_AVOID = 'h-char.bd-jiya'
const CONSECUTIVE_CLASS = 'bd-consecutive'
const JIYA_CS_HTML = '<h-cs hidden class="jinze-outer jiya-outer"> </h-cs>'

function trimBDClass(clazz) {
  return clazz.replace(
    /(biaodian|cjk|bd-jiya|bd-consecutive|bd-hangable)/gi, ''
  ).trim()
}

function charifyBiaodian(portion) {
  const biaodian = portion.text
  const $elmt = portion.node.parentNode
  const $bd = $.parent($elmt, 'h-char.biaodian')
  const $new = createBDChar(biaodian)

  $new.innerHTML = '<h-inner>' + biaodian + '</h-inner>'
  $new.classList.add(JIYA_CLASS)

  const $jinze = $.parent($elmt, 'h-jinze')
  if ($jinze) {
    insertJiyaCS($jinze)
  }

  return !$bd
    ? $new
    : (function () {
      $bd.classList.add(JIYA_CLASS)

      return Finder.matches($elmt, 'h-inner, h-inner *')
        ? biaodian
        : $new.firstChild
    })()
}

let prevBDType, $$prevCS

function locateConsecutiveBD(portion) {
  const prev = prevBDType
  const $elmt = portion.node.parentNode
  const $bd = $.parent($elmt, 'h-char.biaodian')
  const $jinze = $.parent($bd, 'h-jinze')
  const classList = $bd.classList

  if (prev) {
    $bd.setAttribute('prev', prev)
  }

  if ($$prevCS && classList.contains('bd-open')) {
    $$prevCS.pop().setAttribute('next', 'bd-open')
  }

  $$prevCS = undefined

  if (portion.isEnd) {
    prevBDType = undefined
    classList.add(CONSECUTIVE_CLASS)
    classList.add('end-portion')
  } else {
    prevBDType = trimBDClass($bd.getAttribute('class'))
    classList.add(CONSECUTIVE_CLASS)
  }

  if ($jinze) {
    $$prevCS = locateCS($jinze, {
      prev: prev,
      'class': trimBDClass($bd.getAttribute('class'))
    })
  }
  return portion.text
}

function insertJiyaCS($jinze) {
  if (
    Finder.matches($jinze, '.tou, .touwei') &&
    !Finder.matches($jinze.previousSibling, 'h-cs.jiya-outer')
  ) {
    $jinze.insertAdjacentHTML('beforebegin', JIYA_CS_HTML)
  }
  if (
    Finder.matches($jinze, '.wei, .touwei') &&
    !Finder.matches($jinze.nextSibling, 'h-cs.jiya-outer')
  ) {
    $jinze.insertAdjacentHTML('afterend', JIYA_CS_HTML)
  }
}

function locateCS($jinze, attr) {
  let $prev, $next

  if (Finder.matches($jinze, '.tou, .touwei')) {
    $prev = $jinze.previousSibling

    if (Finder.matches($prev, 'h-cs')) {
      $prev.className = 'jinze-outer jiya-outer'
      $prev.setAttribute('prev', attr.prev)
    }
  }
  if (Finder.matches($jinze, '.wei, .touwei')) {
    $next = $jinze.nextSibling

    if (Finder.matches($next, 'h-cs')) {
      $next.className = 'jinze-outer jiya-outer ' + attr['class']
      $next.removeAttribute('prev')
    }
  }
  return [$prev, $next]
}

export function renderJiya(context) {
  context = context || document
  const finder = new Finder(context)

  finder
    .avoid('textarea, code, kbd, samp, pre, h-cs')
    .avoid(JIYA_AVOID)
    .charify({
      avoid: false,
      biaodian: charifyBiaodian
    })
    // End avoiding `JIYA_AVOID`:
    .endAvoid()

    .avoid('textarea, code, kbd, samp, pre, h-cs')
    .replace(TYPESET.group.biaodian[0], locateConsecutiveBD)
    .replace(TYPESET.group.biaodian[1], locateConsecutiveBD)

  return finder
}

export function revertJiya(context) {
  $.qsa(
    'h-char.bd-jiya, h-cs.jiya-outer',
    context
  ).forEach(function ($elmt) {
    const classList = $elmt.classList
    classList.remove('bd-jiya')
    classList.remove('jiya-outer')
  })
  return this
}
