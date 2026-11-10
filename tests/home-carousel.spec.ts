import { test, expect, type Page } from "@playwright/test";
import { installConsoleMocks } from "./helpers/console-mocks";

/**
 * Home carousel: exactly one card per view at every width. Desktop showed
 * a sliver of the previous card (slides were 78–86% wide inside a strip
 * that bled into the page gutter).
 */

/** How many slides intersect the strip's visible box, and how much. */
async function visibleSlides(page: Page) {
  return page.getByTestId("home-carousel").evaluate((ul) => {
    const box = ul.getBoundingClientRect();
    return Array.from(ul.children).map((li) => {
      const r = li.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(r.right, box.right) - Math.max(r.left, box.left));
      return Math.round((overlap / box.width) * 100);
    }).filter((pct) => pct > 0);
  });
}

for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`one card fills the carousel at ${vp.width}px, no neighbour peeks`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(vp);
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app");
    const strip = page.getByTestId("home-carousel");
    await expect(strip).toBeVisible({ timeout: 20_000 });

    expect(await visibleSlides(page)).toEqual([100]);

    // Dots jump to a card; it lands exactly, still one card in view.
    await page.getByRole("button", { name: /^Show / }).nth(2).click();
    await expect.poll(() => visibleSlides(page)).toEqual([100]);
    await expect.poll(() => strip.evaluate((ul) => Math.round(ul.scrollLeft / ul.clientWidth))).toBe(2);

    // A partial scroll snaps back to a single card.
    await strip.evaluate((ul) => ul.scrollTo({ left: ul.clientWidth * 0.6 }));
    await expect.poll(() => visibleSlides(page), { timeout: 5_000 }).toEqual([100]);

    // Rates strip stays inside the column (no bleed past the content edge).
    const inside = await page.getByTestId("rates-strip").evaluate((ul) => {
      const r = ul.getBoundingClientRect();
      const col = (ul.closest("section")?.parentElement as HTMLElement).getBoundingClientRect();
      return r.left >= col.left - 1 && r.right <= col.right + 1;
    });
    expect(inside).toBe(true);
  });
}
