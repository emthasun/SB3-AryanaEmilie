import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

export function loadObject(src) {
  const loader = new FBXLoader();
  const path = "./models/";

  return new Promise((resolve, reject) => {
    loader.load(path + src, function (fbx) {
      resolve(fbx);
    });
  });
}
