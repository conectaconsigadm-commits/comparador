export interface TabItem {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

/**
 * Tabs como Segmented Control (Apple-style)
 * Suporta light/dark mode via CSS variables
 * Scroll horizontal com fade nas bordas em mobile
 */
export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="segmented-control">
      <div className="segmented-wrapper">
        <div className="segmented-scroll">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`segmented-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="segmented-label">{tab.label}</span>
              {tab.count !== undefined && (
                <span className="segmented-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{tabsCSS}</style>
    </div>
  )
}

const tabsCSS = `
  .segmented-control {
    margin-bottom: 16px;
    width: 100%;
  }

  .segmented-wrapper {
    position: relative;
    width: 100%;
  }

  /* Fade edges para indicar scroll (mobile) */
  .segmented-wrapper::before,
  .segmented-wrapper::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 28px;
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity 200ms ease;
  }

  .segmented-wrapper::before {
    left: 0;
    background: linear-gradient(90deg, var(--cc-surface-solid) 0%, transparent 100%);
  }

  .segmented-wrapper::after {
    right: 0;
    background: linear-gradient(-90deg, var(--cc-surface-solid) 0%, transparent 100%);
  }

  .segmented-scroll {
    display: flex;
    flex-wrap: nowrap;
    gap: 2px;
    padding: 4px;
    background: var(--cc-surface-2);
    border: 1px solid var(--cc-border);
    border-radius: var(--cc-radius-md);
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    width: 100%;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  .segmented-scroll::-webkit-scrollbar {
    display: none;
  }

  .segmented-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 7px 14px;
    font-size: 13px;
    font-weight: 500;
    color: var(--cc-text-secondary);
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 150ms ease;
    flex-shrink: 0;
  }

  .segmented-item:hover:not(.active) {
    color: var(--cc-text);
    background: var(--cc-surface);
  }

  .segmented-item.active {
    color: var(--cc-text);
    background: var(--cc-surface-solid);
    box-shadow: var(--cc-shadow-sm);
    border-bottom: 2px solid var(--cc-text);
  }

  .segmented-label {
    line-height: 1.2;
  }

  .segmented-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 10px;
    font-weight: 600;
    background: var(--cc-surface);
    border-radius: 9px;
    line-height: 1;
  }

  .segmented-item.active .segmented-count {
    background: var(--cc-primary-light);
    color: var(--cc-primary);
  }

  /* Tablet: tabs podem precisar scroll */
  @media (max-width: 1024px) {
    .segmented-scroll {
      overflow-x: auto;
      padding-right: 8px;
    }
    
    .segmented-item {
      padding: 7px 12px;
    }
  }

  /* Mobile: scroll horizontal com fade visível */
  @media (max-width: 768px) {
    .segmented-wrapper::after {
      opacity: 0.9;
    }

    .segmented-scroll {
      display: flex;
      width: 100%;
      padding-right: 24px;
    }
    
    .segmented-item {
      padding: 8px 12px;
      font-size: 12px;
    }
    
    .segmented-count {
      font-size: 9px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
    }
  }

  @media (max-width: 480px) {
    .segmented-item {
      padding: 7px 10px;
      font-size: 11px;
    }
    
    .segmented-scroll {
      padding-right: 28px;
    }
  }
`
