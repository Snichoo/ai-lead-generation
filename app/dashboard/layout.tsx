import NavBar from '@/components/custom-ui/navbar';
import React from 'react';

type Props = {
  children: React.ReactNode;
};

const OwnerLayout = async ({ children }: Props) => {
  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      <div className="w-full h-screen flex flex-col pl-0 md:pl-0"> {/* Removed the padding to prevent white space */}
        <NavBar />
        {children}
      </div>
    </div>
  );
};

export default OwnerLayout;
