// src/services/supabaseService.ts

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://YOUR_PROJECT_URL.supabase.co",
  "YOUR_ANON_PUBLIC_KEY"
);

export async function addContainer(data: any) {
  const { error } = await supabase.from("containers").insert([data]);

  if (error) {
    console.error("Insert error:", error);
    throw error;
  }
}
