import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { InvoiceEmail } from '@/emails/InvoiceEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, clientName, invoiceNumber, amount, dueDate, paymentLink, companyName } = await req.json();

    if (!email || !invoiceNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Invoices <onboarding@resend.dev>', // Update this when domain is verified
      to: [email],
      subject: `Invoice ${invoiceNumber} from ${companyName || 'Us'}`,
      react: InvoiceEmail({ invoiceNumber, clientName, amount, dueDate, paymentLink, companyName }),
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
