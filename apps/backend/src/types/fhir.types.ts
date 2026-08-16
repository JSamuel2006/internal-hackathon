export interface FHIRResource {
  resourceType: string;
  id: string;
}

export interface Patient extends FHIRResource {
  resourceType: 'Patient';
  name: {
    use?: string;
    text: string;
    family?: string;
    given?: string[];
  }[];
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  telecom?: {
    system: string;
    value: string;
    use?: string;
  }[];
}

export interface Observation extends FHIRResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category?: {
    coding: {
      system: string;
      code: string;
      display?: string;
    }[];
  }[];
  code: {
    coding: {
      system: string;
      code: string;
      display?: string;
    }[];
    text?: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime?: string;
  valueQuantity?: {
    value: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
}

export interface Condition extends FHIRResource {
  resourceType: 'Condition';
  clinicalStatus?: {
    coding: {
      system: string;
      code: string;
    }[];
  };
  verificationStatus?: {
    coding: {
      system: string;
      code: string;
    }[];
  };
  code: {
    coding: {
      system: string;
      code: string;
      display?: string;
    }[];
    text?: string;
  };
  subject: {
    reference: string;
  };
}

export interface Medication extends FHIRResource {
  resourceType: 'Medication';
  code: {
    coding: {
      system: string;
      code: string;
      display?: string;
    }[];
    text?: string;
  };
}

export interface MedicationRequest extends FHIRResource {
  resourceType: 'MedicationRequest';
  status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft' | 'unknown';
  intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  medicationReference: {
    reference: string;
  };
  subject: {
    reference: string;
  };
  authoredOn?: string;
}

export interface DiagnosticReport extends FHIRResource {
  resourceType: 'DiagnosticReport';
  status: 'registered' | 'partial' | 'preliminary' | 'final';
  code: {
    coding: {
      system: string;
      code: string;
      display?: string;
    }[];
    text?: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime?: string;
  result?: {
    reference: string;
  }[];
}

export interface Encounter extends FHIRResource {
  resourceType: 'Encounter';
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  class: {
    system: string;
    code: string;
    display?: string;
  };
  subject: {
    reference: string;
  };
}

export interface Organization extends FHIRResource {
  resourceType: 'Organization';
  active?: boolean;
  name: string;
}

export interface Practitioner extends FHIRResource {
  resourceType: 'Practitioner';
  active?: boolean;
  name: {
    text: string;
    family?: string;
    given?: string[];
  }[];
}

export interface Bundle extends FHIRResource {
  resourceType: 'Bundle';
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  entry: {
    fullUrl?: string;
    resource: FHIRResource;
  }[];
}
