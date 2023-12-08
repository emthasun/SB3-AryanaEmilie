import Config from "./Config";
import EventEmitter from "@onemorestudio/eventemitterjs";
export default class AudioDetector extends EventEmitter {
  constructor() {
    super();
    this.OPEN_AI_KEY = Config.OPEN_AI_KEY;
    // this.draw();
    this.mediaRecorder;
    this.audioChunks = [];
    this.handlers = {
      startRecording: this.startRecording.bind(this),
      stopRecording: this.stopRecording.bind(this),
    };

    // this.startRecordingButton = document.getElementById("startRecording");
    // this.stopRecordingButton = document.getElementById("stopRecording");

    // this.startRecordingButton.addEventListener(
    //   "click",
    //   this.handlers.startRecording
    // );
    // this.stopRecordingButton.addEventListener(
    //   "click",
    //   this.handlers.stopRecording
    // );
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      this.mediaRecorder = new MediaRecorder(stream);

      console.log(this.mediaRecorder);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: "audio/wav",
        });

        // Send audio file to OpenAI API as FormData
        this.callOpenAI(this.OPEN_AI_KEY, audioBlob);

        // Reset for the next recording
        this.audioChunks = [];
        // this.startRecordingButton.disabled = false;
        // this.stopRecordingButton.disabled = true;
      };

      this.mediaRecorder.start();
      // this.startRecordingButton.disabled = true;
      // this.stopRecordingButton.disabled = false;
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }

  async stopRecording() {
    console.log(this.mediaRecorder);
    if (this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
    }
  }

  callOpenAI(apiKey, audioBlob) {
    const apiUrl = "https://api.openai.com/v1/audio/transcriptions";

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    formData.append("model", "whisper-1");
    // Append other parameters as needed by the API

    fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle the response from OpenAI
        console.log("OpenAI API Response:", data);
        this.emit("transcriptReady", [data]);
      })
      .catch((error) => {
        // Handle errors
        console.error("Error calling OpenAI API:", error);
      });
  }

  draw() {
    requestAnimationFrame(this.draw.bind(this));
  }
}
