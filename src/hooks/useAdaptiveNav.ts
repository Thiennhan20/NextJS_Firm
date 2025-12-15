import { useEffect, useState, useCallback } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: number;
}

/**
 * Smart adaptive navigation hook
 * Automatically detects when nav items overflow and applies adaptive steps:
 * Step 1: Hide TV Shows → More menu
 * Step 2: Search bar → Search icon
 * Step 3: Hide Movies → More menu
 * Step 4: Show mobile menu
 */
export function useAdaptiveNav(allItems: NavItem[]) {
  const [adaptiveStep, setAdaptiveStep] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const width = window.innerWidth;

      // Simple breakpoint-based detection
      // Step 0: All visible (width >= 1200px)
      // Step 1: Hide TV Shows (width < 1200px)
      // Step 2: Search icon (width < 1050px)
      // Step 3: Hide Movies (width < 900px)
      // Step 4: Mobile menu (width < 700px)

      if (width >= 1200) {
        setAdaptiveStep(0);
        setShowMobileMenu(false);
      } else if (width >= 1050) {
        setAdaptiveStep(1); // Hide TV Shows
        setShowMobileMenu(false);
      } else if (width >= 900) {
        setAdaptiveStep(2); // + Search icon
        setShowMobileMenu(false);
      } else if (width >= 700) {
        setAdaptiveStep(3); // + Hide Movies
        setShowMobileMenu(false);
      } else {
        setAdaptiveStep(4); // Mobile menu
        setShowMobileMenu(true);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  // Calculate visible/hidden items based on step
  const getNavState = useCallback(() => {
    // eslint-disable-next-line prefer-const
    let visible = [...allItems];
    // eslint-disable-next-line prefer-const
    let hidden: NavItem[] = [];
    let showSearchBar = true;

    if (adaptiveStep >= 1) {
      // Step 1: Hide TV Shows
      const tvIndex = visible.findIndex(item => item.name === 'TV Shows');
      if (tvIndex !== -1) {
        hidden.push(visible[tvIndex]);
        visible.splice(tvIndex, 1);
      }
    }

    if (adaptiveStep >= 2) {
      // Step 2: Search icon
      showSearchBar = false;
    }

    if (adaptiveStep >= 3) {
      // Step 3: Hide Movies
      const moviesIndex = visible.findIndex(item => item.name === 'Movies');
      if (moviesIndex !== -1) {
        hidden.push(visible[moviesIndex]);
        visible.splice(moviesIndex, 1);
      }
    }

    return {
      visibleItems: visible,
      hiddenItems: hidden,
      showSearchBar,
      showMobileMenu,
    };
  }, [allItems, adaptiveStep, showMobileMenu]);

  return getNavState();
}
