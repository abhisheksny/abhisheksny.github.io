/* =========================================================
   CINEMATIC PARTICLE INTRO
   ---------------------------------------------------------
   Sequence:

   0.0   Particle field
   1.0   Hand formation
   3.2   Five cores appear
   4.6   Energy buildup
   5.8   SNAP
   6.0   Particle explosion
   7.2   Particles reorganize
   8.0   DNA + UI construction
   10.5  Dashboard reveal

   The hand and cores are built from particles.
   The five cores sit around the finger-joint positions.
   ========================================================= */

(() => {

  "use strict";


  /* =======================================================
     CONFIGURATION
     ======================================================= */

  const CONFIG = {

    particleCount: 18000,

    introDuration: 11200,

    handStart: 650,

    handEnd: 3100,

    coresStart: 3100,

    chargeStart: 4200,

    snapTime: 5700,

    explosionEnd: 7000,

    reconstructionStart: 7000,

    dashboardReveal: 10400,

    fadeDuration: 900,

    particleSize: 2.2,

    explosionStrength: 1.0,

    backgroundAlpha: 1.0

  };


  /* =======================================================
     DOM
     ======================================================= */

  const root =
    document.getElementById(
      "particle-intro"
    );

  const canvas =
    document.getElementById(
      "particle-intro-canvas"
    );

  const caption =
    document.getElementById(
      "particle-intro-caption"
    );

  const skip =
    document.getElementById(
      "particle-intro-skip"
    );


  if (!root || !canvas) {

    document.body.classList.remove(
      "intro-active"
    );

    document.body.classList.add(
      "intro-ready"
    );

    return;
  }


  /* =======================================================
     THREE.JS
     ======================================================= */

  let THREE = null;

  let renderer = null;

  let scene = null;

  let camera = null;

  let points = null;

  let geometry = null;

  let material = null;

  let animationFrame = 0;


  /* =======================================================
     STATE
     ======================================================= */

  let startTime = performance.now();

  let lastTime = startTime;

  let finished = false;

  let skipped = false;

  let width = innerWidth;

  let height = innerHeight;

  let dpr =
    Math.min(
      devicePixelRatio || 1,
      2
    );


  /* =======================================================
     PARTICLE DATA
     ======================================================= */

  const N =
    Math.min(
      CONFIG.particleCount,
      innerWidth < 700
        ? 11000
        : CONFIG.particleCount
    );


  const positions =
    new Float32Array(
      N * 3
    );

  const velocities =
    new Float32Array(
      N * 3
    );

  const basePositions =
    new Float32Array(
      N * 3
    );

  const targetPositions =
    new Float32Array(
      N * 3
    );

  const colors =
    new Float32Array(
      N * 3
    );

  const sizes =
    new Float32Array(N);

  const seeds =
    new Float32Array(N);

  const energy =
    new Float32Array(N);


  /* =======================================================
     COLOR PALETTE
     ======================================================= */

  const COLORS = [

    [0.18, 0.85, 1.00],

    [0.20, 0.48, 1.00],

    [0.55, 0.90, 1.00],

    [0.95, 0.98, 1.00],

    [0.35, 0.70, 1.00]

  ];


  /* Five core colors */

  const CORE_COLORS = [

    [0.15, 0.85, 1.00],

    [0.25, 0.45, 1.00],

    [0.75, 0.30, 1.00],

    [1.00, 0.30, 0.65],

    [0.35, 1.00, 0.75]

  ];


  /* =======================================================
     HELPERS
     ======================================================= */

  const clamp =
    (v, a, b) =>
      Math.max(
        a,
        Math.min(b, v)
      );


  const lerp =
    (a, b, t) =>
      a + (b - a) * t;


  const easeOutCubic =
    t =>
      1 -
      Math.pow(
        1 - clamp(t, 0, 1),
        3
      );


  const easeInOut =
    t => {

      t =
        clamp(
          t,
          0,
          1
        );

      return t < 0.5

        ? 4 * t * t * t

        : 1 -
          Math.pow(
            -2 * t + 2,
            3
          ) / 2;
    };


  const randomGaussian =
    () => {

      let u = 0;
      let v = 0;

      while (u === 0)
        u = Math.random();

      while (v === 0)
        v = Math.random();

      return Math.sqrt(
        -2 *
        Math.log(u)
      ) *
      Math.cos(
        Math.PI * 2 * v
      );
    };


  const setColor =
    (index, color) => {

      colors[index * 3] =
        color[0];

      colors[index * 3 + 1] =
        color[1];

      colors[index * 3 + 2] =
        color[2];
    };


  /* =======================================================
     COORDINATE SYSTEM
     -------------------------------------------------------
     We work in a normalized front-facing space.

     X = left/right
     Y = up/down
     Z = depth
     ======================================================= */

  const sx =
    x =>
      x *
      (width / 2) /
      100;


  const sy =
    y =>
      y *
      (height / 2) /
      100;


  /* =======================================================
     HAND GEOMETRY
     -------------------------------------------------------
     This is a stylized FRONT-FACING human hand.

     It is intentionally not photorealistic.

     Thousands of particles form the silhouette.
     ======================================================= */


  function pointInEllipse(
    cx,
    cy,
    rx,
    ry
  ) {

    const a =
      Math.random() *
      Math.PI *
      2;

    const r =
      Math.sqrt(
        Math.random()
      );

    return {

      x:
        cx +
        Math.cos(a) *
        rx *
        r,

      y:
        cy +
        Math.sin(a) *
        ry *
        r
    };
  }


  function pointOnCapsule(
    x1,
    y1,
    x2,
    y2,
    radius
  ) {

    const t =
      Math.random();

    const x =
      lerp(
        x1,
        x2,
        t
      );

    const y =
      lerp(
        y1,
        y2,
        t
      );

    const angle =
      Math.random() *
      Math.PI *
      2;

    const r =
      radius *
      Math.sqrt(
        Math.random()
      );

    return {

      x:
        x +
        Math.cos(angle) *
        r,

      y:
        y +
        Math.sin(angle) *
        r
    };
  }


  function createHandPoint() {

    /*
      Palm
    */

    if (
      Math.random() < 0.48
    ) {

      return pointInEllipse(
        0,
        -5,
        20,
        25
      );
    }


    /*
      INDEX FINGER
    */

    if (
      Math.random() < 0.14
    ) {

      return pointOnCapsule(
        -13,
        8,
        -13,
        38,
        5.2
      );
    }


    /*
      MIDDLE FINGER
    */

    if (
      Math.random() < 0.14
    ) {

      return pointOnCapsule(
        -4.5,
        10,
        -4.5,
        43,
        5.5
      );
    }


    /*
      RING FINGER
    */

    if (
      Math.random() < 0.12
    ) {

      return pointOnCapsule(
        4.5,
        10,
        4.5,
        40,
        5.1
      );
    }


    /*
      LITTLE FINGER
    */

    if (
      Math.random() < 0.10
    ) {

      return pointOnCapsule(
        12.5,
        8,
        13.5,
        33,
        4.7
      );
    }


    /*
      THUMB / SIDE OF HAND
    */

    return pointOnCapsule(
      -17,
      -2,
      -30,
      12,
      6
    );
  }


  /* =======================================================
     BUILD HAND TARGETS
     ======================================================= */

  const handTargets =
    new Float32Array(
      N * 3
    );


  function buildHandTargets() {

    for (
      let i = 0;
      i < N;
      i++
    ) {

      const p =
        createHandPoint();


      const z =
        randomGaussian() *
        1.8;


      handTargets[i * 3] =
        sx(p.x);

      handTargets[i * 3 + 1] =
        sy(p.y);

      handTargets[i * 3 + 2] =
        z;


      /*
        Slight cyan/white variation.
      */

      const c =
        COLORS[
          Math.floor(
            Math.random() *
            COLORS.length
          )
        ];


      setColor(
        i,
        c
      );


      sizes[i] =
        1.0 +
        Math.random() *
        2.0;


      seeds[i] =
        Math.random();
    }
  }


  /* =======================================================
     FIVE PIP JOINT CORE POSITIONS
     -------------------------------------------------------
     IMPORTANT:

     These are deliberately placed on the joints,
     not on the fingertips.

     The positions are relative to the front-facing hand.
     ======================================================= */

  const corePositions = [

    /*
      Index
    */

    {
      x: -13,
      y: 26
    },

    /*
      Middle
    */

    {
      x: -4.5,
      y: 29
    },

    /*
      Ring
    */

    {
      x: 4.5,
      y: 27
    },

    /*
      Little
    */

    {
      x: 13.5,
      y: 22
    },

    /*
      Thumb joint
    */

    {
      x: -22,
      y: 9
    }

  ];


  /* =======================================================
     CORE PARTICLE TARGETS
     ======================================================= */

  const coreTargets = [];


  function createCoreTarget(
    cx,
    cy,
    color
  ) {

    const points = [];

    const count =
      Math.floor(
        N * 0.018
      );


    /*
      Cube dimensions
    */

    const size =
      3.6;


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const face =
        Math.floor(
          Math.random() * 6
        );


      const u =
        (
          Math.random() -
          0.5
        ) *
        size;


      const v =
        (
          Math.random() -
          0.5
        ) *
        size;


      let x = u;
      let y = v;
      let z = 0;


      if (face === 0) {

        x = -size / 2;
        y = u;
        z = v;

      } else if (face === 1) {

        x = size / 2;
        y = u;
        z = v;

      } else if (face === 2) {

        x = u;
        y = -size / 2;
        z = v;

      } else if (face === 3) {

        x = u;
        y = size / 2;
        z = v;

      } else if (face === 4) {

        x = u;
        y = v;
        z = -size / 2;

      } else {

        x = u;
        y = v;
        z = size / 2;
      }


      points.push({

        x:
          sx(cx + x),

        y:
          sy(cy + y),

        z:
          z * 1.5,

        color
      });
    }


    return points;
  }


  function buildCoreTargets() {

    coreTargets.length = 0;


    corePositions.forEach(
      (p, index) => {

        coreTargets.push(
          createCoreTarget(
            p.x,
            p.y,
            CORE_COLORS[index]
          )
        );
      }
    );
  }


  /* =======================================================
     CORE PARTICLE ASSIGNMENT
     ======================================================= */

  const coreParticleRanges = [];


  function assignCoreParticles() {

    const total =
      coreTargets.reduce(
        (
          sum,
          arr
        ) =>
          sum +
          arr.length,
        0
      );


    const start =
      Math.floor(
        N * 0.54
      );


    const available =
      Math.min(
        total,
        N - start
      );


    let cursor =
      start;


    for (
      let c = 0;
      c < coreTargets.length;
      c++
    ) {

      const arr =
        coreTargets[c];


      const begin =
        cursor;


      for (
        let j = 0;
        j < arr.length &&
        cursor < N;
        j++
      ) {

        const p =
          arr[j];


        targetPositions[
          cursor * 3
        ] =
          p.x;

        targetPositions[
          cursor * 3 + 1
        ] =
          p.y;

        targetPositions[
          cursor * 3 + 2
        ] =
          p.z;


        setColor(
          cursor,
          p.color
        );


        sizes[cursor] =
          1.2 +
          Math.random() *
          2.4;


        cursor++;
      }


      coreParticleRanges.push({

        start:begin,

        end:cursor,

        color:
          CORE_COLORS[c]

      });
    }


    return available;
  }


  /* =======================================================
     DNA TARGETS
     ======================================================= */

  const dnaTargets = [];


  function buildDNATargets() {

    dnaTargets.length = 0;


    const dnaWidth =
      Math.min(
        width * 0.16,
        150
      );


    const dnaHeight =
      Math.min(
        height * 0.68,
        680
      );


    const turns = 4.2;

    const steps =
      180;


    for (
      let i = 0;
      i < steps;
      i++
    ) {

      const t =
        i /
        (steps - 1);


      const y =
        lerp(
          -dnaHeight / 2,
          dnaHeight / 2,
          t
        );


      const angle =
        t *
        turns *
        Math.PI *
        2;


      const x1 =
        Math.cos(angle) *
        dnaWidth;


      const z1 =
        Math.sin(angle) *
        18;


      const x2 =
        Math.cos(
          angle +
          Math.PI
        ) *
        dnaWidth;


      const z2 =
        Math.sin(
          angle +
          Math.PI
        ) *
        18;


      for (
        let k = 0;
        k < 4;
        k++
      ) {

        const jitter =
          randomGaussian() *
          1.5;


        dnaTargets.push({

          x:
            x1 +
            jitter,

          y:
            y +
            randomGaussian() *
            1.2,

          z:
            z1 +
            randomGaussian(),

          color:
            COLORS[
              k % COLORS.length
            ]
        });


        dnaTargets.push({

          x:
            x2 +
            jitter,

          y:
            y +
            randomGaussian() *
            1.2,

          z:
            z2 +
            randomGaussian(),

          color:
            COLORS[
              (k + 1) %
              COLORS.length
            ]
        });
      }


      /*
        Base-pair particles
      */

      if (
        i % 4 === 0
      ) {

        for (
          let q = 0;
          q < 7;
          q++
        ) {

          const u =
            q / 6;


          dnaTargets.push({

            x:
              lerp(
                x1,
                x2,
                u
              ) +
              randomGaussian(),

            y:
              y +
              randomGaussian(),

            z:
              lerp(
                z1,
                z2,
                u
              ),

            color:
              COLORS[3]
          });
        }
      }
    }


    /*
      Center DNA on the right side.
    */

    const offsetX =
      sx(
        width > 900
          ? 28
          : 0
      );


    dnaTargets.forEach(
      p => {

        p.x +=
          offsetX;

        p.y +=
          sy(2);
      }
    );
  }


  /* =======================================================
     UI PARTICLE TARGETS
     -------------------------------------------------------
     These are not meant to permanently replace HTML.

     They create the illusion that the dashboard is being
     constructed from the explosion.
     ======================================================= */

  const uiTargets = [];


  function addLine(
    x1,
    y1,
    x2,
    y2,
    count,
    color
  ) {

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const t =
        Math.random();


      uiTargets.push({

        x:
          sx(
            lerp(
              x1,
              x2,
              t
            )
          ),

        y:
          sy(
            lerp(
              y1,
              y2,
              t
            )
          ),

        z:
          randomGaussian() *
          1.2,

        color
      });
    }
  }


  function buildUITargets() {

    uiTargets.length = 0;


    const cyan =
      COLORS[0];


    const white =
      COLORS[3];


    /*
      Top navigation line
    */

    addLine(
      -42,
      38,
      42,
      38,
      700,
      cyan
    );


    /*
      Main title blocks
    */

    addLine(
      -42,
      12,
      -8,
      12,
      900,
      white
    );


    addLine(
      -42,
      6,
      -20,
      6,
      550,
      white
    );


    /*
      Subtitle
    */

    addLine(
      -42,
      -3,
      -5,
      -3,
      600,
      cyan
    );


    /*
      Button 1
    */

    addLine(
      -42,
      -12,
      -28,
      -12,
      350,
      white
    );


    /*
      Button 2
    */

    addLine(
      -25,
      -12,
      -10,
      -12,
      350,
      white
    );


    /*
      Section lines
    */

    addLine(
      -42,
      -27,
      42,
      -27,
      550,
      cyan
    );


    addLine(
      -42,
      -36,
      0,
      -36,
      450,
      white
    );


    addLine(
      4,
      -36,
      42,
      -36,
      450,
      white
    );


    /*
      Small data blocks
    */

    for (
      let row = 0;
      row < 4;
      row++
    ) {

      addLine(
        -42,
        -42 - row * 5,
        -5,
        -42 - row * 5,
        250,
        white
      );


      addLine(
        5,
        -42 - row * 5,
        42,
        -42 - row * 5,
        250,
        cyan
      );
    }
  }


  /* =======================================================
     INITIAL PARTICLE FIELD
     ======================================================= */

  function initializeParticles() {

    for (
      let i = 0;
      i < N;
      i++
    ) {

      const j =
        i * 3;


      /*
        Start spread around the entire viewport.
      */

      positions[j] =
        (
          Math.random() -
          0.5
        ) *
        width;


      positions[j + 1] =
        (
          Math.random() -
          0.5
        ) *
        height;


      positions[j + 2] =
        (
          Math.random() -
          0.5
        ) *
        80;


      basePositions[j] =
        positions[j];

      basePositions[j + 1] =
        positions[j + 1];

      basePositions[j + 2] =
        positions[j + 2];


      velocities[j] =
        0;

      velocities[j + 1] =
        0;

      velocities[j + 2] =
        0;


      targetPositions[j] =
        positions[j];

      targetPositions[j + 1] =
        positions[j + 1];

      targetPositions[j + 2] =
        positions[j + 2];


      energy[i] =
        0;


      sizes[i] =
        1 +
        Math.random() *
        2;


      seeds[i] =
        Math.random();


      setColor(
        i,
        COLORS[
          Math.floor(
            Math.random() *
            COLORS.length
          )
        ]
      );
    }
  }


  /* =======================================================
     THREE INITIALIZATION
     ======================================================= */

  async function initThree() {

    try {

      THREE =
        await import(
          "three"
        );

    } catch (error) {

      console.error(
        "Three.js failed:",
        error
      );

      finishIntro();

      return false;
    }


    renderer =
      new THREE.WebGLRenderer({

        canvas,

        antialias:false,

        alpha:true,

        powerPreference:
          "high-performance"
      });


    renderer.setPixelRatio(
      dpr
    );


    renderer.setSize(
      width,
      height,
      false
    );


    renderer.setClearColor(
      0x000000,
      0
    );


    scene =
      new THREE.Scene();


    camera =
      new THREE.OrthographicCamera(

        -width / 2,
        width / 2,

        height / 2,
        -height / 2,

        -200,
        200

      );


    camera.position.z =
      50;


    initializeParticles();


    geometry =
      new THREE.BufferGeometry();


    const positionAttribute =
      new THREE.BufferAttribute(
        positions,
        3
      );


    positionAttribute.setUsage(
      THREE.DynamicDrawUsage
    );


    geometry.setAttribute(
      "position",
      positionAttribute
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


    geometry.setAttribute(
      "aEnergy",
      new THREE.BufferAttribute(
        energy,
        1
      )
    );


    material =
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

          uBrightness:{
            value:1
          }

        },


        vertexShader:`

          uniform float uPixelRatio;

          uniform float uTime;

          attribute float aSize;

          attribute float aSeed;

          attribute float aEnergy;

          attribute vec3 aColor;


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
                2.0 +
                aSeed *
                30.0
              );


            gl_PointSize =
              aSize *
              uPixelRatio *
              pulse;


            gl_Position =
              projectionMatrix *
              mv;


            vColor =
              aColor;


            vAlpha =
              0.65 +
              aEnergy *
              0.35;
          }

        `,


        fragmentShader:`

          varying vec3 vColor;

          varying float vAlpha;


          void main(){

            vec2 uv =
              gl_PointCoord -
              0.5;


            float d =
              length(uv);


            float alpha =
              smoothstep(
                0.5,
                0.0,
                d
              );


            alpha *= alpha;


            gl_FragColor =
              vec4(
                vColor,
                alpha *
                vAlpha
              );
          }

        `
      });


    points =
      new THREE.Points(
        geometry,
        material
      );


    points.frustumCulled =
      false;


    scene.add(
      points
    );


    /*
      Prepare target structures.
    */

    buildHandTargets();

    buildCoreTargets();

    assignCoreParticles();

    buildDNATargets();

    buildUITargets();


    /*
      For particles that don't belong to cores,
      initially target the hand.
    */

    for (
      let i = 0;
      i < N;
      i++
    ) {

      /*
        Don't overwrite core targets.
      */

      let isCore =
        false;


      for (
        const range of
        coreParticleRanges
      ) {

        if (
          i >= range.start &&
          i < range.end
        ) {

          isCore = true;

          break;
        }
      }


      if (!isCore) {

        targetPositions[
          i * 3
        ] =
          handTargets[
            i * 3
          ];


        targetPositions[
          i * 3 + 1
        ] =
          handTargets[
            i * 3 + 1
          ];


        targetPositions[
          i * 3 + 2
        ] =
          handTargets[
            i * 3 + 2
          ];
      }
    }


    return true;
  }


  /* =======================================================
     HAND FORMATION
     ======================================================= */

  function formHand(
    progress
  ) {

    const p =
      easeInOut(
        progress
      );


    for (
      let i = 0;
      i < N;
      i++
    ) {

      /*
        Core particles remain mostly dispersed
        until their own phase.
      */

      let isCore =
        false;


      for (
        const range of
        coreParticleRanges
      ) {

        if (
          i >= range.start &&
          i < range.end
        ) {

          isCore = true;

          break;
        }
      }


      if (isCore)
        continue;


      const j =
        i * 3;


      const tx =
        handTargets[j];

      const ty =
        handTargets[j + 1];

      const tz =
        handTargets[j + 2];


      positions[j] =
        lerp(
          basePositions[j],
          tx,
          p
        );


      positions[j + 1] =
        lerp(
          basePositions[j + 1],
          ty,
          p
        );


      positions[j + 2] =
        lerp(
          basePositions[j + 2],
          tz,
          p
        );


      energy[i] =
        p;
    }


    geometry.attributes
      .position
      .needsUpdate = true;


    geometry.attributes
      .aEnergy
      .needsUpdate = true;
  }


  /* =======================================================
     CORE FORMATION
     ======================================================= */

  function formCores(
    progress
  ) {

    const p =
      easeOutCubic(
        progress
      );


    for (
      const range of
      coreParticleRanges
    ) {

      for (
        let i =
          range.start;

        i <
          range.end;

        i++
      ) {

        const j =
          i * 3;


        const tx =
          targetPositions[j];

        const ty =
          targetPositions[j + 1];

        const tz =
          targetPositions[j + 2];


        /*
          Cores materialize from local particle noise.
        */

        const spread =
          (1 - p) *
          40;


        positions[j] =
          tx +
          randomGaussian() *
          spread;


        positions[j + 1] =
          ty +
          randomGaussian() *
          spread;


        positions[j + 2] =
          tz +
          randomGaussian() *
          spread;


        energy[i] =
          p;
      }
    }


    geometry.attributes
      .position
      .needsUpdate = true;


    geometry.attributes
      .aEnergy
      .needsUpdate = true;
  }


  /* =======================================================
     ENERGY BUILDUP
     ======================================================= */

  function chargeEnergy(
    progress
  ) {

    const p =
      easeInOut(
        progress
      );


    material.uniforms
      .uBrightness.value =
        1 +
        p * 2.5;


    /*
      All particles begin vibrating.
    */

    for (
      let i = 0;
      i < N;
      i++
    ) {

      const j =
        i * 3;


      const pulse =
        Math.sin(
          performance.now() *
          0.018 +
          seeds[i] *
          20
        );


      positions[j] +=
        pulse *
        p *
        0.45;


      positions[j + 1] +=
        Math.cos(
          performance.now() *
          0.015 +
          seeds[i] *
          15
        ) *
        p *
        0.45;


      energy[i] =
        0.7 +
        p *
        1.5;
    }


    geometry.attributes
      .position
      .needsUpdate = true;


    geometry.attributes
      .aEnergy
      .needsUpdate = true;
  }


  /* =======================================================
     SNAP EXPLOSION
     ======================================================= */

  function snapExplosion(
    progress
  ) {

    const p =
      easeOutCubic(
        progress
      );


    material.uniforms
      .uBrightness.value =
        2.5 +
        p * 2;


    for (
      let i = 0;
      i < N;
      i++
    ) {

      const j =
        i * 3;


      /*
        Direction from screen center.
      */

      let x =
        positions[j];

      let y =
        positions[j + 1];

      let z =
        positions[j + 2];


      const length =
        Math.sqrt(
          x * x +
          y * y +
          z * z
        ) || 1;


      x /= length;
      y /= length;
      z /= length;


      /*
        Individual variation.
      */

      const seed =
        0.65 +
        seeds[i] *
        1.5;


      const explosion =
        p *
        CONFIG.explosionStrength *
        seed;


      positions[j] +=
        x *
        explosion *
        380 *
        0.016;


      positions[j + 1] +=
        y *
        explosion *
        380 *
        0.016;


      positions[j + 2] +=
        z *
        explosion *
        200 *
        0.016;


      /*
        White flash.
      */

      colors[j] =
        lerp(
          colors[j],
          1,
          p * 0.4
        );


      colors[j + 1] =
        lerp(
          colors[j + 1],
          1,
          p * 0.4
        );


      colors[j + 2] =
        lerp(
          colors[j + 2],
          1,
          p * 0.4
        );


      energy[i] =
        1 +
        p;
    }


    geometry.attributes
      .position
      .needsUpdate = true;


    geometry.attributes
      .aColor
      .needsUpdate = true;


    geometry.attributes
      .aEnergy
      .needsUpdate = true;
  }


  /* =======================================================
     RECONSTRUCTION
     ======================================================= */

  function reconstruct(
    progress
  ) {

    const p =
      easeInOut(
        progress
      );


    /*
      We divide the particle population:

      45% → DNA
      35% → UI
      20% → ambient particles
    */

    const dnaCount =
      Math.floor(
        N * 0.45
      );


    const uiCount =
      Math.floor(
        N * 0.35
      );


    for (
      let i = 0;
      i < N;
      i++
    ) {

      const j =
        i * 3;


      let target;


      /*
        DNA
      */

      if (
        i <
        dnaCount
      ) {

        target =
          dnaTargets[
            i %
            dnaTargets.length
          ];

      }


      /*
        UI
      */

      else if (
        i <
        dnaCount +
        uiCount
      ) {

        target =
          uiTargets[
            (
              i -
              dnaCount
            ) %
            uiTargets.length
          ];

      }


      /*
        Ambient
      */

      else {

        target = {

          x:
            (
              Math.random() -
              0.5
            ) *
            width,

          y:
            (
              Math.random() -
              0.5
            ) *
            height,

          z:
            (
              Math.random() -
              0.5
            ) *
            40,

          color:
            COLORS[
              Math.floor(
                Math.random() *
                COLORS.length
              )
            ]
        };
      }


      /*
        Explosion positions gradually
        settle into final targets.
      */

      positions[j] +=
        (
          target.x -
          positions[j]
        ) *
        p *
        0.035;


      positions[j + 1] +=
        (
          target.y -
          positions[j + 1]
        ) *
        p *
        0.035;


      positions[j + 2] +=
        (
          target.z -
          positions[j + 2]
        ) *
        p *
        0.035;


      /*
        Restore colors from white.
      */

      colors[j] +=
        (
          target.color[0] -
          colors[j]
        ) *
        p *
        0.025;


      colors[j + 1] +=
        (
          target.color[1] -
          colors[j + 1]
        ) *
        p *
        0.025;


      colors[j + 2] +=
        (
          target.color[2] -
          colors[j + 2]
        ) *
        p *
        0.025;


      energy[i] =
        1 -
        p * 0.15;
    }


    geometry.attributes
      .position
      .needsUpdate = true;


    geometry.attributes
      .aColor
      .needsUpdate = true;


    geometry.attributes
      .aEnergy
      .needsUpdate = true;
  }


  /* =======================================================
     CAMERA / RESIZE
     ======================================================= */

  function resize() {

    width =
      innerWidth;

    height =
      innerHeight;


    dpr =
      Math.min(
        devicePixelRatio || 1,
        2
      );


    if (!renderer)
      return;


    renderer.setPixelRatio(
      dpr
    );


    renderer.setSize(
      width,
      height,
      false
    );


    camera.left =
      -width / 2;

    camera.right =
      width / 2;

    camera.top =
      height / 2;

    camera.bottom =
      -height / 2;


    camera.updateProjectionMatrix();


    material.uniforms
      .uPixelRatio.value =
        dpr;


    /*
      Rebuild responsive targets.
    */

    buildHandTargets();

    buildDNATargets();

    buildUITargets();
  }


  addEventListener(
    "resize",
    resize,
    {
      passive:true
    }
  );


  /* =======================================================
     CAPTION
     ======================================================= */

  function setCaption(
    text
  ) {

    if (!caption)
      return;


    caption.textContent =
      text;
  }


  /* =======================================================
     DASHBOARD REVEAL
     ======================================================= */

  function revealDashboard() {

    if (finished)
      return;


    setCaption(
      "SYSTEM ONLINE"
    );


    document.body.classList.remove(
      "intro-active"
    );


    document.body.classList.add(
      "intro-ready"
    );


    /*
      Let the particle composition remain
      visible briefly while the real HTML
      dashboard fades in.
    */

    setTimeout(
      () => {

        root.classList.add(
          "is-finished"
        );

      },
      450
    );


    setTimeout(
      () => {

        finished = true;

        cancelAnimationFrame(
          animationFrame
        );

        /*
          Free WebGL resources.
        */

        if (geometry)
          geometry.dispose();

        if (material)
          material.dispose();

        if (renderer)
          renderer.dispose();

        root.style.display =
          "none";

      },
      1500
    );
  }


  /* =======================================================
     SKIP
     ======================================================= */

  function finishIntro() {

    if (finished)
      return;


    skipped = true;

    finished = true;


    document.body.classList.remove(
      "intro-active"
    );


    document.body.classList.add(
      "intro-ready"
    );


    root.classList.add(
      "is-finished"
    );


    setTimeout(
      () => {

        root.style.display =
          "none";

      },
      1000
    );
  }


  if (skip) {

    skip.addEventListener(
      "click",
      finishIntro
    );
  }


  /* =======================================================
     ANIMATION LOOP
     ======================================================= */

  function animate(
    now
  ) {

    if (finished)
      return;


    animationFrame =
      requestAnimationFrame(
        animate
      );


    const elapsed =
      now -
      startTime;


    const dt =
      Math.min(
        0.033,
        (
          now -
          lastTime
        ) /
        1000
      );


    lastTime =
      now;


    material.uniforms
      .uTime.value =
        now *
        0.001;


    /*
      -----------------------------------------
      PHASE 1
      Hand formation
      -----------------------------------------
    */

    if (
      elapsed >=
      CONFIG.handStart &&
      elapsed <
      CONFIG.handEnd
    ) {

      const p =
        (
          elapsed -
          CONFIG.handStart
        ) /
        (
          CONFIG.handEnd -
          CONFIG.handStart
        );


      setCaption(
        "ASSEMBLING BIOLOGICAL COMPUTATION"
      );


      formHand(p);
    }


    /*
      -----------------------------------------
      PHASE 2
      Five cores
      -----------------------------------------
    */

    else if (
      elapsed >=
      CONFIG.coresStart &&
      elapsed <
      CONFIG.chargeStart
    ) {

      const p =
        (
          elapsed -
          CONFIG.coresStart
        ) /
        (
          CONFIG.chargeStart -
          CONFIG.coresStart
        );


      setCaption(
        "SYSTEM COMPONENTS SYNCHRONIZING"
      );


      /*
        Keep hand visible while
        cores appear.
      */

      formHand(1);

      formCores(p);
    }


    /*
      -----------------------------------------
      PHASE 3
      Energy buildup
      -----------------------------------------
    */

    else if (
      elapsed >=
      CONFIG.chargeStart &&
      elapsed <
      CONFIG.snapTime
    ) {

      const p =
        (
          elapsed -
          CONFIG.chargeStart
        ) /
        (
          CONFIG.snapTime -
          CONFIG.chargeStart
        );


      setCaption(
        "ENERGY BUILDUP"
      );


      formHand(1);

      formCores(1);

      chargeEnergy(p);
    }


    /*
      -----------------------------------------
      PHASE 4
      SNAP
      -----------------------------------------
    */

    else if (
      elapsed >=
      CONFIG.snapTime &&
      elapsed <
      CONFIG.explosionEnd
    ) {

      const p =
        (
          elapsed -
          CONFIG.snapTime
        ) /
        (
          CONFIG.explosionEnd -
          CONFIG.snapTime
        );


      setCaption(
        "SNAP"
      );


      snapExplosion(p);
    }


    /*
      -----------------------------------------
      PHASE 5
      Reconstruction
      -----------------------------------------
    */

    else if (
      elapsed >=
      CONFIG.reconstructionStart &&
      elapsed <
      CONFIG.dashboardReveal
    ) {

      const p =
        (
          elapsed -
          CONFIG.reconstructionStart
        ) /
        (
          CONFIG.dashboardReveal -
          CONFIG.reconstructionStart
        );


      setCaption(
        "RECONSTRUCTING SYSTEM"
      );


      reconstruct(p);
    }


    /*
      -----------------------------------------
      PHASE 6
      Dashboard reveal
      -----------------------------------------
    */

    else if (
      elapsed >=
      CONFIG.dashboardReveal
    ) {

      setCaption(
        "SYSTEM ONLINE"
      );


      revealDashboard();

      return;
    }


    /*
      Tiny ambient movement.
    */

    if (
      elapsed <
      CONFIG.snapTime
    ) {

      for (
        let i = 0;
        i < N;
        i++
      ) {

        const j =
          i * 3;


        const breathing =
          Math.sin(
            now *
            0.0012 +
            seeds[i] *
            20
          ) *
          0.025;


        positions[j] +=
          breathing;

        positions[j + 1] +=
          Math.cos(
            now *
            0.001 +
            seeds[i] *
            17
          ) *
          0.025;
      }


      geometry.attributes
        .position
        .needsUpdate = true;
    }


    renderer.render(
      scene,
      camera
    );
  }


  /* =======================================================
     START
     ======================================================= */

  async function start() {

    /*
      Respect reduced-motion.
    */

    if (
      matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {

      finishIntro();

      return;
    }


    const ok =
      await initThree();


    if (!ok)
      return;


    startTime =
      performance.now();

    lastTime =
      startTime;


    setCaption(
      "INITIALIZING BIOLOGICAL COMPUTATION"
    );


    animationFrame =
      requestAnimationFrame(
        animate
      );
  }


  /* =======================================================
     AUTO START
     ======================================================= */

  start();

})();
