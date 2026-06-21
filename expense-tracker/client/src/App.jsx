import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  Download, 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  FileSpreadsheet,
  FileDown
} from 'lucide-react'

// Section definitions
const SECTIONS = [
  { id: 'nisa', title: 'Nisa Marriage Hall', gradient: 'from-violet-600 to-indigo-600', glow: 'shadow-violet-900/20' },
  { id: 'ahmed', title: "Ahmed's Home", gradient: 'from-blue-600 to-cyan-600', glow: 'shadow-blue-900/20' },
  { id: 'faizu', title: "Faizu's Home", gradient: 'from-emerald-600 to-teal-600', glow: 'shadow-emerald-900/20' },
  { id: 'hera', title: "Hera's Home", gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-900/20' }
]

export default function App() {
  // Application Data States
  const [columns, setColumns] = useState({
    nisa: [
      { id: 'description', label: 'Where Spent', type: 'text' },
      { id: 'amount', label: 'Amount', type: 'number' }
    ],
    ahmed: [
      { id: 'description', label: 'Where Spent', type: 'text' },
      { id: 'amount', label: 'Amount', type: 'number' }
    ],
    faizu: [
      { id: 'description', label: 'Where Spent', type: 'text' },
      { id: 'amount', label: 'Amount', type: 'number' }
    ],
    hera: [
      { id: 'description', label: 'Where Spent', type: 'text' },
      { id: 'amount', label: 'Amount', type: 'number' }
    ]
  })

  const [rows, setRows] = useState({
    nisa: [
      { id: 'nisa-1', description: 'Hall Booking Advance', amount: 50000 },
      { id: 'nisa-2', description: 'Catering Services', amount: 35000 },
      { id: 'nisa-3', description: 'Stage Decoration', amount: 15000 }
    ],
    ahmed: [
      { id: 'ahmed-1', description: 'Monthly Groceries', amount: 8500 },
      { id: 'ahmed-2', description: 'Electricity Bill', amount: 4200 },
      { id: 'ahmed-3', description: 'Internet Broadband', amount: 1200 }
    ],
    faizu: [
      { id: 'faizu-1', description: 'House Maintenance', amount: 6000 },
      { id: 'faizu-2', description: 'Water Delivery', amount: 850 },
      { id: 'faizu-3', description: 'Gas Cylinder Refill', amount: 1150 }
    ],
    hera: [
      { id: 'hera-1', description: 'Rent Installment', amount: 12000 },
      { id: 'hera-2', description: 'Local Taxes', amount: 2300 },
      { id: 'hera-3', description: 'Garden Landscaping', amount: 3500 }
    ]
  })

  // Calculation Configuration State
  const [calcModes, setCalcModes] = useState({
    nisa: true,  // true = Auto, false = Manual
    ahmed: true,
    faizu: true,
    hera: true
  })

  // Stored calculated totals
  const [totals, setTotals] = useState({
    nisa: 0,
    ahmed: 0,
    faizu: 0,
    hera: 0
  })

  // UI state for adding columns
  const [activeAddColumnSection, setActiveAddColumnSection] = useState(null)
  const [newColumnName, setNewColumnName] = useState('')
  const [newColumnType, setNewColumnType] = useState('text')

  // UI Toast notification state
  const [toast, setToast] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  // Show a temporary alert toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  // Calculate total for a section
  const computeSectionTotal = (sectionId, customRows = rows) => {
    const sectionRows = customRows[sectionId] || []
    return sectionRows.reduce((sum, row) => {
      const val = parseFloat(row.amount)
      return sum + (isNaN(val) ? 0 : val)
    }, 0)
  }

  // Effect to automatically calculate if Auto mode is enabled
  useEffect(() => {
    const updatedTotals = { ...totals }
    let changed = false

    SECTIONS.forEach(sec => {
      if (calcModes[sec.id]) {
        const computed = computeSectionTotal(sec.id)
        if (totals[sec.id] !== computed) {
          updatedTotals[sec.id] = computed
          changed = true
        }
      }
    })

    if (changed) {
      setTotals(updatedTotals)
    }
  }, [rows, calcModes])

  // Trigger manual calculation
  const handleManualCalculate = (sectionId) => {
    const computed = computeSectionTotal(sectionId)
    setTotals(prev => ({
      ...prev,
      [sectionId]: computed
    }))
    showToast(`Recalculated totals for ${SECTIONS.find(s => s.id === sectionId).title}!`, 'success')
  }

  // Handle cell edit
  const handleCellChange = (sectionId, rowId, fieldId, value) => {
    setRows(prev => {
      const updatedRows = prev[sectionId].map(row => {
        if (row.id === rowId) {
          return { ...row, [fieldId]: value }
        }
        return row
      })
      return {
        ...prev,
        [sectionId]: updatedRows
      }
    })
  }

  // Add a new row to a section
  const handleAddRow = (sectionId) => {
    const newRow = {
      id: `${sectionId}-${Date.now()}`
    }
    // Initialize fields based on current columns
    columns[sectionId].forEach(col => {
      newRow[col.id] = col.type === 'number' ? '' : ''
    })

    setRows(prev => ({
      ...prev,
      [sectionId]: [...prev[sectionId], newRow]
    }))
  }

  // Delete a row
  const handleDeleteRow = (sectionId, rowId) => {
    setRows(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter(row => row.id !== rowId)
    }))
  }

  // Add a dynamic column
  const handleAddColumnSubmit = (e) => {
    e.preventDefault()
    if (!newColumnName.trim() || !activeAddColumnSection) return

    const colId = newColumnName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    
    // Check if column already exists
    const exists = columns[activeAddColumnSection].some(c => c.id === colId)
    if (exists) {
      showToast('A column with that name already exists!', 'error')
      return
    }

    const newCol = {
      id: colId,
      label: newColumnName,
      type: newColumnType
    }

    // Add to columns schema
    setColumns(prev => ({
      ...prev,
      [activeAddColumnSection]: [...prev[activeAddColumnSection], newCol]
    }))

    // Initialize the property in all existing rows
    setRows(prev => {
      const updatedRows = prev[activeAddColumnSection].map(row => ({
        ...row,
        [colId]: newColumnType === 'number' ? '' : ''
      }))
      return {
        ...prev,
        [activeAddColumnSection]: updatedRows
      }
    })

    showToast(`Added column "${newColumnName}" to ${SECTIONS.find(s => s.id === activeAddColumnSection).title}!`)
    setNewColumnName('')
    setActiveAddColumnSection(null)
  }

  // Grand Total calculation
  const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0)

  // Export PDF Handler (Node endpoint with Browser window.print fallback)
  const handleExportPDF = async () => {
    setIsExporting(true)
    
    const payload = {
      sections: SECTIONS.map(sec => ({
        id: sec.id,
        title: sec.title,
        columns: columns[sec.id],
        rows: rows[sec.id],
        total: totals[sec.id],
        calcMode: calcModes[sec.id] ? 'Automatic' : 'Manual'
      })),
      grandTotal,
      timestamp: new Date().toLocaleString()
    }

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        showToast(result.message || 'Receipt PDF successfully saved to your Desktop!', 'success')
      } else {
        // Fallback to client-side print
        throw new Error('Server returned an error')
      }
    } catch (err) {
      console.warn('Backend PDF generator not available. Triggering browser print layout instead...', err)
      showToast('Desktop Direct Server not running. Launching browser print module instead!', 'amber')
      setTimeout(() => {
        window.print()
      }, 1000)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border glass-panel shadow-2xl fade-in`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          ) : toast.type === 'amber' ? (
            <HelpCircle className="w-5 h-5 text-amber-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          )}
          <span className="text-sm font-medium text-gray-200">{toast.message}</span>
        </div>
      )}

      {/* Dynamic Column Modal */}
      {activeAddColumnSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleAddColumnSubmit} className="glass-card glass-panel p-6 max-w-md w-full flex flex-col gap-4 fade-in">
            <h3 className="text-xl font-heading font-bold text-gray-100">
              Add New Column in {SECTIONS.find(s => s.id === activeAddColumnSection).title}
            </h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Column Label</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Tax Rate, Date, Payer" 
                value={newColumnName}
                onChange={e => setNewColumnName(e.target.value)}
                className="table-input"
                style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'var(--border-color)' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Data Type</label>
              <select 
                value={newColumnType}
                onChange={e => setNewColumnType(e.target.value)}
                className="table-input"
                style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'var(--border-color)', color: '#fff' }}
              >
                <option value="text" style={{background: '#111827'}}>Text / Description</option>
                <option value="number" style={{background: '#111827'}}>Number (Currency/Totals)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button 
                type="button"
                onClick={() => setActiveAddColumnSection(null)}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/35"
              >
                Create Column
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Header Area */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5 no-print">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💸</span>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 tracking-tight">
              Expense Architect
            </h1>
          </div>
          <p className="text-gray-400 text-sm md:text-base">
            Professional Multi-Section Event & House Management Ledger
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Grand Total Indicator */}
          <div className="glass-card px-6 py-3 flex flex-col items-end gap-1 shadow-lg border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GRAND TOTAL LEDGER</span>
            <span className="text-2xl font-heading font-black text-white bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/40 transform hover:-translate-y-0.5 active:translate-y-0 transition duration-150 disabled:opacity-50"
          >
            {isExporting ? (
              <span className="animate-spin mr-1">⌛</span>
            ) : (
              <FileDown className="w-5 h-5" />
            )}
            Download PDF Receipt
          </button>
        </div>
      </header>

      {/* Grid Layout of the 4 Sections */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {SECTIONS.map(section => {
          const sectionColumns = columns[section.id]
          const sectionRows = rows[section.id]
          const isAuto = calcModes[section.id]
          const sectionTotal = totals[section.id]

          return (
            <section 
              key={section.id} 
              className={`glass-card p-6 flex flex-col gap-6 shadow-xl relative overflow-hidden ${section.glow} fade-in`}
            >
              {/* Card Accent Glow */}
              <div className={`absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br ${section.gradient} opacity-5 rounded-full blur-3xl`}></div>

              {/* Section Header */}
              <div className="flex justify-between items-center gap-4 flex-wrap border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${section.gradient}`}></div>
                  <h2 className="text-xl font-heading font-bold text-gray-100">{section.title}</h2>
                </div>

                {/* Switch Controls */}
                <div className="flex items-center gap-3 no-print">
                  <div 
                    className="switch-container"
                    onClick={() => {
                      setCalcModes(prev => ({
                        ...prev,
                        [section.id]: !prev[section.id]
                      }))
                    }}
                    title={isAuto ? "Dynamic calculation on expense changes" : "Requires clicking manual recalculation"}
                  >
                    <span className="switch-label">{isAuto ? "Auto" : "Manual"}</span>
                    <div className={`switch-track ${isAuto ? 'active' : ''}`}>
                      <div className="switch-thumb"></div>
                    </div>
                  </div>

                  {!isAuto && (
                    <button 
                      onClick={() => handleManualCalculate(section.id)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-cyan-400 hover:text-cyan-300 border border-white/5"
                      title="Calculate Section Sum"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Section Grid/Table Container */}
              <div className="overflow-x-auto min-h-[160px]">
                <table className="custom-table">
                  <thead>
                    <tr>
                      {sectionColumns.map(col => (
                        <th key={col.id} style={{ width: col.id === 'amount' ? '120px' : 'auto' }}>
                          {col.label}
                        </th>
                      ))}
                      <th className="no-print" style={{ width: '45px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionRows.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.01]">
                        {sectionColumns.map(col => (
                          <td key={col.id}>
                            <input 
                              type={col.type === 'number' ? 'number' : 'text'}
                              value={row[col.id] ?? ''}
                              onChange={(e) => handleCellChange(section.id, row.id, col.id, e.target.value)}
                              placeholder={col.type === 'number' ? '0.00' : 'Spent on...'}
                              className={`table-input ${col.type === 'number' ? 'table-input-number' : ''}`}
                            />
                          </td>
                        ))}
                        <td className="no-print text-center">
                          <button 
                            onClick={() => handleDeleteRow(section.id, row.id)}
                            className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section Footer Actions & Sum display */}
              <div className="flex justify-between items-center gap-4 flex-wrap mt-auto pt-4 border-t border-white/5">
                <div className="flex gap-2 no-print">
                  <button 
                    onClick={() => handleAddRow(section.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Row
                  </button>

                  <button 
                    onClick={() => setActiveAddColumnSection(section.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Column
                  </button>
                </div>

                <div className="flex items-baseline gap-2 ml-auto">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SECTION SUM</span>
                  <span className={`text-xl font-heading font-black bg-clip-text text-transparent bg-gradient-to-r ${section.gradient}`}>
                    ${sectionTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
