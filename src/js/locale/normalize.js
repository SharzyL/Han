import $ from "../method"
import support from "./support";
import { renderRuby } from "./h-ruby";
import { Finder } from "../find";

/**
 * Normalisation rendering mechanism
 */

// Render and normalise the given context by routine:
//
// ruby -> u, ins -> s, del -> em
//
export function renderElem(context) {
  renderRuby(context)
  renderDecoLine(context)
  renderDecoLine(context, 's, del')
  renderEm(context)
}

// Traverse all target elements and address
// presentational corrections if any two of
// them are adjacent to each other.
export function renderDecoLine(context, target) {
  const $$target = $.qsa(target || 'u, ins', context)
  let i = $$target.length

  traverse: while (i--) {
    const $this = $$target[i]
    let $prev = null

    // Ignore all `<wbr>` and comments in between,
    // and add class `.adjacent` once two targets
    // are next to each other.
    do {
      $prev = ($prev || $this).previousSibling

      if (!$prev) {
        continue traverse
      } else if ($$target[i - 1] === $prev) {
        $this.classList.add('adjacent')
      }
    } while ($.isIgnorable($prev))
  }
}

// Traverse all target elements to render
// emphasis marks.
export function renderEm(context, target) {
  const method = target ? 'qsa' : 'tag'
  target = target || 'em'
  const $target = $[method](target, context)

  $target
    .forEach(function (elem) {
      // TODO:
      const $elem = new Finder(elem)

      if (support.textEmphasis) {
        $elem
          .avoid('rt, h-char')
          .charify({biaodian: true, punct: true})
      } else {
        $elem
          .avoid('rt, h-char, h-char-group')
          .jinzify()
          .groupify({western: true})
          .charify({
            hanzi: true,
            biaodian: true,
            punct: true,
            latin: true,
            ellinika: true,
            kirillica: true
          })
      }
    })
}
