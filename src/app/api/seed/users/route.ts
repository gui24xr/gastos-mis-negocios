import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

const testUsers = [
  { email: "ana@seed.test", full_name: "Ana Gómez" },
  { email: "bruno@seed.test", full_name: "Bruno Pérez" },
  { email: "carla@seed.test", full_name: "Carla Ruiz" },
  { email: "diego@seed.test", full_name: "Diego Fernández" },
  { email: "elena@seed.test", full_name: "Elena Torres" },
  { email: "fede@seed.test", full_name: "Federico Silva" },
  { email: "gabi@seed.test", full_name: "Gabriela Núñez" },
  { email: "hugo@seed.test", full_name: "Hugo Molina" },
];

export async function POST() {
  const supabase = await createAdminClient();
  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const user of testUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: "TempPass123!",
        email_confirm: true,
        user_metadata: { full_name: user.full_name },
      });

      if (error) {
        results.push({ email: user.email, success: false, error: error.message });
      } else {
        results.push({ email: user.email, success: true });
      }
    } catch (err) {
      results.push({ email: user.email, success: false, error: "Unknown error" });
    }
  }

  return NextResponse.json({ results });
}
