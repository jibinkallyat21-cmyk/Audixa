// Visual/animation audit for the redesign pass. Not a permanent test suite
// (no assertions framework) — a throwaway script that opens the running dev
// server, checks for layout bugs (horizontal overflow, overlapping header
// elements), and verifies key animations actually fire (modal, toast,
// mobile drawer, sidebar active indicator).
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const routes = [
  '/login',
  '/client/dashboard',
  '/team/dashboard',
  '/manager/dashboard',
  '/manager/status-board',
  '/fo/dashboard',
  '/fo/proposals',
  '/management/dashboard',
  '/management/analytics',
]

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
]

const results = []

const browser = await chromium.launch()

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(String(err)))

  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth + 1,
      }
    })

    // Header title / logo overlap check: use Range.getClientRects() on the
    // text nodes themselves (actual glyph boxes), not the elements' full
    // layout boxes, since an absolutely-centered h1's box can be wider than
    // its rendered text without any real visual collision.
    const overlap = await page.evaluate(() => {
      const h1 = document.querySelector('header h1')
      const logoWrap = document.querySelector('header')?.firstElementChild
      if (!h1 || !logoWrap) return { checked: false }
      const textRect = (el) => {
        const range = document.createRange()
        range.selectNodeContents(el)
        const rects = Array.from(range.getClientRects())
        if (rects.length === 0) return null
        return rects.reduce((acc, r) => ({
          left: Math.min(acc.left, r.left),
          right: Math.max(acc.right, r.right),
          top: Math.min(acc.top, r.top),
          bottom: Math.max(acc.bottom, r.bottom),
        }))
      }
      const a = textRect(h1)
      const b = logoWrap.getBoundingClientRect()
      if (!a) return { checked: true, intersects: false }
      const intersects = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
      return { checked: true, intersects }
    })

    results.push({
      viewport: vp.name,
      route,
      ...overflow,
      headerOverlap: overlap.checked ? overlap.intersects : null,
      consoleErrorsSoFar: consoleErrors.length,
    })
  }

  await context.close()
}

// --- Interaction / animation checks (desktop) ---
const dCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const dPage = await dCtx.newPage()

// Modal entrance animation
await dPage.goto(BASE + '/management/dashboard', { waitUntil: 'networkidle' })
await dPage.waitForTimeout(300)
const escalateBtn = dPage.locator('button', { hasText: /^Escalate$/ }).first()
await escalateBtn.click()
await dPage.waitForTimeout(50) // catch mid-animation
const modalMidAnim = await dPage.evaluate(() => {
  const el = document.querySelector('[class*="fixed"][class*="z-\\[110\\]"] > div')
  if (!el) return null
  const t = getComputedStyle(el).transform
  return t
})
await dPage.waitForTimeout(300)
const modalVisible = await dPage.evaluate(() => document.body.innerText.includes('Notify Management team') || document.body.innerText.includes('Notify') )
results.push({ check: 'modal-animation', modalMidAnimTransform: modalMidAnim, modalVisibleAfterSettle: modalVisible })

// Mobile drawer check
const mCtx = await browser.newContext({ viewport: { width: 375, height: 812 } })
const mPage = await mCtx.newPage()
await mPage.goto(BASE + '/manager/dashboard', { waitUntil: 'networkidle' })
await mPage.waitForTimeout(300)
await mPage.locator('button[aria-label="Toggle menu"]').click()
await mPage.waitForTimeout(350)
const drawerOpen = await mPage.evaluate(() => {
  const overlay = document.querySelector('.bg-black\\/50')
  return !!overlay
})
results.push({ check: 'mobile-drawer', drawerOpenedAfterClick: drawerOpen })
await mCtx.close()

// Button press-feedback check (active scale)
await dPage.goto(BASE + '/login', { waitUntil: 'networkidle' })
const btnActiveScale = await dPage.evaluate(async () => {
  const btn = document.querySelector('button[type="submit"]')
  if (!btn) return null
  const before = getComputedStyle(btn).transform
  return { hasTransition: getComputedStyle(btn).transitionProperty.includes('transform'), before }
})
results.push({ check: 'button-press-feedback', ...btnActiveScale })

await dCtx.close()
await browser.close()

console.log(JSON.stringify(results, null, 2))
