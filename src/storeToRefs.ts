import {
  ComputedRef,
  isReactive,
  isRef,
  isVue2,
  Ref,
  toRaw,
  ToRef,
  toRef,
  ToRefs,
  toRefs,
} from 'vue-demi'
import { StoreGetters, StoreState } from './store'
import type { PiniaCustomStateProperties, StoreGeneric } from './types'

type ToComputedRefs<T> = {
  [K in keyof T]: ToRef<T[K]> extends Ref<infer U>
    ? ComputedRef<U>
    : ToRef<T[K]>
}

/**
 * Extracts the return type for `storeToRefs`.
 * Will convert any `getters` into `ComputedRef`.
 */
export type StoreToRefs<SS extends StoreGeneric> = ToRefs<
  StoreState<SS> & PiniaCustomStateProperties<StoreState<SS>>
> &
  ToComputedRefs<StoreGetters<SS>>

/**
 * Creates an object of references with all the state, getters, and plugin-added
 * state properties of the store. Similar to `toRefs()` but specifically
 * designed for Pinia stores so methods and non reactive properties are
 * completely ignored.
 *
 * @param store - store to extract the refs from
 */
//# 用于结构 store 的方法
export function storeToRefs<SS extends StoreGeneric>(
  store: SS
): StoreToRefs<SS> {
  // See https://github.com/vuejs/pinia/issues/852
  // It's easier to just use toRefs() even if it includes more stuff
  if (isVue2) {
    // @ts-expect-error: toRefs include methods and others
    return toRefs(store)
  } else {
    //# 先转成原生对象, 避免循环中不断触发 getter
    store = toRaw(store)

    //# 定义一个用于接收结果的对象
    const refs = {} as StoreToRefs<SS>
    for (const key in store) {
      const value = store[key]
      //# 将每一个 prop 转成 ref, 但是过滤掉 function(action)
      if (isRef(value) || isReactive(value)) {
        // @ts-expect-error: the key is state or getter
        refs[key] =
          // ---
          toRef(store, key)
      }
    }

    // 返回结果
    return refs
  }
}
