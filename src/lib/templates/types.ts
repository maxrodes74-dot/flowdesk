// =============================================================
// MTR-293: Template Library Types
// Type definitions for document templates with sections & metadata
// =============================================================

export interface TemplateSection {
  key: string;
  label: string;
  type: 'text' | 'rich_text' | 'list' | 'table' | 'number' | 'date' | 'currency';
  required: boolean;
  ai_prompt: string;
  placeholder: string;
  default_value?: unknown;
}

export interface Template {
  id: string;
  type: string; // matches DocumentType
  name: string;
  description: string;
  category: 'general' | 'development' | 'design' | 'consulting' | 'creative';
  sections: TemplateSection[];
  metadata_schema: Record<string, unknown>;
  default_file_type: 'pdf' | 'docx';
  styling: TemplateStyling;
  is_system: boolean;
  freelancer_id: string | null;
  tier_required: 'pro' | 'pro_plus';
  created_at: string;
  updated_at: string;
}

export interface TemplateStyling {
  primary_color: string;
  font_family: string;
  header_style: 'modern' | 'classic' | 'minimal';
  show_logo: boolean;
}

export interface CreateTemplateInput {
  type: string;
  name: string;
  description: string;
  category: string;
  sections: TemplateSection[];
  metadata_schema?: Record<string, unknown>;
  default_file_type?: string;
  styling?: Partial<TemplateStyling>;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  sections?: TemplateSection[];
  metadata_schema?: Record<string, unknown>;
  default_file_type?: string;
  styling?: Partial<TemplateStyling>;
}
