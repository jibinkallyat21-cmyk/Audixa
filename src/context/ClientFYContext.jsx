import { createContext, useContext, useState } from 'react'
import { useStore, readStore } from '../utils/store'

const ClientFYContext = createContext(null)

export const AVAILABLE_FYS = ['FY2024', 'FY2023', 'FY2022']

// With the demo data loaded the client has one engagement: the demo file.
const DEMO_REF = 'ENG-DEMO-0001'
export const ENGAGEMENT_REFS = {
  get FY2024() { return readStore('demo:loaded', null) ? DEMO_REF : 'KSA-2024-8841' },
  FY2023: 'KSA-2023-7712',
  FY2022: 'KSA-2022-6305',
}

export const PARTNER_DATA = {
  FY2024: { initials: 'AB', name: 'Ashraf Bassas', firm: 'Ashraf Bassas CPA Firm' },
  FY2023: { initials: 'AB', name: 'Ashraf Bassas', firm: 'Ashraf Bassas CPA Firm' },
  FY2022: { initials: 'MI', name: 'Man Ibrahim Alshinqiti', firm: 'Man Ibrahim Alshinqiti CPA Firm' },
}

export function ClientFYProvider({ children }) {
  const [selectedFY, setSelectedFY] = useState('FY2024')
  const [demo] = useStore('demo:loaded', null)
  const partner = demo ? { initials: 'FA', name: 'Fahad Al-Otaibi', firm: `${demo.auditor || 'MISCPA'} audit team` } : (PARTNER_DATA[selectedFY] ?? PARTNER_DATA.FY2024)
  const fys = demo ? ['FY2024'] : AVAILABLE_FYS

  return (
    <ClientFYContext.Provider value={{ selectedFY: demo ? 'FY2024' : selectedFY, setSelectedFY, availableFYs: fys, partner }}>
      {children}
    </ClientFYContext.Provider>
  )
}

export function useClientFY() {
  const ctx = useContext(ClientFYContext)
  if (!ctx) throw new Error('useClientFY must be used within ClientFYProvider')
  return ctx
}
