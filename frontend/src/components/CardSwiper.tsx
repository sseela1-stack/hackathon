import React, { useState, useRef, useEffect } from 'react';
import styles from './CardSwiper.module.css';

interface CardSwiperProps {
  cards: React.ReactNode[];
  onCardChange?: (index: number) => void;
  activeIndex?: number;
}

export const CardSwiper: React.FC<CardSwiperProps> = ({ cards, onCardChange, activeIndex }) => {
  const [currentIndex, setCurrentIndex] = useState(activeIndex ?? 0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof activeIndex === 'number' && activeIndex !== currentIndex) {
      setCurrentIndex(activeIndex);
    }
  }, [activeIndex]);

  // Minimum swipe distance (in px) to trigger card change
  const minSwipeDistance = 50;

  const updateIndex = (nextIndex: number) => {
    setCurrentIndex(nextIndex);
    onCardChange?.(nextIndex);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;

    // Apply resistance at edges
    let offset = -diff;
    if (currentIndex === 0 && offset > 0) {
      offset = offset * 0.3; // Resistance at start
    } else if (currentIndex === cards.length - 1 && offset < 0) {
      offset = offset * 0.3; // Resistance at end
    }

    setDragOffset(offset);
    setTouchEnd(currentTouch);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < cards.length - 1) {
      updateIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      updateIndex(currentIndex - 1);
    }

    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const goToCard = (index: number) => {
    updateIndex(index);
  };

  // Calculate transform based on current index and drag offset
  const getTransform = () => {
    const baseOffset = -currentIndex * 100;
    const dragPercentage = containerRef.current
      ? (dragOffset / containerRef.current.offsetWidth) * 100
      : 0;
    return `translateX(calc(${baseOffset}% + ${dragPercentage}px))`;
  };

  return (
    <div className={styles.swiperContainer} ref={containerRef}>
      <div
        className={styles.cardsWrapper}
        style={{
          transform: getTransform(),
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {cards.map((card, index) => (
          <div key={index} className={styles.card}>
            {card}
          </div>
        ))}
      </div>

      {/* Card indicators */}
      <div className={styles.indicators}>
        {cards.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === currentIndex ? styles.indicatorActive : ''}`}
            onClick={() => goToCard(index)}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
