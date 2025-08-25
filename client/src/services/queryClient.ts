import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

// Error handler for queries
const queryErrorHandler = (error: unknown, query: any) => {
  console.warn("Query error:", {
    queryKey: query.queryKey,
    error: error instanceof Error ? error.message : "Unknown error",
  });
};

// Error handler for mutations
const mutationErrorHandler = (
  error: unknown,
  variables: any,
  context: any,
  mutation: any
) => {
  console.warn("Mutation error:", {
    mutationKey: mutation.options.mutationKey,
    error: error instanceof Error ? error.message : "Unknown error",
  });
};

// Create query cache with error handling
const queryCache = new QueryCache({
  onError: queryErrorHandler,
});

// Create mutation cache with error handling
const mutationCache = new MutationCache({
  onError: mutationErrorHandler,
});

// Create QueryClient instance
const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
      gcTime: 15 * 60 * 1000, // 15 minutes - cache garbage collection

      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Refetch on mount if data is stale
      refetchOnReconnect: "always",
      refetchInterval: false,

      // Performance optimizations
      structuralSharing: true, // Enable structural sharing for better performance

      // Network mode - handle offline scenarios
      networkMode: "online",
    },
    mutations: {
      retry: 1,
      networkMode: "online",
    },
  },
});

export { queryClient };
export default queryClient;
