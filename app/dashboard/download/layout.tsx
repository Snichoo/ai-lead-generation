import React from 'react'


type Props = {
  children: React.ReactNode
}

const DownloadLayout = async ({ children }: Props) => {


  return (
    <div className="flex h-screen w-full">
      <div className="w-full h-screen flex flex-col pl-20 md:pl-4">
        {children}
      </div>
    </div>
  )
}

export default DownloadLayout