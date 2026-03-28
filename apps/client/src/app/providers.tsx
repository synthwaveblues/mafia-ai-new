import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { FishjamProvider } from '@fishjam-cloud/react-client'

const FISHJAM_ID = import.meta.env.VITE_FISHJAM_ID || 'a3adb7970dc445b680b0bed5589786e7'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FishjamProvider fishjamId={FISHJAM_ID}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </FishjamProvider>
  )
}
