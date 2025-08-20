// types/midtrans-client.d.ts
declare module "midtrans-client" {
  export interface SnapOptions { isProduction: boolean; serverKey: string; clientKey?: string }
  export interface TransactionDetails { order_id: string; gross_amount: number }
  export interface CustomerDetails { first_name?: string; last_name?: string; email?: string; phone?: string }
  export interface ItemDetail { id?: string|number; price: number; quantity: number; name: string; brand?: string; category?: string; merchant_name?: string }
  export interface CreditCardOptions { secure?: boolean }
  export interface Callbacks { finish?: string }
  export interface CreateTransactionParams {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    item_details?: ItemDetail[];
    credit_card?: CreditCardOptions;
    callbacks?: Callbacks;
    [k: string]: unknown;
  }
  export interface CreateTransactionResponse { token: string; redirect_url: string; [k: string]: unknown }
  export class Snap {
    constructor(options: SnapOptions);
    createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResponse>;
  }
  const _default: { Snap: typeof Snap };
  export default _default;
}
