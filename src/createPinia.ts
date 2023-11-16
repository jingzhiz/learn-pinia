import { Pinia, PiniaPlugin, setActivePinia, piniaSymbol } from './rootStore'
import { ref, App, markRaw, effectScope, isVue2, Ref } from 'vue-demi'
import { registerPiniaDevtools, devtoolsPlugin } from './devtools'
import { IS_CLIENT } from './env'
import { StateTree, StoreGeneric } from './types'

/**
 * Creates a Pinia instance to be used by the application
 */
//# 生成 pinia 实例并返回
export function createPinia(): Pinia {
  //# 创建一个 effect 作用域, 捕获其中所创建的响应式副作用, 这样捕获到的副作用可以一起处理
  const scope = effectScope(true)
  // NOTE: here we could check the window object for a state and directly set it
  // if there is anything like it with Vue 3 SSR
  //# state 是一个被 run 方法包裹后返回的 ref 对象
  const state = scope.run<Ref<Record<string, StateTree>>>(() =>
    ref<Record<string, StateTree>>({})
  )!

  let _p: Pinia['_p'] = []
  // plugins added before calling app.use(pinia)
  // # 用来记录所被 pinia.use 的插件
  let toBeInstalled: PiniaPlugin[] = []

  const pinia: Pinia = markRaw({
    //# vue 插件对象形式提供的 install 方法
    install(app: App) {
      // this allows calling useStore() outside of a component setup after
      // installing pinia's plugin
      // # 记录当前 pinia 已经被创建出来了, 用于在组件外使用时判断是否 pinia 有被安装
      setActivePinia(pinia)
      if (!isVue2) {
        //# 记录 Vue 根组件实例
        pinia._a = app
        //# 根组件通过 provide 方法可以给所有后代组件注入 pinia
        app.provide(piniaSymbol, pinia)
        //# 组件的代理对象可以通过 $pinia 访问 pinia
        app.config.globalProperties.$pinia = pinia
        /* istanbul ignore else */
        //# 将 pinia 添加到浏览器控制台的 Vue 开发工具里
        if (__USE_DEVTOOLS__ && IS_CLIENT) {
          registerPiniaDevtools(app, pinia)
        }

        //# 将 pinia 插件记录至 _p 属性上, 然后清空 toBeInstalled 数组
        toBeInstalled.forEach((plugin) => _p.push(plugin))
        toBeInstalled = []
      }
    },

    //# use 插件方法
    use(plugin) {
      if (!this._a && !isVue2) {
        toBeInstalled.push(plugin)
      } else {
        _p.push(plugin)
      }
      return this
    },

    _p, //# plugins
    // it's actually undefined here
    // @ts-expect-error
    _a: null, //# Vue 实例
    _e: scope, //# effect 作用域
    _s: new Map<string, StoreGeneric>(), //# id 和 store 映射的记录
    state, //# refs 对象, pinia 所有 state 的合集
  })

  // pinia devtools rely on dev only features so they cannot be forced unless
  // the dev build of Vue is used. Avoid old browsers like IE11.
  //# 浏览器插件的支持
  if (__USE_DEVTOOLS__ && typeof Proxy !== 'undefined') {
    pinia.use(devtoolsPlugin)
  }

  //# 返回 pinia 实例
  return pinia
}

/**
 * Dispose a Pinia instance by stopping its effectScope and removing the state, plugins and stores. This is mostly
 * useful in tests, with both a testing pinia or a regular pinia and in applications that use multiple pinia instances.
 *
 * @param pinia - pinia instance
 */
//# 重置整个 pinia
export function disposePinia(pinia: Pinia) {
  //# 停止副作用函数的响应式执行
  pinia._e.stop()
  //# 清空 Map
  pinia._s.clear()
  //# 清空安装的插件记录
  pinia._p.splice(0)
  //# 清空 state 值
  pinia.state.value = {}
  // @ts-expect-error: non valid
  //# 清空记录的根组件实例
  pinia._a = null
}
