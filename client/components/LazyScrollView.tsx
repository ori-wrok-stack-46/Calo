
import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, View, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIEWPORT_BUFFER = SCREEN_HEIGHT * 0.5; // Render items within 50% of screen height

interface LazyScrollViewProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement;
  keyExtractor: (item: any, index: number) => string;
  itemHeight?: number;
  children?: React.ReactNode;
  style?: any;
  contentContainerStyle?: any;
  onScroll?: (event: any) => void;
  refreshControl?: React.ReactElement;
}

export const LazyScrollView: React.FC<LazyScrollViewProps> = ({
  data,
  renderItem,
  keyExtractor,
  itemHeight = 100,
  children,
  style,
  contentContainerStyle,
  onScroll,
  refreshControl,
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  const handleScroll = useCallback(
    (event: any) => {
      const offset = event.nativeEvent.contentOffset.y;
      setScrollOffset(offset);
      onScroll?.(event);
    },
    [onScroll]
  );

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor((scrollOffset - VIEWPORT_BUFFER) / itemHeight)
    );
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((scrollOffset + SCREEN_HEIGHT + VIEWPORT_BUFFER) / itemHeight)
    );

    return { startIndex, endIndex };
  }, [scrollOffset, data.length, itemHeight]);

  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    const items = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (data[i]) {
        items.push({
          item: data[i],
          index: i,
          key: keyExtractor(data[i], i),
        });
      }
    }

    return items;
  }, [data, visibleRange, keyExtractor]);

  const totalHeight = data.length * itemHeight;
  const topSpacerHeight = visibleRange.startIndex * itemHeight;
  const bottomSpacerHeight = 
    (data.length - visibleRange.endIndex - 1) * itemHeight;

  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      {children}
      
      {/* Top spacer for virtualization */}
      {topSpacerHeight > 0 && (
        <View style={{ height: topSpacerHeight }} />
      )}

      {/* Visible items */}
      {visibleItems.map(({ item, index, key }) => (
        <View key={key} style={{ minHeight: itemHeight }}>
          {renderItem(item, index)}
        </View>
      ))}

      {/* Bottom spacer for virtualization */}
      {bottomSpacerHeight > 0 && (
        <View style={{ height: bottomSpacerHeight }} />
      )}
    </ScrollView>
  );
};

export default LazyScrollView;
