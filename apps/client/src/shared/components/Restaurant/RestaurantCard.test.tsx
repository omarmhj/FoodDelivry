import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

/**
 * COMPONENT SPEC (TDD) for RestaurantCard — restaurant-browsing feature.
 *
 * STATUS: RestaurantCard does not exist yet. This file is an executable
 * specification / NEEDS_CHANGES handoff for the frontend-builder agent.
 * It will fail with "Cannot find module './RestaurantCard'" until the
 * component is created at:
 *
 *   apps/client/src/shared/components/Restaurant/RestaurantCard.tsx
 *
 * Required props (typed, exported as `RestaurantCardProps`):
 *   restaurant: {
 *     id: string; name: string; city: string; address: string;
 *     distanceKm?: number | null;   // populated by nearbyRestaurants
 *     imageUrl?: string;
 *     rating?: number;              // presentation-only (design system)
 *     etaMinutes?: number;
 *     deliveryFee?: number;         // 0 => "Free delivery"
 *     cuisines?: string[];
 *   };
 *   href?: string;                  // defaults to `/restaurants/${id}`
 *   onSelect?: (id: string) => void;
 *
 * Required contract:
 *   - Root element has data-testid="restaurant-card" and is a keyboard-focusable
 *     link (role="link") whose accessible name includes the restaurant name.
 *   - Renders name as a heading, plus city/address.
 *   - Shows "<n> km away" when distanceKm is provided.
 *   - Shows rating, ETA and delivery fee when provided; "Free delivery" when fee is 0.
 *   - Image (if present) has non-empty alt text.
 *   - No axe accessibility violations.
 */
import RestaurantCard from './RestaurantCard';

const baseRestaurant = {
  id: 'r1',
  name: 'Pizza Palace',
  city: 'New York',
  address: '5th Ave',
  imageUrl: 'https://images.example/pizza.jpg',
  rating: 4.6,
  etaMinutes: 25,
  deliveryFee: 0,
  cuisines: ['Pizza', 'Italian'],
};

describe('RestaurantCard', () => {
  it('renders the restaurant name and location', () => {
    render(<RestaurantCard restaurant={baseRestaurant} />);
    expect(
      screen.getByRole('heading', { name: /pizza palace/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/new york/i)).toBeInTheDocument();
  });

  it('is a focusable link pointing at the restaurant detail route', () => {
    render(<RestaurantCard restaurant={baseRestaurant} />);
    const card = screen.getByTestId('restaurant-card');
    expect(card).toHaveAttribute('href', '/restaurants/r1');
    card.focus();
    expect(card).toHaveFocus();
  });

  it('shows distance when distanceKm is provided (nearby results)', () => {
    render(
      <RestaurantCard restaurant={{ ...baseRestaurant, distanceKm: 1.2 }} />
    );
    expect(screen.getByText(/1\.2\s*km/i)).toBeInTheDocument();
  });

  it('shows rating, ETA and "Free delivery" when fee is 0', () => {
    render(<RestaurantCard restaurant={baseRestaurant} />);
    expect(screen.getByText(/4\.6/)).toBeInTheDocument();
    expect(screen.getByText(/25\s*min/i)).toBeInTheDocument();
    expect(screen.getByText(/free delivery/i)).toBeInTheDocument();
  });

  it('renders cuisine tags', () => {
    render(<RestaurantCard restaurant={baseRestaurant} />);
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
  });

  it('gives its image meaningful alt text', () => {
    render(<RestaurantCard restaurant={baseRestaurant} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAccessibleName(expect.stringMatching(/pizza palace/i));
  });

  it('calls onSelect with the restaurant id when activated', async () => {
    const onSelect = jest.fn();
    render(<RestaurantCard restaurant={baseRestaurant} onSelect={onSelect} />);
    await userEvent.click(screen.getByTestId('restaurant-card'));
    expect(onSelect).toHaveBeenCalledWith('r1');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<RestaurantCard restaurant={baseRestaurant} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
