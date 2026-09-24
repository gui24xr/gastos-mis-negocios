import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { person_id, business_id, role = "EMPLOYEE" } = await request.json();

    if (!person_id || !business_id) {
      return NextResponse.json(
        { error: "person_id y business_id son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("memberships")
      .insert({
        person_id,
        business_id,
        role,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Esta persona ya es miembro de este negocio" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Error al agregar el miembro" },
      { status: 500 }
    );
  }
}
