import { gql, useQuery } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Integration test for the api-search GraphQL data layer, exercised with Apollo's
 * MockedProvider. This test is intentionally SELF-CONTAINED: it defines its own
 * query document and a throwaway consumer component, so it validates two things
 * regardless of whether the feature UI exists yet:
 *
 *   1. The MockedProvider harness is correctly wired.
 *   2. The api-search response contract is handled correctly — every response
 *      carries an `error { message, code }` envelope even on HTTP 200, so the
 *      error path must be asserted explicitly (per the testing-agent rules).
 *
 * Schema mirrored from apps/api-search/src (search.resolver.ts / search.entities.ts):
 *   searchRestaurants(input) -> { results[RestaurantResult] total cached error }
 *   RestaurantResult: id name country city address email longitude? latitude? distanceKm?
 *   ErrorType: { message? code? }
 */

const SEARCH_RESTAURANTS = gql`
  query SearchRestaurants($input: SearchRestaurantsDto!) {
    searchRestaurants(input: $input) {
      results {
        id
        name
        country
        city
        address
        email
        longitude
        latitude
        distanceKm
      }
      total
      cached
      error {
        message
        code
      }
    }
  }
`;

type RestaurantResult = {
  id: string;
  name: string;
  country: string;
  city: string;
  address: string;
  email: string;
  longitude: number | null;
  latitude: number | null;
  distanceKm: number | null;
};

type SearchRestaurantsData = {
  searchRestaurants: {
    results: RestaurantResult[];
    total: number;
    cached: boolean;
    error: { message: string | null; code: string | null } | null;
  };
};

// Throwaway consumer that renders loading / error-envelope / success states.
function SearchConsumer({ query }: { query: string }) {
  const { data, loading } = useQuery<SearchRestaurantsData>(SEARCH_RESTAURANTS, {
    variables: { input: { query } },
  });

  if (loading) return <p role="status">Loading…</p>;

  const payload = data?.searchRestaurants;
  if (payload?.error) {
    return (
      <p role="alert" data-code={payload.error.code ?? ''}>
        {payload.error.message}
      </p>
    );
  }

  if (!payload || payload.results.length === 0) {
    return <p>No restaurants found</p>;
  }

  return (
    <ul aria-label="search results">
      {payload.results.map((r) => (
        <li key={r.id}>{r.name}</li>
      ))}
    </ul>
  );
}

const successMock = {
  request: {
    query: SEARCH_RESTAURANTS,
    variables: { input: { query: 'pizza' } },
  },
  result: {
    data: {
      searchRestaurants: {
        results: [
          {
            id: 'r1',
            name: 'Pizza Palace',
            country: 'US',
            city: 'New York',
            address: '5th Ave',
            email: 'pizzapalace@snackrapido.com',
            longitude: -73.9857,
            latitude: 40.7484,
            distanceKm: null,
          },
        ],
        total: 1,
        cached: false,
        error: null,
      },
    },
  },
};

// api-search returns errors inside the payload with HTTP 200 — not as a GraphQL error.
const errorEnvelopeMock = {
  request: {
    query: SEARCH_RESTAURANTS,
    variables: { input: { query: 'boom' } },
  },
  result: {
    data: {
      searchRestaurants: {
        results: [],
        total: 0,
        cached: false,
        error: {
          message: 'Search index unavailable',
          code: 'SEARCH_RESTAURANTS_FAILED',
        },
      },
    },
  },
};

describe('api-search contract via MockedProvider', () => {
  it('shows a loading state, then renders restaurant results on success', async () => {
    render(
      <MockedProvider mocks={[successMock]} addTypename={false}>
        <SearchConsumer query="pizza" />
      </MockedProvider>
    );

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

    expect(await screen.findByRole('list', { name: /search results/i })).toBeInTheDocument();
    expect(screen.getByText('Pizza Palace')).toBeInTheDocument();
  });

  it('surfaces the error envelope (message + code) returned on a 200 response', async () => {
    render(
      <MockedProvider mocks={[errorEnvelopeMock]} addTypename={false}>
        <SearchConsumer query="boom" />
      </MockedProvider>
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Search index unavailable');
    expect(alert).toHaveAttribute('data-code', 'SEARCH_RESTAURANTS_FAILED');
  });

  it('renders an empty state when there are no results and no error', async () => {
    const emptyMock = {
      request: {
        query: SEARCH_RESTAURANTS,
        variables: { input: { query: 'nothinghere' } },
      },
      result: {
        data: {
          searchRestaurants: { results: [], total: 0, cached: false, error: null },
        },
      },
    };

    render(
      <MockedProvider mocks={[emptyMock]} addTypename={false}>
        <SearchConsumer query="nothinghere" />
      </MockedProvider>
    );

    await waitFor(() =>
      expect(screen.getByText(/no restaurants found/i)).toBeInTheDocument()
    );
  });
});
