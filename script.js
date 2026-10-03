/* =========================================================
   ABHISHEK KUMAR — MAIN WEBSITE PARTICLE SYSTEM
   ---------------------------------------------------------
   This is the POST-INTRO system.

   intro.js
      ↓
   cinematic hand / cores / snap / explosion
      ↓
   intro disappears
      ↓
   this file takes over
      ↓
   subtle DNA + ambient particles + cursor interaction

   NO GIANT NEURAL NETWORK
   NO YELLOW / GOLD THEME
   ========================================================= */

import * as THREE from "three";


/* =========================================================
   CONFIG
   ========================================================= */

const CFG = {

  desktopParticles: 15000,

  mobileParticles: 6500,

  ambientStars: 1200,

  dnaRadius: 1.7,

  dnaHeight: 7.6,

  dnaTurns: 4.8,

  dnaRungs: 70,

  particleSize: 1.0,

  rotationSpeed: 0.035,

  mouseStrength: 0.55,

  mouseRadius: 1.8

};


/* =========================================================
   BASIC STATE
   ========================================================= */

const reduceMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

const coarsePointer =
  window.matchMedia(
    "(pointer: coarse)"
  ).matches;

const isMobile =
  window.innerWidth < 760;


/* =========================================================
   DOM
   ========================================================= */

const canvas =
  document.getElementById(
    "hero-canvas"
  );

const hero =
  document.querySelector(
    ".hero"
  );

const cursorEl =
  document.querySelector(
    ".cursor-field"
  );

const navEl =
  document.querySelector(
    ".nav"
  );


/*
   If canvas doesn't exist,
   stop cleanly.
*/

