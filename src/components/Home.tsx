import { StyleSheet, Text, View } from "react-native";

// import settings from "../data/settings.json";
// import bills from "../data/settings.json";

let name = "Owen";

function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>NoOwe</Text>
      <Text style={styles.subheading}>
        Hello {name}!
      </Text>
    </View>
  );
}

export default Home;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    alignItems: "center",
  },
  heading: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  paragraph: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});