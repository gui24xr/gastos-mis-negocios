import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { title } = await request.json();

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "El nombre del negocio es requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("businesses")
      .insert({ title: title.trim() })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.id, title: data.title });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al crear el negocio" },
      { status: 500 }
    );
  }
}
