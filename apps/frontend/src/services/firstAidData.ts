export interface FirstAidArticle {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  steps: string[];
  warnings: string[];
}

export const firstAidArticles: FirstAidArticle[] = [
  {
    id: 'fever',
    title: 'Fever Support',
    category: 'General Care',
    icon: 'Thermometer',
    description: 'Guidelines to help manage an elevated body temperature and keep a person comfortable.',
    steps: [
      'Encourage the individual to drink plenty of clear fluids (water, oral rehydration solutions, dilute juices).',
      'Keep the room at a comfortable, cool temperature with good airflow.',
      'Have them wear lightweight, loose-fitting clothing and use a light blanket.',
      'Apply a cool, damp washcloth to the forehead, back of the neck, or armpits.',
      'Ensure they get plenty of rest.'
    ],
    warnings: [
      'Do NOT use cold baths, ice, or alcohol rubs, as these can trigger shivering and raise internal temperature.',
      'Seek immediate medical care if the fever exceeds 103°F (39.4°C), is accompanied by a stiff neck, severe headache, confusion, or difficulty breathing, or if the individual is an infant under 3 months with a temperature of 100.4°F (38°C) or higher.'
    ]
  },
  {
    id: 'cuts',
    title: 'Minor Cuts & Scrapes',
    category: 'Wound Care',
    icon: 'Bandage',
    description: 'Initial care for minor bleeding, scrapes, and superficial cuts to prevent infection.',
    steps: [
      'Wash your hands thoroughly with soap and clean water before touching the wound.',
      'Apply gentle, direct pressure using a clean cloth or sterile bandage to stop any bleeding.',
      'Rinse the cut under running clean water to clean the area. Wash around the wound with mild soap.',
      'Apply a thin layer of petroleum jelly or antibiotic ointment to keep the surface moist.',
      'Cover the wound with a sterile adhesive bandage or gauze to protect it from dirt.'
    ],
    warnings: [
      'Do NOT scrub the wound vigorously, as this can cause further tissue damage.',
      'Seek medical care if the cut is deep, gaping, won\'t stop bleeding after 10 minutes of direct pressure, or shows signs of infection (redness, swelling, warmth, pus).'
    ]
  },
  {
    id: 'burns',
    title: 'Minor Burns (First-Degree)',
    category: 'Emergency Care',
    icon: 'Flame',
    description: 'Immediate relief and treatment guidelines for superficial burns (sunburn, minor kitchen burns).',
    steps: [
      'Cool the burn immediately by holding it under cool (not cold) running water for 10 to 15 minutes.',
      'Remove rings, bracelets, or tight clothing gently from the burned area before it starts to swell.',
      'Apply a gentle moisturizing lotion, aloe vera gel, or petroleum jelly to prevent drying.',
      'Cover the burn loosely with a clean, non-stick sterile gauze bandage to protect the blistered skin.'
    ],
    warnings: [
      'Do NOT use ice on the burn, as extreme cold can worsen tissue damage.',
      'Do NOT break blisters, as intact blisters protect the underlying skin from infection.',
      'Do NOT apply butter, oil, or home remedies which trap heat and introduce bacteria.',
      'Seek emergency care if the burn covers a large area, involves face, hands, feet, or groin, or appears deep, charred, or white (second or third-degree).'
    ]
  },
  {
    id: 'dehydration',
    title: 'Dehydration & Heat Illness',
    category: 'Fluid Loss',
    icon: 'Droplet',
    description: 'Practical guide to replenish lost fluids and manage mild dehydration or heat exposure.',
    steps: [
      'Move the person out of the heat and into a shaded, cool, or air-conditioned environment.',
      'Loosen or remove tight, heavy clothing.',
      'Provide small, frequent sips of cool water, oral rehydration solutions (ORS), or coconut water.',
      'Cool the body by spraying them with cool water, fan them, or place wet cloths on their skin.'
    ],
    warnings: [
      'Do NOT give fluids too quickly, as this can trigger vomiting.',
      'Do NOT give drinks containing caffeine or high sugar content, which can worsen fluid loss.',
      'Seek emergency medical help immediately if the person is confused, loses consciousness, has hot, dry skin (heat stroke warning), or is unable to keep fluids down.'
    ]
  }
];
