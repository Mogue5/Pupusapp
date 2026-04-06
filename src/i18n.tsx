import React, { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'es' | 'en';

const translations = {
  es: {
    // Home
    perPersonTitle: 'Por Persona',
    perPersonDesc: 'Cada quien lo suyo',
    masterTitle: 'Hoja Completa',
    masterDesc: 'Como en la pupusería',

    // Order
    whatsTheirName: '¿Cómo se llama?',
    nameOptional: 'Nombre (opcional)',
    start: 'Empezar',
    orderByPerson: 'Pedido por Persona',
    orderSheet: 'Hoja de Pedido',
    add: 'Agregar',
    pupusa: 'PUPUSA',
    arroz: 'ARROZ',
    maiz: 'MAÍZ',
    classic: 'CLÁSICAS',
    specialties: 'ESPECIALIDADES',
    myFlavors: 'MIS SABORES',
    flavorName: 'Nombre del sabor',
    addFlavor: '+ Agregar sabor',
    pupusas: 'pupusas',
    total: 'Total',
    next: '+ Siguiente',
    orderComplete: 'Pedido terminado',
    person: 'Persona',

    // Summary
    yourOrder: 'Tu Pedido',
    pupusaOrder: 'Pedido de Pupusas:',
    arrozLower: 'arroz',
    maizLower: 'maíz',
    copied: 'Copiado!',
    copyText: 'Copiar texto',
    copyToShare: 'Copiar para compartir',
    share: 'Compartir',
    whoOrdered: '¿De quién es? (y cuánto toca pagar)',
    editOrder: 'Editar pedido',

    // Distribution
    whoOrderedShort: '¿De quién es?',
    prices: 'PRECIOS',
  },
  en: {
    // Home
    perPersonTitle: 'Per Person',
    perPersonDesc: "Everyone picks their own",
    masterTitle: 'Full Sheet',
    masterDesc: 'Like at the pupusería',

    // Order
    whatsTheirName: "What's their name?",
    nameOptional: 'Name (optional)',
    start: 'Start',
    orderByPerson: 'Order by Person',
    orderSheet: 'Order Sheet',
    add: 'Add',
    pupusa: 'PUPUSA',
    arroz: 'RICE',
    maiz: 'CORN',
    classic: 'CLASSIC',
    specialties: 'SPECIALTIES',
    myFlavors: 'MY FLAVORS',
    flavorName: 'Flavor name',
    addFlavor: '+ Add flavor',
    pupusas: 'pupusas',
    total: 'Total',
    next: '+ Next',
    orderComplete: 'Order complete',
    person: 'Person',

    // Summary
    yourOrder: 'Your Order',
    pupusaOrder: 'Pupusa Order:',
    arrozLower: 'rice',
    maizLower: 'corn',
    copied: 'Copied!',
    copyText: 'Copy text',
    copyToShare: 'Copy to share',
    share: 'Share',
    whoOrdered: 'Who ordered what? (and how much to pay)',
    editOrder: 'Edit order',

    // Distribution
    whoOrderedShort: 'Who ordered what?',
    prices: 'PRICES',
  },
} as const;

type Translations = { [K in keyof typeof translations['es']]: string };

interface I18nContextType {
  lang: Lang;
  t: Translations;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('es');

  const toggleLang = () => setLang(prev => (prev === 'es' ? 'en' : 'es'));

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
