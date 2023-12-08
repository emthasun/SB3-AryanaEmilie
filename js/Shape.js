import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

export default class Shape {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
  }

  createCube() {
    //Create a cube
    const geometry = new THREE.BoxGeometry();
    // const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;
    this.scene.add(this.cube);
  }

  createFloor() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.receiveShadow = true;
    plane.rotateX(Math.PI / 2);
    this.scene.add(plane);
  }

  createHelix() {
    const radius = 3;
    const height = 40;
    this.numCoils = height * 2; // Number of coils
    this.numPoints = 30;

    const points = [];
    for (let i = 0; i <= this.numPoints * this.numCoils; i++) {
      const t = i / (this.numPoints * this.numCoils);
      const angle = 2 * Math.PI * this.numCoils * t;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(-angle) * radius;
      const z = height * -t;
      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial();

    this.helixLine = new THREE.Line(geometry, material);
    this.helixLine.rotateX(Math.PI / -2);

    this.helixCurve = new THREE.CatmullRomCurve3(points);
    const rotationMatrix = new THREE.Matrix4().makeRotationX(Math.PI / -2);
    this.helixCurve.points.forEach((point) => {
      point.applyMatrix4(rotationMatrix);
    });

    // this.scene.add(this.helixLine);
    return this.helixCurve;
  }
  //load fbx object

  createObject(angle, radius, obj) {
    let rotation = 0;
    obj.scale.setScalar(0.03);
    const x = 0;
    const z = -3;
    let y = this.camera.position.y + 3;
    obj.position.set(x, y, z);
    //recenter pivot
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    obj.position.x += obj.position.x - center.x;
    obj.position.z += obj.position.z - center.z;
    //add material
    obj.rotateX(0.5 * Math.PI);
    obj.rotateY(rotation++);
    obj.castShadow = true;
    obj.receiveShadow = true;
    console.log(obj);
    this.scene.add(obj);
  }
}
