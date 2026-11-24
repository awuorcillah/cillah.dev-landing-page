"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

const CORE_PAGES = [
  { href: "/", label: "Home" },
  { href: "/our-services", label: "Services" },
  { href: "/book-consultation", label: "Consultation" },
] as const

function isInsideInteractiveOrScrollable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  let el: HTMLElement | null = target
  while (el && el !== document.body) {
    const tag = el.tagName
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      el.isContentEditable ||
      el.hasAttribute("data-no-swipe")
    ) {
      return true
    }
    const style = window.getComputedStyle(el)
    if (
      (style.overflowX === "auto" || style.overflowX === "scroll") &&
      el.scrollWidth > el.clientWidth + 6
    ) {
      return true
    }
    el = el.parentElement
  }
  return false
}

export function PageSwipeNavigator() {
  const pathname = usePathname()
  const router = useRouter()

  const currentIdx = CORE_PAGES.findIndex((p) => p.href === pathname)
  const prevPage = currentIdx > 0 ? CORE_PAGES[currentIdx - 1] : null
  const nextPage =
    currentIdx >= 0 && currentIdx < CORE_PAGES.length - 1
      ? CORE_PAGES[currentIdx + 1]
      : null

  const [dragState, setDragState] = useState<{
    direction: "prev" | "next"
    progress: number
  } | null>(null)

  const touchStartRef = useRef<{
    x: number
    y: number
    time: number
    locked: "horizontal" | "vertical" | null
    blocked: boolean
  } | null>(null)

  // Prefetch neighboring core pages immediately so swiping feels instantaneous
  useEffect(() => {
    if (prevPage) router.prefetch(prevPage.href)
    if (nextPage) router.prefetch(nextPage.href)
  }, [prevPage, nextPage, router])

  useEffect(() => {
    if (currentIdx === -1) return

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        locked: null,
        blocked: isInsideInteractiveOrScrollable(e.target),
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const state = touchStartRef.current
      if (!state || state.blocked || e.touches.length !== 1) return

      const touch = e.touches[0]
      const dx = touch.clientX - state.x
      const dy = touch.clientY - state.y
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (!state.locked) {
        if (absX < 14 && absY < 14) return
        if (absX > absY * 1.45) {
          state.locked = "horizontal"
        } else {
          state.locked = "vertical"
          return
        }
      }

      if (state.locked !== "horizontal") return

      // Swiping left (dx < 0) moves to nextPage; swiping right (dx > 0) moves to prevPage
      if (dx < 0 && nextPage) {
        const progress = Math.min(1, Math.abs(dx) / 90)
        setDragState({ direction: "next", progress })
      } else if (dx > 0 && prevPage) {
        const progress = Math.min(1, Math.abs(dx) / 90)
        setDragState({ direction: "prev", progress })
      } else {
        setDragState(null)
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      const state = touchStartRef.current
      touchStartRef.current = null
      setDragState(null)

      if (!state || state.blocked || state.locked !== "horizontal") return
      const touch = e.changedTouches[0]
      if (!touch) return

      const dx = touch.clientX - state.x
      const dy = touch.clientY - state.y
      const elapsed = Date.now() - state.time
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      // Accept either a confident swipe (>= 68px) or a crisp quick flick (>= 44px in < 260ms)
      const isValidSwipe =
        absX > absY * 1.4 && (absX >= 68 || (absX >= 44 && elapsed < 260))

      if (!isValidSwipe) return

      if (dx < 0 && nextPage) {
        router.push(nextPage.href)
      } else if (dx > 0 && prevPage) {
        router.push(prevPage.href)
      }
    }

    const onTouchCancel = () => {
      touchStartRef.current = null
      setDragState(null)
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    window.addEventListener("touchcancel", onTouchCancel, { passive: true })

    return () => {
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("touchcancel", onTouchCancel)
    }
  }, [currentIdx, prevPage, nextPage, router])

  if (!dragState) return null

  const target = dragState.direction === "next" ? nextPage : prevPage
  if (!target) return null

  const isNext = dragState.direction === "next"
  const ready = dragState.progress >= 0.78

  return (
    <div
      aria-hidden="true"
      className={`fixed top-1/2 -translate-y-1/2 z-50 pointer-events-none transition-transform duration-75 ${
        isNext ? "right-3" : "left-3"
      }`}
      style={{
        opacity: Math.max(0.25, dragState.progress),
        transform: `translateY(-50%) translateX(${
          isNext ? (1 - dragState.progress) * 18 : -(1 - dragState.progress) * 18
        }px) scale(${0.92 + dragState.progress * 0.08})`,
      }}
    >
      <div
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-xl border text-xs font-heading font-semibold tracking-wide shadow-2xl ${
          ready
            ? "bg-[#C9A66B] text-[#141418] border-[#C9A66B]"
            : "bg-[#141418]/90 text-[#F9F7F6] border-[#C9A66B]/45"
        }`}
      >
        {!isNext && <ChevronLeft className="h-3.5 w-3.5" />}
        <span>{target.label}</span>
        {isNext && <ChevronRight className="h-3.5 w-3.5" />}
      </div>
    </div>
  )
}
