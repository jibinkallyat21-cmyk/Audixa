import { createContext, useContext, useState } from 'react'

const ClientFYContext = createContext(null)

export const AVAILABLE_FYS = ['FY2024', 'FY2023', 'FY2022']

export const ENGAGEMENT_REFS = {
  FY2024: 'KSA-2024-8841',
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
  const partner = PARTNER_DATA[selectedFY] ?? PARTNER_DATA.FY2024

  return (
    <ClientFYContext.Provider value={{ selectedFY, setSelectedFY, availableFYs: AVAILABLE_FYS, partner }}>
      {children}
    </ClientFYContext.Provider>
  )
}

export function useClientFY() {
  const ctx = useContext(ClientFYContext)
  if (!ctx) throw new Error('useClientFY must be used within ClientFYProvider')
  return ctx
}
