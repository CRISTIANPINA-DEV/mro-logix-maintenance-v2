import * as React from "react"

// Tablet landscape is typically between 768px and 1280px in width
// and has width greater than height (landscape orientation)
export function useIsTabletLandscape() {
  const [isTabletLandscape, setIsTabletLandscape] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkTabletLandscape = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Check if device is in landscape orientation (width > height)
      // and within tablet width range (768px-1279px)
      setIsTabletLandscape(width > height && width >= 768 && width < 1280);
    };

    // Initial check
    checkTabletLandscape();
    
    // Add event listeners
    window.addEventListener("resize", checkTabletLandscape);
    window.addEventListener("orientationchange", checkTabletLandscape);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", checkTabletLandscape);
      window.removeEventListener("orientationchange", checkTabletLandscape);
    };
  }, []);

  return !!isTabletLandscape;
}
