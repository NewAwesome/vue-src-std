// NOTE: runtime + compiler构建入口文件
/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

// NOTE: cached用于给这个函数加个缓存（闭包原理）。调用iToTemplate时，假如之前已经执行过cached中的函数
// NOTE: ，存留有缓存值了，那么下次给idToTemplate传入相同的参数时就不再执行函数而是直接取缓存
const idToTemplate = cached(id => {
  // NOTE: 如果id是已经是dom元素，就直接返回；如果id是dom选择器，那就查找并返回对应的dom元素
  const el = query(id)
  return el && el.innerHTML
})

// NOTE: 先缓存原型上的$mount方法，再对原型上的方法重新定义（这里实际上是函数增强，做一些处理后再调用原本原型上的mount函数）
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  // NOTE: 限制el，不可以是body或html这种节点
  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // TODO: 如果没有定义render方法，则将template或el转换成render方法？？？
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
    if (template) {
      // NOTE: 存在template属性为字符串
      if (typeof template === 'string') {
        // TODO: 存在template属性为字符串，并且第一个开头是#？？？？
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      // NOTE: 存在template属性为节点？（I Guess）直接使用它的innerHTML
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // TODO: 存在el，拿外层HTML元素，为啥
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }
      // NOTE: 编译DOM核心方法
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
