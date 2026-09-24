import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: people } = await supabase
    .from("people")
    .select(`
      id,
      full_name,
      email,
      memberships (
        business_id,
        businesses (
          id,
          title
        )
      )
    `)
    .order("full_name", { ascending: true });

  return NextResponse.json(people);
}

export async function POST(request: Request) {
  const supabase = await createAdminClient();

  try {
    const { full_name, email } = await request.json();

    if (!full_name || !email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      );
    }

    const temporaryPassword = "TempPass123!";

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      id: data.user.id,
      full_name,
      email,
      temporaryPassword,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}
