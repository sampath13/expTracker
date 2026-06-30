import data from '../data/product-overview.json'

// ─── Section renderers ────────────────────────────────────────────────────────

function Prose({ body }) {
  return (
    <div className="space-y-3">
      {body.split('\n\n').map((para, i) => (
        <p key={i} className="text-gray-600 leading-relaxed text-sm">
          {para}
        </p>
      ))}
    </div>
  )
}

function CardList({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.number} className="flex gap-4 p-4 rounded-lg border border-gray-200 bg-white">
          <div className="shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center mt-0.5">
            {item.number}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">{item.title}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function Flow({ intro, steps }) {
  return (
    <div>
      {intro && <p className="text-sm text-gray-600 mb-4">{intro}</p>}
      <div className="flex flex-col sm:flex-row gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex sm:flex-col flex-1 items-start sm:items-stretch">
            {/* Step card */}
            <div className="flex-1 p-4 rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-gray-900">{step.label}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
            </div>
            {/* Arrow between steps */}
            {i < steps.length - 1 && (
              <div className="hidden sm:flex items-center justify-center px-1 text-gray-300 text-lg shrink-0 self-center">
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function UserTarget({ primary, excluded }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="p-4 rounded-lg border border-green-200 bg-green-50">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
          {primary.label}
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{primary.description}</p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {excluded.label}
        </p>
        <ul className="space-y-1">
          {excluded.items.map((item) => (
            <li key={item} className="text-sm text-gray-500 flex items-start gap-1.5">
              <span className="text-gray-300 mt-0.5">✕</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DataTable({ columns, rows, callout }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={`border-b border-gray-100 last:border-0 ${ri % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-4 py-3 text-sm leading-snug ${ci === 0 ? 'font-medium text-gray-800' : 'text-gray-600'}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {callout && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800 leading-relaxed">{callout}</p>
        </div>
      )}
    </div>
  )
}

function BulletList({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <span className="text-gray-300 mt-0.5 shrink-0">▸</span>
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong className="text-gray-900 font-semibold">{item.strong}</strong>{' '}
            {item.rest}
          </p>
        </div>
      ))}
    </div>
  )
}

function Pricing({ note, tiers }) {
  return (
    <div>
      {note && (
        <p className="text-xs text-gray-500 italic mb-3">{note}</p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`p-4 rounded-lg border ${
              tier.highlight
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-baseline justify-between mb-3">
              <span className={`text-sm font-bold ${tier.highlight ? 'text-blue-900' : 'text-gray-900'}`}>
                {tier.name}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                tier.highlight ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {tier.price}
              </span>
            </div>
            <ul className="space-y-1.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className={`mt-0.5 shrink-0 ${tier.highlight ? 'text-blue-400' : 'text-gray-300'}`}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section dispatcher ───────────────────────────────────────────────────────

function Section({ section }) {
  let content
  switch (section.type) {
    case 'prose':        content = <Prose body={section.body} />; break
    case 'card-list':    content = <CardList items={section.items} />; break
    case 'flow':         content = <Flow intro={section.intro} steps={section.steps} />; break
    case 'user-target':  content = <UserTarget primary={section.primary} excluded={section.excluded} />; break
    case 'table':        content = <DataTable columns={section.columns} rows={section.rows} callout={section.callout} />; break
    case 'bullet-list':  content = <BulletList items={section.items} />; break
    case 'pricing':      content = <Pricing note={section.note} tiers={section.tiers} />; break
    default:             content = null
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">
        {section.heading}
      </h2>
      {content}
    </section>
  )
}

// ─── ProductOverview ──────────────────────────────────────────────────────────

export default function ProductOverview() {
  const { title, tagline, status, sections } = data

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium border border-amber-200">
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">{tagline}</p>
          <p className="text-xs text-gray-400 mt-1">{status.description}</p>
        </div>
      </div>

      {/* Sections */}
      <div className="px-8 py-6 max-w-2xl space-y-8">
        {sections.map((section) => (
          <Section key={section.id} section={section} />
        ))}
      </div>
    </div>
  )
}
