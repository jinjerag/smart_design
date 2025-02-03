document.addEventListener('DOMContentLoaded', () => {
  const backgroundCanvas = document.getElementById('backgroundCanvas');
  const drawingCanvas = document.getElementById('drawingCanvas');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const bgCtx = backgroundCanvas.getContext('2d');
  const ctx = drawingCanvas.getContext('2d');
  const imageUpload = document.getElementById('imageUpload');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const noteTitle = document.getElementById('noteTitle');
  const noteText = document.getElementById('noteText');
  const saveNoteBtn = document.getElementById('saveNote');
  const savedNotesGrid = document.getElementById('savedNotesGrid');
  
  const penTool = document.getElementById('penTool');
  const eraserTool = document.getElementById('eraserTool');
  const clearAllTool = document.getElementById('clearAllTool');
  const colorOptions = document.querySelectorAll('.color-option');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const resetZoomBtn = document.getElementById('resetZoom');

  // Enlarged Image Modal
  const enlargedImageModal = new bootstrap.Modal(document.getElementById('enlargedImageModal'));
  const enlargedImage = document.getElementById('enlargedImage');
  const prevImageBtn = document.getElementById('prevImageBtn');
  const nextImageBtn = document.getElementById('nextImageBtn');

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let selectedColor = '#000000';
  let selectedBackgroundColor = '#ffffff';
  let currentTool = 'pen';
  let currentZoom = 1;
  let uploadedImages = []; // Store uploaded images
  let currentNoteId = null; // Track current note being edited
  let currentImageIndex = 0;
  let currentImageSet = [];

  // New Section-related Elements
  const newSectionNameInput = document.getElementById('newSectionName');
  const addSectionBtn = document.getElementById('addSectionBtn');
  const sectionsListContainer = document.getElementById('sectionsList');
  const currentSectionTitle = document.getElementById('currentSectionTitle');

  // Edit Section Modal
  const editSectionModal = new bootstrap.Modal(document.getElementById('editSectionModal'));
  const editSectionNameInput = document.getElementById('editSectionNameInput');
  const saveSectionNameBtn = document.getElementById('saveSectionNameBtn');

  let currentSectionId = null;

  // Function to detect if text contains Arabic characters
  function containsArabic(text) {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
  }

  // RTL Detection and Auto-switching for Title
  function applyRTLForElement(element) {
    if (containsArabic(element.value)) {
      element.dir = 'rtl';
      element.style.textAlign = 'right';
    } else {
      element.dir = 'ltr';
      element.style.textAlign = 'left';
    }
  }

  // Apply RTL for both title and text
  noteText.addEventListener('input', function() {
    applyRTLForElement(this);
  });

  noteTitle.addEventListener('input', function() {
    applyRTLForElement(this);
  });

  // Drawing setup
  ctx.strokeStyle = selectedColor;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // Zoom functionality
  function applyZoom() {
    const transformValue = `scale(${currentZoom})`;
    backgroundCanvas.style.transform = transformValue;
    drawingCanvas.style.transform = transformValue;
  }

  zoomInBtn.addEventListener('click', () => {
    currentZoom = Math.min(3, currentZoom + 0.25);
    applyZoom();
  });

  zoomOutBtn.addEventListener('click', () => {
    currentZoom = Math.max(0.5, currentZoom - 0.25);
    applyZoom();
  });

  resetZoomBtn.addEventListener('click', () => {
    currentZoom = 1;
    applyZoom();
  });

  // Image Upload Handler
  imageUpload.addEventListener('change', (e) => {
    const files = e.target.files;
    
    // Limit to 10 images
    if (files.length > 10) {
      alert('You can upload a maximum of 10 images.');
      // Reset file input
      imageUpload.value = '';
      return;
    }

    // Clear previous uploads if adding new images
    if (uploadedImages.length + files.length > 10) {
      alert('Total images cannot exceed 10. Clearing previous uploads.');
      uploadedImages = [];
    }

    for (let file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        uploadedImages.push(imageData);
        renderImagePreviews();
      };
      reader.readAsDataURL(file);
    }
  });

  function renderImagePreviews() {
    imagePreviewContainer.innerHTML = '';
    uploadedImages.forEach((imageData, index) => {
      const previewDiv = document.createElement('div');
      previewDiv.className = 'image-preview';
      
      const img = document.createElement('img');
      img.src = imageData;
      img.addEventListener('click', () => showEnlargedImage(imageData, uploadedImages, index));

      const deleteBtn = document.createElement('span');
      deleteBtn.className = 'delete-image';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => deleteImage(index));

      previewDiv.appendChild(img);
      previewDiv.appendChild(deleteBtn);
      imagePreviewContainer.appendChild(previewDiv);

      // Show total image count
      const imageCountSpan = document.createElement('span');
      imageCountSpan.className = 'image-count';
      imageCountSpan.textContent = `${uploadedImages.length}/10`;
      imagePreviewContainer.appendChild(imageCountSpan);
    });
  }

  function deleteImage(index) {
    uploadedImages.splice(index, 1);
    renderImagePreviews();
  }

  function showEnlargedImage(imageData, imageArray, startIndex = 0) {
    currentImageSet = imageArray;
    currentImageIndex = startIndex;
    enlargedImage.src = imageData;
    updateNavigationButtons();
    enlargedImageModal.show();
  }

  function updateNavigationButtons() {
    prevImageBtn.disabled = currentImageIndex <= 0;
    nextImageBtn.disabled = currentImageIndex >= currentImageSet.length - 1;
  }

  prevImageBtn.addEventListener('click', () => {
    if (currentImageIndex > 0) {
      currentImageIndex--;
      enlargedImage.src = currentImageSet[currentImageIndex];
      updateNavigationButtons();
    }
  });

  nextImageBtn.addEventListener('click', () => {
    if (currentImageIndex < currentImageSet.length - 1) {
      currentImageIndex++;
      enlargedImage.src = currentImageSet[currentImageIndex];
      updateNavigationButtons();
    }
  });

  function getCanvasCoordinates(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const scaleX = drawingCanvas.width / rect.width;
    const scaleY = drawingCanvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX / currentZoom;
    const y = (e.clientY - rect.top) * scaleY / currentZoom;

    return { x, y };
  }

  function startDrawing(e) {
    isDrawing = true;
    const coords = getCanvasCoordinates(e);
    [lastX, lastY] = [coords.x, coords.y];
  }

  function draw(e) {
    if (!isDrawing) return;

    const coords = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(coords.x, coords.y);
    
    if (currentTool === 'pen') {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 20;
    }
    
    ctx.stroke();
    [lastX, lastY] = [coords.x, coords.y];
  }

  function stopDrawing() {
    isDrawing = false;
  }

  // Event Listeners for Canvas
  drawingCanvas.addEventListener('mousedown', startDrawing);
  drawingCanvas.addEventListener('mousemove', draw);
  drawingCanvas.addEventListener('mouseup', stopDrawing);
  drawingCanvas.addEventListener('mouseout', stopDrawing);

  // Touch support with adjusted coordinates
  drawingCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    drawingCanvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  drawingCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    drawingCanvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  drawingCanvas.addEventListener('touchend', () => {
    const mouseEvent = new MouseEvent('mouseup');
    drawingCanvas.dispatchEvent(mouseEvent);
  });

  // Erase All functionality
  clearAllTool.addEventListener('click', () => {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  });

  // Color Selection
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      
      selectedBackgroundColor = option.dataset.color;
      bgCtx.fillStyle = selectedBackgroundColor;
      bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    });
  });

  // Tool Selection
  penTool.addEventListener('click', () => {
    currentTool = 'pen';
    penTool.classList.add('active');
    eraserTool.classList.remove('active');
  });

  eraserTool.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserTool.classList.add('active');
    penTool.classList.remove('active');
  });

  // Section Management Functions
  function createSection(name) {
    const sections = JSON.parse(localStorage.getItem('projectSheetSections') || '[]');
    const newSection = {
      id: Date.now().toString(),
      name: name || 'Untitled Section'
    };
    sections.push(newSection);
    localStorage.setItem('projectSheetSections', JSON.stringify(sections));
    renderSections();
    selectSection(newSection.id);
  }

  function renderSections() {
    const sections = JSON.parse(localStorage.getItem('projectSheetSections') || '[]');
    sectionsListContainer.innerHTML = '';

    sections.forEach(section => {
      const sectionItem = document.createElement('div');
      sectionItem.className = 'section-item';
      sectionItem.dataset.sectionId = section.id;
      
      sectionItem.innerHTML = `
        <span>${section.name}</span>
        <div class="section-actions">
          <button class="btn btn-sm btn-outline-primary edit-section">
            <i class="feather feather-edit-2"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-section">
            <i class="feather feather-trash-2"></i>
          </button>
        </div>
      `;

      // Section Selection
      sectionItem.addEventListener('click', (e) => {
        if (!e.target.closest('.section-actions')) {
          selectSection(section.id);
        }
      });

      // Edit Section
      sectionItem.querySelector('.edit-section').addEventListener('click', () => {
        currentSectionId = section.id;
        editSectionNameInput.value = section.name;
        editSectionModal.show();
      });

      // Delete Section
      sectionItem.querySelector('.delete-section').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this section and all its notes?')) {
          deleteSection(section.id);
        }
      });

      sectionsListContainer.appendChild(sectionItem);
    });
  }

  function selectSection(sectionId) {
    // Remove active class from all sections
    document.querySelectorAll('.section-item').forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to selected section
    const selectedSection = document.querySelector(`.section-item[data-section-id="${sectionId}"]`);
    if (selectedSection) {
      selectedSection.classList.add('active');
      currentSectionId = sectionId;
      currentSectionTitle.textContent = selectedSection.querySelector('span').textContent;
      loadSavedNotes();
    }
  }

  function deleteSection(sectionId) {
    // Remove section from localStorage
    const sections = JSON.parse(localStorage.getItem('projectSheetSections') || '[]');
    const updatedSections = sections.filter(section => section.id !== sectionId);
    localStorage.setItem('projectSheetSections', JSON.stringify(updatedSections));

    // Remove notes in this section
    const savedNotes = JSON.parse(localStorage.getItem('projectSheets') || '[]');
    const updatedNotes = savedNotes.filter(note => note.sectionId !== sectionId);
    localStorage.setItem('projectSheets', JSON.stringify(updatedNotes));

    renderSections();
    loadSavedNotes();
  }

  // Saving Notes
  function saveNote() {
    if (!currentSectionId) {
      alert('Please select or create a section first!');
      return;
    }

    // Validate image count
    if (uploadedImages.length > 10) {
      alert('You can only upload up to 10 images.');
      return;
    }

    const title = noteTitle.value.trim() || 'Untitled Note';
    const text = noteText.value;
    const drawingData = drawingCanvas.toDataURL();
    const backgroundData = backgroundCanvas.toDataURL();

    const note = {
      id: currentNoteId || Date.now().toString(),
      sectionId: currentSectionId,
      title,
      text,
      imageData: uploadedImages, // Store all images
      drawingData,
      backgroundData,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    const savedNotes = JSON.parse(localStorage.getItem('projectSheets') || '[]');

    // Find and update or add new note
    const existingNoteIndex = savedNotes.findIndex(n => n.id === note.id);
    if (existingNoteIndex !== -1) {
      savedNotes[existingNoteIndex] = note;
    } else {
      savedNotes.push(note);
    }

    localStorage.setItem('projectSheets', JSON.stringify(savedNotes));

    // Reset form and state
    resetNoteForm();
    loadSavedNotes();
  }

  function resetNoteForm() {
    noteTitle.value = '';
    noteText.value = '';
    uploadedImages = [];
    imagePreviewContainer.innerHTML = '';
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    bgCtx.fillStyle = '#ffffff';
    bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    currentNoteId = null;
  }

  function loadSavedNotes() {
    const savedNotes = JSON.parse(localStorage.getItem('projectSheets') || '[]');
    savedNotesGrid.innerHTML = '';

    const filteredNotes = currentSectionId
      ? savedNotes.filter(note => note.sectionId === currentSectionId)
      : [];

    if (filteredNotes.length === 0) {
      savedNotesGrid.innerHTML = '<div class="col text-center text-muted">No notes in this section</div>';
    }

    filteredNotes.forEach(note => {
      const noteCard = document.createElement('div');
      noteCard.className = 'col-md-6 mb-4';
      noteCard.innerHTML = `
        <div class="card note-card">
          <div class="card-body">
            <h5 class="card-title">${note.title}</h5>
            <p class="card-text">${note.text}</p>
            ${note.imageData && note.imageData.length > 0 ? `
              <div class="image-previews">
                ${note.imageData.map((img, index) => `
                  <img src="${img}" class="img-thumbnail" data-index="${index}">
                `).join('')}
                <span class="image-count">${note.imageData.length}/10</span>
              </div>
            ` : ''}
            <canvas width="200" height="200" class="note-canvas"></canvas>
            <div class="d-flex justify-content-between mt-2">
              <small class="text-muted">${new Date(note.createdAt).toLocaleString()}</small>
              <div>
                <button class="btn btn-sm btn-primary edit-note" data-id="${note.id}">
                  <i class="feather feather-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-note" data-id="${note.id}">
                  <i class="feather feather-trash-2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const noteCanvas = noteCard.querySelector('.note-canvas');
      const noteCtx = noteCanvas.getContext('2d');
      
      // Load background
      if (note.backgroundData) {
        const bgImage = new Image();
        bgImage.onload = () => {
          noteCtx.drawImage(bgImage, 0, 0, 200, 200);
        };
        bgImage.src = note.backgroundData;
      }

      // Load drawing
      if (note.drawingData) {
        const drawImage = new Image();
        drawImage.onload = () => {
          noteCtx.drawImage(drawImage, 0, 0, 200, 200);
        };
        drawImage.src = note.drawingData;
      }

      // Image Enlargement with Navigation
      const imagePreviews = noteCard.querySelectorAll('.image-previews img');
      imagePreviews.forEach(img => {
        img.addEventListener('click', () => {
          const index = parseInt(img.dataset.index);
          showEnlargedImage(note.imageData[index], note.imageData, index);
        });
      });

      // Edit Note Listener
      noteCard.querySelector('.edit-note').addEventListener('click', () => {
        editNote(note);
      });

      // Delete Note Listener
      noteCard.querySelector('.delete-note').addEventListener('click', () => {
        const savedNotes = JSON.parse(localStorage.getItem('projectSheets') || '[]');
        const updatedNotes = savedNotes.filter(n => n.id !== note.id);
        localStorage.setItem('projectSheets', JSON.stringify(updatedNotes));
        loadSavedNotes();
      });

      savedNotesGrid.appendChild(noteCard);
    });
  }

  function editNote(note) {
    // Populate form with existing note data
    noteTitle.value = note.title;
    noteText.value = note.text;
    currentNoteId = note.id;

    // Apply RTL if needed
    applyRTLForElement(noteTitle);
    applyRTLForElement(noteText);

    // Scroll to top of the page
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Restore drawing
    if (note.backgroundData) {
      const bgImage = new Image();
      bgImage.onload = () => {
        bgCtx.drawImage(bgImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
      };
      bgImage.src = note.backgroundData;
    }

    if (note.drawingData) {
      const drawImage = new Image();
      drawImage.onload = () => {
        ctx.drawImage(drawImage, 0, 0, drawingCanvas.width, drawingCanvas.height);
      };
      drawImage.src = note.drawingData;
    }

    // Restore images
    uploadedImages = note.imageData || [];
    renderImagePreviews();
  }

  // Add Section Button
  addSectionBtn.addEventListener('click', () => {
    const newSectionName = newSectionNameInput.value.trim();
    if (newSectionName) {
      createSection(newSectionName);
      newSectionNameInput.value = '';
    } else {
      alert('Please enter a section name');
    }
  });

  // Save Section Name Button
  saveSectionNameBtn.addEventListener('click', () => {
    const newName = editSectionNameInput.value.trim();
    if (newName) {
      const sections = JSON.parse(localStorage.getItem('projectSheetSections') || '[]');
      const sectionIndex = sections.findIndex(section => section.id === currentSectionId);
      
      if (sectionIndex !== -1) {
        // Store the old section name
        const oldSectionName = sections[sectionIndex].name;
        
        // Update section name
        sections[sectionIndex].name = newName;
        localStorage.setItem('projectSheetSections', JSON.stringify(sections));

        // Update notes in this section
        const savedNotes = JSON.parse(localStorage.getItem('projectSheets') || '[]');
        const updatedNotes = savedNotes.map(note => {
          // Check if note belongs to this section
          if (note.sectionId === currentSectionId) {
            // Update note title if it contains the old section name
            if (note.title.includes(oldSectionName)) {
              note.title = note.title.replace(oldSectionName, newName);
            }
          }
          return note;
        });

        localStorage.setItem('projectSheets', JSON.stringify(updatedNotes));

        // Render sections and reload notes
        renderSections();
        selectSection(currentSectionId);
        editSectionModal.hide();
      }
    }
  });

  saveNoteBtn.addEventListener('click', saveNote);

  // Initial load
  renderSections();
});