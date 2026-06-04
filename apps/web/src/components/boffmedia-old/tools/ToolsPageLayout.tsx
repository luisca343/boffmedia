"use client";

import { PageHeader } from "./PageHeader";
import { FeaturedTool } from "./FeaturedTool";
import { ToolsGrid } from "./ToolsGrid";
import { ExternalResources } from "./ExternalResources";

interface ToolsPageLayoutProps {
  title: {
    prefix: string;
    highlight: string;
  };
  subtitle: string;
  logoSrc: string;
  logoAlt: string;
  tools: any[];
  externalLinks: any[];
  t: (key: string, params?: any) => string;
}

export function ToolsPageLayout({
  title,
  subtitle,
  logoSrc,
  logoAlt,
  tools,
  externalLinks,
  t,
}: ToolsPageLayoutProps) {
  const featuredTool = tools.find((tool) => tool.featured);
  const otherTools = tools.filter((tool) => !tool.featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title={title} subtitle={subtitle} logoSrc={logoSrc} logoAlt={logoAlt} />

      {featuredTool && <FeaturedTool tool={featuredTool} t={t} />}

      {otherTools.length > 0 && <ToolsGrid tools={otherTools} t={t} />}

      <ExternalResources links={externalLinks} t={t} />
    </div>
  );
}
