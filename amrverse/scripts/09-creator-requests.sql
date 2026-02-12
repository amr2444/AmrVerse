-- Table pour les demandes de statut créateur
CREATE TABLE IF NOT EXISTS creator_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  presentation TEXT NOT NULL, -- Présentation du créateur
  motivation TEXT NOT NULL, -- Ce qu'ils veulent faire
  portfolio_url VARCHAR(500), -- Lien vers portfolio (optionnel)
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes TEXT, -- Notes de l'admin
  reviewed_by UUID REFERENCES users(id), -- ID de l'admin qui a traité la demande
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX idx_creator_requests_user ON creator_requests(user_id);
CREATE INDEX idx_creator_requests_status ON creator_requests(status);
CREATE INDEX idx_creator_requests_reviewed_by ON creator_requests(reviewed_by);

-- Trigger pour updated_at
CREATE TRIGGER update_creator_requests_updated_at 
  BEFORE UPDATE ON creator_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE creator_requests IS 'Demandes de statut créateur soumises par les utilisateurs';
COMMENT ON COLUMN creator_requests.presentation IS 'Présentation personnelle du créateur';
COMMENT ON COLUMN creator_requests.motivation IS 'Motivation et projets envisagés';
COMMENT ON COLUMN creator_requests.status IS 'pending: en attente, approved: approuvé, rejected: rejeté';
