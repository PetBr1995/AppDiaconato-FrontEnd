import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import jsQR from "jsqr";

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [manualCpf, setManualCpf] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const requestCameraPermission = async () => {
      console.log("Iniciando solicitação de permissão da câmera...");
      console.log("Plataforma:", Platform.OS);
      console.log("navigator.mediaDevices:", !!navigator.mediaDevices);
      console.log("navigator.mediaDevices.getUserMedia:", !!navigator.mediaDevices?.getUserMedia);

      if (Platform.OS === "web" && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
        console.log("API de mídia não suportada pelo navegador.");
        setHasPermission(false);
        setErrorMessage("API de mídia não suportada pelo navegador.");
        return;
      }

      console.log("Solicitando acesso à câmera...");
      try {
        // Ajuste condicional para mobile (não aplicável aqui) e web
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        console.log("Stream obtido com sucesso:", stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log("Metadados do vídeo carregados. Iniciando reprodução...");
            videoRef.current
              .play()
              .then(() => {
                console.log("Vídeo iniciado com sucesso.");
                setHasPermission(true);
                setErrorMessage(null);
                startScanning();
              })
              .catch(err => {
                console.error("Erro ao iniciar o vídeo:", err);
                setErrorMessage("Erro ao iniciar o vídeo da câmera: " + err.message);
                setHasPermission(false);
              });
          };
        } else {
          console.error("Elemento <video> não encontrado.");
          setErrorMessage("Elemento de vídeo não encontrado.");
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Erro ao solicitar permissão da câmera:", error);
        setHasPermission(false);
        setErrorMessage(
          error.name === "NotAllowedError"
            ? "Permissão da câmera negada pelo usuário."
            : "Erro ao acessar a câmera: " + error.message
        );
      }
    };

    if (Platform.OS === "web") {
      requestCameraPermission();
    } else {
      // Mobile: não usa câmera nativa neste código, assume entrada manual
      setHasPermission(false);
      setErrorMessage("Câmera não disponível no mobile neste modo.");
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        console.log("Limpando stream da câmera...");
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
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

      const baseURL = Platform.OS === "web" ? "http://localhost:3000" : "http://192.168.10.4:3000";
      console.log("Enviando requisição para registrar presença:", { cpf, periodo });
      const response = await axios.post(
        `${baseURL}/api/usuarios/register-attendance`,
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

  const startScanning = () => {
    console.log("Iniciando escaneamento...");
    const tick = () => {
      if (scanned || !videoRef.current || !canvasRef.current) {
        console.log("Escaneamento interrompido:", {
          scanned,
          video: !!videoRef.current,
          canvas: !!canvasRef.current,
        });
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log("Vídeo ainda não tem dimensões válidas. Tentando novamente...");
        requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        setScanned(true);
        setScannedData(code.data);
        console.log("QR Code escaneado:", { data: code.data });

        try {
          const cpf = code.data;
          if (!cpf || typeof cpf !== "string" || cpf.length !== 11) {
            throw new Error("CPF inválido.");
          }
          registerAttendance(cpf);
        } catch (error) {
          console.error("Erro ao processar QR Code:", error);
          Alert.alert("Erro", "QR Code inválido.");
          setScanned(false);
        }
      } else {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  const handleManualSubmit = () => {
    if (!manualCpf || manualCpf.length !== 11 || isNaN(manualCpf)) {
      Alert.alert("Erro", "Por favor, insira um CPF válido com 11 dígitos.");
      return;
    }
    setScanned(true);
    setScannedData(manualCpf);
    registerAttendance(manualCpf);
  };

  if (hasPermission === null) {
    return <Text>Solicitando permissão da câmera...</Text>;
  }

  return (
    <View style={styles.container}>
      {Platform.OS === "web" && hasPermission ? (
        <>
          <video
            ref={videoRef}
            style={styles.camera}
            muted
            autoPlay
            playsInline
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
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

          {scanned && (
            <TouchableOpacity
              style={styles.buttonScanear}
              onPress={() => {
                setScanned(false);
                setScannedData(null);
                startScanning();
              }}
            >
              <Text style={styles.buttonScanearText}>Escanear Novamente</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text style={styles.errorText}>
          {errorMessage || "Câmera não disponível ou permissão negada."}
        </Text>
      )}

      <Text style={styles.manualLabel}>Insira o CPF manualmente:</Text>
      <TextInput
        style={styles.input}
        value={manualCpf}
        onChangeText={setManualCpf}
        placeholder="Digite o CPF (11 dígitos)"
        keyboardType="numeric"
        maxLength={11}
      />
      <TouchableOpacity style={styles.buttonScanear} onPress={handleManualSubmit}>
        <Text style={styles.buttonScanearText}>Registrar Presença</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    width: "90%",
  },
  buttonScanearText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    margin: 20,
  },
  manualLabel: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    width: "90%",
    marginBottom: 10,
    fontSize: 16,
  },
});