import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
  const [status, setStatus] = useState({ message: "", type: "" }); // { message, type: "success" | "error" | "warning" }
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // Para armazenar o MediaStream
  const animationFrameId = useRef(null); // Para controlar o requestAnimationFrame

  useEffect(() => {
    const requestCameraPermission = async () => {
      console.log("Iniciando solicitação de permissão da câmera...");
      console.log("Plataforma:", Platform.OS);

      if (Platform.OS === "web") {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.log("API de mídia não suportada pelo navegador.");
          setHasPermission(false);
          setErrorMessage("API de mídia não suportada pelo navegador.");
          return;
        }

        try {
          let stream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "environment" },
            });
          } catch (err) {
            console.log("Câmera traseira não disponível, tentando qualquer câmera:", err);
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
          }

          console.log("Stream obtido com sucesso:", stream);
          streamRef.current = stream;
          setHasPermission(true);
          setErrorMessage(null);
          startScanning();
        } catch (error) {
          console.error("Erro ao solicitar permissão da câmera:", error);
          setHasPermission(false);
          setErrorMessage(
            error.name === "NotFoundError"
              ? "Nenhuma câmera encontrada no dispositivo."
              : error.name === "NotAllowedError"
              ? "Permissão da câmera negada pelo usuário."
              : "Erro ao acessar a câmera: " + error.message
          );
        }
      } else {
        setHasPermission(false);
        setErrorMessage("Câmera não disponível no mobile neste modo.");
      }
    };

    requestCameraPermission();

    return () => {
      if (streamRef.current) {
        console.log("Limpando stream da câmera...");
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const registerAttendance = async (cpf) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setStatus({ message: "Erro: Token não encontrado. Faça login novamente.", type: "error" });
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
        setStatus({
          message: "Aviso: Nenhuma janela de leitura ativa no momento (8:00-12:00 ou 13:00-18:00).",
          type: "warning",
        });
        return;
      }

      const baseURL =
        Platform.OS === "web" ? "https://appdiaconato.ddns.net:3000" : "http://localhost:3000";
      console.log("Enviando requisição para registrar presença:", { cpf, periodo });
      const response = await axios.post(
        `${baseURL}/api/usuarios/register-attendance`,
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
          : result.message || "Presença registrada com sucesso!";
        setStatus({ message: successMessage, type: "success" });
      }
    } catch (error) {
      console.error("Erro ao registrar presença:", error);
      setStatus({
        message: error.response?.data?.message || "Erro ao conectar com o servidor.",
        type: "error",
      });
    } finally {
      setScanned(true); // Marca como escaneado para exibir o botão
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current); // Para o loop de escaneamento
        console.log("Escaneamento pausado após leitura.");
      }
    }
  };

  const startScanning = () => {
    console.log("Iniciando escaneamento...");
    const video = document.createElement("video");
    video.srcObject = streamRef.current;
    video.play();

    const tick = () => {
      if (!canvasRef.current || !streamRef.current) {
        console.log("Escaneamento interrompido: canvas ou stream ausente.");
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log("Vídeo ainda não tem dimensões válidas. Tentando novamente...");
        animationFrameId.current = requestAnimationFrame(tick);
        return;
      }

      // Sempre atualiza o canvas com o stream da câmera
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Processa o QR code apenas se não estiver em estado "scanned"
      if (!scanned) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setScannedData(code.data);
          console.log("QR Code escaneado:", code.data);

          try {
            const cpf = code.data;
            if (!cpf || typeof cpf !== "string" || cpf.length !== 11) {
              throw new Error("CPF inválido.");
            }
            registerAttendance(cpf);
            return; // Para o loop imediatamente após a leitura
          } catch (error) {
            console.error("Erro ao processar QR Code:", error);
            setStatus({ message: "Erro: QR Code inválido.", type: "error" });
            setScanned(true); // Mostra o botão mesmo em caso de erro
            return; // Para o loop imediatamente após erro
          }
        }
      }

      // Continua o loop apenas se não estiver escaneado
      animationFrameId.current = requestAnimationFrame(tick);
    };

    animationFrameId.current = requestAnimationFrame(tick);
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedData(null);
    setStatus({ message: "", type: "" });
    startScanning(); // Reinicia o escaneamento
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Solicitando permissão da câmera...</Text>
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <>
          <canvas ref={canvasRef} style={styles.camera} />
          {hasPermission ? (
            <>
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
              {status.message && (
                <View style={styles.statusContainer}>
                  <Text
                    style={[
                      styles.statusMessage,
                      status.type === "success" && styles.successMessage,
                      status.type === "error" && styles.errorMessage,
                      status.type === "warning" && styles.warningMessage,
                    ]}
                  >
                    {status.message}
                  </Text>
                  {scanned && (
                    <TouchableOpacity
                      style={styles.buttonScanAgain}
                      onPress={handleScanAgain}
                    >
                      <Text style={styles.buttonScanAgainText}>
                        Deseja escanear novamente?
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {errorMessage || "Câmera não disponível ou permissão negada."}
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {errorMessage || "Câmera não disponível no mobile neste modo."}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    width: "100%",
    height: "70%",
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
  statusContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
    alignItems: "center",
    zIndex: 10,
  },
  statusMessage: {
    fontSize: 18,
    textAlign: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    color: "#fff",
    opacity: 0,
    animation: "fadeIn 0.5s forwards",
  },
  successMessage: {
    backgroundColor: "rgba(0, 128, 0, 0.9)", // Verde para sucesso
  },
  errorMessage: {
    backgroundColor: "rgba(255, 0, 0, 0.9)", // Vermelho para erro
  },
  warningMessage: {
    backgroundColor: "rgba(255, 165, 0, 0.9)", // Amarelo para aviso
  },
  buttonScanAgain: {
    backgroundColor: "#f1901d",
    padding: 12,
    borderRadius: 5,
  },
  buttonScanAgainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "#ff5555",
    fontSize: 16,
    textAlign: "center",
    margin: 20,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});

// Adicionar animação CSS inline para React Native Web
const keyframes = `
  @keyframes fadeIn {
    0% { opacity: 0; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }
`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerHTML = keyframes;
document.head.appendChild(styleSheet);