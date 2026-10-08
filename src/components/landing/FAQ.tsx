import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { faqs } from '@/content';

export function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="defer-render mx-auto mt-24 max-w-4xl scroll-mt-24 px-5 sm:mt-32 sm:px-6 lg:px-8 lg:py-32">
      <h2 id="faq-title" className="text-center text-3xl leading-10 tracking-tight sm:text-4xl">
        Frequently asked questions
      </h2>
      <Accordion type="single" collapsible className="mt-10 w-full space-y-4">
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm leading-7 text-muted-foreground">{faq.answer}</p>
              {faq.href && (
                <a
                  href={faq.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  Learn more <span aria-hidden>→</span>
                </a>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
