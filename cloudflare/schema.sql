-- Zayaan’s Signature stores only a newsletter email, acquisition source, and consent timestamp.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'website',
  consent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
