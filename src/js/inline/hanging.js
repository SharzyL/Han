import { Finder, createBDChar } from "../find";
import $ from "../method"
import { TYPESET } from "../regex";
import { document, body } from "../vars";

const HANGABLE_CLASS = 'bd-hangable'
const HANGABLE_AVOID = 'h-char.bd-hangable'
const HANGABLE_CS_HTML = '<h-cs hidden class="jinze-outer hangable-outer"> </h-cs>'

function detectSpaceFont() {
  if (!document) return false

  const div = $.create('div');
  let ret;

  div.innerHTML = '<span>a b</span><span style="font-family: \'Han Space\'">a b</span>'
  body.appendChild(div)
  ret = div.firstChild.offsetWidth !== div.lastChild.offsetWidth
  $.remove(div)
  return ret
}

function insertHangableCS($jinze) {
  const $cs = $jinze.nextSibling;

  if ($cs && Finder.matches($cs, 'h-cs.jinze-outer')) {
    $cs.classList.add('hangable-outer')
  } else {
    $jinze.insertAdjacentHTML(
      'afterend',
      HANGABLE_CS_HTML
    )
  }
}

export const isSpaceFontLoaded = detectSpaceFont()

export function renderHanging(context) {
  context = context || document
  const finder = new Finder(context);

  finder
    .avoid('textarea, code, kbd, samp, pre')
    .avoid(HANGABLE_AVOID)
    .replace(
      TYPESET.jinze.hanging,
      function (portion) {
        if (/^[\x20\t\r\n\f]+$/.test(portion.text)) {
          return ''
        }

        const $elmt = portion.node.parentNode
        let $new, $bd, biaodian


        const $jinze = $.parent($elmt, 'h-jinze')
        if ($jinze) {
          insertHangableCS($jinze)
        }

        biaodian = portion.text.trim()

        $new = createBDChar(biaodian)
        $new.innerHTML = '<h-inner>' + biaodian + '</h-inner>'
        $new.classList.add(HANGABLE_CLASS)

        $bd = $.parent($elmt, 'h-char.biaodian')

        if (!$bd) {
          return $new
        } else {
          $bd.classList.add(HANGABLE_CLASS)
          return Finder.matches($elmt, 'h-inner, h-inner *')
            ? biaodian
            : $new.firstChild
        }
      }
    )
  return finder
}
