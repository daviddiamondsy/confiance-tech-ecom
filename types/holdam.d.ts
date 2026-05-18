declare module "@holdam/ts" {
  interface HoldamOptions {
    baseUrl?: string;
  }

  interface DealCreateParams {
    amount: number;
    currency: string;
    seller: string;
    successUrl: string;
    cancelUrl: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }

  interface DealData {
    id: string;
    checkoutUrl: string;
    status: string;
    amount: number;
    currency: string;
  }

  interface HoldamResponse<T> {
    data: T;
  }

  interface Deals {
    create(params: DealCreateParams): Promise<HoldamResponse<DealData>>;
  }

  interface Webhooks {
    verifySignature(payload: Buffer | string, signature: string, secret: string): boolean;
  }

  class Holdam {
    deals: Deals;
    webhooks: Webhooks;
    constructor(apiKey: string, options?: HoldamOptions);
  }

  export default Holdam;
}
