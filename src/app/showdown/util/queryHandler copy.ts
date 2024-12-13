import { QueryHandlers, QueryType, ShowdownMessage, UpdateUserArgs, ChallstrArgs, FormatArgs } from './types'

const queryHandlers: QueryHandlers = {
  updateuser: (args: UpdateUserArgs) => {
    const [, fullName, namedCode, avatar, userData] = args
    return { 
      fullName, 
      namedCode: parseInt(namedCode), 
      avatar, 
      userData: JSON.parse(userData) 
    }
  },
  challstr: (args: ChallstrArgs) => {
    const [, challstr] = args
    return { challstr }
  },
   formats: (args: FormatArgs) => {
    const [, formats] = args
    return formats
   }
    
}

function handleQuery<T extends QueryType>(message: ShowdownMessage): ReturnType<QueryHandlers[T]> {
  const [queryType, ...args] = message
  const handler = queryHandlers[queryType as T]
  
  if (!handler) {
    console.error(`Unhandled query type: ${queryType}`)
    return message as any
  }
  
  return handler(message as any) as ReturnType<QueryHandlers[T]>
}

export default handleQuery

