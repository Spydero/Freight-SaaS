"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Badge, Button, Card, PageHeader, statusTone } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/utils";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<any>(null);
  const [pdf, setPdf] = useState<any>(null);

  useEffect(() => {
    api<{ quote: any }>(`/v1/quotes/${id}`).then((r) => setQuote(r.quote));
    api<{ pdf: any }>(`/v1/quotes/${id}/pdf-data`).then((r) => setPdf(r.pdf));
  }, [id]);

  function printPdf() {
    if (!pdf) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${pdf.title}</title>
      <style>body{font-family:system-ui;padding:40px;color:#111}table{width:100%;border-collapse:collapse;margin-top:24px}
      td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}h1{margin:0}</style></head><body>
      <h1>${pdf.title}</h1>
      <p>${pdf.organization} · Prepared by ${pdf.preparedBy}</p>
      <p>Valid until ${new Date(pdf.validUntil).toLocaleDateString()}</p>
      <table><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead><tbody>
      ${pdf.lineItems
        .map(
          (li: any) =>
            `<tr><td>${li.description}</td><td>${li.quantity}</td><td>${li.unitPrice}</td><td>${li.amount}</td></tr>`,
        )
        .join("")}
      </tbody></table>
      <p style="margin-top:24px;font-size:18px"><strong>Total ${pdf.currency} ${pdf.total.toFixed(2)}</strong></p>
      ${pdf.notes ? `<p>${pdf.notes}</p>` : ""}
      </body></html>`);
    w.document.close();
    w.print();
  }

  if (!quote) return <p className="text-white/50">Loading…</p>;

  return (
    <div>
      <PageHeader
        title={`Quote ${quote.id.slice(-6).toUpperCase()}`}
        description={quote.organization.name}
        actions={
          <>
            <Link href="/app/quotes">
              <Button variant="ghost">Back</Button>
            </Link>
            <Button onClick={printPdf}>Download / Print PDF</Button>
          </>
        }
      />
      <Card className="p-6">
        <Badge tone={statusTone(quote.status)}>{quote.status}</Badge>
        <p className="mt-4 text-2xl text-[var(--gold-soft)]">
          {formatMoney(Number(quote.total), quote.currency)}
        </p>
        <p className="mt-2 text-sm text-white/55">Valid until {formatDate(quote.validUntil)}</p>
        <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Unit</th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((li: any) => (
                <tr key={li.id} className="border-t border-white/10">
                  <td className="px-3 py-2">{li.description}</td>
                  <td className="px-3 py-2 text-right">{li.quantity}</td>
                  <td className="px-3 py-2 text-right">{formatMoney(Number(li.unitPrice), quote.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
