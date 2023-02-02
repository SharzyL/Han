import { document } from "../vars";
import { Finder, createBDChar } from "../find";
import support from "../locale/support";

export function correctBiaodian( context ) {
  context = context || document
  const finder  = new Finder( context )

  finder
  .avoid( 'h-char' )
  .replace( /([‘“])/g, function( portion ) {
    const $char = createBDChar(portion.text);
    $char.classList.add( 'bd-open', 'punct' )
    return $char
  })
  .replace( /([’”])/g, function( portion ) {
    const $char = createBDChar( portion.text )
    $char.classList.add( 'bd-close', 'bd-end', 'punct' )
    return $char
  })

  return support.unicodeRange
    ? finder
    : finder.charify({ biaodian: true })
}
