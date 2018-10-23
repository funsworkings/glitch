/* global AFRAME, THREE */

var marker, models;
var shown;

var step;

/* ************************************************************** */

AFRAME.registerComponent('loaded', {
  schema: {type: 'string'},

  init: function () {
    var text = this.data;
  }
});

/* ************************************************************** */

AFRAME.registerComponent('holographic', {
  schema: {
    frontfacing : {type: 'boolean'}
  },
  
  init: function () {
    var tex = new THREE.TextureLoader().load("https://cdn.glitch.com/2b367b3b-0a08-48c8-a5a5-345267ba04ae%2FDobermanLoPolyPaint_grey02.png?1539998848527");
    var lightTex = new THREE.TextureLoader().load("https://cdn.glitch.com/2b367b3b-0a08-48c8-a5a5-345267ba04ae%2FDobermanLoPolyPaint%400%2C5x.png?1539997415735");
    
    var vert = document.getElementById('custom-vertex-shader').textContent;
    var frag = document.getElementById('custom-fragment-shader').textContent;
    var customUniforms = THREE.UniformsUtils.merge([
      THREE.ShaderLib.lambert.uniforms,
      { },
      { time: { value: 0.0 },
        glitch: { value: 0.0 } }
    ]);
    
    this.material = new THREE.ShaderMaterial({
      uniforms: customUniforms,
      vertexShader: vert,
      fragmentShader: frag,
      lights: true,
      skinning: true,
      transparent: true,
      colorWrite: true,
      map: tex
    });
    
    this.material.colorWrite = this.data.frontfacing;
    
    this.material.uniforms.map.value = tex;
    this.material.map = tex;
    
    this.el.addEventListener('model-loaded', () => this.update());
  },

  update: function () {
    var object = this.el.getObject3D('mesh');
    var material = this.material;
    
    if (object) {
      object.traverse(function (node) {
        if (node.isMesh){
          node.material = material;
        }
      });
    }
  },
  
  tick: function(time, timeDelta){
    var durations = this.el.getAttribute('animation-switcher', 'animDurations');
    
    this.material.uniforms.time.value = time; 
    
    if(step >= .99  || ( step <= .05 ) &&
       Math.floor(Math.random() * 5) == 0 ){
        this.glitch();
    }
    else
      this.material.uniforms.glitch.value = 0.0;
  },
  
  glitch: function(){
    this.material.uniforms.glitch.value = Math.floor(Math.random()*(2*Math.PI));
  }
  
});

/* ************************************************************** */

AFRAME.registerComponent('animation-switcher', {
  schema: {
    index : {type: 'int', default: -1},
    second: {type: 'bool', default: false},
  
    delayTime: {type: 'int'},
    transitionTime: {type: 'int'},
    
    animDurations:{type: 'array'}
  },
  
  init: function () {
    var el = this.el;
    var data = this.data;
    
    models = document.querySelectorAll('a-asset-item');
    
    shown = false;
    step = 0.0;
    
    el.addEventListener('animation-loop', () => this.nextAnimation());
    
    if(data.second)
      el.addEventListener('model-loaded', () => this.go());
    else{
      var sec = document.querySelectorAll('[animation-switcher]')[1];
      sec.addEventListener('model-loaded', () => this.go());
    }
    
    this.nextAnimation();
  },
  
  tick: function (time, timeDelta) {
    var el = this.el;
    var data = this.data;
    
    if(shown){
      el.object3D.visible = true;
    }
    else{
      el.object3D.visible = false;
    }
    
    this.updateStep(shown, timeDelta);
  },
  
  nextAnimation: function(){
    var el = this.el;
    var data = this.data;
    var ind = data.index;
    
    shown = false;
    el.setAttribute('animation-mixer', 'timeScale', '0');
      
    if(ind == models.length-1)
      ind = 0;
    else
      ++ind;
    
    el.setAttribute('gltf-model', '#'+models[ind].id);
    data.index = ind;
  },
  
  updateStep: function(updating, delta){
    var data = this.data;
    
    if(updating){
        step += (delta / (data.animDurations[data.index]))/2.0;
    }
    else
      step = 0.0;
  },
  
  go: function(){
      this.el.setAttribute('animation-mixer', 'timeScale', '1');
      shown = true;
  }
});

/* ************************************************************** */

AFRAME.registerComponent('binary', {
  schema: {
    boneTargets: {type: 'array'}
  },
  
  init: function(){
    this.el.addEventListener('model-loaded', () => this.update());
  },
  
  update: function(){
    var particles = document.querySelectorAll('[tethered]');
    var obj = this.el.getObject3D('mesh');
    var targets = this.data.boneTargets;
                           
    if(obj){
     obj.traverse(function (node) {
       //console.log(node);
       for(var i = 0; i < targets.length; i++){
         if(node.name == targets[i]){
           node.add(particles[i].object3D);
         }
       }
      });
    }
  }
});

/* ************************************************************** */

AFRAME.registerComponent('tethered', {
  schema: {
    name: {type: 'string', default: "?"}
  }
});

/* ************************************************************** */