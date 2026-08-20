const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto('http://localhost:5173/?example=page-patterns');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => {
    function rect(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { sel, w: r.width, h: r.height, x: r.x };
    }
    const shell = document.querySelector('.shell-layout');
    return {
      dataMobile: shell ? shell.getAttribute('data-mobile') : null,
      sidebarCol: rect('.shell-layout__sidebar-col'),
      canvas: rect('.shell-layout__canvas'),
      configTilesContainer: rect('[data-testid="config-tiles-container"]'),
      configTile: rect('[class*="config-tile"]'),
      quickAccessTile: rect('[data-testid="quick-access-tile"]'),
      activityTimeline: rect('[class*="activity-timeline"]'),
      bodyWidth: document.body.getBoundingClientRect().width,
      innerWidth: window.innerWidth,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
