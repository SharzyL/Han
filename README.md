# Han-CSS-Q

「[汉字标准格式](https://github.com/ethantw/Han)」（以下简称 Han-CSS）是一个集「语意样式标准化」「文字设计」「高阶排版功能」三大概念的 Sass/Stylus、JavaScript 排版框架。其专为汉字网页提供的美观而标准化的环境，不仅符合传统阅读习惯、更为萤幕阅读提供了既成标准，得以完整解决现今汉字网页设计的排版需求。

然而，Han-CSS 近年缺少维护，构建工具链停留在已经废弃的 gulp 版本，代码也不符合现代 JavaScript 编程惯例，功能上也不能满足现代前端的需求（例如服务器端渲染）。

本项目是 Han-CSS 的一个 fork，命名为 Han-CSS-Q，旨在提供 Han-CSS 的一个现代化版本。

相对于 Han-CSS，本项目做了如下改动：

1. 抛弃原有的 gulp 构建工具链，全面使用 ES Module，可以使用包管理器直接导入到现代前端项目中。
2. 支持服务器端渲染。
3. 重新整理代码，使其基本符合现代 JavaScript 规范。
4. 重新设计 API，使其更加易用、可定制化。

目前本项目还处于开发阶段，功能基本可用，但是由于重构过程较为复杂，且还未经过完整测试，不保证和 Han-CSS 的结果一致。[sharzy.in](https://sharzy.in/blog) 已全面启用 Han-CSS-Q，效果可供参考。

## 使用方法

### 安装
目前 Han-CSS-Q 尚未上传到 NPM 或者 Yarn 的仓库，在此之前，可以通过 GitHub 的来源安装：
```shell
yarn add git+https://github.com/SharzyL/Han
# or if using npm
npm install git+https://github.com/SharzyL/Han
```

为了使用 Han-CSS-Q，需要同时引入它的 CSS 和 JS，步骤分别如下：

### CSS API
Han-CSS-Q 的 CSS 使用 SASS/SCSS 编写，配置打包器对应的 SASS loader 之后，使用 `@import` 语句导入：
```sass
@import "han-css-q"
```

> 注意: Han-CSS-Q 的 `src/sass/var/_internal.sass` 中使用相对路径 `../../../font` 引用了一些字体文件。然而，一些 SASS loader（例如 [webpack SASS loader](https://github.com/webpack-contrib/sass-loader#problems-with-url)）在解析这个相对路径的时候，会使用入口文件的路径作为当前目录（而不是 `url()` 语句出现的文件的目录）。例如，如果用户在 JS 中使用 `import "../style/main.sass"`，而 `main.sass` 中使用 `@import "han-css-q"`，那么由于传递给 SASS loader 的入口文件是 `main.sass`，因此字体的查找目录就会被设定为 `../style/../../../font`，导致打包器找不到字体文件。有两个途径来解决这个问题：
> 1. 让打包器相对当前目录解析文件，例如对于 webpack，可以使用 [resolve-url-loader](https://github.com/bholloway/resolve-url-loader) 这一加载器。
> 2. 通过 SASS 变量 `$han-font-path` 来指定字体路径。例如，如果入口文件为 `src/style/main.sass`，那么可以设定（设定方法见下文）：
> ```sass
> $han-font-path: "../../node_modules/han-css-q/font"
> ```

Han-CSS-Q 的 SASS 提供了若干变量可供定制化，可以通过在 `@import` 语句之前定义这些变量来完成定制：
```sass
$han-article-line-height: 1.55
$han-line-height: 1.55
$han-hanging-hans: false

@import "han-css-q"
```

Han-CSS 的 [CSS API 文档](https://hanzi.pro/manual/sass-api#variable)提供了这些变量的说明。

### JS API

`han-css-q` 导出了 `Han` 这个类，可以通过 `import` 导入到我们的项目中：
```js
import Han from "han-css-q"
```

`Han` 的构造函数支持两个可选参数：
- `context` 为需要进行渲染的 DOM 元素，默认为 `document.body`
- `condition` 附加信息（如功能、字体支援侦测类别等）的加载环境，默认为 `document.documentElement`

```js
const han = new Han(document.querySelector('article'), document.documentElement)
```

使用默认管线渲染：
```js
han.render()
```

默认管线 `render()` 会依次执行如下步骤（关于每个步骤的作用，参见[渲染步骤](#渲染步骤)）：

```js
const defaultRoutine = [
  'initCond',
  'renderElem',
  'renderJiya',
  'renderHanging',
  'correctBiaodian',
  'renderHWS',
]
```

如需定制渲染步骤，可以使用 `.setRoutine` 方法，例如：

```js
han.setRoutine([
  'initCond', 'renderElem', 'renderJiya', 'renderHWS'
]).render()
```

## 渲染步骤

下文列出所有可用的渲染步骤的列表，可供选用：
- 初始化 `initCond()`
- 字级语意元素样式标准化 `renderElem()`，包含下述三个子步骤：
  - 渲染行间注元素 `renderRuby()`
  - 渲染文字装饰线元素 `renderDecoLine()`
  - 渲染强调元素 `renderEm()`
- 渲染行尾点号悬挂 `renderHanging()`
- 渲染标点挤压 `renderJiya()`
- 渲染汉字西文混排间隙 `renderHWS()`
- 修正基本标点符号 `correctBasicBD()`，仅当浏览器不支持时启用（参见[标点样式修正](https://hanzi.pro/manual/wenzisheji#biaodian_yangshi_xiuzheng)）
- 以私有区（PUA）字元取代合字符 `substCombLigaWithPUA()`，仅当浏览器不支持时启用（参见[着重字體效果的異體字顯示](https://ethantw.github.io/Han/latest/subst.html#zhuozhong_yuyi_de_ezi_xiuzheng)）
- 强调语义的讹字修正 `substInaccurateChar()`（参见[着重語意的訛字修正](https://ethantw.github.io/Han/latest/subst.html#zhuozhong_yuyi_de_ezi_xiuzheng)）

## 样式修正

Han-CSS-Q 提供了对部分 HTML 元素样式的修正，使其更加符合排版标准，具体信息参见[原文档](https://hanzi.pro/manual/yangshi_biaozhunhua)。

同时，Han-CSS-Q 定义了一部分字体，提供了更加精细的字体回退，具体信息亦参见有[原文档](https://hanzi.pro/manual/wenzisheji)。
