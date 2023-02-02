# Han-CSS-Q

「[汉字标准格式](https://github.com/ethantw/Han)」（以下简称 Han-CSS）是一个集「语意样式标准化」「文字设计」「高阶排版功能」三大概念的 Sass/Stylus、JavaScript 排版框架。其专为汉字网页提供的美观而标准化的环境，不仅符合传统阅读习惯、更为萤幕阅读提供了既成标准，得以完整解决现今汉字网页设计的排版需求。

然而，Han-CSS 近年缺少维护，构建工具链停留在已经废弃的 gulp 版本，代码也不符合现代 JavaScript 编程惯例，功能上也不能满足现代前端的需求（例如服务器端渲染）。

本项目是 Han-CSS 的一个 fork，命名为 Han-CSS-Q，旨在提供 Han-CSS 的一个现代化版本。

相对于 Han-CSS，本项目做了如下改动：

1. 抛弃原有的 gulp 构建工具链，全面使用 ES Module，可以使用包管理器直接导入到现代前端项目中。
2. 支持服务器端渲染。
3. 重新整理代码，使其基本符合现代 JavaScript 规范。
4. 重新设计 API，使其更加易用。

目前本项目还处于开发阶段，功能基本可用，但是由于重构过程较为复杂，且还未经过完整测试，不保证和 Han-CSS 的结果一致。[sharzy.in](https://sharzy.in/blog) 已全面启用 Han-CSS-Q，效果可供参考。

## 使用方法

> 待补充

```js
import Han from "han-css"

new Han(document).render()
```

