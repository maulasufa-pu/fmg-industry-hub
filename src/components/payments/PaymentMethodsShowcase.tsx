import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import LocalizedText from "@/components/LocalizedText";

type PaymentMethod = {
  name: string;
  logo: string;
};

type PaymentGroup = {
  id: string;
  titleId: string;
  titleEn: string;
  methods: PaymentMethod[];
};

const PAYMENT_GROUPS: PaymentGroup[] = [
  {
    id: "bank-transfer",
    titleId: "Transfer bank & virtual account",
    titleEn: "Bank transfer & virtual account",
    methods: [
      { name: "BCA", logo: "/payment-methods/bca.svg" },
      { name: "BRI / BRIVA", logo: "/payment-methods/bri.svg" },
      { name: "BNI", logo: "/payment-methods/bni.svg" },
      { name: "Mandiri", logo: "/payment-methods/mandiri.svg" },
      { name: "PermataBank", logo: "/payment-methods/permata.svg" },
      { name: "CIMB Niaga", logo: "/payment-methods/cimb.svg" },
      { name: "Danamon", logo: "/payment-methods/danamon.svg" },
      { name: "BSI", logo: "/payment-methods/bsi.svg" },
      { name: "SeaBank", logo: "/payment-methods/seabank.svg" },
      { name: "Bank Saqu", logo: "/payment-methods/bank-saqu.svg" },
      { name: "ATM Bersama", logo: "/payment-methods/atm-bersama.webp" },
      { name: "PRIMA", logo: "/payment-methods/prima.webp" },
      { name: "ALTO", logo: "/payment-methods/alto.webp" },
    ],
  },
  {
    id: "wallet-qris",
    titleId: "E-wallet & QRIS",
    titleEn: "E-wallets & QRIS",
    methods: [
      { name: "GoPay", logo: "/payment-methods/gopay.webp" },
      { name: "QRIS", logo: "/payment-methods/qris.svg" },
      { name: "ShopeePay", logo: "/payment-methods/shopeepay.svg" },
      { name: "DANA", logo: "/payment-methods/dana.svg" },
      { name: "OVO", logo: "/payment-methods/ovo.svg" },
    ],
  },
  {
    id: "cards",
    titleId: "Kartu & pembayaran global",
    titleEn: "Cards & global payments",
    methods: [
      { name: "Visa", logo: "/payment-methods/visa.svg" },
      { name: "Mastercard", logo: "/payment-methods/mastercard.svg" },
      { name: "JCB", logo: "/payment-methods/jcb.svg" },
      { name: "American Express", logo: "/payment-methods/amex.svg" },
      { name: "UnionPay", logo: "/payment-methods/unionpay.svg" },
      { name: "Google Pay", logo: "/payment-methods/google-pay.svg" },
    ],
  },
  {
    id: "retail",
    titleId: "Gerai retail",
    titleEn: "Retail outlets",
    methods: [
      { name: "Indomaret", logo: "/payment-methods/indomaret.svg" },
      { name: "Alfamart", logo: "/payment-methods/alfamart.svg" },
      { name: "Alfamidi", logo: "/payment-methods/alfamidi.svg" },
      { name: "DAN+DAN", logo: "/payment-methods/dan-dan.webp" },
    ],
  },
  {
    id: "paylater",
    titleId: "PayLater",
    titleEn: "PayLater",
    methods: [
      { name: "Akulaku PayLater", logo: "/payment-methods/akulaku.svg" },
      { name: "Kredivo", logo: "/payment-methods/kredivo.svg" },
    ],
  },
];

export default function PaymentMethodsShowcase({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-slate-50/80 ${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"} dark:border-white/10 dark:bg-white/[0.04] ${className}`}
      aria-label="Payment methods supported through Midtrans"
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <LocalizedText id="Pembayaran aman" en="Secure payments" />
          </div>
          <h2 className={`${compact ? "mt-2 text-xl" : "mt-3 text-2xl sm:text-3xl"} font-bold tracking-tight text-slate-950 dark:text-white`}>
            <LocalizedText id="Pilih metode pembayaran yang paling nyaman." en="Choose the payment method that works for you." />
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <LocalizedText
              id="Pembayaran diproses dengan aman melalui Midtrans. Metode yang tampil saat checkout mengikuti channel yang aktif dan kelayakan transaksi."
              en="Payments are securely processed through Midtrans. Checkout options depend on active channels and transaction eligibility."
            />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10" data-no-translate>
          <span className="text-xs font-medium text-slate-500">Powered by</span>
          <Image src="/payment-methods/midtrans.svg" alt="Midtrans" width={112} height={30} className="h-7 w-auto" />
        </div>
      </div>

      <div className={`${compact ? "mt-6 space-y-5" : "mt-8 space-y-7"}`} data-no-translate>
        {PAYMENT_GROUPS.map((group) => (
          <div key={group.id}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <LocalizedText id={group.titleId} en={group.titleEn} />
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {group.methods.map((method) => (
                <div
                  key={method.name}
                  className="flex min-h-16 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  title={method.name}
                >
                  <Image
                    src={method.logo}
                    alt={method.name}
                    width={160}
                    height={56}
                    className="h-10 w-full max-w-40 object-contain"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs leading-5 text-slate-500 dark:text-slate-400">
        <LocalizedText
          id="Logo menunjukkan channel yang didukung Midtrans, bukan jaminan bahwa setiap channel tersedia untuk setiap transaksi."
          en="Logos indicate channels supported by Midtrans, not a guarantee that every channel is available for every transaction."
        />
      </p>
    </section>
  );
}
