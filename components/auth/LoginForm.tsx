"use client"

import { signIn } from "next-auth/react";
import Image from "next/image";


const LoginForm = () => {
    return (
      <form className="flex-1 space-y-6">
        <section className="mb-12 space-y-4">
          <h1 className="header">Hi there 👋</h1>
          <p className="text-#8D8F92">Get started with lead generation.</p>
        </section>
          <div>
            <button onClick={() => signIn("google")}
              className="flex w-full justify-center border border-black dark:border-none items-center gap-x-4 bg-white text-black dark:text-white dark:bg-neutral-700 font-medium rounded-sm hover:bg-neutral-200 dark:hover:bg-neutral-600 transition p-2 px-6">
                <Image src={'/google.svg'} alt="" width={20} height={20}/>
                <span>Continue with Google</span>
            </button>
          </div>
      </form>
     );
}
 
export default LoginForm

