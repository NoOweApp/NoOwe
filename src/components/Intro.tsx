import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";

export default function Loading() {
  const { width } = useWindowDimensions();
  const coin1Y = useRef(new Animated.Value(0)).current;
  const coin2Y = useRef(new Animated.Value(0)).current;
  const coin1Opacity = useRef(new Animated.Value(0)).current;
  const coin2Opacity = useRef(new Animated.Value(0)).current;
  const star1Opacity = useRef(new Animated.Value(0)).current;
  const star2Opacity = useRef(new Animated.Value(0)).current;
  const star3Opacity = useRef(new Animated.Value(0)).current;
  const star4Opacity = useRef(new Animated.Value(0)).current;

  const WALLET_SIZE = width * 0.35;
  const COIN_SIZE = WALLET_SIZE * 0.16;
  const STAR_LG = width * 0.04;
  const STAR_SM = width * 0.025;
  const COIN_START = -WALLET_SIZE * 2; // starts above the wallet
  const COIN_END = WALLET_SIZE * 0.32; // lands at slot position

  useEffect(() => {
    const dropCoin = (
      animY: Animated.Value,
      animOpacity: Animated.Value,
      delay: number,
    ) =>
      Animated.sequence([
        Animated.delay(delay),
        // reset position to top
        Animated.parallel([
          Animated.timing(animY, {
            toValue: COIN_START,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(animOpacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        // hard fall with gravity feel
        Animated.timing(animY, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        // quick bounce on landing
        Animated.timing(animY, {
          toValue: -WALLET_SIZE * 0.05,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animY, {
          toValue: 0,
          duration: 80,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        // fade out as coin drops into wallet
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        // pause before next drop
        Animated.delay(600),
      ]);

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

    dropCoin(coin1Y, coin1Opacity, 0).start();
    dropCoin(coin2Y, coin2Opacity, 350).start();
    starBlink(star1Opacity, 0).start();
    starBlink(star2Opacity, 200).start();
    starBlink(star3Opacity, 400).start();
    starBlink(star4Opacity, 600).start();
  }, []);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: WALLET_SIZE, height: WALLET_SIZE }}>
        {/* Stars */}
        <Animated.Image
          source={require("../assets/bluestar.png")}
          style={[
            styles.star,
            {
              width: STAR_LG,
              height: STAR_LG,
              top: -STAR_LG,
              right: -STAR_LG,
              opacity: star1Opacity,
            },
          ]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../assets/bluestar.png")}
          style={[
            styles.star,
            {
              width: STAR_SM,
              height: STAR_SM,
              top: STAR_SM,
              right: -STAR_SM,
              opacity: star2Opacity,
            },
          ]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../assets/bluestar.png")}
          style={[
            styles.star,
            {
              width: STAR_LG,
              height: STAR_LG,
              bottom: -STAR_LG,
              left: -STAR_LG,
              opacity: star3Opacity,
            },
          ]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../assets/bluestar.png")}
          style={[
            styles.star,
            {
              width: STAR_SM,
              height: STAR_SM,
              bottom: STAR_SM,
              left: -STAR_SM,
              opacity: star4Opacity,
            },
          ]}
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

        {/* Coin 1 — falls first */}
        <Animated.Image
          source={require("../assets/Coin.png")}
          style={{
            position: "absolute",
            width: COIN_SIZE,
            height: COIN_SIZE,
            left: WALLET_SIZE * 0.25,
            top: WALLET_SIZE * 0.32,
            zIndex: 2,
            opacity: coin1Opacity,
            transform: [{ translateY: coin1Y }],
          }}
          resizeMode="contain"
        />

        {/* Coin 2 — falls second */}
        <Animated.Image
          source={require("../assets/Coin.png")}
          style={{
            position: "absolute",
            width: COIN_SIZE,
            height: COIN_SIZE,
            left: WALLET_SIZE * 0.54,
            top: WALLET_SIZE * 0.32,
            zIndex: 2,
            opacity: coin2Opacity,
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
  star: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 4,
  },
});
