import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'normal',
    color: '#8b5cf6', // Primary color
  },
  companyDetails: {
    alignItems: 'flex-end',
    color: '#666',
  },
  invoiceDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  billTo: {
    width: '50%',
  },
  billToTitle: {
    color: '#666',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#111',
  },
  metaData: {
    width: '40%',
    alignItems: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    width: '100%',
  },
  metaLabel: {
    color: '#666',
    width: 60,
    textAlign: 'right',
  },
  metaValue: {
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right',
  },
  table: {
    width: '100%',
    marginBottom: 40,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
    marginBottom: 8,
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  th: { color: '#666', fontWeight: 'bold' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  totals: {
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
    width: 200,
  },
  totalLabel: {
    color: '#666',
    width: 100,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    width: 80,
    textAlign: 'right',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  payLink: {
    color: '#8b5cf6',
    textDecoration: 'none',
    fontWeight: 'bold',
    marginTop: 12,
    fontSize: 12,
  },
  notes: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  notesTitle: {
    color: '#666',
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  }
});

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export const InvoicePDF = ({ invoice, client, origin }) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>INVOICE</Text>
        </View>
        <View style={styles.companyDetails}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 2 }}>LanceLedger Pro</Text>
          <Text>123 Freelance Ave</Text>
          <Text>San Francisco, CA 94105</Text>
          <Text>hello@LanceLedger.com</Text>
        </View>
      </View>

      {/* Bill To & Meta */}
      <View style={styles.invoiceDetailsRow}>
        <View style={styles.billTo}>
          <Text style={styles.billToTitle}>BILL TO:</Text>
          <Text style={styles.clientName}>{client?.name}</Text>
          {client?.company && <Text>{client.company}</Text>}
          {client?.address && <Text>{client.address}</Text>}
          {client?.email && <Text>{client.email}</Text>}
        </View>
        <View style={styles.metaData}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Invoice #:</Text>
            <Text style={styles.metaValue}>{invoice.number}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date:</Text>
            <Text style={styles.metaValue}>{new Date(invoice.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Due Date:</Text>
            <Text style={styles.metaValue}>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>

      {/* Line Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.col1, styles.th]}>Description</Text>
          <Text style={[styles.col2, styles.th]}>Qty</Text>
          <Text style={[styles.col3, styles.th]}>Rate</Text>
          <Text style={[styles.col4, styles.th]}>Amount</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>{item.description}</Text>
            <Text style={styles.col2}>{item.qty}</Text>
            <Text style={styles.col3}>{formatCurrency(item.rate)}</Text>
            <Text style={styles.col4}>{formatCurrency(item.qty * item.rate)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({invoice.taxRate || 0}%):</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.tax)}</Text>
        </View>
        <View style={[styles.totalRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#eee' }]}>
          <Text style={[styles.totalLabel, { color: '#111', fontWeight: 'bold' }]}>Total Due:</Text>
          <Text style={[styles.totalValue, styles.grandTotal]}>{formatCurrency(invoice.total)}</Text>
        </View>
        {invoice.status !== 'Paid' && origin && (
          <Link src={`${origin}/api/checkout?id=${invoice.id}`} style={styles.payLink}>
            Pay Online ➔
          </Link>
        )}
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Notes:</Text>
          <Text>{invoice.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for your business! Please make payment within the due date stated above.</Text>
      </View>

    </Page>
  </Document>
);
