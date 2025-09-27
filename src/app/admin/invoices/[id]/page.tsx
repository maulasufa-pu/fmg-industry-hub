export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const dynamicParams = true;

import { use } from "react";
import InvoiceDetailClient from "@/app/ui/panel/invoices/components/InvoiceDetailClient";

type Params = { id: string };

export default function Page({ params }: { params: Promise<Params> }) {
  const { id } = use(params);
  return <InvoiceDetailClient invoiceId={id} />;
}
