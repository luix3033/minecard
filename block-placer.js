AFRAME.registerComponent('block-placer', {
  schema: {
    gridSize: { type: 'number', default: 0.5 }, // Tamanho da célula da grade (ex: 0.5 = 50cm)
    blockColor: { type: 'color', default: '#4CC3D9' }
  },

  init: function () {
    this.cursor = document.getElementById('cursor');
    this.blockPreview = document.getElementById('blockPreview');
    this.placementPlane = document.getElementById('placementPlane'); // Nosso plano invisível
    this.sceneEl = this.el; // a-scene

    this.handleRaycasterIntersection = this.handleRaycasterIntersection.bind(this);
    this.handlePlaceBlock = this.handlePlaceBlock.bind(this);

    this.cursor.addEventListener('raycaster-intersection', this.handleRaycasterIntersection);
    this.cursor.addEventListener('click', this.handlePlaceBlock); // 'click' é emitido pelo fuse do cursor
  },

  remove: function () {
    this.cursor.removeEventListener('raycaster-intersection', this.handleRaycasterIntersection);
    this.cursor.removeEventListener('click', this.handlePlaceBlock);
  },

  handleRaycasterIntersection: function (evt) {
    if (!this.blockPreview || !evt.detail.els.length) {
      if (this.blockPreview) this.blockPreview.setAttribute('visible', false);
      return;
    }

    // Pega o primeiro objeto intersectado
    const intersection = evt.detail.intersections[0];

    // Só mostra a pré-visualização se estivermos mirando no plano de construção ou em outro bloco
    if (intersection.object.el.id === 'placementPlane' || intersection.object.el.classList.contains('placeable-block')) {
      const point = intersection.point;
      const gridSize = this.data.gridSize;

      // Calcula a posição na grade
      // Adiciona metade do gridSize para centralizar o bloco na célula da grade
      // Se estiver colocando em cima de outro bloco, calcula a posição em relação à face do bloco.
      let snappedX, snappedY, snappedZ;

      if (intersection.object.el.id === 'placementPlane') {
        snappedX = Math.round(point.x / gridSize) * gridSize;
        snappedY = Math.round(point.y / gridSize) * gridSize + (gridSize / 2); // Coloca em cima do plano
        snappedZ = Math.round(point.z / gridSize) * gridSize;
        this.placementPlane.setAttribute('position', `0 ${snappedY - (gridSize / 2) -0.01} -3`); // Move o plano para baixo do bloco atual
      } else if (intersection.object.el.classList.contains('placeable-block')) {
        // Lógica para empilhar blocos:
        const targetBlockPosition = intersection.object.el.getAttribute('position');
        const faceNormal = intersection.face.normal; // Normal da face atingida

        // Calcula a posição do novo bloco adjacente ao bloco existente
        snappedX = targetBlockPosition.x + faceNormal.x * gridSize;
        snappedY = targetBlockPosition.y + faceNormal.y * gridSize;
        snappedZ = targetBlockPosition.z + faceNormal.z * gridSize;

        // Arredonda para a grade para garantir alinhamento, caso a face não seja perfeitamente alinhada
        snappedX = Math.round(snappedX / gridSize) * gridSize;
        snappedY = Math.round(snappedY / gridSize) * gridSize;
        snappedZ = Math.round(snappedZ / gridSize) * gridSize;
      }


      this.blockPreview.setAttribute('position', `${snappedX} ${snappedY} ${snappedZ}`);
      this.blockPreview.setAttribute('visible', true);
      this.lastValidPosition = { x: snappedX, y: snappedY, z: snappedZ }; // Salva a última posição válida
    } else {
      this.blockPreview.setAttribute('visible', false);
      this.lastValidPosition = null;
    }
  },

  handlePlaceBlock: function () {
    if (this.blockPreview && this.blockPreview.getAttribute('visible') && this.lastValidPosition) {
      const newBlock = document.createElement('a-box');
      newBlock.setAttribute('position', this.lastValidPosition);
      newBlock.setAttribute('width', this.data.gridSize * 0.95); // Um pouco menor para ver as bordas
      newBlock.setAttribute('height', this.data.gridSize * 0.95);
      newBlock.setAttribute('depth', this.data.gridSize * 0.95);
      newBlock.setAttribute('color', this.data.blockColor);
      newBlock.setAttribute('shadow', "cast: true; receive: false");
      newBlock.classList.add('placeable-block'); // Para poder mirar nele depois
      newBlock.classList.add('raycastable');     // Para o raycaster interagir

      // Adiciona uma física simples se quiser que os blocos caiam (requer aframe-physics-system)
      // newBlock.setAttribute('static-body', ''); // ou dynamic-body

      this.sceneEl.appendChild(newBlock);
      console.log('Bloco colocado em:', this.lastValidPosition);
    }
  }
});