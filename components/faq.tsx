"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SectionWrapper } from "@/components/section-wrapper"
import { FAQ } from "@/lib/constants"

export function Faq() {
  return (
    <SectionWrapper id="faq">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {FAQ.headline}
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            {FAQ.subtext}
          </p>
        </div>

        {/* Core FAQs */}
        <h3 className="mb-4 mt-12 text-lg font-semibold text-foreground">
          Core Questions
        </h3>
        <Accordion type="single" collapsible className="w-full">
          {FAQ.core.map((item, i) => (
            <AccordionItem
              key={`core-${i}`}
              value={`core-${i}`}
              className="border-border"
            >
              <AccordionTrigger className="py-4 text-left text-base font-medium text-foreground hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Common Concerns */}
        <h3 className="mb-4 mt-10 text-lg font-semibold text-foreground">
          Common Concerns
        </h3>
        <Accordion type="single" collapsible className="w-full">
          {FAQ.concerns.map((item, i) => (
            <AccordionItem
              key={`concern-${i}`}
              value={`concern-${i}`}
              className="border-border"
            >
              <AccordionTrigger className="py-4 text-left text-base font-medium text-foreground hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SectionWrapper>
  )
}
