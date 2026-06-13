import React, { useRef, useEffect, useState } from 'react';
import { View, ScrollView, Dimensions, Pressable, StyleSheet, Image, Text } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

interface Props {
  slides: Slide[];
  autoPlayInterval?: number;
}

export default function HeroBanner({ slides, autoPlayInterval = 5000 }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const bannerWidth = SCREEN_WIDTH - Spacing.xl * 2;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: nextIndex * bannerWidth, animated: true });
      setCurrentIndex(nextIndex);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [currentIndex, slides.length]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / bannerWidth);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        snapToInterval={bannerWidth}
        contentContainerStyle={{ gap: 0 }}
      >
        {slides.map((slide) => (
          <Pressable
            key={slide.id}
            style={[styles.slide, { width: bannerWidth }]}
            onPress={slide.onPress}
          >
            <Image
              source={{ uri: slide.image }}
              style={styles.slideImage}
              resizeMode="cover"
            />
            <View style={styles.slideOverlay} />
            <View style={styles.slideContent}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Dots */}
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  slide: {
    height: 160,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  slideContent: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  slideTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  slideSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
});
