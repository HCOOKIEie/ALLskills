/* Original SkillAtlas scene. Reference: Rhine Music's spatial archive idea.
 * Models, layout, cover art and interaction implementation are ours. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

window.SkillArchiveScene = function createArchive(host, select, open) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch (_) {
    return null;
  }
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 150);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  scene.environmentIntensity = 0.55;
  const sky = new THREE.HemisphereLight(0xfffaf0, 0x8b938d, 1.6);
  scene.add(sky);
  const key = new THREE.DirectionalLight(0xfff3d9, 2.8);
  key.position.set(-8, 18, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -17,
    right: 17,
    top: 17,
    bottom: -17,
    near: 1,
    far: 60,
  });
  key.shadow.bias = -0.001;
  key.shadow.normalBias = 0.04;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd5e6ee, 3);
  rim.position.set(12, 9, -10);
  scene.add(rim);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.ShadowMaterial({ color: 0x4b483e, opacity: 0.15 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.9;
  floor.receiveShadow = true;
  scene.add(floor);
  const geometry = new RoundedBoxGeometry(3.35, 3.6, 0.22, 2, 0.045);
  const paperGeometry = new THREE.PlaneGeometry(2.92, 2.92);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xf1f0e7,
    transmission: 0.92,
    thickness: 0.21,
    roughness: 0.18,
    ior: 1.43,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.3,
  });
  const spineMat = new THREE.MeshStandardMaterial({
    color: 0xe0e1d6,
    metalness: 0.15,
    roughness: 0.34,
  });
  const spineGeometry = new THREE.BoxGeometry(0.13, 3.46, 0.26);
  const edgeGeometry = new THREE.EdgesGeometry(geometry, 35);
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.46,
  });
  const records = [],
    hitTargets = [];
  let list = [],
    index = 0,
    frame = 0,
    last = 0,
    active = false,
    visible = true,
    dark = false;
  let width = 1,
    height = 1,
    intro = 0,
    detail = 0,
    detailTarget = 0,
    parallaxX = 0,
    parallaxY = 0;
  let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const focus = new THREE.Vector3(),
    desiredFocus = new THREE.Vector3();
  const pointer = new THREE.Vector2(),
    ray = new THREE.Raycaster();
  let down = null,
    wheelAt = 0,
    disposed = false;
  function slot(i) {
    const n = (i + 10) % 21;
    return { x: (Math.floor(n / 7) - 1) * 4.08, z: ((n % 7) - 3) * 1.38 };
  }
  function wake() {
    if (!disposed && active && visible && !document.hidden && !frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function tick(time) {
    frame = 0;
    if (!active || !visible || document.hidden || disposed) return;
    const dt = Math.min((time - last) / 1000, 0.045);
    last = time;
    const lerp = reduced ? 1 : 1 - Math.exp(-dt * 5.2);
    intro += (1 - intro) * lerp;
    detail += (detailTarget - detail) * lerp;
    const s = slot(index);
    desiredFocus.set(s.x * 0.86, 0.65 + detail * 0.9, s.z * 0.92);
    focus.lerp(desiredFocus, lerp);
    const portrait = width / height < 1.15;
    camera.position.set(
      focus.x + 17 + parallaxX,
      focus.y + 12 + parallaxY,
      focus.z + 22,
    );
    camera.lookAt(focus);
    camera.zoom = (portrait ? 0.8 : 0.94) + detail * 0.15;
    camera.updateProjectionMatrix();
    let moving =
      intro < 0.998 ||
      Math.abs(detail - detailTarget) > 0.002 ||
      focus.distanceTo(desiredFocus) > 0.005;
    records.forEach((r, i) => {
      const selected = i === index,
        targetY = selected ? 2.65 + detail * 0.8 : 0;
      const targetScale = selected ? 1.035 + detail * 0.08 : 1;
      r.group.position.y += (targetY - r.group.position.y) * lerp;
      r.group.position.z +=
        (r.z + (selected ? 0.38 : 0) - r.group.position.z) * lerp;
      r.group.scale.setScalar(
        r.group.scale.x + (targetScale - r.group.scale.x) * lerp,
      );
      r.group.rotation.y +=
        ((selected ? -0.035 : 0) - r.group.rotation.y) * lerp;
      if (
        Math.abs(targetY - r.group.position.y) > 0.003 ||
        Math.abs(r.z + (selected ? 0.38 : 0) - r.group.position.z) > 0.003
      )
        moving = true;
    });
    renderer.render(scene, camera);
    if (moving) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width;
    height = rect.height;
    renderer.setSize(width, height, false);
    const h = width / height < 1.15 ? 15 : 11.8;
    camera.left = (-h * width) / height / 2;
    camera.right = (h * width) / height / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
    wake();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const visibility = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    wake();
  });
  visibility.observe(host);
  function clear() {
    records.forEach((r) => {
      scene.remove(r.group);
      r.paper.material.map?.dispose();
      r.paper.material.dispose();
    });
    records.length = 0;
    hitTargets.length = 0;
  }
  function update(items, selected) {
    const next = items.slice(0, 21),
      same =
        next.length === list.length &&
        next.every((s, i) => s.id === list[i].id);
    list = next;
    index = Math.max(0, Math.min(selected || 0, list.length - 1));
    if (same) {
      wake();
      return;
    }
    clear();
    list.forEach((skill, i) => {
      const group = new THREE.Group(),
        p = slot(i);
      group.position.set(p.x, reduced ? 0 : -1.2, p.z);
      group.userData.index = i;
      const shell = new THREE.Mesh(geometry, glass);
      shell.castShadow = true;
      group.add(shell);
      const edges = new THREE.LineSegments(edgeGeometry, edgesMat);
      group.add(edges);
      const spine = new THREE.Mesh(spineGeometry, spineMat);
      spine.position.x = -1.51;
      group.add(spine);
      const paperMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const paper = new THREE.Mesh(paperGeometry, paperMat);
      paper.position.set(0.035, -0.08, 0.116);
      group.add(paper);
      paper.userData.index = i;
      shell.userData.index = i;
      hitTargets.push(paper, shell);
      scene.add(group);
      const record = { group, paper, z: p.z };
      records.push(record);
      const image = new Image();
      image.onload = () => {
        if (disposed || !records.includes(record)) return;
        const surface = document.createElement("canvas");
        surface.width = surface.height = 512;
        surface.getContext("2d").drawImage(image, 0, 0, 512, 512);
        const texture = new THREE.CanvasTexture(surface);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(
          4,
          renderer.capabilities.getMaxAnisotropy(),
        );
        texture.needsUpdate = true;
        paperMat.map = texture;
        paperMat.needsUpdate = true;
        wake();
      };
      image.src =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(window.SkillCovers.svg(skill));
    });
    intro = 0;
    const p = slot(index);
    focus.set(p.x * 0.86, -0.4, p.z * 0.92);
    resize();
    wake();
  }
  function choose(n) {
    if (list.length) select(Math.max(0, Math.min(list.length - 1, n)));
  }
  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    return ray.intersectObjects(hitTargets, false)[0]?.object.userData.index;
  }
  function pointerDown(e) {
    down = { x: e.clientX, y: e.clientY };
  }
  function pointerUp(e) {
    if (!down) return;
    const dx = e.clientX - down.x,
      dy = e.clientY - down.y;
    down = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      choose(index + (dx < 0 ? 1 : -1));
      return;
    }
    if (Math.abs(dx) + Math.abs(dy) > 15) return;
    const n = pick(e);
    if (n == null) return;
    if (n === index) open(list[index].id);
    else choose(n);
  }
  function pointerMove(e) {
    if (reduced || e.pointerType === "touch") return;
    const rect = canvas.getBoundingClientRect();
    parallaxX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.65;
    parallaxY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.4;
    wake();
  }
  function wheel(e) {
    // Only horizontal intent changes cards; vertical scroll stays a page scroll.
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) && !e.shiftKey) return;
    e.preventDefault();
    if (performance.now() - wheelAt < 240) return;
    wheelAt = performance.now();
    choose(index + ((e.deltaX || e.deltaY) > 0 ? 1 : -1));
  }
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", () => {
    down = null;
  });
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerleave", () => {
    down = null;
    parallaxX = parallaxY = 0;
    wake();
  });
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    host.classList.remove("has-webgl");
    active = false;
  });
  canvas.addEventListener("webglcontextrestored", () => {
    host.classList.add("has-webgl");
    active = true;
    resize();
  });
  document.addEventListener("visibilitychange", wake);
  reducedQuery.addEventListener("change", (e) => {
    reduced = e.matches;
    wake();
  });
  host.classList.add("has-webgl");
  return {
    update,
    select(n) {
      index = Math.max(0, Math.min(list.length - 1, n));
      wake();
    },
    setActive(value) {
      active = value;
      if (!value && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      wake();
    },
    setDetail(value) {
      detailTarget = value ? 1 : 0;
      wake();
    },
    setTheme(value) {
      dark = value === "dark";
      sky.intensity = dark ? 0.9 : 1.6;
      key.intensity = dark ? 1.8 : 2.8;
      sky.color.set(dark ? 0xc2d5ef : 0xfffaf0);
      edgesMat.opacity = dark ? 0.28 : 0.46;
      glass.color.set(dark ? 0xb4c8da : 0xf1f0e7);
      spineMat.color.set(dark ? 0x8599a7 : 0xe0e1d6);
      wake();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      clear();
      geometry.dispose();
      paperGeometry.dispose();
      spineGeometry.dispose();
      edgeGeometry.dispose();
      glass.dispose();
      spineMat.dispose();
      edgesMat.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      environment.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
};
