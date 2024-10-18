import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Image as SkiaImage, useImage, Circle, SkImage } from "@shopify/react-native-skia";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";

interface MapProps {
  mapImage: SkImage | null;
  translationX: SharedValue<number>;
  translationY: SharedValue<number>;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const mapWidth = 2048 * 2;
const mapHeight = 2048 * 2;

const MapComponent = (props: MapProps) => {
  const { mapImage, translationX, translationY } = props;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Canvas style={{ width: mapWidth, height: mapHeight }}>
        {mapImage && (
          <SkiaImage image={mapImage} x={0} y={0} width={mapWidth} height={mapHeight} />
        )}
      </Canvas>
    </Animated.View>
  );
};

export default function Game() {
  const mapImage = useImage(require('@/assets/images/map.png'));

  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Giá trị cộng dồn trước đó
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  // Giới hạn di chuyển theo viền của ảnh
  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.max(min, Math.min(value, max));
  };

  // Gesture kéo di chuyển bản đồ
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Khi bắt đầu vuốt, sử dụng giá trị cộng dồn trước đó
      translationX.value = offsetX.value;
      translationY.value = offsetY.value;
    })
    .onUpdate((event) => {
      // Cập nhật vị trí khi di chuyển, với giới hạn viền
      const newTranslationX = offsetX.value + event.translationX;
      const newTranslationY = offsetY.value + event.translationY;

      // Tính toán giới hạn di chuyển với kích thước thay đổi theo scale
      const maxTranslateX = (screenWidth - mapWidth * scale.value);
      const maxTranslateY = (screenHeight - mapHeight * scale.value);

      translationX.value = clamp(newTranslationX, maxTranslateX, 0);
      translationY.value = clamp(newTranslationY, maxTranslateY, 0);
    })
    .onEnd(() => {
      // Khi kết thúc, lưu vị trí hiện tại vào giá trị cộng dồn
      offsetX.value = translationX.value;
      offsetY.value = translationY.value;

      // Thêm hiệu ứng mượt mà (không bắt buộc)
      translationX.value = withSpring(translationX.value);
      translationY.value = withSpring(translationY.value);
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <GestureDetector gesture={panGesture}>
          <MapComponent
            mapImage={mapImage}
            translationX={translationX}
            translationY={translationY}
          />
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
});
