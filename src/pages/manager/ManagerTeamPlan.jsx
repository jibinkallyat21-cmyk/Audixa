import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { useModal } from '../../components/shared/Modal'
import { teamPlanSummary, abcpaTeamPlan, SENIORITY_OPTIONS } from '../../data/sampleData'

function EditableRow({ person, isLead, onSave, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(person.name)
  const { openModal, closeModal } = useModal()

  const handleRemove = () => {
    openModal({
      title: 'Remove from Team Plan',
      body: (
        <p className="text-sm text-slate-600">
          Remove {person.name} from the team plan? This will not affect existing file assignments.
        </p>
      ),
      confirmLabel: 'Confirm',
      onConfirm: () => onRemove(),
    })
  }

  return (
    <div className={`flex items-center gap-3 py-2.5 ${isLead ? '' : 'pl-10'}`}>
      <div className={`flex shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-semibold text-navy ${isLead ? 'h-9 w-9' : 'h-7 w-7'}`}>
        {name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
      </div>
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="rounded-md border border-navy px-2 py-1 text-sm outline-none"
        />
      ) : (
        <p className={`text-sm ${isLead ? 'font-bold text-navy' : 'font-medium text-navy'}`}>{name}</p>
      )}
      {isLead && person.seniority && <span className="text-xs text-slate-400">{person.seniority}</span>}
      <div className="ml-auto flex items-center gap-1.5">
        {editing ? (
          <>
            <button
              onClick={() => {
                onSave(name)
                setEditing(false)
              }}
              aria-label="Save"
              className="flex h-7 w-7 items-center justify-center rounded-md text-emerald hover:bg-emerald/10"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setName(person.name)
                setEditing(false)
              }}
              aria-label="Cancel"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} aria-label="Edit" className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-navy">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleRemove} aria-label="Remove" className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-alert-red/10 hover:text-alert-red">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function AddLeadModalBody({ onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [seniority, setSeniority] = useState(SENIORITY_OPTIONS[0])

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Lead Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Seniority</label>
        <select value={seniority} onChange={(e) => setSeniority(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy">
          {SENIORITY_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2.5 pt-1">
        <button
          disabled={!name.trim()}
          onClick={() => onSubmit({ name: name.trim(), email, seniority })}
          className="flex-1 rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731] disabled:opacity-40"
        >
          Add Lead
        </button>
        <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

function AddAssociateModalBody({ leadName, onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Adding an associate under {leadName}.</p>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Associate Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy" />
      </div>
      <div className="flex gap-2.5 pt-1">
        <button
          disabled={!name.trim()}
          onClick={() => onSubmit({ name: name.trim(), email })}
          className="flex-1 rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731] disabled:opacity-40"
        >
          Add
        </button>
        <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ManagerTeamPlan() {
  const showToast = useToast()
  const { openModal, closeModal } = useModal()
  const [plan, setPlan] = useState(abcpaTeamPlan)
  const [editMode, setEditMode] = useState(false)

  const updateLeadName = (leadId, name) => setPlan((prev) => prev.map((l) => (l.id === leadId ? { ...l, name } : l)))
  const removeLead = (leadId) => {
    setPlan((prev) => prev.filter((l) => l.id !== leadId))
    showToast('Lead removed from team plan')
  }
  const updateAssociateName = (leadId, assocId, name) =>
    setPlan((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, associates: l.associates.map((a) => (a.id === assocId ? { ...a, name } : a)) } : l))
    )
  const removeAssociate = (leadId, assocId) => {
    setPlan((prev) => prev.map((l) => (l.id === leadId ? { ...l, associates: l.associates.filter((a) => a.id !== assocId) } : l)))
    showToast('Associate removed from team plan')
  }

  const handleAddLead = () => {
    openModal({
      title: 'Add New Lead',
      body: (
        <AddLeadModalBody
          onCancel={closeModal}
          onSubmit={({ name, seniority }) => {
            setPlan((prev) => [...prev, { id: `lead-${Date.now()}`, name, seniority, associates: [] }])
            showToast(`${name} added as ${seniority}`)
            closeModal()
          }}
        />
      ),
    })
  }

  const handleAddAssociate = (lead) => {
    openModal({
      title: `Add Associate to ${lead.name}`,
      body: (
        <AddAssociateModalBody
          leadName={lead.name}
          onCancel={closeModal}
          onSubmit={({ name }) => {
            setPlan((prev) =>
              prev.map((l) => (l.id === lead.id ? { ...l, associates: [...l.associates, { id: `assoc-${Date.now()}`, name }] } : l))
            )
            showToast(`${name} added to ${lead.name}'s team`)
            closeModal()
          }}
        />
      ),
    })
  }

  return (
    <ManagerLayout title="Team Plan">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">Annual Team Plan — FY2026</h1>
            <button
              onClick={() => {
                setEditMode((v) => !v)
                showToast(editMode ? 'Edit mode off' : 'Edit mode on — rows are now editable')
              }}
              className="rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
            >
              {editMode ? 'Done Editing' : 'Edit Plan'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">Total Leads: {teamPlanSummary.totalLeads}</span>
            <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">Total Associates: {teamPlanSummary.totalAssociates}</span>
            <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">Last Updated: {teamPlanSummary.lastUpdated}</span>
            <span className="rounded-full bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald">Status: {teamPlanSummary.status}</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-navy px-5 py-3">
              <h2 className="text-sm font-bold text-white">ABCPA Department</h2>
            </div>
            <div className="divide-y divide-slate-100 px-5">
              {plan.map((lead) => (
                <div key={lead.id} className="py-4">
                  <EditableRow
                    person={lead}
                    isLead
                    onSave={(name) => updateLeadName(lead.id, name)}
                    onRemove={() => removeLead(lead.id)}
                  />
                  <div className="mt-1 divide-y divide-slate-50">
                    {lead.associates.map((assoc) => (
                      <EditableRow
                        key={assoc.id}
                        person={assoc}
                        isLead={false}
                        onSave={(name) => updateAssociateName(lead.id, assoc.id, name)}
                        onRemove={() => removeAssociate(lead.id, assoc.id)}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddAssociate(lead)}
                    className="ml-10 mt-2 flex items-center gap-1.5 rounded-lg border border-navy/30 px-3.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Associate
                  </button>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 pt-2">
              <button
                onClick={handleAddLead}
                className="flex items-center gap-1.5 rounded-lg border border-brand-red px-4 py-2 text-xs font-semibold text-brand-red hover:bg-brand-red/5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Lead
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-amber/30 bg-amber/10 px-5 py-4 text-sm text-amber">
            Allocating a file to a Lead automatically assigns their entire team. Mid-year changes apply to new
            allocations only — existing assignments are not affected.
          </div>
        </div>
      </PageTransition>
    </ManagerLayout>
  )
}
