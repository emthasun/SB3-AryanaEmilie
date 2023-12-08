import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

export default class Text {
  constructor(scene) {
    this.scene = scene;
    this.angle = 0;
  }

  loadFont() {
    const loader = new FontLoader();
    return new Promise((resolve, reject) => {
      loader.load("./corporate-semi.json", (font) => {
        resolve(font);
      });
    });
  }
  getSize() {
    return this.text._size;
  }

  createText(_text, font, addToScale) {
    const addToScene = true;
    const upperCaseText = _text.toUpperCase();
    const geometry = new TextGeometry(upperCaseText, {
      font: font,
      size: 0.45,
      height: 0 + addToScale,
      //   curveSegments: 12,
      //   bevelEnabled: true,
      //   bevelThickness: 0.1,
      //   bevelSize: 0.1,
      //   bevelOffset: 0,
      //   bevelSegments: 5,
    });
    const material = new THREE.MeshPhongMaterial({
      color: 0x2765ff,
      emissive: 0x0642ff,
      emissiveIntensity: 2,
    });
    this.text = new THREE.Mesh(geometry, material);
    // this.text.rotateX(-Math.PI / 2);
    this.text.castShadow = true;
    this.text.receiveShadow = true;
    this.text.rotateY(-Math.PI / 2);
    const boundingBox = new THREE.Box3().setFromObject(this.text);
    const size = boundingBox.getSize(new THREE.Vector3());

    this.text._size = size;
    this.text.position.x += size.x;

    // put this.text in a 3d object and return the object
    this.textHolder = new THREE.Object3D();
    this.textHolder.add(this.text);
    // center this.text to the origin of the 3d object
    // this.text.position.x = -size.x / 2;
    // this.text.position.y = -size.y / 2;
    // this.text.position.z = -size.z / 2;

    if (addToScene) this.scene.add(this.textHolder);

    this.textHolder._angle = 0.02 - Math.random() * 0.04;

    return this.textHolder;
  }
}
