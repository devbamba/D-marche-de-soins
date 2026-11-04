import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export function subscribeToAuth(callback) {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback({ event, user: session?.user ?? null });
  });
  return () => subscription.unsubscribe();
}

export async function signInWithPassword(email, password) {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signInWithProvider(provider) {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.href.split("#")[0] }
  });
  if (error) throw error;
}

export async function sendSignupCode(email, fullName) {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const redirectUrl = new URL(window.location.href);
  redirectUrl.hash = "";
  redirectUrl.search = "?auth=signup";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { full_name: fullName },
      emailRedirectTo: redirectUrl.toString()
    }
  });
  if (error) throw error;
}

export async function verifySignupCode(email, token) {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
}

export async function completeSignup(fullName, password) {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const { error } = await supabase.auth.updateUser({
    password,
    data: { full_name: fullName }
  });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

function mapRecord(row) {
  return {
    id: row.id,
    title: row.title,
    data: row.data,
    savedAt: row.updated_at || row.created_at
  };
}

export async function listUserRecords(userId) {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const { data, error } = await supabase
    .from("records")
    .select("id,title,data,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data.map(mapRecord);
}

export async function saveUserRecord(record, userId) {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const { data, error } = await supabase
    .from("records")
    .upsert({
      id: record.id,
      user_id: userId,
      title: record.title,
      data: record.data,
      updated_at: record.savedAt
    })
    .select("id,title,data,created_at,updated_at")
    .single();
  if (error) throw error;
  return mapRecord(data);
}

export async function addUserRecords(records, userId) {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  if (!records.length) return 0;
  const { error } = await supabase.from("records").upsert(
    records.map(record => ({
      id: record.id,
      user_id: userId,
      title: record.title,
      data: record.data,
      updated_at: record.savedAt
    })),
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (error) throw error;
  return records.length;
}

export async function deleteUserRecord(id, userId) {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const { error } = await supabase
    .from("records")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
