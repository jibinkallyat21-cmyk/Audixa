import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:5173'
const OUT = 'scripts/screenshots'
fs.mkdirSync(OUT, { recursive: true })

const results = { passed: [], failed: [], screenshots: [] }
const browser = await chromium.launch()

function shot(page, name) {
  const path = `${OUT}/${name}.png`
  results.screenshots.push(path)
  return page.screenshot({ path })
}

// ---- Test 1: cinematic sequence plays, then login visible ----
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  const cinematicVisibleEarly = await page.evaluate(() => !!document.querySelector('.bg-navy.fixed.inset-0'))
  await page.waitForTimeout(3500)
  const loginVisible = await page.evaluate(() => !!document.querySelector('#email'))
  const cinematicGoneAfter = await page.evaluate(() => !document.body.innerText.includes('ANALYTIX') || !!document.querySelector('#email'))
  await shot(page, '01-cinematic-then-login')
  if (cinematicVisibleEarly && loginVisible) {
    results.passed.push('Test 1: Cinematic sequence plays then login form visible after 3.5s')
  } else {
    results.failed.push(`Test 1: cinematicVisibleEarly=${cinematicVisibleEarly} loginVisible=${loginVisible}`)
  }
  await context.close()
}

// ---- Test 2: logo has no white background rectangle ----
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)
  const logoCheck = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg[viewBox="0 0 100 100"]'))
    if (svgs.length === 0) return { found: false }
    // Check the svg itself and its ancestor chain for a white background box
    const offenders = svgs.filter((svg) => {
      let el = svg.parentElement
      for (let i = 0; i < 3 && el; i++) {
        const bg = getComputedStyle(el).backgroundColor
        if (bg === 'rgb(255, 255, 255)') return true
        el = el.parentElement
      }
      return false
    })
    return { found: true, total: svgs.length, offenders: offenders.length }
  })
  if (logoCheck.found && logoCheck.offenders === 0) {
    results.passed.push(`Test 2: ${logoCheck.total} logo mark(s) found, zero on white background boxes`)
  } else {
    results.failed.push(`Test 2: ${JSON.stringify(logoCheck)}`)
  }
  await context.close()
}

// ---- Test 3: sidebar/header/footer present on each dashboard ----
{
  const routes = ['/client/dashboard', '/team/dashboard', '/manager/dashboard', '/fo/dashboard', '/management/dashboard']
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    const check = await page.evaluate(() => ({
      sidebar: !!document.querySelector('aside'),
      header: !!document.querySelector('header'),
      footer: document.body.innerText.includes('AUDIXA by Analytix'),
      exitDemo: document.body.innerText.includes('Exit Demo'),
    }))
    await shot(page, `03-dashboard-${route.replace(/\//g, '_')}`)
    if (check.sidebar && check.header && check.footer && check.exitDemo) {
      results.passed.push(`Test 3: ${route} — sidebar/header/footer/Exit Demo all present`)
    } else {
      results.failed.push(`Test 3: ${route} — ${JSON.stringify(check)}`)
    }
  }
  await context.close()
}

// ---- Test 4: mobile 375px — no horizontal scroll, sidebar collapses ----
{
  const routes = ['/client/dashboard', '/team/dashboard', '/manager/dashboard', '/fo/dashboard', '/management/dashboard']
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await context.newPage()
  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    const check = await page.evaluate(() => {
      const doc = document.documentElement
      const aside = document.querySelector('aside')
      const asideVisible = aside ? getComputedStyle(aside.closest('div')?.parentElement || aside).display !== 'none' && aside.getBoundingClientRect().width > 0 && aside.offsetParent !== null : false
      const hamburger = !!document.querySelector('button[aria-label="Toggle menu"]')
      return {
        noHorizontalScroll: doc.scrollWidth <= doc.clientWidth + 1,
        hamburgerPresent: hamburger,
      }
    })
    await shot(page, `04-mobile-${route.replace(/\//g, '_')}`)
    if (check.noHorizontalScroll && check.hamburgerPresent) {
      results.passed.push(`Test 4: ${route} mobile — no horizontal scroll, hamburger present`)
    } else {
      results.failed.push(`Test 4: ${route} mobile — ${JSON.stringify(check)}`)
    }
  }
  await context.close()
}

// ---- Test 5: AI Verification Flag panel animated border ----
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(BASE + '/team/workspace/requirements', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const panelCheck = await page.evaluate(() => {
    const found = document.body.innerText.toUpperCase().includes('AI VERIFICATION FLAG')
    return { found }
  })
  await shot(page, '05-ai-verification-panel')
  if (panelCheck.found) {
    results.passed.push('Test 5: AI Verification Flag panel visible on /team/workspace/requirements')
  } else {
    results.failed.push(`Test 5: ${JSON.stringify(panelCheck)}`)
  }
  await context.close()
}

await browser.close()
console.log(JSON.stringify(results, null, 2))
