// The person using the demo portal right now (there is no real login yet).
import { getPortal } from './portalSession'
import { teamUser, managerUser, foUser, mgmtUser } from '../data/sampleData'

export function currentUser() {
  switch (getPortal()) {
    case 'manager': return { name: managerUser.name, role: managerUser.role }
    case 'fo': return { name: foUser.name, role: foUser.role }
    case 'management': return { name: mgmtUser.name, role: mgmtUser.role }
    default: return { name: teamUser.name, role: teamUser.role }
  }
}
