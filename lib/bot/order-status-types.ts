/** Response shape for GET /api/bot/order-status (WhatsApp bot OrderStatusPort). */
export type OrderStatusSnapshot = {
  referenceId: string;
  status: string;
  statusCode?: string;
  escrowSecured?: boolean;
  dispatchEta?: string;
  deliveryDueDate?: string;
  postPurchaseUrl?: string;
  isDeliveryOverdue?: boolean;
  productName?: string;
  lastUpdatedAt?: string;
};
