import Constants from "expo-constants";
import { Platform } from "react-native";

const getHost = () => {
  if (Platform.OS === "android") {
    return "10.0.2.2";
  }

  const debuggerHost = Constants.manifest?.debuggerHost || Constants.expoConfig?.hostUri;

  if (debuggerHost) {
    return debuggerHost.split(":")[0];
  }

  return "localhost";
};

export const API_URL = `http://${getHost()}:3000/api`;
