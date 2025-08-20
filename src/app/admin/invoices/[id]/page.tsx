export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import InvoiceDetailClient from "./InvoiceDetailClient";

export default function Page({
  params,
}: {
  params: { id: string };
}): React.JSX.Element {
  return <InvoiceDetailClient invoiceId={params.id} />;
}
