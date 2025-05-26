AFRAME.registerComponent('block-placer', {
  schema: {
    gridSize: { type: 'number', default: 0.5 }, // Tamanho da célula da grade e do bloco
    blockColor: { type: 'color', default: '#4CC3D9' }
  },

  init: function () {
    this.cursor = document.getElementById('cursor');
    this.blockPreview = document.getElementById('blockPreview');
    this.groundPlane = document.getElementById('groundPlane'); // Referência ao chão
    this.sceneEl = this.el;

    // Configura a geometria do bloco de pré-visualização com base no gridSize
    const previewSize = this.data.gridSize * 0.98; // Ligeiramente menor para evitar z-fighting e dar contorno
    this.blockPreview.setAttribute('geometry', {
      primitive: 'box',
      width: previewSize,
      height: previewSize,
      depth: previewSize
    });

    this.handleRaycasterIntersection = this.handleRaycasterIntersection.bind(this);
    this.handlePlaceBlock = this.handlePlaceBlock.bind(this);
    this.updatePreviewVisibility = this.updatePreviewVisibility.bind(this);

    this.cursor.addEventListener('raycaster-intersection', this.handleRaycasterIntersection);
    this.cursor.addEventListener('raycaster-intersection-cleared', this.updatePreviewVisibility); // Esconde o preview se não mirar em nada
    this.cursor.addEventListener('click', this.handlePlaceBlock); // 'click' é emitido pelo fuse do cursor

    this.lastValidPosition = null;
    this.intersectionData = null; // Para armazenar dados da última interseção válida
  },

  remove: function () {
    this.cursor.removeEventListener('raycaster-intersection', this.handleRaycasterIntersection);
    this.cursor.removeEventListener('raycaster-intersection-cleared', this.updatePreviewVisibility);
    this.cursor.removeEventListener('click', this.handlePlaceBlock);
  },

  updatePreviewVisibility: function() {
    // Chamado quando o raycaster não atinge mais nada ou atinge algo inválido
    if (this.blockPreview) {
      this.blockPreview.setAttribute('visible', false);
    }
    this.lastValidPosition = null;
    this.intersectionData = null;
  },

  handleRaycasterIntersection: function (evt) {
    if (!this.blockPreview || !evt.detail.els.length) {
      this.updatePreviewVisibility();
      return;
    }

    const intersection = evt.detail.intersections[0]; // Pega a primeira interseção válida
    const targetEl = intersection.object.el;

    if (!targetEl.classList.contains('raycastable')) { // Verifica se é um alvo válido
        this.updatePreviewVisibility();
        return;
    }

    const point = intersection.point;
    const faceNormal = intersection.face.normal;
    const gridSize = this.data.gridSize;
    let snappedX, snappedY, snappedZ;

    if (targetEl.id === 'groundPlane') {
      snappedX = Math.round(point.x / gridSize) * gridSize;
      snappedY = gridSize / 2; // Metade da altura do bloco, sobre o chão (Y=0)
      snappedZ = Math.round(point.z / gridSize) * gridSize;
    } else if (targetEl.classList.contains('placeable-block')) {
      const targetBlockPosition = targetEl.getAttribute('position');

      // Calcula a posição do novo bloco adjacente ao bloco existente usando a normal da face
      snappedX = targetBlockPosition.x + faceNormal.x * gridSize;
      snappedY = targetBlockPosition.y + faceNormal.y * gridSize;
      snappedZ = targetBlockPosition.z + faceNormal.z * gridSize;

      // Arredonda para a grade para garantir alinhamento, pois a face normal pode não ser perfeita
      // e para garantir que o centro do novo bloco esteja na grade.
      snappedX = Math.round(snappedX / gridSize) * gridSize;
      snappedY = Math.round(snappedY / gridSize) * gridSize; // Garante que Y também caia na grade
      snappedZ = Math.round(snappedZ / gridSize) * gridSize;

    } else {
      this.updatePreviewVisibility(); // Não é um alvo válido
      return;
    }

    this.blockPreview.setAttribute('position', `${snappedX} ${snappedY} ${snappedZ}`);
    this.blockPreview.setAttribute('visible', true);
    this.lastValidPosition = { x: snappedX, y: snappedY, z: snappedZ };
    this.intersectionData = intersection; // Guardar para usar ao colocar o bloco
  },

  handlePlaceBlock: function () {
    if (this.blockPreview && this.blockPreview.getAttribute('visible') && this.lastValidPosition) {
      // Verifica se já existe um bloco na posição (prevenção simples de sobreposição)
      const existingBlocks = this.sceneEl.querySelectorAll('.placeable-block');
      let canPlace = true;
      for (let i = 0; i < existingBlocks.length; i++) {
        const pos = existingBlocks[i].getAttribute('position');
        if (pos.x === this.lastValidPosition.x &&
            pos.y === this.lastValidPosition.y &&
            pos.z === this.lastValidPosition.z) {
          canPlace = false;
          break;
        }
      }

      if (!canPlace) {
        console.log("Já existe um bloco aqui!");
        return;
      }

      const newBlock = document.createElement('a-box');
      newBlock.setAttribute('position', this.lastValidPosition);
      const blockSize = this.data.gridSize; // Blocos têm o tamanho exato da grade
      newBlock.setAttribute('width', blockSize);
      newBlock.setAttribute('height', blockSize);
      newBlock.setAttribute('depth', blockSize);
      newBlock.setAttribute('color', this.data.blockColor);
      newBlock.setAttribute('shadow', "cast: true; receive: true");
      newBlock.classList.add('placeable-block'); // Para poder mirar nele depois
      newBlock.classList.add('raycastable');     // Para o raycaster interagir com ele

      this.sceneEl.appendChild(newBlock);
      console.log('Bloco colocado em:', this.lastValidPosition);
    }
  }
});
