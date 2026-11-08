import React from 'react';
import { Link } from 'react-router-dom';

// Plain-language starter pages for Privacy, Terms and Refunds.
// They describe how the product works today. Have them reviewed by a lawyer before relying on them.

const EFFECTIVE = 'November 2026';

const PAGES = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'We collect only what we need to book home services for you.',
    sections: [
      ['What we collect', 'Your name, email address, phone number, the addresses you save, and the details of your bookings (service, date, time, address, notes). Workers also give their service, city and experience, and may upload a profile photo.'],
      ['How we use it', 'To create your account, verify your email with a one-time code, match you with a worker, show you the status of your booking, send booking emails, and keep payments safe.'],
      ['Who sees what', 'Phone numbers and emails are never shown on any page or in any email. When you press Call karo on an active booking, the other person on that booking gets your number, and only then; we keep a log of those requests. A worker sees your first name, and only the area of your address until they accept your booking; after that they see the full address so they can reach you. Admins can see account and booking details to run the service and help with support.'],
      ['Payments', 'Online payments are handled by Razorpay. We never see or store your card, UPI or bank details. We store only that a booking was paid, how, and when.'],
      ['Sharing', 'We do not sell your data. We share it only with the services that run NipunGo (hosting, email delivery, payments, image storage) and when the law requires it.'],
      ['Your choices', 'You can edit your name and saved addresses on your Profile page. To delete your account or ask what we hold about you, email support@nipungo.com.'],
      ['Security', 'Passwords are stored hashed, codes are time-limited, sessions end when you change your password, and access to each booking is limited to the people on it.'],
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro: 'By using NipunGo you agree to these simple terms.',
    sections: [
      ['What NipunGo is', 'A platform that connects customers with independent service workers. Workers are responsible for the work they do.'],
      ['Accounts', 'Give true details and keep your password private. You are responsible for activity on your account. Customers and workers use separate sign-up pages.'],
      ['Bookings', 'You choose a service, date, time and address. We send your request to available workers; the first to accept is assigned. Start and finish the job with the 4-digit codes shown in your booking, and share a code only with the worker in front of you.'],
      ['Prices and payment', 'The price shown at booking is the service charge plus a platform fee. You can pay after the service (cash to the worker, or online) or pay online when booking.'],
      ['Behaviour', 'Be respectful. Do not misuse the platform, post false reviews, or try to bypass the codes. We may suspend accounts that do.'],
      ['Changes', 'We may update these terms. Continuing to use NipunGo means you accept the updated terms.'],
    ],
  },
  refunds: {
    title: 'Cancellation & Refund Policy',
    intro: 'Plans change. Here is how cancellations and refunds work.',
    sections: [
      ['Before a worker accepts', 'You can cancel for free from your booking page.'],
      ['After a worker accepts, before work starts', 'You can still cancel from your booking page. Please do it as early as you can so the worker can take another job.'],
      ['Once work has started', 'Online cancellation is no longer possible. Contact support if there is a problem.'],
      ['Paid online', 'If you paid online and need to cancel, or you were charged incorrectly, email support@nipungo.com with your booking ID. Approved refunds go back to the original payment method and usually reach you in 5 to 7 working days.'],
      ['Paid in cash', 'Nothing is charged until the work is done, so there is nothing to refund if you cancel in time.'],
      ['Unhappy with the work?', 'Tell us within 24 hours with your booking ID and we will look into it.'],
    ],
  },
};

function Legal({ page }) {
  const doc = PAGES[page];
  if (!doc) return null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{doc.title}</h1>
      <p className="mt-2 text-slate-500">{doc.intro}</p>
      <p className="mt-1 text-xs text-slate-400">Last updated: {EFFECTIVE}</p>

      <div className="mt-8 space-y-6">
        {doc.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-lg font-bold text-slate-900">{heading}</h2>
            <p className="mt-1 leading-relaxed text-slate-600">{body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 space-y-1 text-sm text-slate-500">
        <p>
          Questions? Write to{' '}
          <a href="mailto:support@nipungo.com" className="inline-block py-2 text-primary underline">support@nipungo.com</a>
        </p>
        <Link to="/" className="inline-block py-2 text-primary underline">Back to home</Link>
      </div>
    </div>
  );
}

export default Legal;
