-- Create freelancers table
CREATE TABLE freelancers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  profession VARCHAR(255) NOT NULL,
  services TEXT,
  hourly_rate DECIMAL(10, 2) DEFAULT 0,
  brand_color VARCHAR(7) DEFAULT '#000000',
  logo_url TEXT,
  portfolio_url TEXT,
  slug VARCHAR(255) NOT NULL UNIQUE,
  tone TEXT,
  stripe_account_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  portal_slug VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(freelancer_id, email),
  UNIQUE(freelancer_id, portal_slug)
);

-- Create proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  brief TEXT,
  budget VARCHAR(255),
  timeline VARCHAR(255),
  terms TEXT,
  scope_json JSONB,
  total_price DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  invoice_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  line_items JSONB,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  payment_terms VARCHAR(255),
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for milestone invoice_id
ALTER TABLE milestones
ADD CONSTRAINT milestones_invoice_id_fkey
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- Create contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  clauses JSONB,
  signature_name VARCHAR(255),
  signature_ip VARCHAR(45),
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  date DATE,
  description TEXT,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automations table
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on foreign keys
CREATE INDEX idx_clients_freelancer_id ON clients(freelancer_id);
CREATE INDEX idx_proposals_freelancer_id ON proposals(freelancer_id);
CREATE INDEX idx_proposals_client_id ON proposals(client_id);
CREATE INDEX idx_milestones_proposal_id ON milestones(proposal_id);
CREATE INDEX idx_milestones_invoice_id ON milestones(invoice_id);
CREATE INDEX idx_invoices_freelancer_id ON invoices(freelancer_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_contracts_proposal_id ON contracts(proposal_id);
CREATE INDEX idx_time_entries_freelancer_id ON time_entries(freelancer_id);
CREATE INDEX idx_time_entries_client_id ON time_entries(client_id);
CREATE INDEX idx_time_entries_milestone_id ON time_entries(milestone_id);
CREATE INDEX idx_messages_client_id ON messages(client_id);
CREATE INDEX idx_automations_freelancer_id ON automations(freelancer_id);

-- Create indexes on commonly queried columns
CREATE INDEX idx_freelancers_user_id ON freelancers(user_id);
CREATE INDEX idx_freelancers_slug ON freelancers(slug);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_portal_slug ON clients(portal_slug);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at);
CREATE INDEX idx_milestones_due_date ON milestones(due_date);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_messages_created_at ON messages(created_at);
