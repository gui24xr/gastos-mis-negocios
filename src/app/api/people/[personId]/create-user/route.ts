import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ personId: string }> }
) {
  const { personId } = await params;
  const supabase = await createAdminClient();

  const { data: person, error: personError } = await supabase
    .from("people")
    .select("id, full_name, email, user_id")
    .eq("id", personId)
    .single();

  if (personError || !person) {
    return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });
  }

  if (person.user_id) {
    return NextResponse.json({ error: "Esta persona ya tiene un usuario asociado" }, { status: 400 });
  }

  const email = person.email;
  if (!email) {
    return NextResponse.json({ error: "La persona necesita un email para crear el usuario" }, { status: 400 });
  }

  const temporaryPassword = "TempPass123!";
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: person.full_name },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("people")
    .update({ user_id: authData.user.id })
    .eq("id", personId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    temporaryPassword,
  });
}
