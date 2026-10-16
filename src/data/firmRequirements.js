import { MIS_REQUIREMENTS } from './misRequirements.js'
import { ABC_REQUIREMENTS } from './abcRequirements.js'
// The general audit requirement list of the firm the client is allocated to.
export const requirementsFor = (auditor) => (auditor === 'ABCPA' ? ABC_REQUIREMENTS : auditor === 'MISCPA' ? MIS_REQUIREMENTS : [])
