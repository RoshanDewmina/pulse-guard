// Server-side JSON-LD structured data components for SEO

export function OrganizationJsonLd() {
  const site = process.env.SITE_URL ?? 'https://tokiflow.co';
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tokiflow',
    url: site,
    logo: `${site}/icons/icon-512.png`,
    sameAs: [
      'https://x.com/tokiflow',
      'https://github.com/tokiflow'
    ]
  };
  
  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} 
    />
  );
}

export function SoftwareApplicationJsonLd() {
  const site = process.env.SITE_URL ?? 'https://tokiflow.co';
  const json = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Tokiflow',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: site,
    description: 'Cron & job monitoring with smart Slack alerts, runtime analytics, and anomaly detection.',
    offers: {
      '@type': 'Offer',
      price: '19.00',
      priceCurrency: 'USD'
    }
  };
  
  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} 
    />
  );
}

export function FAQJsonLd({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
  
  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} 
    />
  );
}


