"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {supabase} from "../../lib/supabase";

export default function Account(){
  const [mode,setMode]=useState("signin");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [fullName,setFullName]=useState("");
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  useEffect(()=>{
    if(!supabase){
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({data})=>{
      setUser(data.user || null);
      setLoading(false);
    });

    const {
      data:{subscription}
    }=supabase.auth.onAuthStateChange((_event,session)=>{
      setUser(session?.user || null);
    });

    return ()=>subscription.unsubscribe();
  },[]);

  async function submit(e){
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    if(!supabase){
      setError("Supabase is not configured.");
      setBusy(false);
      return;
    }

    if(mode==="signup"){
      const {data,error}=await supabase.auth.signUp({
        email,
        password,
        options:{
          data:{
            full_name:fullName
          }
        }
      });

      if(error){
        setError(error.message);
      }else if(data.session){
        setMessage("Account created. Welcome to PEACEMAGENTS.");
      }else{
        setMessage("Account created. Check your email to confirm your account.");
      }
    }else{
      const {error}=await supabase.auth.signInWithPassword({
        email,
        password
      });

      if(error){
        setError(error.message);
      }else{
        setMessage("Welcome back.");
      }
    }

    setBusy(false);
  }

  async function signOut(){
    if(!supabase)return;

    setBusy(true);
    const {error}=await supabase.auth.signOut();

    if(error){
      setError(error.message);
    }else{
      setUser(null);
      setMessage("You have been signed out.");
    }

    setBusy(false);
  }

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <span className="pm">PM</span>
            <span className="brand-name">
              PEACEMAGENTS<br/>WORLDWIDE
            </span>
          </Link>

          <div className="nav-links">
            <Link href="/shop">Shop</Link>
            <Link href="/about">About</Link>
          </div>
        </div>
      </nav>

      <main className="container">
        <div className="subnav">
          <div className="kicker">CUSTOMER AREA</div>
          <h1>{user ? "YOUR SPACE." : "WELCOME IN."}</h1>
        </div>

        {loading ? (
          <div className="card">
            <p className="muted">Loading your account...</p>
          </div>
        ) : user ? (
          <div className="detail">
            <div className="card">
              <div className="kicker">ACCOUNT</div>
              <h2>{user.user_metadata?.full_name || "PEACEMAGENTS MEMBER"}</h2>

              <p className="muted">{user.email}</p>

              <div className="stack">
                <Link href="/shop" className="btn primary">
                  Shop the collection
                </Link>

                <button
                  className="btn"
                  onClick={signOut}
                  disabled={busy}
                >
                  {busy ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>

            <div className="card">
              <h2>Your account</h2>
              <p className="muted">
                Orders, saved details and account security will live here as
                the PEACEMAGENTS system grows.
              </p>
            </div>
          </div>
        ) : (
          <div className="detail">
            <div className="card">
              <div className="stack">
                <div>
                  <h2>{mode==="signin" ? "Sign in" : "Create account"}</h2>
                  <p className="muted">
                    {mode==="signin"
                      ? "Welcome back to PEACEMAGENTS."
                      : "Create your PEACEMAGENTS customer account."}
                  </p>
                </div>

                <form onSubmit={submit} className="stack">
                  {mode==="signup" && (
                    <input
                      className="size"
                      placeholder="Full name"
                      value={fullName}
                      onChange={e=>setFullName(e.target.value)}
                      required
                    />
                  )}

                  <input
                    className="size"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                    required
                  />

                  <input
                    className="size"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    minLength={6}
                    required
                  />

                  <button
                    className="btn primary"
                    type="submit"
                    disabled={busy}
                  >
                    {busy
                      ? "Please wait..."
                      : mode==="signin"
                        ? "Sign in"
                        : "Create account"}
                  </button>
                </form>

                {error && (
                  <p className="muted">{error}</p>
                )}

                {message && (
                  <p className="muted">{message}</p>
                )}

                <button
                  className="btn"
                  onClick={()=>{
                    setMode(mode==="signin" ? "signup" : "signin");
                    setError("");
                    setMessage("");
                  }}
                >
                  {mode==="signin"
                    ? "Create a new account"
                    : "I already have an account"}
                </button>
              </div>
            </div>

            <div className="card">
              <div className="kicker">PEACEMAGENTS WORLDWIDE</div>
              <h2>CALM REBELS.</h2>
              <p className="muted">
                Your account will eventually hold orders, saved details,
                addresses and everything you need for the worldwide collection.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
