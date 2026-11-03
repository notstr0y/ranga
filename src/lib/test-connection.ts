import { supabase } from "./supabase";

async function testConnection() {
  const { data, error } = await supabase
    .from("programmes")
    .select("*");

  if (error) {
    console.error("Supabase error:", error.message);
    return;
  }

  console.log("RANGA connected successfully!", data);
}

testConnection();
