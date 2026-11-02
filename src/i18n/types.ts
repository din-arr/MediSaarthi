export type LanguageCode = "en" | "hi" | "mr" | "ta" | "bn";

export type Dictionary = {
  languageName: string;
  demoBanner: string;
  demoBannerDetail: string;
  nav: {
    medicines: string;
    upload: string;
    howItWorks: string;
    faqs: string;
    uploadRx: string;
    explore: string;
  };
  hero: {
    badge: string;
    titleBefore: string;
    titleAccent: string;
    titleAfter: string;
    description: string;
    explore: string;
    upload: string;
    checks: string[];
    caption: string;
    progress: string;
    reminder: string;
    reminderDetail: string;
    taken: string;
    snooze: string;
  };
  sections: {
    trust: Array<{ title: string; description: string }>;
    toolsEyebrow: string;
    toolsTitle: string;
    toolsDescription: string;
    catalogueEyebrow: string;
    catalogueTitle: string;
    catalogueDescription: string;
    prescriptionTitle: string;
    howTitle: string;
    faqTitle: string;
    ctaTitle: string;
    ctaDescription: string;
  };
  safety: {
    educational: string;
    noOrders: string;
    noRecords: string;
  };
  footer: {
    description: string;
    credits: string;
    rights: string;
  };
  faq: Array<{ question: string; answer: string }>;
};
