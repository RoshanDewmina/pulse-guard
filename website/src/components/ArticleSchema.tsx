import React from 'react';

interface ArticleSchemaProps {
  title: string;
  description: string;
  author?: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}

/**
 * Article Schema component for JSON-LD structured data
 * Use on guides, tutorials, and documentation pages
 */
export function ArticleSchema({
  title,
  description,
  author = 'Saturn Team',
  datePublished,
  dateModified,
  image = 'https://docs.saturn.example.com/img/og/default.png',
  url,
}: ArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description: description,
    image: image,
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://saturn.example.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Saturn',
      logo: {
        '@type': 'ImageObject',
        url: 'https://docs.saturn.example.com/img/logo.svg',
      },
    },
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

