import { test, expect } from '@playwright/test';

/**
 * E2E SPEC (TDD) — restaurant-browsing flow for the customer app.
 *
 * Flow under test (from the testing-agent brief):
 *   type query -> results render -> "near me" -> card click -> restaurant page
 *
 * STATUS: the /restaurants browsing route and its components do not exist yet.
 * This spec is the executable acceptance criterion / NEEDS_CHANGES handoff.
 * It relies on the same data-testids as the component specs:
 *   - search-input        (inside SearchBar, role="searchbox")
 *   - near-me-button
 *   - restaurant-card      (one per result; links to /restaurants/:id)
 *   - results list labelled "search results"
 *
 * The near-me action uses geolocation; the test grants a mock position so the
 * app can call nearbyRestaurants without a permission prompt.
 */

test.use({
  permissions: ['geolocation'],
  geolocation: { latitude: 40.7484, longitude: -73.9857 }, // NYC
});

test.describe('Restaurant browsing', () => {
  test('search query renders results, then a card click opens the restaurant', async ({
    page,
  }) => {
    await page.goto('/restaurants');

    // 1. Type a query.
    const search = page.getByTestId('search-input');
    await expect(search).toBeVisible();
    await search.fill('pizza');

    // 2. Results render.
    const results = page.getByRole('list', { name: /search results/i });
    await expect(results).toBeVisible();
    const cards = page.getByTestId('restaurant-card');
    await expect(cards.first()).toBeVisible();

    // 3. Click the first card -> navigates to the restaurant detail route.
    await cards.first().click();
    await expect(page).toHaveURL(/\/restaurants\/.+/);
  });

  test('"near me" switches to nearby results using geolocation', async ({
    page,
  }) => {
    await page.goto('/restaurants');

    await page.getByTestId('near-me-button').click();

    const results = page.getByRole('list', { name: /search results/i });
    await expect(results).toBeVisible();
    // Nearby results surface a distance (e.g. "1.2 km away").
    await expect(page.getByText(/km/i).first()).toBeVisible();
  });

  test('shows an empty state for a query with no matches', async ({ page }) => {
    await page.goto('/restaurants');
    await page.getByTestId('search-input').fill('zzzzz-no-such-food');
    await expect(page.getByText(/no restaurants/i)).toBeVisible();
  });
});
