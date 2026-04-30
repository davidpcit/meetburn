export interface Category {
  name: string;
  costPerHour: number;
}

export const CATEGORIES: Category[] = [
  { name: "Analista Junior",  costPerHour: 25  },
  { name: "Analista Senior",  costPerHour: 45  },
  { name: "Project Manager",  costPerHour: 65  },
  { name: "Director",         costPerHour: 90  },
  { name: "C-Level",          costPerHour: 130 },
];

export interface ParticipantData {
  displayName: string;
  categoryName: string;
  costPerHour: number;
  active: boolean;
  manuallyAdded?: boolean;
}
