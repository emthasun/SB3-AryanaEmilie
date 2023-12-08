import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Shape from "./Shape.js";
import Light from "./Light.js";
import Text from "./Text";
import Chat from "./Chat";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import AudioDetector from "./AudioDetector";
import * as dat from "dat.gui";
import { loadObject } from "./loadObject.js";
import { add } from "@tweenjs/tween.js";

export default class App {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    // this.gui = new dat.GUI();
    this.objPosition;
    this.wordRotationX = 0;
    this.wordsIsRotating = false;
    this.allWords = [];
    this.addScaleCounter = 0;

    //inint chat
    this.chat = new Chat();
    this.chat.addEventListener("word", this.addWord.bind(this));
    this.chat.addEventListener("speechEnd", this.speechEnd.bind(this));
    this.chat.addEventListener(
      "gpt_response",
      this.getTotalSentence.bind(this)
    );
    //init audio detector
    this.audioDetector = new AudioDetector();
    this.audioDetector.addEventListener(
      "transcriptReady",
      this.onTextReceived.bind(this)
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        console.log("space");
        this.audioDetector.stopRecording();
      }
    });

    this.splineLastPosition = 0;
    this.splineLastSpacer = 0;
    this.yIncrement = 1;

    this.initTHREE();
  }

  async initTHREE() {
    // Create a scene
    this.scene = new THREE.Scene();
    // Create a camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Set camera position
    // this.camera.position.z = 0;
    this.camera.position.y = 0;
    this.camera._viewTarget = new THREE.Vector3(0, 0, 0);
    this.cameraFinalTarget = -20;
    //force camera to look at first position on helixcurve
    this.camera.rotateY(-Math.PI / 2);

    // Create a renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    // change background color
    this.renderer.setClearColor("#000000");
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // set shadow
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; //default
    document.body.appendChild(this.renderer.domElement);

    // add fog
    // this.scene.fog = new THREE.FogExp2(0x333333, 0.2);

    this.renderScene = new RenderPass(this.scene, this.camera);
    //bloom
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    this.bloomPass.threshold = 0.6;
    this.bloomPass.strength = 0.5;
    this.bloomPass.radius = 0.5;

    this.bloomComposer = new EffectComposer(this.renderer);
    this.bloomComposer.setSize(window.innerWidth, window.innerHeight);
    this.bloomComposer.renderToScreen = true;
    this.bloomComposer.addPass(this.renderScene);
    this.bloomComposer.addPass(this.bloomPass);

    // const bloomFolder = this.gui.addFolder("bloom");
    // bloomFolder.add(this.bloomPass, "threshold", 0, 1, 0.01);
    // bloomFolder.add(this.bloomPass, "strength", 0, 3, 0.01);
    // bloomFolder.add(this.bloomPass, "radius", 0, 1, 0.01);

    // Create controls
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.shapes = [];
    // Create cube
    this.shape = new Shape(this.scene, this.camera);
    this.numCircles = 3;

    loadObject("human.fbx").then((object) => {
      this.createPraying(object);
    });

    //Create Light
    this.light = new Light(this.scene);
    this.light.createLight();
    // this.light.gui(this.gui);

    // this.rotationOffset = 1;

    //duplicate circles but with bigger radius

    //create floor
    // this.shape.createFloor();

    //add helix
    this.curveObject = this.shape.createHelix();

    //Create text
    this.text = new Text(this.scene);
    this.font = await this.text.loadFont();

    this.allMots = [];

    document.addEventListener("keydown", (e) => {
      // this.chat.call(this.chat.context);
      // console.log("clicked");
      if (e.key === "Enter") {
        console.log("p");
        this.chat.call(this.chat.context);
      }
      //press backspace to go back to final target
      if (e.key === "Backspace") {
        console.log("backspace");
        setTimeout(() => {
          this.wordsIsRotating = !this.wordsIsRotating;
        }, 500);

        // this.camera._targetY = this.cameraFinalTarget;
        console.log(this.camera.position.y);
        this.bloomPass.strength = 1;
        this.rotateWords();
        //make camera look at create praying object
        this.camera._target = new THREE.Vector3(
          0,
          this.camera.position.y + 5,
          0
        );
        //animate a camera rotation
      }
    });

    //
    this.draw();
  }

  createPraying(object) {
    this.shape = new Shape(this.scene, this.camera);
    const clone = object.clone();
    this.shape.createObject(this.angle, this.radius, clone);
    console.log("createShape");
    this.shapes.push(this.shape);
  }

  getTotalSentence(sentence) {
    const words = sentence.split(" ");
    this.positionOnSpline = [];
    this.allTangents = [];
    this.allMots = [];
    let t = this.splineLastPosition;
    let totalLength = 0;
    let sizes = [];
    console.log("CURVE LENGTH", this.curveObject.getLength());
    words.forEach((word, index) => {
      const text = this.text.createText(word, this.font, false);
      const size = this.text.getSize();
      // const size = { z: 0.5 };
      sizes.push(totalLength);
      totalLength += size.z + 0.15;
    });
    sizes.push(totalLength);
    console.log("totalLength", totalLength);
    let spacer = 0;
    words.forEach((word, index) => {
      // const text = this.text.createText(word, this.font);
      spacer =
        (sizes[index] / totalLength) *
          (totalLength / this.curveObject.getLength()) +
        this.splineLastSpacer;
      t = spacer; //index / (words.length * 10);
      // t += this.splineLastPosition;
      // console.log("T TO BE CHECKED", t);
      const point = this.curveObject.getPointAt(t);

      //position sur la curve en fonction de t
      this.positionOnSpline.push(point);
      const fullTangent = this.curveObject.getTangentAt(t);
      let tangent = new THREE.Vector3(
        fullTangent.x,
        fullTangent.y,
        fullTangent.z
      );
      tangent.normalize();

      this.allTangents.push(tangent);
    });
    this.splineLastSpacer =
      (sizes[words.length] / totalLength) *
        (totalLength / this.curveObject.getLength()) +
      this.splineLastSpacer;
    // console.log("t", t.toFixed(3));
    this.splineLastPosition = parseFloat(t.toFixed(3)); // words.length / (words.length * 10);
    console.log("TTT", this.allTangents);
  }

  addWord(word) {
    const text = this.text.createText(word, this.font, this.addScaleCounter);
    this.allMots.push(text);
    this.allWords.push(text);
    const size = this.text.getSize();
    // text.scale.x = this.addScaleCounter;
    this.addScaleCounter += 0.003;
    text.position.copy(this.positionOnSpline[this.allMots.length - 1]);

    text.lookAt(
      text.position.clone().add(this.allTangents[this.allMots.length - 1])
    );

    this.camera._target = text.position.clone();
    this.camera._targetY = text.position.y;
    this.light.spotLight.lookAt(text.position.clone());

    // this.camera.lookAt(text.position);
    // this.camera.position.y = text.position.y;
  }

  speechEnd(data) {
    this.chat.messages.push({
      role: "assistant",
      content: data.choices[0].message.content,
    });
    this.audioDetector.startRecording();
  }

  onTextReceived(transcript) {
    this.chat.call(transcript.text);
  }

  rotateWords() {
    console.log("rotate");
    for (let i = 0; i < this.allWords.length; i++) {
      this.allWords[i].rotation.x += this.allWords[i]._angle;
    }
  }

  draw() {
    // this.controls.update();
    this.light.update();
    if (this.wordsIsRotating) {
      this.rotateWords();
    }
    // this.rotationOffset += 0.01;
    // this.allMots.forEach((mot) => {
    //   mot.update();
    // });

    if (this.camera._target) {
      this.camera._viewTarget.x = this.lerp(
        this.camera._viewTarget.x,
        this.camera._target.x,
        0.05
      );
      this.camera._viewTarget.y = this.lerp(
        this.camera._viewTarget.y,
        this.camera._target.y,
        0.05
      );
      this.camera._viewTarget.z = this.lerp(
        this.camera._viewTarget.z,
        this.camera._target.z,
        0.05
      );
      this.camera.lookAt(this.camera._viewTarget);
      this.camera.position.y = this.lerp(
        this.camera.position.y,
        this.camera._targetY,
        0.05
      );
      this.light.spotLight.position.y = this.camera.position.y;
      //set light target
      this.light.spotLight.target.position.copy(this.camera._viewTarget);
    }
    //add eventlistener to create transition between camera position and final target

    this.shapes.forEach((shape) => {
      if (shape.fbx) {
        shape.fbx.position.setY(this.camera.position.y);
      }
    });

    // this.renderer.render(this.scene, this.camera);
    this.bloomComposer.render();
    requestAnimationFrame(this.draw.bind(this));
  }

  lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t;
  }
}
