import { Camera, CameraType, CameraView } from "expo-camera";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios"; // Adicionei axios para a requisição

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log("Status da permissão:", status);
      setHasPermission(status === "granted");
    })();
  }, []);

  const registerAttendance = async (cpf) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Erro", "Token não encontrado. Faça login novamente.");
        return;
      }

      const currentDateTime = new Date();
      const currentHour = currentDateTime.getHours();
      const currentMinutes = currentDateTime.getMinutes();
      console.log("Horário atual (local):", `${currentHour}:${currentMinutes}`);

      // Determinar o período com base no horário atual
      let periodo;
      if (currentHour >= 8 && currentHour < 12) {
        periodo = "manha";
      } else if (currentHour >= 13 && currentHour < 18) {
        periodo = "tarde";
      } else {
        periodo = null;
      }

      console.log("Período calculado:", periodo);

      if (!periodo) {
        Alert.alert(
          "Erro",
          "Nenhuma janela de leitura ativa no momento (8:00-12:00 ou 13:00-18:00)."
        );
        return;
      }

      // Fazer a requisição para o backend
      const response = await axios.post(
        "http://192.168.10.4:3000/api/usuarios/register-attendance",
        {
          cpf: cpf,
          periodo: periodo,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;
      console.log("Resposta do backend:", result);

      if (response.status === 200) {
        const successMessage = result.complete
          ? "Presença registrada! Comparecimento completo hoje."
          : result.message;
        Alert.alert("Sucesso", successMessage);
      }
    } catch (error) {
      console.error("Erro ao registrar presença:", error);
      if (error.response) {
        Alert.alert(
          "Erro",
          error.response.data.message || "Erro ao registrar presença."
        );
      } else {
        Alert.alert("Erro", "Erro ao conectar com o servidor.");
      }
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      setScannedData(data);
      console.log("QR Code escaneado:", { type, data });

      try {
        // O QR Code contém apenas o CPF como string simples
        const cpf = data; // Não precisa de JSON.parse, pois é só o CPF
        if (!cpf || typeof cpf !== "string" || cpf.length !== 11) {
          throw new Error("CPF inválido.");
        }
        registerAttendance(cpf);
      } catch (error) {
        console.error("Erro ao processar QR Code:", error);
        Alert.alert("Erro", "QR Code inválido.");
        setScanned(false);
      }
    }
  };

  if (hasPermission === null) {
    return <Text>Solicitando permissão da câmera...</Text>;
  }

  if (hasPermission === false) {
    return <Text>Permissão não concedida. Acesso à câmera negado.</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlayContainer}>
          <View style={styles.topOverlay} />
          <View style={styles.middleOverlay}>
            <View style={styles.scanFrame}>
              <Text style={styles.scanText}>
                {scanned ? "QR Code lido!" : "Escaneie o QR Code"}
              </Text>
            </View>
          </View>
          <View style={styles.bottomOverlay} />
        </View>
      </CameraView>

      {scanned && (
        <TouchableOpacity
          style={styles.buttonScanear}
          onPress={() => {
            setScanned(false);
            setScannedData(null);
          }}
        >
          <Text style={styles.buttonScanearText}>Escanear Novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "column",
  },
  topOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  middleOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  scanFrame: {
    flex: 1,
    borderColor: "#fff",
    borderWidth: 0.5,
    borderRadius: 10,
    marginHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scanText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  buttonScanear: {
    backgroundColor: "#f1901d",
    padding: 12,
    borderRadius: 5,
    marginTop: 6,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  buttonScanearText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
});