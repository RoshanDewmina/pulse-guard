import React from 'react';

interface SoftwareSchemaProps {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

/**
 * SoftwareApplication Schema for product pages
 * Helps search engines understand Saturn as a software product
 */
export function SoftwareSchema({
  name = 'Saturn',
  description,
  applicationCategory = 'MonitoringApplication',
  operatingSystem = 'Any',
  offers,
}: SoftwareSchemaProps) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: name,
    description: description,
    applicationCategory: applicationCategory,
    operatingSystem: operatingSystem,
    url: 'https://saturn.example.com',
    author: {
      '@type': 'Organization',
      name: 'Saturn',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
  };

  if (offers) {
    schema.offers = {
      '@type': 'Offer',
      price: offers.price,
      priceCurrency: offers.priceCurrency,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

