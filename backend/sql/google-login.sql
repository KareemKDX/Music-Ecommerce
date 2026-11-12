-- GOOGLE LOGIN
-- Google's id for the user ("sub"). Never changes, even if the user changes email at Google.
-- NULL for users who only log in with email/password.

ALTER TABLE users
  ADD google_id VARCHAR(255) NULL,
  ADD UNIQUE KEY unique_google_id (google_id);
