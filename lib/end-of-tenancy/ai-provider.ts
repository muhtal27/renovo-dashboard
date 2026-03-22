type GenerateStructuredObjectInput = {
  systemPrompt: string
  userPrompt: string
}

export type StructuredObjectResult = {
  model: string
  outputText: string
}

export interface EndOfTenancyAiProvider {
  generateStructuredObject(input: GenerateStructuredObjectInput): Promise<StructuredObjectResult>
}

class OpenAiEndOfTenancyProvider implements EndOfTenancyAiProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  async generateStructuredObject(input: GenerateStructuredObjectInput): Promise<StructuredObjectResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: {
          type: 'json_object',
        },
        messages: [
          {
            role: 'system',
            content: input.systemPrompt,
          },
          {
            role: 'user',
            content: input.userPrompt,
          },
        ],
      }),
    })

    const json = (await response.json().catch(() => null)) as
      | {
          error?: { message?: string }
          choices?: Array<{
            message?: {
              content?: string | null
            }
          }>
        }
      | null

    if (!response.ok) {
      throw new Error(json?.error?.message || 'End-of-tenancy AI request failed.')
    }

    const outputText = json?.choices?.[0]?.message?.content?.trim()

    if (!outputText) {
      throw new Error('End-of-tenancy AI returned an empty response.')
    }

    return {
      model: this.model,
      outputText,
    }
  }
}

export function isEndOfTenancyAiProviderConfigured() {
  return Boolean(process.env.OPENAI_API_KEY && process.env.END_OF_TENANCY_AI_MODEL)
}

export function getDefaultEndOfTenancyAiProvider(): EndOfTenancyAiProvider {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.END_OF_TENANCY_AI_MODEL

  if (!apiKey || !model) {
    throw new Error(
      'AI drafting is not configured.'
    )
  }

  // Provider-specific logic stays isolated here so the EOT workflow can swap vendors later.
  return new OpenAiEndOfTenancyProvider(apiKey, model)
}
