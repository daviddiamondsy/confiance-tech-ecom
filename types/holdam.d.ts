declare module "@holdam/ts" {
  interface HoldamOptions {
    baseUrl?: string;
  }

  interface DealCreateParams {
    amount: number;
    currency: string;
    seller?: string;
    successUrl: string;
    cancelUrl: string;
    title: string;
    deliveryDays?: number;
    buyerFirstName: string;
    buyerLastName?: string;
    metadata?: Record<string, unknown>;
  }

  interface DealData {
    id: string;
    checkoutUrl: string;
    title?: string;
    status: string;
    amount: number;
    currency: string;
    deliveryDueAt?: string;
    createdAt?: string;
    metadata?: Record<string, unknown>;
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
