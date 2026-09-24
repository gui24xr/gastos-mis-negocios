import { createClient } from "@/utils/supabase/server";
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
  const supabase = await createClient();

  try {
    const { full_name } = await request.json();

    if (!full_name) {
      return NextResponse.json(
        { error: "Nombre es requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("people")
      .insert({
        full_name,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Error al crear la persona" },
      { status: 500 }
    );
  }
}
