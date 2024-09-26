"use client"

import { SignUp } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import Image from "next/image";

const LoginForm = () => {
  // Use a ref with the type 'HTMLButtonElement | null' to accommodate the button element
  const clerkGoogleButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // Wait for Clerk SignUp to render, then find the button using the class and assign it to the ref
    const interval = setInterval(() => {
      const clerkButton = document.querySelector<HTMLButtonElement>('.cl-socialButtonsBlockButton__google');
      if (clerkButton) {
        clerkGoogleButtonRef.current = clerkButton;
        clearInterval(interval); // Stop checking once we found the button
      }
    }, 500);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = () => {
    if (clerkGoogleButtonRef.current) {
      clerkGoogleButtonRef.current.click(); // Programmatically trigger Clerk Google button click
    }
  };

  return (
    <form className="flex-1 space-y-6">
      <section className="mb-12 space-y-4">
        <h1 className="header">Hi Michael 👋</h1>
        <p className="text-#8D8F92">Get started with lead generation.</p>
      </section>
      <div>
        {/* Hide the Clerk SignUp component with CSS */}
        <div style={{ display: 'none' }}>
          <SignUp
          forceRedirectUrl={"/dashboard"}
          />
        </div>
        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="flex w-full justify-center border border-black dark:border-none items-center gap-x-4 bg-white text-black dark:text-white dark:bg-neutral-700 font-medium rounded-sm hover:bg-neutral-200 dark:hover:bg-neutral-600 transition p-2 px-6"
        >
          <Image src={'/google.svg'} alt="Google" width={20} height={20} />
          <span>Continue with Google</span>
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
