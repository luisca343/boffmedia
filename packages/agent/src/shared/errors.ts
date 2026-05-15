export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'AgentError'
  }
}

export class GuardrailError extends AgentError {
  constructor(
    public readonly violations: Array<{ path: string; reason: string }>
  ) {
    super(
      `Guardrail violation: ${violations.map(v => v.path).join(', ')}`,
      'GUARDRAIL_VIOLATION'
    )
    this.name = 'GuardrailError'
  }
}
