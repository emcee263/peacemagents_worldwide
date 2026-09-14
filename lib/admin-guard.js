"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useAdminGuard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      if (!supabase) {
        if (mounted) {
          setError("Supabase is not configured.");
          setLoading(false);
        }
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        if (mounted) {
          setError(userError.message);
          setLoading(false);
        }
        return;
      }

      if (!user) {
        if (mounted) {
          setLoading(false);
          setAuthorized(false);
        }
        return;
      }

      const { data: isStaff, error: staffError } =
        await supabase.rpc("is_staff");

      if (staffError) {
        console.error("HQ authorization error:", staffError);

        if (mounted) {
          setError(staffError.message);
          setLoading(false);
          setAuthorized(false);
        }

        return;
      }

      if (!isStaff) {
        if (mounted) {
          setError("This account is not authorized for HQ.");
          setLoading(false);
          setAuthorized(false);
        }

        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error("HQ profile error:", profileError);

        if (mounted) {
          setError(profileError.message);
          setLoading(false);
          setAuthorized(false);
        }

        return;
      }

      if (
        !profile ||
        !["staff", "admin", "developer"].includes(profile.role)
      ) {
        if (mounted) {
          setError("This account is not authorized for HQ.");
          setLoading(false);
          setAuthorized(false);
        }

        return;
      }

      if (mounted) {
        setRole(profile.role);
        setAuthorized(true);
        setLoading(false);
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    loading,
    authorized,
    role,
    error,
  };
}
