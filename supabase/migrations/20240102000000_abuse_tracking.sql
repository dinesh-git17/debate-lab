-- supabase/migrations/20240102000000_abuse_tracking.sql
-- Abuse tracking tables for IP-based ban system

-- IP tracking table
CREATE TABLE IF NOT EXISTS ip_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash VARCHAR(64) NOT NULL UNIQUE,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  flag_count INTEGER NOT NULL DEFAULT 0,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reasons JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IP bans table
CREATE TABLE IF NOT EXISTS ip_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash VARCHAR(64) NOT NULL,
  ban_type VARCHAR(20) NOT NULL CHECK (ban_type IN ('temporary', 'permanent', 'shadow')),
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100) NOT NULL DEFAULT 'system',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Abuse logs table
CREATE TABLE IF NOT EXISTS abuse_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash VARCHAR(64) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB NOT NULL DEFAULT '{}',
  endpoint VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ip_tracking_hash ON ip_tracking(ip_hash);
CREATE INDEX IF NOT EXISTS idx_ip_tracking_flagged ON ip_tracking(is_flagged) WHERE is_flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_ip_bans_hash ON ip_bans(ip_hash);
CREATE INDEX IF NOT EXISTS idx_ip_bans_active ON ip_bans(ip_hash, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ip_bans_expires ON ip_bans(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_abuse_logs_hash ON abuse_logs(ip_hash);
CREATE INDEX IF NOT EXISTS idx_abuse_logs_created ON abuse_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_abuse_logs_severity ON abuse_logs(severity) WHERE severity IN ('high', 'critical');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ip_tracking updated_at
DROP TRIGGER IF EXISTS update_ip_tracking_updated_at ON ip_tracking;
CREATE TRIGGER update_ip_tracking_updated_at
  BEFORE UPDATE ON ip_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically deactivate expired bans
CREATE OR REPLACE FUNCTION deactivate_expired_bans()
RETURNS INTEGER AS $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  UPDATE ip_bans
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql;

-- RLS policies (enable Row Level Security)
ALTER TABLE ip_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_logs ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access for backend)
CREATE POLICY "Service role full access on ip_tracking"
  ON ip_tracking FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ip_bans"
  ON ip_bans FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on abuse_logs"
  ON abuse_logs FOR ALL
  USING (auth.role() = 'service_role');
