import { useRef, useEffect, useState, useCallback } from 'react';
import './BottomNav.css';

/**
 * Tab configuration for the bottom navigation.
 * Each tab has a unique name, icon, and label.
 */
const TABS = [
  { name: 'habitat', icon: '🏝️', label: 'Habitat' },
  { name: 'log', icon: '📝', label: 'Log' },
  { name: 'dashboard', icon: '📊', label: 'Dashboard' },
  { name: 'social', icon: '🏆', label: 'Badges' },
  { name: 'suggestions', icon: '💡', label: 'Tips' },
];

/**
 * BottomNav — Fixed bottom tab navigation bar.
 * Features glassmorphism background, smooth sliding indicator,
 * and scale animation on the active tab icon.
 *
 * @param {Object} props
 * @param {string} [props.activeTab='habitat'] - Currently active tab name
 * @param {Function} props.onTabChange - Callback when a tab is selected (receives tab name)
 */
export default function BottomNav({ activeTab = 'habitat', onTabChange }) {
  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  /** Updates the sliding indicator position based on the active tab. */
  const updateIndicator = useCallback(() => {
    if (!navRef.current) return;
    const activeIndex = TABS.findIndex((t) => t.name === activeTab);
    if (activeIndex === -1) return;

    const activeButton = navRef.current.querySelector(
      `[data-tab="${activeTab}"]`
    );
    if (!activeButton) return;

    const navRect = navRef.current.getBoundingClientRect();
    const btnRect = activeButton.getBoundingClientRect();

    setIndicatorStyle({
      left: `${btnRect.left - navRect.left + btnRect.width / 2 - 20}px`,
      width: '40px',
    });
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  /**
   * Handles tab selection via click.
   * @param {string} tabName
   */
  const handleTabClick = (tabName) => {
    if (onTabChange) onTabChange(tabName);
  };

  /**
   * Handles keyboard navigation between tabs.
   * @param {KeyboardEvent} e
   * @param {number} currentIndex
   */
  const handleKeyDown = (e, currentIndex) => {
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = TABS.length - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextTab = TABS[nextIndex];
      if (onTabChange) onTabChange(nextTab.name);
      const btn = navRef.current?.querySelector(`[data-tab="${nextTab.name}"]`);
      btn?.focus();
    }
  };

  return (
    <nav
      ref={navRef}
      className="bottom-nav"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="bottom-nav__indicator" style={indicatorStyle} aria-hidden="true" />

      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.name;

        return (
          <button
            key={tab.name}
            id={`nav-tab-${tab.name}`}
            data-tab={tab.name}
            className={`bottom-nav__tab ${isActive ? 'bottom-nav__tab--active' : ''}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.name}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleTabClick(tab.name)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            type="button"
          >
            <span
              className={`bottom-nav__icon ${isActive ? 'bottom-nav__icon--active' : ''}`}
              aria-hidden="true"
            >
              {tab.icon}
            </span>
            <span className="bottom-nav__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
