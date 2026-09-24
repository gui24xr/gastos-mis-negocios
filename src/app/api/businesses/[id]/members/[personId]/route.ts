import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; personId: string }> }
) {
  const { id, personId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("membership_details")
    .select("*")
    .eq("business_id", id)
    .eq("person_id", personId)
    .single();

  if (error) {
    return NextResponse.json({ error: "No se encontro el miembro" }, { status: 404 });
  }

  return NextResponse.json(data);
}
