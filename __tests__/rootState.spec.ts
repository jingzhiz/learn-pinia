import { describe, it, expect } from 'vitest'
import { createPinia, defineStore } from '../src'
import { mockWarn } from './vitest-mock-warn'

describe('Root State', () => {
  mockWarn()
  const useA = defineStore('a', {
    state: () => ({ a: 'a' }),
  })

  const useB = defineStore('b', {
    state: () => ({ b: 'b' }),
  })

  it('warns if creating a store without a pinia', () => {
    expect(() => useA()).toThrowError(/there was no active Pinia/)
  })

  it('works with no stores', () => {
    expect(createPinia().state.value).toEqual({})
  })

  it('retrieves the root state of one store', () => {
    const pinia = createPinia()
    useA(pinia)
    expect(pinia.state.value).toEqual({
      a: { a: 'a' },
    })
  })

  it('does not mix up different applications', () => {
    const pinia1 = createPinia()
    const pinia2 = createPinia()
    useA(pinia1)
    useB(pinia2)
    expect(pinia1.state.value).toEqual({
      a: { a: 'a' },
    })
    expect(pinia2.state.value).toEqual({
      b: { b: 'b' },
    })
  })

  it('can hold multiple stores', () => {
    const pinia1 = createPinia()
    useA(pinia1)
    useB(pinia1)
    expect(pinia1.state.value).toEqual({
      a: { a: 'a' },
      b: { b: 'b' },
    })
  })
})
