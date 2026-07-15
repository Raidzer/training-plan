export type TemplateFilter = "all" | "user" | "system";

export type TemplateSummary = {
  id: number;
  userId: number | null;
  name: string;
  matchPattern: string | null;
};

export type TemplatesOverviewStats = {
  total: number;
  user: number;
  system: number;
};