if (!canvas) {

  console.warn(
    "hero-canvas not found."
  );

} else {


  /* =======================================================
     THREE.JS SETUP
     ======================================================= */

  const scene =
    new THREE.Scene();


  const camera =
    new THREE.PerspectiveCamera(

      45,

      window.innerWidth /
      window.innerHeight,

      0.1,

      100

    );


  camera.position.set(
    0,
    0,
    13
  );


  const renderer =
    new THREE.WebGLRenderer({

      canvas,

      antialias:false,

      alpha:true,

      powerPreference:
        "high-performance"

    });


  const dpr =
    Math.min(
      window.devicePixelRatio || 1,
      coarsePointer ? 1.25 : 1.7
    );


  renderer.setPixelRatio(
    dpr
  );


  renderer.setSize(
    window.innerWidth,
    window.innerHeight,
    false
  );


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  renderer.setClearColor(
    0x000000,
    0
  );


  /* =======================================================
     PARTICLE COUNT
     ======================================================= */

  const PARTICLE_COUNT =
    isMobile
      ? CFG.mobileParticles
      : CFG.desktopParticles;


  /* =======================================================
     COLORS
     -------------------------------------------------------
     White / cyan / blue only.

     No yellow.
     No amber.
     ======================================================= */

  const COLOR_CYAN =
    new THREE.Color(
      "#35d9ff"
    );

  const COLOR_BLUE =
    new THREE.Color(
      "#3b82f6"
    );

  const COLOR_WHITE =
    new THREE.Color(
      "#f2f7ff"
    );

  const COLOR_ICE =
    new THREE.Color(
      "#9eeaff"
    );


  /* =======================================================
     PARTICLE ARRAYS
     ======================================================= */

  const positions =
    new Float32Array(
      PARTICLE_COUNT * 3
    );

  const base =
    new Float32Array(
      PARTICLE_COUNT * 3
    );

  const colors =
    new Float32Array(
      PARTICLE_COUNT * 3
    );

  const sizes =
    new Float32Array(
      PARTICLE_COUNT
    );

  const seeds =
    new Float32Array(
      PARTICLE_COUNT
    );


  /* =======================================================
     HELPER
     ======================================================= */

  function putParticle(
    index,
    x,
    y,
    z,
    color,
    size
  ) {

    const p =
      index * 3;


    positions[p] =
      base[p] =
        x;

    positions[p + 1] =
      base[p + 1] =
        y;

    positions[p + 2] =
      base[p + 2] =
        z;


    colors[p] =
      color.r;

    colors[p + 1] =
      color.g;

    colors[p + 2] =
      color.b;


    sizes[index] =
      size;


    seeds[index] =
      Math.random();
  }


  /* =======================================================
     DNA GEOMETRY
     ======================================================= */

  let index = 0;


  const R =
    CFG.dnaRadius;

  const H =
    CFG.dnaHeight;

  const TURNS =
    CFG.dnaTurns;


  function strandPoint(
    t,
    phase
  ) {

    const angle =
      t *
      TURNS *
      Math.PI *
      2 +
      phase;


    return {

      x:
        Math.cos(angle) *
        R,

      y:
        (t - 0.5) *
        H,

      z:
        Math.sin(angle) *
        R

    };
  }


  /* =======================================================
     MAIN DNA STRANDS
     ======================================================= */

  const strandParticles =
    Math.floor(
      PARTICLE_COUNT *
      0.58
    );


  for (
    let i = 0;

    i < strandParticles &&
    index < PARTICLE_COUNT;

    i++
  ) {

    const t =
      Math.random();


    const phase =
      Math.random() < 0.5
        ? 0
        : Math.PI;


    const p =
      strandPoint(
        t,
        phase
      );


    const jitter =
      0.075;


    const x =
      p.x +
      (
        Math.random() -
        0.5
      ) *
      jitter;


    const y =
      p.y +
      (
        Math.random() -
        0.5
      ) *
      jitter;


    const z =
      p.z +
      (
        Math.random() -
        0.5
      ) *
      jitter;


    const r =
      Math.random();


    let color;


    if (r < 0.48) {

      color =
        COLOR_CYAN;

    } else if (r < 0.82) {

      color =
        COLOR_BLUE;

    } else if (r < 0.94) {

      color =
        COLOR_ICE;

    } else {

      color =
        COLOR_WHITE;
    }


    const size =
      r > 0.92
        ? 1.6
        : 0.8 +
          Math.random() *
          0.7;


    putParticle(
      index++,
      x,
      y,
      z,
      color,
      size
    );
  }


  /* =======================================================
     DNA BASE-PAIR PARTICLES
     ======================================================= */

  const rungParticles =
    Math.floor(
      PARTICLE_COUNT *
      0.24
    );


  for (
    let i = 0;

    i < rungParticles &&
    index < PARTICLE_COUNT;

    i++
  ) {

    const t =
      (
        Math.floor(
          Math.random() *
          CFG.dnaRungs
        ) +
        0.5
      ) /
      CFG.dnaRungs;


    const a =
      strandPoint(
        t,
        0
      );


    const b =
      strandPoint(
        t,
        Math.PI
      );


    const u =
      Math.random();


    const x =
      THREE.MathUtils.lerp(
        a.x,
        b.x,
        u
      );


    const y =
      THREE.MathUtils.lerp(
        a.y,
        b.y,
        u
      );


    const z =
      THREE.MathUtils.lerp(
        a.z,
        b.z,
        u
      );


    const spread =
      0.045;


    const color =
      Math.random() <
      0.25
        ? COLOR_WHITE
        : COLOR_CYAN;


    putParticle(

      index++,

      x +
        (
          Math.random() -
          0.5
        ) *
        spread,

      y +
        (
          Math.random() -
          0.5
        ) *
        spread,

      z +
        (
          Math.random() -
          0.5
        ) *
        spread,

      color,

      0.65 +
        Math.random() *
        0.55
    );
  }


  /* =======================================================
     AMBIENT PARTICLES
     ======================================================= */

  while (
    index <
    PARTICLE_COUNT
  ) {

    const angle =
      Math.random() *
      Math.PI *
      2;


    const radius =
      2.8 +
      Math.pow(
        Math.random(),
        0.7
      ) *
      4.8;


    const y =
      (
        Math.random() -
        0.5
      ) *
      9;


    const x =
      Math.cos(angle) *
      radius;


    const z =
      Math.sin(angle) *
      radius;


    const r =
      Math.random();


    const color =
      r < 0.62
        ? COLOR_BLUE
        : r < 0.90
          ? COLOR_CYAN
          : COLOR_WHITE;


    putParticle(

      index++,

      x,

      y,

      z,

      color,

      0.25 +
        Math.random() *
        0.6

    );
  }


  /* =======================================================
     PARTICLE GEOMETRY
     ======================================================= */

  const geometry =
    new THREE.BufferGeometry();


  geometry.setAttribute(

    "position",

    new THREE.BufferAttribute(
      positions,
      3
    )

  );


  geometry.setAttribute(

    "aColor",

    new THREE.BufferAttribute(
      colors,
      3
    )

  );


  geometry.setAttribute(

    "aSize",

    new THREE.BufferAttribute(
      sizes,
      1
    )

  );


  geometry.setAttribute(

    "aSeed",

    new THREE.BufferAttribute(
      seeds,
      1
    )

  );


  /* =======================================================
     SHADER
     ======================================================= */

  const particleMaterial =
    new THREE.ShaderMaterial({

      transparent:true,

      depthWrite:false,

      blending:
        THREE.AdditiveBlending,

      uniforms:{

        uTime:{
          value:0
        },

        uPixelRatio:{
          value:dpr
        },

        uOpacity:{
          value:0
        }

      },


      vertexShader:`

        attribute vec3 aColor;

        attribute float aSize;

        attribute float aSeed;


        uniform float uTime;

        uniform float uPixelRatio;


        varying vec3 vColor;

        varying float vAlpha;


        void main(){

          vec4 mv =
            modelViewMatrix *
            vec4(
              position,
              1.0
            );


          float pulse =
            0.82 +
            0.18 *
            sin(
              uTime *
              1.3 +
              aSeed *
              25.0
            );


          gl_PointSize =
            aSize *
            uPixelRatio *
            (
              150.0 /
              max(
                1.0,
                -mv.z
              )
            ) *
            pulse;


          gl_Position =
            projectionMatrix *
            mv;


          vColor =
            aColor;


          vAlpha =
            0.72 +
            0.28 *
            pulse;

        }

      `,


      fragmentShader:`

        varying vec3 vColor;

        varying float vAlpha;


        uniform float uOpacity;


        void main(){

          vec2 uv =
            gl_PointCoord -
            0.5;


          float d =
            length(uv);


          float glow =
            smoothstep(
              0.5,
              0.0,
              d
            );


          float core =
            smoothstep(
              0.15,
              0.0,
              d
            );


          if (
            glow <
            0.01
          )
            discard;


          vec3 finalColor =
            vColor *
            (
              0.7 +
              core *
              1.5
            );


          gl_FragColor =
            vec4(
              finalColor,
              glow *
              vAlpha *
              uOpacity
            );

        }

      `

    });


  /* =======================================================
     DNA OBJECT
     ======================================================= */

  const dna =
    new THREE.Points(
      geometry,
      particleMaterial
    );


  dna.position.set(
    3.0,
    0.0,
    0
  );


  scene.add(
    dna
  );


  /* =======================================================
     AMBIENT STARFIELD
     ======================================================= */

  const starCount =
    isMobile
      ? 500
      : CFG.ambientStars;


  const starPositions =
    new Float32Array(
      starCount * 3
    );


  for (
    let i = 0;
    i < starCount;
    i++
  ) {

    const p =
      i * 3;


    const radius =
      14 +
      Math.random() *
      20;


    const angle =
      Math.random() *
      Math.PI *
      2;


    starPositions[p] =
      Math.cos(angle) *
      radius;


    starPositions[p + 1] =
      (
        Math.random() -
        0.5
      ) *
      18;


    starPositions[p + 2] =
      Math.sin(angle) *
      radius -
      8;
  }


  const starGeometry =
    new THREE.BufferGeometry();


  starGeometry.setAttribute(

    "position",

    new THREE.BufferAttribute(
      starPositions,
      3
    )

  );


  const starMaterial =
    new THREE.PointsMaterial({

      color:
        0x9eeaff,

      size:
        isMobile
          ? 0.018
          : 0.026,

      transparent:true,

      opacity:
        0.32,

      depthWrite:false,

      blending:
        THREE.AdditiveBlending

    });


  const stars =
    new THREE.Points(
      starGeometry,
      starMaterial
    );


  scene.add(
    stars
  );


  /* =======================================================
     MOUSE
     ======================================================= */

  const mouse =
    new THREE.Vector2(
      999,
      999
    );


  const targetMouse =
    new THREE.Vector2(
      999,
      999
    );


  const previousMouse =
    new THREE.Vector2(
      999,
      999
    );


  let mouseSpeed = 0;


  if (!coarsePointer) {

    window.addEventListener(

      "pointermove",

      event => {

        targetMouse.x =
          (
            event.clientX /
            window.innerWidth
          ) *
          2 -
          1;


        targetMouse.y =
          -(
            event.clientY /
            window.innerHeight
          ) *
          2 +
          1;


        if (cursorEl) {

          cursorEl.classList.add(
            "on"
          );


          cursorEl.style.left =
            `${event.clientX}px`;


          cursorEl.style.top =
            `${event.clientY}px`;
        }

      },

      {
        passive:true
      }

    );


    window.addEventListener(

      "pointerleave",

      () => {

        targetMouse.set(
          999,
          999
        );


        if (cursorEl) {

          cursorEl.classList.remove(
            "on"
          );
        }

      }

    );

  }


  /* =======================================================
     SCROLL
     ======================================================= */

  let scrollProgress = 0;


  window.addEventListener(

    "scroll",

    () => {

      scrollProgress =
        Math.min(

          1,

          Math.max(

            0,

            window.scrollY /
            Math.max(
              1,
              window.innerHeight
            )

          )

        );


      if (navEl) {

        navEl.classList.toggle(

          "scrolled",

          window.scrollY >
          40

        );

      }

    },

    {
      passive:true
    }

  );


  /* =======================================================
     INTRO → DASHBOARD HANDOFF
     ======================================================= */

  /*
    intro.js adds "intro-ready"
    after the cinematic finishes.

    Until then the DNA remains
    almost invisible.
  */


  function updateIntroOpacity() {

    const intro =
      document.getElementById(
        "particle-intro"
      );


    if (
      !intro ||
      !document.body.classList.contains(
        "intro-ready"
      )
    ) {

      particleMaterial
        .uniforms
        .uOpacity
        .value =
          0;


      return;
    }


    /*
      Fade DNA in gradually after
      the cinematic intro.
    */

    particleMaterial
      .uniforms
      .uOpacity
      .value =
        THREE.MathUtils.lerp(

          particleMaterial
            .uniforms
            .uOpacity
            .value,

          0.72,

          0.025

        );
  }


  /* =======================================================
     ANIMATION
     ======================================================= */

  const clock =
    new THREE.Clock();


  function animate() {

    requestAnimationFrame(
      animate
    );


    const elapsed =
      clock.getElapsedTime();


    /*
      Smooth mouse.
    */

    mouse.lerp(
      targetMouse,
      0.075
    );


    mouseSpeed =
      THREE.MathUtils.lerp(

        mouseSpeed,

        mouse.distanceTo(
          previousMouse
        ),

        0.16

      );


    previousMouse.copy(
      mouse
    );


    /*
      Intro handoff.
    */

    updateIntroOpacity();


    /*
      If intro isn't finished,
      keep background essentially
      invisible.
    */

    const introReady =
      document.body.classList.contains(
        "intro-ready"
      );


    if (introReady) {

      const pos =
        geometry
          .attributes
          .position
          .array;


      /*
        Cursor interaction.
      */

      const cursorX =
        mouse.x *
        5.7;


      const cursorY =
        mouse.y *
        4.0;


      for (
        let i = 0;

        i < PARTICLE_COUNT;

        i++
      ) {

        const p =
          i * 3;


        const bx =
          base[p];

        const by =
          base[p + 1];

        const bz =
          base[p + 2];


        let x =
          pos[p];

        let y =
          pos[p + 1];

        let z =
          pos[p + 2];


        /*
          Only interact when cursor
          is actually inside viewport.
        */

        if (
          mouse.x < 5
        ) {

          const dx =
            x -
            cursorX;


          const dy =
            y -
            cursorY;


          const distance =
            Math.sqrt(
              dx * dx +
              dy * dy
            );


          if (
            distance <
            CFG.mouseRadius
          ) {

            const force =
              Math.pow(

                1 -
                distance /
                CFG.mouseRadius,

                2

              );


            const push =
              CFG.mouseStrength *
              (
                0.8 +
                mouseSpeed *
                2.5
              );


            x +=
              (
                dx /
                (
                  distance +
                  0.0001
                )
              ) *
              force *
              push;


            y +=
              (
                dy /
                (
                  distance +
                  0.0001
                )
              ) *
              force *
              push;


            z +=
              force *
              push *
              Math.sin(
                elapsed *
                6 +
                i *
                0.012
              );
          }

        }


        /*
          Spring back to original DNA.
        */

        const returnStrength =
          0.055 +
          Math.min(
            mouseSpeed *
            0.7,
            0.08
          );


        pos[p] +=
          (
            bx +
            x -
            bx -
            pos[p]
          ) *
          returnStrength;


        pos[p + 1] +=
          (
            by +
            y -
            by -
            pos[p + 1]
          ) *
          returnStrength;


        pos[p + 2] +=
          (
            bz +
            z -
            bz -
            pos[p + 2]
          ) *
          returnStrength;


        /*
          Very subtle biological motion.
        */

        if (!reduceMotion) {

          pos[p] +=
            Math.sin(
              elapsed *
              0.65 +
              i *
              0.009
            ) *
            0.00045;


          pos[p + 1] +=
            Math.cos(
              elapsed *
              0.5 +
              i *
              0.006
            ) *
            0.0003;
        }

      }


      geometry
        .attributes
        .position
        .needsUpdate =
          true;


      /*
        DNA rotation.
      */

      if (!reduceMotion) {

        dna.rotation.y =
          elapsed *
          CFG.rotationSpeed;


        dna.rotation.x =
          Math.sin(
            elapsed *
            0.28
          ) *
          0.025;


        stars.rotation.y =
          elapsed *
          0.003;
      }


      /*
        Slight hero parallax.
      */

      if (!reduceMotion) {

        camera.position.x =
          THREE.MathUtils.lerp(

            camera.position.x,

            mouse.x *
            0.20,

            0.025

          );


        camera.position.y =
          THREE.MathUtils.lerp(

            camera.position.y,

            mouse.y *
            0.10,

            0.025

          );

      }


      /*
        Hero scroll movement.

        DNA moves slightly upward
        when leaving hero.
      */

      dna.position.y =
        THREE.MathUtils.lerp(

          dna.position.y,

          -scrollProgress *
          0.8,

          0.025

        );


      dna.position.x =
        THREE.MathUtils.lerp(

          dna.position.x,

          3.0 -
          scrollProgress *
          1.0,

          0.025

        );


    }


    camera.lookAt(
      0,
      0,
      0
    );


    renderer.render(
      scene,
      camera
    );

  }


  /* =======================================================
     RESIZE
     ======================================================= */

  window.addEventListener(

    "resize",

    () => {

      const w =
        window.innerWidth;

      const h =
        window.innerHeight;


      camera.aspect =
        w / h;


      camera.updateProjectionMatrix();


      const pixelRatio =
        Math.min(

          window.devicePixelRatio ||
          1,

          coarsePointer
            ? 1.25
            : 1.7

        );


      renderer.setPixelRatio(
        pixelRatio
      );


      renderer.setSize(
        w,
        h,
        false
      );


      particleMaterial
        .uniforms
        .uPixelRatio
        .value =
          pixelRatio;

    },

    {
      passive:true
    }

  );


  /* =======================================================
     VISIBILITY
     ======================================================= */

  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.hidden
      ) {

        renderer.setAnimationLoop(
          null
        );

      } else {

        renderer.setAnimationLoop(
          animate
        );

      }

    }
  );


  /* =======================================================
     START
     ======================================================= */

  animate();

}
