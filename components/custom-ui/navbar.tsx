"use client";

import { useUser, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Image from 'next/image';

export default function NavBar({ toolName = "Michael's Lead Generation Tool" }) {
  const { user } = useUser();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Tool Name */}
          <div className="flex items-center">
            <span className="text-xl font-semibold text-gray-800">{toolName}</span>
          </div>

          {/* User Profile or Sign-In Button */}
          <div className="flex items-center">
            <UserButton afterSignOutUrl="/"/>
          </div>
        </div>
      </div>
    </nav>
  );
}
