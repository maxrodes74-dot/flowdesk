-- Enable RLS on all tables
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- Freelancers policies
-- Users can read their own freelancer record
CREATE POLICY "freelancers_read_own"
  ON freelancers FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own freelancer record
CREATE POLICY "freelancers_update_own"
  ON freelancers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can insert their own freelancer record
CREATE POLICY "freelancers_insert_own"
  ON freelancers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Clients policies
-- Freelancers can read their own clients
CREATE POLICY "clients_read_own"
  ON clients FOR SELECT
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can insert clients
CREATE POLICY "clients_insert_own"
  ON clients FOR INSERT
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can update their own clients
CREATE POLICY "clients_update_own"
  ON clients FOR UPDATE
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Proposals policies
-- Freelancers can read their own proposals
CREATE POLICY "proposals_read_own"
  ON proposals FOR SELECT
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can insert proposals
CREATE POLICY "proposals_insert_own"
  ON proposals FOR INSERT
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can update their own proposals
CREATE POLICY "proposals_update_own"
  ON proposals FOR UPDATE
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Service role can read all proposals (for client portal)
CREATE POLICY "proposals_read_service_role"
  ON proposals FOR SELECT
  USING (auth.role() = 'service_role');

-- Milestones policies
-- Access through proposal ownership chain
CREATE POLICY "milestones_read_own"
  ON milestones FOR SELECT
  USING (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE freelancer_id IN (
        SELECT id FROM freelancers WHERE user_id = auth.uid()
      )
    )
  );

-- Freelancers can insert milestones through their own proposals
CREATE POLICY "milestones_insert_own"
  ON milestones FOR INSERT
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE freelancer_id IN (
        SELECT id FROM freelancers WHERE user_id = auth.uid()
      )
    )
  );

-- Freelancers can update milestones through their own proposals
CREATE POLICY "milestones_update_own"
  ON milestones FOR UPDATE
  USING (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE freelancer_id IN (
        SELECT id FROM freelancers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE freelancer_id IN (
        SELECT id FROM freelancers WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can read all milestones (for client portal)
CREATE POLICY "milestones_read_service_role"
  ON milestones FOR SELECT
  USING (auth.role() = 'service_role');

-- Invoices policies
-- Freelancers can read their own invoices
CREATE POLICY "invoices_read_own"
  ON invoices FOR SELECT
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can insert invoices
CREATE POLICY "invoices_insert_own"
  ON invoices FOR INSERT
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can update their own invoices
CREATE POLICY "invoices_update_own"
  ON invoices FOR UPDATE
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Service role can read all invoices (for client portal)
CREATE POLICY "invoices_read_service_role"
  ON invoices FOR SELECT
  USING (auth.role() = 'service_role');

-- Contracts policies
-- Access through proposal ownership chain
CREATE POLICY "contracts_read_own"
  ON contracts FOR SELECT
  USING (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE freelancer_id IN (
        SELECT id FROM freelancers WHERE user_id = auth.uid()
      )
    )
  );

-- Freelancers can insert contracts through their own proposals
CREATE POLICY "contracts_insert_own"
  ON contracts FOR INSERT
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE freelancer_id IN (
        SELECT id FROM freelancers WHERE user_id = auth.uid()
      )
    )
  );

-- Freelancers can update contracts through their own proposals
CREATE POLICY "contracts_update_own"
  ON contracts FOR UPDATE
  USING (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE freelancer_id IN (
        SELECT id FROM freelancers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE freelancer_id IN (
        SELECT id FROM freelancers WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can read all contracts (for client portal)
CREATE POLICY "contracts_read_service_role"
  ON contracts FOR SELECT
  USING (auth.role() = 'service_role');

-- Time entries policies
-- Freelancers can read their own time entries
CREATE POLICY "time_entries_read_own"
  ON time_entries FOR SELECT
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can insert time entries
CREATE POLICY "time_entries_insert_own"
  ON time_entries FOR INSERT
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can update their own time entries
CREATE POLICY "time_entries_update_own"
  ON time_entries FOR UPDATE
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Messages policies
-- Access through client ownership chain
CREATE POLICY "messages_read_own"
  ON messages FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE freelancer_id IN (
        SELECT id FROM freelancers WHERE user_id = auth.uid()
      )
    )
  );

-- Freelancers can insert messages through their own clients
CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients
      WHERE freelancer_id IN (
        SELECT id FROM freelancers WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can read all messages (for client portal)
CREATE POLICY "messages_read_service_role"
  ON messages FOR SELECT
  USING (auth.role() = 'service_role');

-- Automations policies
-- Freelancers can read their own automations
CREATE POLICY "automations_read_own"
  ON automations FOR SELECT
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can insert automations
CREATE POLICY "automations_insert_own"
  ON automations FOR INSERT
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can update their own automations
CREATE POLICY "automations_update_own"
  ON automations FOR UPDATE
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can delete their own automations
CREATE POLICY "automations_delete_own"
  ON automations FOR DELETE
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );
