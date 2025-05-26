<!DOCTYPE html>
<html>
<head>
  <title>Construtor AR Cardboard</title>
  <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
  <script src="block-placer.js" defer></script>
  <style>
    body { margin: 0; overflow: hidden; }
    /* O CSS para #cameraFeed não é mais necessário aqui,
       pois o vídeo será gerenciado dentro do A-Frame.
       Mas precisamos de um <video> para ser a fonte. */
  </style>
</head>
<body>
  <video id="cameraVideoAsset" autoplay playsinline muted style="display:none;"></video>

  <a-scene
    vr-mode-ui="enabled: true"
    renderer="antialias: true;" block-placer="gridSize: 0.5">

    <a-assets>
      <video id="cameraFeedTexture" src="#cameraVideoAsset" autoplay loop="false" playsinline muted></video>
    </a-assets>

    <a-sky src="#cameraFeedTexture" rotation="0 -90 0"></a-sky> <a-plane
      id="placementPlane"
      position="0 0 -3"
      rotation="-90 0 0"
      width="20"
      height="20"
      material="visible: false; transparent: true; opacity: 0.1"
      class="raycastable">
    </a-plane>

    <a-light type="ambient" color="#FFF"></a-light> <a-entity id="playerCamera" camera position="0 0.5 0" look-controls wasd-controls="enabled:false">
      <a-entity
        id="cursor"
        cursor="fuse: true; fuseTimeout: 1500;" raycaster="objects: .raycastable, .placeable-block; far: 5"
        position="0 0 -0.75"
        geometry="primitive: ring; radiusInner: 0.01; radiusOuter: 0.015"
        material="color: white; shader: flat; opacity: 0.8">
        <a-animation begin="fusing" easing="ease-in" attribute="scale"
                     fill="forwards" from="1 1 1" to="0.2 0.2 0.2" dur="1500"></a-animation>
      </a-entity>
      <a-entity id="blockPreview"
        geometry="primitive: box; width: 0.48; height: 0.48; depth: 0.48"
        material="color: orange; opacity: 0.5; transparent: true"
        position="0 0 -1.5"
        visible="false">
      </a-entity>
    </a-entity>
  </a-scene>

  <script>
    // Script para iniciar a câmera e conectar ao asset de vídeo
    const videoAssetElement = document.getElementById('cameraVideoAsset'); // O <video> escondido
    const aFrameVideoTexture = document.getElementById('cameraFeedTexture'); // O <video> dentro de <a-assets>

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(function(stream) {
          // Conecta o stream ao elemento <video> que serve de asset
          videoAssetElement.srcObject = stream;
          videoAssetElement.play(); // Garante que o vídeo no asset comece a tocar

          // A-Frame deve pegar o stream do #cameraVideoAsset automaticamente para #cameraFeedTexture
          // Mas às vezes é preciso dar um "play" explícito no asset do A-Frame também,
          // especialmente após o stream ser atribuído.
          // No entanto, o atributo 'autoplay' no <video> dentro de <a-assets> deve cuidar disso.
        })
        .catch(function(err) {
          console.error("Erro ao acessar a câmera: ", err);
          alert("Não foi possível acessar a câmera. Verifique as permissões.");
        });
    } else {
      alert("Seu navegador não suporta acesso à câmera via getUserMedia.");
    }
  </script>
</body>
</html>
