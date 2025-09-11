import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'

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

const wsLink = new WebSocketLink({
  uri: (import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql').replace('http', 'ws'),
  options: {
    reconnect: true,
    connectionParams: {
      authorization: localStorage.getItem('auth-storage') 
        ? `Bearer ${JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token}` 
        : '',
    },
  },
})

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  authLink.concat(httpLink),
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})