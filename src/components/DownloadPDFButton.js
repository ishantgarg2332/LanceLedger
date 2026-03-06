"use client";

import dynamic from 'next/dynamic';
import { Download } from 'lucide-react';
import { InvoicePDF } from './InvoicePDF';

// We must dynamically import the PDFDownloadLink because it relies on browser APIs
// that cause hydration errors if rendered on the server.
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false, loading: () => <button className="p-2 text-foreground/20 rounded-lg cursor-not-allowed"><Download className="w-4 h-4" /></button> }
);

export default function DownloadPDFButton({ invoice, client, currencySymbol = '$', settings = {} }) {
  if (!invoice || !client) return null;

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} client={client} currencySymbol={currencySymbol} settings={settings} origin={typeof window !== 'undefined' ? window.location.origin : ''} />}
      fileName={`Invoice_${invoice.number}.pdf`}
      className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center"
      title="Download PDF"
    >
      {({ blob, url, loading, error }) => (
        <Download className={`w-4 h-4 ${loading ? 'opacity-50 animate-pulse' : ''}`} />
      )}
    </PDFDownloadLink>
  );
}
