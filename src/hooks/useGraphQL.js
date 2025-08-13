import { useState, useCallback } from 'react';

export function useGraphQL() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const query = useCallback(async (queryString, variables = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryString,
          variables,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { query, loading, error };
}

// GraphQL queries
export const QUERIES = {
  GET_METRICS: `
    query GetMetrics {
      metrics {
        avgHoursPerDay
        peoplePerDay {
          day
          count
        }
        totalHoursPerStaff {
          userId
          userName
          hours
        }
      }
    }
  `,
  
  GET_SHIFTS: `
    query GetShifts {
      shifts {
        id
        userId
        clockInAt
        clockOutAt
        clockInLat
        clockInLng
        clockOutLat
        clockOutLng
        clockInNote
        clockOutNote
        user {
          name
          email
        }
      }
    }
  `,
  
  GET_ACTIVE_SHIFTS: `
    query GetActiveShifts {
      activeShifts {
        id
        userId
        clockInAt
        clockInLat
        clockInLng
        clockInNote
        user {
          name
          email
        }
      }
    }
  `
};
