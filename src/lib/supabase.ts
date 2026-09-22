import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "";
const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function upsertProfile(profile: {
  id: string;
  username: string;
  avatar_url: string;
}) {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("profiles")
    .upsert({ ...profile, id: data.user?.id ?? profile.id }, { onConflict: "id" });
  if (error) console.error("Supabase Profile Error:", error);
}