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
    title: 'first_aid_fever_title',
    category: 'first_aid_cat_general',
    icon: 'Thermometer',
    description: 'first_aid_fever_desc',
    steps: [
      'first_aid_fever_step1',
      'first_aid_fever_step2',
      'first_aid_fever_step3',
      'first_aid_fever_step4',
      'first_aid_fever_step5'
    ],
    warnings: [
      'first_aid_fever_warn1',
      'first_aid_fever_warn2'
    ]
  },
  {
    id: 'cuts',
    title: 'first_aid_cuts_title',
    category: 'first_aid_cat_wound',
    icon: 'Bandage',
    description: 'first_aid_cuts_desc',
    steps: [
      'first_aid_cuts_step1',
      'first_aid_cuts_step2',
      'first_aid_cuts_step3',
      'first_aid_cuts_step4',
      'first_aid_cuts_step5'
    ],
    warnings: [
      'first_aid_cuts_warn1',
      'first_aid_cuts_warn2'
    ]
  },
  {
    id: 'burns',
    title: 'first_aid_burns_title',
    category: 'first_aid_cat_emergency',
    icon: 'Flame',
    description: 'first_aid_burns_desc',
    steps: [
      'first_aid_burns_step1',
      'first_aid_burns_step2',
      'first_aid_burns_step3',
      'first_aid_burns_step4'
    ],
    warnings: [
      'first_aid_burns_warn1',
      'first_aid_burns_warn2',
      'first_aid_burns_warn3',
      'first_aid_burns_warn4'
    ]
  },
  {
    id: 'dehydration',
    title: 'first_aid_dehydration_title',
    category: 'first_aid_cat_fluid',
    icon: 'Droplet',
    description: 'first_aid_dehydration_desc',
    steps: [
      'first_aid_dehydration_step1',
      'first_aid_dehydration_step2',
      'first_aid_dehydration_step3',
      'first_aid_dehydration_step4'
    ],
    warnings: [
      'first_aid_dehydration_warn1',
      'first_aid_dehydration_warn2',
      'first_aid_dehydration_warn3'
    ]
  }
];
