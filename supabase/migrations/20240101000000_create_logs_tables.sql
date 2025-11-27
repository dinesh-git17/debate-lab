-- Supabase Migration: Create Logging Tables
-- Run this in your Supabase SQL Editor or via CLI

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LOGS TABLE - Stores all application log entries
-- ============================================================================
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,

  -- Context fields (denormalized for query performance)
  request_id TEXT,
  debate_id TEXT,
  session_id TEXT,
  provider TEXT,
  endpoint TEXT,
  method TEXT,

  -- Structured context as JSONB for flexibility
  context JSONB DEFAULT '{}',

  -- Error details (if applicable)
  error_name TEXT,
  error_message TEXT,
  error_stack TEXT,

  -- Indexes will be created below
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs (level);
CREATE INDEX IF NOT EXISTS idx_logs_request_id ON logs (request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_debate_id ON logs (debate_id) WHERE debate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_level_timestamp ON logs (level, timestamp DESC);

-- Partial index for errors only (faster error queries)
CREATE INDEX IF NOT EXISTS idx_logs_errors ON logs (timestamp DESC)
  WHERE level IN ('error', 'fatal');

-- GIN index for JSONB context queries
CREATE INDEX IF NOT EXISTS idx_logs_context ON logs USING GIN (context);

-- ============================================================================
-- METRICS_SNAPSHOTS TABLE - Periodic metrics snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- System metrics
  requests_total BIGINT NOT NULL DEFAULT 0,
  errors_total BIGINT NOT NULL DEFAULT 0,
  active_connections INTEGER NOT NULL DEFAULT 0,

  -- Response time histogram buckets
  response_time_le_50 INTEGER DEFAULT 0,
  response_time_le_100 INTEGER DEFAULT 0,
  response_time_le_250 INTEGER DEFAULT 0,
  response_time_le_500 INTEGER DEFAULT 0,
  response_time_le_1000 INTEGER DEFAULT 0,
  response_time_le_2500 INTEGER DEFAULT 0,
  response_time_le_5000 INTEGER DEFAULT 0,
  response_time_le_10000 INTEGER DEFAULT 0,
  response_time_sum DOUBLE PRECISION DEFAULT 0,
  response_time_count INTEGER DEFAULT 0,

  -- Debate metrics
  debates_started BIGINT DEFAULT 0,
  debates_completed BIGINT DEFAULT 0,
  debates_errored BIGINT DEFAULT 0,

  -- Full metrics snapshot as JSONB for detailed analysis
  full_metrics JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics_snapshots (timestamp DESC);

-- ============================================================================
-- ALERTS TABLE - Triggered alerts history
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  message TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  threshold DOUBLE PRECISION NOT NULL,

  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  notified BOOLEAN NOT NULL DEFAULT FALSE,

  -- Additional context
  context JSONB DEFAULT '{}',
  environment TEXT DEFAULT 'development',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON alerts (triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts (triggered_at DESC)
  WHERE resolved_at IS NULL;

-- ============================================================================
-- LLM_REQUESTS TABLE - LLM API request tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS llm_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  provider TEXT NOT NULL,
  model TEXT,
  debate_id TEXT,
  turn_number INTEGER,

  -- Performance metrics
  latency_ms INTEGER NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Status
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Request context
  request_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_requests_timestamp ON llm_requests (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_llm_requests_provider ON llm_requests (provider);
CREATE INDEX IF NOT EXISTS idx_llm_requests_debate_id ON llm_requests (debate_id) WHERE debate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_llm_requests_success ON llm_requests (success, timestamp DESC);

-- ============================================================================
-- DEBATE_EVENTS TABLE - Debate lifecycle events
-- ============================================================================
CREATE TABLE IF NOT EXISTS debate_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  debate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,

  -- Event details
  details JSONB DEFAULT '{}',

  -- Request context
  request_id TEXT,
  session_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debate_events_debate_id ON debate_events (debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_events_type ON debate_events (event_type);
CREATE INDEX IF NOT EXISTS idx_debate_events_timestamp ON debate_events (timestamp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables (adjust policies based on your auth strategy)
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_events ENABLE ROW LEVEL SECURITY;

-- Service role policies (for server-side inserts)
-- These allow the service role to insert/select all rows
CREATE POLICY "Service role can insert logs" ON logs
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can select logs" ON logs
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can insert metrics" ON metrics_snapshots
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can select metrics" ON metrics_snapshots
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can insert alerts" ON alerts
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can all alerts" ON alerts
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can insert llm_requests" ON llm_requests
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can select llm_requests" ON llm_requests
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can insert debate_events" ON debate_events
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can select debate_events" ON debate_events
  FOR SELECT TO service_role USING (true);

-- ============================================================================
-- CLEANUP FUNCTION - For log retention (optional, run via cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_logs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM logs
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM llm_requests
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

  DELETE FROM debate_events
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

  -- Keep metrics for longer (90 days)
  DELETE FROM metrics_snapshots
  WHERE timestamp < NOW() - '90 days'::INTERVAL;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AGGREGATE FUNCTIONS - For dashboard queries (secured via RLS on base tables)
-- Using functions instead of views for better security control
-- ============================================================================

-- Function to get logs summary (requires service_role or authenticated with proper policies)
CREATE OR REPLACE FUNCTION get_logs_summary(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
  hour TIMESTAMPTZ,
  level TEXT,
  count BIGINT,
  unique_requests BIGINT,
  unique_debates BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('hour', timestamp) AS hour,
    level,
    COUNT(*) AS count,
    COUNT(DISTINCT request_id) AS unique_requests,
    COUNT(DISTINCT debate_id) AS unique_debates
  FROM logs
  WHERE timestamp > NOW() - (hours_back || ' hours')::INTERVAL
  GROUP BY date_trunc('hour', timestamp), level
  ORDER BY hour DESC, level;
$$;

-- Function to get provider stats
CREATE OR REPLACE FUNCTION get_provider_stats(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
  provider TEXT,
  hour TIMESTAMPTZ,
  total_requests BIGINT,
  successful BIGINT,
  failed BIGINT,
  avg_latency_ms DOUBLE PRECISION,
  total_tokens BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    provider,
    date_trunc('hour', timestamp) AS hour,
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE success = true) AS successful,
    COUNT(*) FILTER (WHERE success = false) AS failed,
    AVG(latency_ms) AS avg_latency_ms,
    SUM(total_tokens) AS total_tokens
  FROM llm_requests
  WHERE timestamp > NOW() - (hours_back || ' hours')::INTERVAL
  GROUP BY provider, date_trunc('hour', timestamp)
  ORDER BY hour DESC, provider;
$$;

-- Revoke public access to these functions
REVOKE ALL ON FUNCTION get_logs_summary FROM PUBLIC;
REVOKE ALL ON FUNCTION get_provider_stats FROM PUBLIC;

-- Grant only to service_role (your backend)
GRANT EXECUTE ON FUNCTION get_logs_summary TO service_role;
GRANT EXECUTE ON FUNCTION get_provider_stats TO service_role;
