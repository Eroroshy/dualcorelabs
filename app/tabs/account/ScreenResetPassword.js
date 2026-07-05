import { useNavigation, useRoute } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-paper';

import { supabase } from '../../subapaseClient';

const parseParamsFromUrl = async () => {
  const url = await Linking.getInitialURL();
  if (!url) return {};

  const parsed = Linking.parse(url);
  return {
    ...parsed.queryParams,
  };
};

export default function ScreenResetPassword() {
  const navigation = useNavigation();
  const route = useRoute();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const params = useMemo(() => route.params || {}, [route.params]);

  useEffect(() => {
    let mounted = true;

    const prepareSession = async () => {
      try {
        const mergedParams = { ...(await parseParamsFromUrl()), ...params };
        const accessToken = mergedParams.access_token || mergedParams.accessToken;
        const refreshToken = mergedParams.refresh_token || mergedParams.refreshToken;
        const code = mergedParams.code;

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        if (mounted) {
          setSessionReady(true);
        }
      } catch (error) {
        if (mounted) {
          Alert.alert('Error', error.message || 'No se pudo abrir el enlace de recuperación.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    prepareSession();

    return () => {
      mounted = false;
    };
  }, [params]);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      await supabase.auth.signOut();
      Alert.alert('Éxito', 'Tu contraseña fue actualizada. Ahora puedes iniciar sesión de nuevo.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>K I N E T I C</Text>
      <Text style={styles.title}>Restablecer contraseña</Text>
      <Text style={styles.subtitle}>
        {sessionReady
          ? 'Escribe la nueva contraseña de tu cuenta.'
          : 'Estamos validando tu enlace de recuperación...'}
      </Text>

      <View style={styles.card}>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={styles.input}
          mode="flat"
          placeholder="Nueva contraseña"
          placeholderTextColor="#6e7277"
          textColor="#fff"
          activeUnderlineColor="#88adff"
          underlineColor="#2d3135"
          disabled={!sessionReady || loading}
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
          mode="flat"
          placeholder="Confirmar contraseña"
          placeholderTextColor="#6e7277"
          textColor="#fff"
          activeUnderlineColor="#88adff"
          underlineColor="#2d3135"
          disabled={!sessionReady || loading}
        />

        <TouchableOpacity
          onPress={handleUpdatePassword}
          disabled={!sessionReady || submitting || loading}
          style={[styles.button, (!sessionReady || submitting || loading) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {submitting ? 'GUARDANDO...' : 'ACTUALIZAR CONTRASEÑA'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
          <Text style={styles.linkText}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e10',
    padding: 24,
    justifyContent: 'center',
  },
  brand: {
    color: '#fff',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Lexend_800ExtraBold',
    letterSpacing: 2,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Lexend_700Bold',
  },
  subtitle: {
    color: '#aaabad',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Manrope_500Medium',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#171a1c',
    borderRadius: 14,
    padding: 20,
    gap: 14,
  },
  input: {
    backgroundColor: '#232629',
    color: '#fff',
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#88adff',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0c0e10',
    textAlign: 'center',
    fontFamily: 'Lexend_800ExtraBold',
    letterSpacing: 1,
  },
  linkButton: {
    alignSelf: 'center',
    marginTop: 6,
  },
  linkText: {
    color: '#88adff',
    fontFamily: 'Manrope_600SemiBold',
  },
});
