import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function seedUsers() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("Creando usuarios de prueba...\n");

  for (const user of testUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: "TempPass123!",
        email_confirm: true,
        user_metadata: { full_name: user.full_name },
      });

      if (error) {
        console.log(`❌ ${user.email}: ${error.message}`);
      } else {
        console.log(`✅ ${user.email} - ${user.full_name}`);
      }
    } catch (err) {
      console.log(`❌ ${user.email}: Error desconocido`);
    }
  }

  console.log("\nListo!");
  process.exit(0);
}

seedUsers();
