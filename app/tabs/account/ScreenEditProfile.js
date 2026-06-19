import { useContext, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { TextInput } from "react-native-paper";
import { API_URL } from "../../config/api";
import { AuthContext } from "../../context/AuthContext";

export default function ScreenEditProfile() {
  const { user, token, updateUser } = useContext(AuthContext);
  const profile = user?.profile || {};

  const [nombre, setNombre] = useState(user?.nombre || "");
  const [email, setEmail] = useState(user?.email || "");
  const [edad, setEdad] = useState(profile.edad?.toString() || "");
  const [pesoKg, setPesoKg] = useState(profile.peso_kg?.toString() || "");
  const [alturaCm, setAlturaCm] = useState(profile.altura_cm?.toString() || "");
  const [nivelExperiencia, setNivelExperiencia] = useState(profile.nivel_experiencia || "");
  const [objetivo, setObjetivo] = useState(profile.objetivo || "");
  const [fotoUrl, setFotoUrl] = useState(profile.foto_url || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNombre(user?.nombre || "");
    setEmail(user?.email || "");
    setEdad(profile.edad?.toString() || "");
    setPesoKg(profile.peso_kg?.toString() || "");
    setAlturaCm(profile.altura_cm?.toString() || "");
    setNivelExperiencia(profile.nivel_experiencia || "");
    setObjetivo(profile.objetivo || "");
    setFotoUrl(profile.foto_url || "");
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!token) {
        setSaving(false);
        Alert.alert("Sesión inválida", "Por favor inicia sesión nuevamente.");
        return;
      }

      const response = await fetch(`${API_URL}/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre,
          edad: edad ? parseInt(edad, 10) : null,
          peso_kg: pesoKg ? parseFloat(pesoKg) : null,
          altura_cm: alturaCm ? parseFloat(alturaCm) : null,
          nivel_experiencia: nivelExperiencia,
          objetivo,
          foto_url: fotoUrl
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        let errorText = `HTTP ${response.status}`;
        try {
          if (contentType.includes("application/json")) {
            const errorData = await response.json();
            errorText = errorData.message || JSON.stringify(errorData);
          } else {
            errorText = await response.text();
          }
        } catch (e) {
          errorText = await response.text().catch(() => errorText);
        }
        console.error("Profile update failed:", response.status, errorText);
        throw new Error(errorText || "Error al actualizar perfil");
      }

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text().catch(() => null);
        console.warn("Profile update returned non-JSON response:", text);
        throw new Error(text || "Respuesta inválida del servidor");
      }
      updateUser(data.user);
      Alert.alert("Perfil actualizado", "Tus cambios se guardaron correctamente.");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar Perfil</Text>

      <TextInput
        label="Nombre"
        value={nombre}
        onChangeText={setNombre}
        style={styles.input}
        textColor="#fff"
      />
      <TextInput
        label="Email"
        value={email}
        style={styles.input}
        textColor="#fff"
        editable={false}
      />
      <TextInput
        label="Edad"
        value={edad}
        style={styles.input}
        keyboardType="numeric"
        onChangeText={setEdad}
        textColor="#fff"
      />
      <TextInput
        label="Peso (kg)"
        value={pesoKg}
        style={styles.input}
        keyboardType="numeric"
        onChangeText={setPesoKg}
        textColor="#fff"
      />
      <TextInput
        label="Altura (cm)"
        value={alturaCm}
        style={styles.input}
        keyboardType="numeric"
        onChangeText={setAlturaCm}
        textColor="#fff"
      />
      <TextInput
        label="Nivel de experiencia"
        value={nivelExperiencia}
        style={styles.input}
        onChangeText={setNivelExperiencia}
        textColor="#fff"
      />
      <TextInput
        label="Objetivo"
        value={objetivo}
        style={styles.input}
        onChangeText={setObjetivo}
        textColor="#fff"
      />
      <TextInput
        label="Foto URL"
        value={fotoUrl}
        style={styles.input}
        onChangeText={setFotoUrl}
        textColor="#fff"
      />

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? "Guardando..." : "Guardar"}</Text>
      </TouchableOpacity>
    </ScrollView>
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