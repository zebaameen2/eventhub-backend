// backend/supabaseClient.js
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://ywcwxjcqmobtqfmvixvu.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3d4amNxbW9idHFmbXZpeHZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAwNzY5NCwiZXhwIjoyMDg3NTgzNjk0fQ.npjNdZexavhhE_uAZSfK2heROmCXCloAlVucmG-jpps";  // keep secret!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = supabase;