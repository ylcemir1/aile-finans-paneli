"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerSchema, getFirstError } from "@/lib/validations";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("Lütfen tüm alanları doldurun"));
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      "/login?error=" + encodeURIComponent("E-posta veya şifre hatalı")
    );
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const raw = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      "/register?error=" + encodeURIComponent(getFirstError(parsed.error))
    );
  }

  const { full_name, email, password } = parsed.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  });

  if (error) {
    const msg =
      error.message === "User already registered"
        ? "Bu e-posta adresi zaten kayıtlı"
        : error.message;
    redirect("/register?error=" + encodeURIComponent(msg));
  }

  redirect(
    "/login?success=" +
      encodeURIComponent("Kayıt başarılı! Giriş yapabilirsiniz.")
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
