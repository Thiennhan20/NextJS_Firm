import { useEffect, useState, useRef } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

/**
 * Hook to detect when an element enters the viewport
 * Used for lazy loading components
 */
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '200px', // Load 200px before entering viewport
  triggerOnce = true,
}: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    // If already intersected and triggerOnce is true, don't observe again
    if (triggerOnce && hasIntersected) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting
        setIsIntersecting(isVisible)
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true)
          
          // If triggerOnce, disconnect after first intersection
          if (triggerOnce) {
            observer.disconnect()
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce, hasIntersected])

  return { targetRef, isIntersecting, hasIntersected }
}
