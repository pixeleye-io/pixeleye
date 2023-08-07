import { Link } from "@pixeleye/ui";

const faqs = [
  {
    id: 1,
    question: "What is a snapshot?",
    answer:
      "A snapshot is a picture. You can take snapshots of individual components or even of your entire application. We use snapshots to compare changes in your ui",
  },
  {
    id: 2,
    question: "What's the price per snapshot?",
    answer:
      "We charge $0.003 per snapshot. We offer volume discounts for larger teams. Contact us for more information.",
  },
  {
    id: 3,
    question: "Can I cancel my subscription?",
    answer:
      "We operate on a pay-as-you-go model. You can cancel your subscription at any time.",
  },
  {
    id: 4,
    question: "Can I set a budget?",
    answer:
      "Yes, you can set a budget for your team. We will notify you when you are close to reaching your budget.",
  },
  {
    id: 5,
    question: "What happens if I go over my budget?",
    answer:
      "We will notify you when you are close to reaching your budget. If you go over your budget, we will stop taking snapshots until the next billing cycle.",
  },
  {
    id: 6,
    question: "Can I sign up without a credit card?",
    answer:
      "Yes, you can take up to 5000 snapshots a month with our free plan.",
  },
];

export function FAQ() {
  return (
    <div className="mt-12">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
        <h2 className="text-2xl font-bold leading-10 tracking-tight text-on-surface">
          Frequently asked questions
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-7 text-on-surface-variant">
          Have a different question and can’t find the answer you’re looking
          for? Reach out to our support team by{" "}
          <Link href="#">sending us an email</Link> and we’ll get back to you as
          soon as we can.
        </p>
        <div className="mt-20">
          <dl className="space-y-16 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-16 sm:space-y-0 lg:gap-x-10">
            {faqs.map((faq) => (
              <div key={faq.id}>
                <dt className="text-base font-semibold leading-7 text-on-surface">
                  {faq.question}
                </dt>
                <dd className="mt-2 text-base leading-7 text-on-surface-variant">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
