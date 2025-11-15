import { useCallback, useEffect, useRef, useState } from 'react'

const isBrowser = () => typeof window !== 'undefined'

export function usePersistentState<T>(key: string, initialValue: T | (() => T)) {
  const initialize = useCallback(() => {
    if (!isBrowser()) {
      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
    }
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) {
        return JSON.parse(stored) as T
      }
    } catch {}
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
  }, [initialValue, key])

  const [value, setValue] = useState<T>(initialize)
  const keyRef = useRef(key)

  useEffect(() => {
    keyRef.current = key
  }, [key])

  useEffect(() => {
    if (!isBrowser()) {
      return
    }
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value))
    } catch {}
  }, [value])

  const setPersistedValue = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (current: T) => T)(prev) : next
        return resolved
      })
    },
    [setValue],
  )

  return [value, setPersistedValue] as const
}
