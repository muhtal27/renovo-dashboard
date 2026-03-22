declare module 'pg' {
  export class Client {
    constructor(config?: unknown)
    connect(): Promise<void>
    end(): Promise<void>
    query<T = unknown>(text: string, values?: unknown[]): Promise<{ rows: T[]; rowCount: number | null }>
  }
}
