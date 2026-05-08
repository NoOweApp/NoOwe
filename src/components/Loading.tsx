import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";

export default function Loading() {
  const { width, height } = useWindowDimensions();
  const coin1Y = useRef(new Animated.Value(0)).current;
  const coin2Y = useRef(new Animated.Value(0)).current;
  const star1Opacity = useRef(new Animated.Value(0)).current;
  const star2Opacity = useRef(new Animated.Value(0)).current;
  const star3Opacity = useRef(new Animated.Value(0)).current;
  const star4Opacity = useRef(new Animated.Value(0)).current;

  const WALLET_SIZE = width * 0.35;
  const COIN_SIZE = WALLET_SIZE * 0.16;
  const COIN_TRAVEL = -WALLET_SIZE * 0.45;
  const STAR_LG = width * 0.02;
  const STAR_SM = width * 0.04;

  useEffect(() => {
    const bounce = (anim: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: COIN_TRAVEL,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

    const starBlink = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ]),
      );

    bounce(coin1Y, 600).start();
    bounce(coin2Y, 900).start();
    starBlink(star1Opacity, 0).start();
    starBlink(star2Opacity, 200).start();
    starBlink(star3Opacity, 400).start();
    starBlink(star4Opacity, 600).start();
  }, []);

  return (
    <View style={styles.container}>
      <View
        style={{
          width: WALLET_SIZE,
          height: WALLET_SIZE,
          marginTop: -height * 0.2,
        }}
      >
        {/* Stars anchored to wallet */}
        <Animated.Image
          source={require("../assets/white star.webp")}
          style={{
            position: "absolute",
            width: STAR_LG,
            height: STAR_LG,
            top: STAR_LG * 2.5,
            right: -STAR_LG,
            opacity: star1Opacity,
          }}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../assets/white star.webp")}
          style={{
            position: "absolute",
            width: STAR_SM,
            height: STAR_SM,
            top: 0,
            right: -STAR_SM,
            opacity: star2Opacity,
          }}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../assets/white star.webp")}
          style={{
            position: "absolute",
            width: STAR_LG,
            height: STAR_LG,
            bottom: -STAR_LG,
            left: -STAR_LG,
            opacity: star3Opacity,
          }}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../assets/white star.webp")}
          style={{
            position: "absolute",
            width: STAR_SM,
            height: STAR_SM,
            bottom: 0,
            left: -STAR_SM,
            opacity: star4Opacity,
          }}
          resizeMode="contain"
        />

        {/* Bottom wallet layer */}
        <Animated.Image
          source={require("../assets/logo.png")}
          style={{
            position: "absolute",
            width: WALLET_SIZE,
            height: WALLET_SIZE,
            zIndex: 1,
          }}
          resizeMode="contain"
        />

        {/* Coin 1 */}
        <Animated.Image
          source={require("../assets/Coin.png")}
          style={{
            position: "absolute",
            width: COIN_SIZE,
            height: COIN_SIZE,
            left: WALLET_SIZE * 0.25,
            top: WALLET_SIZE * 0.32,
            zIndex: 2,
            transform: [{ translateY: coin1Y }],
          }}
          resizeMode="contain"
        />

        {/* Coin 2 */}
        <Animated.Image
          source={require("../assets/Coin.png")}
          style={{
            position: "absolute",
            width: COIN_SIZE,
            height: COIN_SIZE,
            left: WALLET_SIZE * 0.54,
            top: WALLET_SIZE * 0.32,
            zIndex: 2,
            transform: [{ translateY: coin2Y }],
          }}
          resizeMode="contain"
        />

        {/* Top yellow flap layer */}
        <Animated.Image
          source={require("../assets/yellow flap.png")}
          style={{
            position: "absolute",
            width: WALLET_SIZE,
            height: WALLET_SIZE,
            zIndex: 3,
          }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
