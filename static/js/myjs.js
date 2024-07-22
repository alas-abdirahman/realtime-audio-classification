import audio from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.0";
const { AudioClassifier, FilesetResolver } = audio;

const demosSection = document.getElementById("demos");

let audioClassifier;
let audioCtx;

const createAudioClassifier = async () => {
  const audioResolver = await FilesetResolver.forAudioTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.0/wasm"
  );

  audioClassifier = await AudioClassifier.createFromOptions(audioResolver, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite"
    }
  });
  demosSection.classList.remove("invisible");
};
createAudioClassifier();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

const streamingBt = document.getElementById("microBt");

streamingBt.addEventListener("click", async function () {
  await runStreamingAudioClassification();
});

async function runStreamingAudioClassification() {
  const output = document.getElementById("microResult");
  const constraints = { audio: true };
  let stream;

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    console.log("The following error occurred: " + err);
    alert("getUserMedia not supported on your browser");
  }

  if (!audioCtx) {
    audioCtx = new AudioContext({ sampleRate: 16000 });
  } else if (audioCtx.state === "running") {
    await audioCtx.suspend();
    streamingBt.firstElementChild.innerHTML = "START CLASSIFYING";
    return;
  }

  await audioCtx.resume();
  streamingBt.firstElementChild.innerHTML = "STOP CLASSIFYING";

  const source = audioCtx.createMediaStreamSource(stream);
  const scriptNode = audioCtx.createScriptProcessor(16384, 1, 1);

  scriptNode.onaudioprocess = async function (audioProcessingEvent) {
    const inputBuffer = audioProcessingEvent.inputBuffer;
    const inputData = inputBuffer.getChannelData(0);

    const result = await audioClassifier.classify(inputData);
    const categories = result[0].classifications[0].categories;

    output.innerText =
      categories[0].categoryName +
      "(" +
      categories[0].score.toFixed(3) +
      ")\n" +
      categories[1].categoryName +
      "(" +
      categories[1].score.toFixed(3) +
      ")\n" + 
      categories[2].categoryName +
      "(" +
      categories[2].score.toFixed(3) +
      ")\n" 
      +
      categories[3].categoryName +
      "(" +
      categories[3].score.toFixed(3) +
      ")\n" +
      categories[4].categoryName +
      "(" +
      categories[4].score.toFixed(3) +
      ")";
  };

  source.connect(scriptNode);
  scriptNode.connect(audioCtx.destination);
}
