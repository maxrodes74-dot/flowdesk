-- Create referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  referred_email VARCHAR(255) NOT NULL,
  referral_code VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create testimonials table
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  permission_to_use BOOLEAN DEFAULT FALSE,
  token VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on referrals and testimonials
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Referrals policies
-- Freelancers can read their own referrals
CREATE POLICY "referrals_read_own"
  ON referrals FOR SELECT
  USING (
    referrer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can insert referrals
CREATE POLICY "referrals_insert_own"
  ON referrals FOR INSERT
  WITH CHECK (
    referrer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can update their own referrals
CREATE POLICY "referrals_update_own"
  ON referrals FOR UPDATE
  USING (
    referrer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    referrer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Service role can read all referrals
CREATE POLICY "referrals_read_service_role"
  ON referrals FOR SELECT
  USING (auth.role() = 'service_role');

-- Service role can update referral status
CREATE POLICY "referrals_update_service_role"
  ON referrals FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Testimonials policies
-- Freelancers can read their own testimonials
CREATE POLICY "testimonials_read_own"
  ON testimonials FOR SELECT
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can insert testimonials
CREATE POLICY "testimonials_insert_own"
  ON testimonials FOR INSERT
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Freelancers can update their own testimonials
CREATE POLICY "testimonials_update_own"
  ON testimonials FOR UPDATE
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

-- Service role can read all testimonials
CREATE POLICY "testimonials_read_service_role"
  ON testimonials FOR SELECT
  USING (auth.role() = 'service_role');

-- Service role can insert testimonials (for submitted forms)
CREATE POLICY "testimonials_insert_service_role"
  ON testimonials FOR INSERT
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role can update testimonials (for publishing)
CREATE POLICY "testimonials_update_service_role"
  ON testimonials FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create indexes on foreign keys and commonly queried columns
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_created_at ON referrals(created_at);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);

CREATE INDEX idx_testimonials_freelancer_id ON testimonials(freelancer_id);
CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_created_at ON testimonials(created_at);
CREATE INDEX idx_testimonials_token ON testimonials(token);
