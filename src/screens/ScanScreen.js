import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { Camera, CameraType } from "expo-camera"; // Para mobile
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import jsQR from "jsqr"; // Para escanear QR codes na web

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null); // Para exibir erros
  const videoRef = useRef(null); // Para a versão web
  const canvasRef = useRef(null); // Para escanear QR codes na web

  // Solicitação de permissão e inicialização
  useEffect(() => {
    const requestPermission = async () => {
      console.log("Iniciando solicitação de permissão...");
      console.log("Plataforma:", Platform.OS);

      if (Platform.OS === "web") {
        // Web: Usar navigator.mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.log("API de mídia não suportada pelo navegador.");
          setHasPermission(false);
          setErrorMessage("API de mídia não suportada pelo navegador.");
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }, // Câmera traseira
          });
          console.log("Stream obtido com sucesso na web.");
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              setHasPermission(true);
              setErrorMessage(null);
              startScanning(); // Inicia o escaneamento na web
            };
          } else {
            console.error("Elemento <video> não encontrado.");
            setHasPermission(false);
            setErrorMessage("Elemento de vídeo não encontrado.");
          }
        } catch (error) {
          console.error("Erro ao acessar câmera na web:", error);
          setHasPermission(false);
          setErrorMessage("Erro ao acessar a câmera na web: " + error.message);
        }
      } else {
        // Mobile: Usar expo-camera
        try {
          const { status } = await Camera.requestCameraPermissionsAsync();
          console.log("Status da permissão (mobile):", status);
          setHasPermission(status === "granted");
          if (status !== "granted") {
            setErrorMessage("Permissão da câmera negada no mobile.");
          }
        } catch (error) {
          console.error("Erro ao solicitar permissão no mobile:", error);
          setHasPermission(false);
          setErrorMessage("Erro ao solicitar permissão no mobile: " + error.message);
        }
      }
    };

    requestPermission();

    return () => {
      if (Platform.OS === "web" && videoRef.current && videoRef.current.srcObject) {
        console.log("Limpando stream da câmera na web...");
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
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

      if (!periodo) {
        Alert.alert(
          "Erro",
          "Nenhuma janela de leitura ativa no momento (8:00-12:00 ou 13:00-18:00)."
        );
        return;
      }

      const response = await axios.post(
        Platform.OS === "web"
          ? "https://appdiaconato.ddns.net:3000/api/usuarios/register-attendance"
          : "http://192.168.10.4:3000/api/usuarios/register-attendance",
        { cpf, periodo },
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
      Alert.alert(
        "Erro",
        error.response?.data?.message || "Erro ao conectar com o servidor."
      );
    }
  };

  // Função para escanear QR codes na web
  const startScanning = () => {
    console.log("Iniciando escaneamento na web...");
    const tick = () => {
      if (scanned || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (video.videoWidth === 0 || video.videoHeight === 0) {
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
        console.log("QR Code escaneado (web):", code.data);
        handleQRCodeData(code.data);
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  };

  // Função para processar o QR code (comum a web e mobile)
  const handleQRCodeData = (data) => {
    try {
      const cpf = data;
      if (!cpf || typeof cpf !== "string" || cpf.length !== 11) {
        throw new Error("CPF inválido.");
      }
      registerAttendance(cpf);
    } catch (error) {
      console.error("Erro ao processar QR Code:", error);
      Alert.alert("Erro", "QR Code inválido.");
      setScanned(false);
    }
  };

  // Handler para mobile (expo-camera)
  const handleBarCodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      setScannedData(data);
      console.log("QR Code escaneado (mobile):", { type, data });
      handleQRCodeData(data);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Solicitando permissão da câmera...</Text>
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Permissão não concedida. Acesso à câmera negado.
        </Text>
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <>
          <video ref={videoRef} style={styles.camera} muted autoPlay playsInline />
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
        </>
      ) : (
        <Camera
          style={styles.camera}
          type={CameraType.back}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
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
        </Camera>
      )}

      {scanned && (
        <TouchableOpacity
          style={styles.buttonScanear}
          onPress={() => {
            setScanned(false);
            setScannedData(null);
            if (Platform.OS === "web") startScanning();
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
    width: "100%",
    height: "100%",
    objectFit: "cover", // Para web
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
    borderWidth: 2,
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
    alignSelf: "center",
    width: "90%",
  },
  buttonScanearText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#ff5555",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
});