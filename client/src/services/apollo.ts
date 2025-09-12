import { ApolloClient, InMemoryCache, createHttpLink, split, ApolloLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { onError } from '@apollo/client/link/error'

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth-storage')
  const authData = token ? JSON.parse(token) : null
  
  return {
    headers: {
      ...headers,
      authorization: authData?.state?.token ? `Bearer ${authData.state.token}` : '',
    }
  }
})

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    )
  }
  if (networkError) {
    console.log(`[Network error]: ${networkError}`)
  }
})

// Create WebSocket link with better error handling
let wsLink: ApolloLink | null = null
try {
  // Only create WebSocket link if we're in a browser environment
  if (typeof window !== 'undefined' && 'WebSocket' in window) {
    wsLink = new WebSocketLink({
      uri: (import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql')
        .replace('https', 'wss')
        .replace('http', 'ws'),
      options: {
        reconnect: true,
        lazy: true,
        timeout: 30000,
        connectionParams: () => {
          const token = localStorage.getItem('auth-storage')
          const authData = token ? JSON.parse(token) : null
          return {
            authorization: authData?.state?.token ? `Bearer ${authData.state.token}` : '',
          }
        },
      },
    })
  }
} catch (error) {
  console.log('WebSocket not available, using HTTP only')
}

// Use split link only if WebSocket is available
const link = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        )
      },
      wsLink,
      errorLink.concat(authLink.concat(httpLink))
    )
  : errorLink.concat(authLink.concat(httpLink))

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})