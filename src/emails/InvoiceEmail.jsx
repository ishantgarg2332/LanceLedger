import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';

export const InvoiceEmail = ({ invoiceNumber, clientName, amount, dueDate, paymentLink, companyName }) => (
  <Html>
    <Head />
    <Preview>Your invoice {invoiceNumber} from {companyName || 'Us'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Invoice {invoiceNumber}</Heading>
        <Text style={text}>Hi {clientName},</Text>
        <Text style={text}>
          This is a friendly reminder that invoice {invoiceNumber} for {amount} is due on {dueDate}.
        </Text>
        {paymentLink && (
          <Text style={text}>
            You can securely pay this invoice online by clicking the link below:
          </Text>
        )}
        {paymentLink && (
          <Link href={paymentLink} style={button}>
            Pay Invoice Now
          </Link>
        )}
        <Text style={text}>
          Thank you for your business!
        </Text>
        <Text style={footer}>
          {companyName || 'Your Freelancer'}
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0 48px',
  margin: '30px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  marginTop: '32px',
};

const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  width: '200px',
  padding: '12px',
  margin: '30px 48px',
};

export default InvoiceEmail;
