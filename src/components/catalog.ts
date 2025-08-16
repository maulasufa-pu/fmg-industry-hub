export type ServiceGroup = "core" | "additional" | "business";

export type ServiceRow = {
  id: string;
  service_key: string;
  label: string;
  group_name: ServiceGroup;
  price: number;
  is_subscription: boolean;
  is_active: boolean;
  sort_order: number;
};

export type BundleRow = {
  id: string;
  bundle_key: string;
  label: string;
  bundle_price: number;
  note: string | null;
  is_active: boolean;
  sort_order: number;
};

export type BundleItemRow = {
  id: string;
  bundle_id: string;
  service_id: string;
};

export type BundleWithItems = BundleRow & {
  items: Array<Pick<ServiceRow, "id" | "service_key" | "label">>;
};
