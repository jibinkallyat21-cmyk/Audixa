import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

export default function ExitDemoButton() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/login')}
      className="flex items-center rounded-[20px] border font-medium text-white transition-colors"
      style={{
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'transparent',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '11px',
        padding: '5px 12px',
        gap: '5px',
        transitionDuration: '150ms',
        transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.color = 'rgba(255,255,255,1)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
      }}
    >
      <LogOut size={13} />
      Exit Demo
    </button>
  )
}
