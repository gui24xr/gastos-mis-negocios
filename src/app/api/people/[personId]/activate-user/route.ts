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
    .select("id, user_id")
    .eq("id", personId)
    .single();

  if (personError || !person) {
    return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });
  }

  if (!person.user_id) {
    return NextResponse.json({ error: "Esta persona no tiene un usuario asociado" }, { status: 400 });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    person.user_id,
    { ban_duration: "none" }
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
