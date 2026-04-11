import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-paper";

export default function ScreenEditProfile() {

  const [name, setName] = useState("Terry Crews");

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Edit Profile</Text>

      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        textColor="#fff"
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c0e10",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#171a1c",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#88adff",
    padding: 14,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: "center",
    color: "#002052",
    fontWeight: "bold",
  },
});