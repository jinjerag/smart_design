document.addEventListener('DOMContentLoaded', () => {
  const largeProjectNameEl = document.getElementById('largeProjectName');
  const largeProjectDateEl = document.getElementById('largeProjectDate');
  const largeProjectIdEl = document.getElementById('largeProjectId');
  const largeProjectTotalCostEl = document.getElementById('largeProjectTotalCost');
  const largeProjectNotesEl = document.getElementById('largeProjectNotes');
  const subProjectsGrid = document.getElementById('subProjectsGrid');
  const noSubProjectsMessage = document.getElementById('noSubProjectsMessage');

  const editLargeProjectBtn = document.getElementById('editLargeProjectBtn');
  const editLargeProjectModal = new bootstrap.Modal(document.getElementById('largeProjectEditModal'));
  const editLargeProjectNameInput = document.getElementById('editLargeProjectName');
  const editLargeProjectIdInput = document.getElementById('editLargeProjectId');
  const editLargeProjectNotesInput = document.getElementById('editLargeProjectNotes');
  const saveLargeProjectBtn = document.getElementById('saveLargeProjectBtn');

  // Add Sub-Project Modal
  const addSubProjectBtn = document.getElementById('addSubProjectBtn');
  const addSubProjectModal = new bootstrap.Modal(document.getElementById('addSubProjectModal'));
  const subProjectNameInput = document.getElementById('subProjectName');
  const subProjectIdInput = document.getElementById('subProjectId');
  const createSubProjectBtn = document.getElementById('createSubProjectBtn');

  function loadLargeProject() {
    const urlParams = new URLSearchParams(window.location.search);
    const largeProjectId = urlParams.get('id');
    
    // Find the large project in saved projects
    const savedLargeProjects = JSON.parse(localStorage.getItem('smartDesignLargeProjects') || '[]');
    const largeProject = savedLargeProjects.find(p => p.id === largeProjectId);

    if (!largeProject) {
      // If no large project found, create a new one with default values
      largeProject = {
        id: largeProjectId,
        name: 'New Large Project',
        createdAt: new Date().toISOString(),
        notes: '',
        totalCost: 0
      };
      
      // Don't save this temporary project to localStorage
      localStorage.setItem('currentLargeProject', JSON.stringify(largeProject));
      
      return largeProject;
    }

    // Save the current large project to local storage
    localStorage.setItem('currentLargeProject', JSON.stringify(largeProject));

    largeProjectNameEl.textContent = largeProject.name;
    largeProjectDateEl.textContent = `Date: ${new Date(largeProject.createdAt).toLocaleDateString()}`;
    largeProjectIdEl.textContent = `Project ID: ${largeProject.id}`;
    largeProjectNotesEl.value = largeProject.notes || '';
    largeProjectTotalCostEl.textContent = '0.00';

    return largeProject;
  }

  function saveLargeProject(largeProject) {
    // Check if the project has any meaningful data
    const hasSubProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]')
      .some(p => p.largeProjectId === largeProject.id);
    
    const hasNonEmptyName = largeProject.name && largeProject.name.trim() !== 'New Large Project';
    const hasNotes = largeProject.notes && largeProject.notes.trim() !== '';

    if (!hasSubProjects && !hasNonEmptyName && !hasNotes) {
      // Project is essentially empty, don't save
      return false;
    }

    // Get existing large projects
    let savedLargeProjects = JSON.parse(localStorage.getItem('smartDesignLargeProjects') || '[]');

    // Check if project already exists
    const existingProjectIndex = savedLargeProjects.findIndex(p => p.id === largeProject.id);

    if (existingProjectIndex !== -1) {
      // Update existing project
      savedLargeProjects[existingProjectIndex] = largeProject;
    } else {
      // Add new project
      savedLargeProjects.push(largeProject);
    }

    // Save updated projects
    localStorage.setItem('smartDesignLargeProjects', JSON.stringify(savedLargeProjects));
    return true;
  }

  function loadSubProjects() {
    const savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    const largeProject = JSON.parse(localStorage.getItem('currentLargeProject') || '{}');
    
    const subProjects = savedProjects.filter(p => p.largeProjectId === largeProject.id);

    let totalProjectCost = 0;
    subProjectsGrid.innerHTML = '';

    if (subProjects.length === 0) {
      noSubProjectsMessage.style.display = 'block';
      largeProjectTotalCostEl.textContent = '0.00';
      return;
    }

    noSubProjectsMessage.style.display = 'none';

    subProjects.forEach(project => {
      const projectCard = document.createElement('div');
      projectCard.className = 'col-md-4 mb-4';
      projectCard.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${project.name}</h5>
            <p class="card-text">
              <strong>Project ID:</strong> ${project.id}<br>
              <strong>Total Cost:</strong> ${project.finalGrandTotal}
            </p>
            <div class="d-flex justify-content-between">
              <a href="project-calculator.html?id=${project.id}" class="btn btn-sm btn-primary load-project">
                <i class="feather feather-edit"></i> Edit
              </a>
              <button class="btn btn-sm btn-danger delete-project" data-id="${project.id}">
                <i class="feather feather-trash-2"></i> Delete
              </button>
              <button class="btn btn-sm btn-success export-project" data-id="${project.id}">
                <i class="feather feather-download"></i> Export PDF
              </button>
            </div>
          </div>
        </div>
      `;

      subProjectsGrid.appendChild(projectCard);
      
      // Calculate total project cost
      totalProjectCost += parseFloat(project.finalGrandTotal || 0);
    });

    largeProjectTotalCostEl.textContent = totalProjectCost.toFixed(2);

    // Add event listeners for delete and export buttons
    subProjectsGrid.querySelectorAll('.delete-project').forEach(btn => {
      btn.addEventListener('click', (e) => deleteSubProject(e.target.closest('.delete-project').dataset.id));
    });

    subProjectsGrid.querySelectorAll('.export-project').forEach(btn => {
      btn.addEventListener('click', (e) => exportSubProjectToPDF(e.target.closest('.export-project').dataset.id));
    });
  }

  function deleteSubProject(projectId) {
    if (!confirm('Are you sure you want to delete this sub-project?')) return;

    let savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    savedProjects = savedProjects.filter(p => p.id !== projectId);

    localStorage.setItem('smartDesignProjects', JSON.stringify(savedProjects));
    
    loadSubProjects();
  }

  function exportSubProjectToPDF(projectId) {
    const savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    const project = savedProjects.find(p => p.id === projectId);

    if (!project) {
      console.error('Project not found');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Project Calculator - Sub-Project Details', 10, 10);
      doc.setFontSize(10);

      doc.text(`Sub-Project Name: ${project.name}`, 10, 20);
      doc.text(`Project ID: ${project.id}`, 10, 30);
      doc.text(`Created: ${new Date(project.createdAt).toLocaleDateString()}`, 10, 40);

      const components = project.components.map(comp => [
        comp.component,
        comp.subtype,
        comp.pricePerUnit,
        comp.quantity,
        comp.total
      ]);

      doc.autoTable({
        startY: 50,
        head: [['Component', 'Subtype', 'Price/Unit', 'Quantity', 'Total']],
        body: components
      });

      const finalY = doc.autoTable.previous.finalY + 10;
      doc.text(`Grand Total: ${project.grandTotal || '0.00'}`, 10, finalY);
      doc.text(`Final Price: ${project.finalPrice || '0.00'}`, 10, finalY + 10);
      
      doc.text(`Installation Cost: ${project.installationCost || '0'}`, 10, finalY + 20);
      doc.text(`Transportation Cost: ${project.transportationCost || '0'}`, 10, finalY + 30);
      doc.text(`Crane Cost: ${project.craneCost || '0'}`, 10, finalY + 40);
      doc.text(`Other Expenses: ${project.otherExpenses || '0'}`, 10, finalY + 50);
      
      doc.text(`Final Grand Total: ${project.finalGrandTotal || '0.00'}`, 10, finalY + 60);

      doc.text('Notes:', 10, finalY + 80);
      doc.text(project.notes || '', 10, finalY + 90);

      doc.save(`sub-project-${project.id}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please check console for details.');
    }
  }

  // Add Sub Project Functionality
  addSubProjectBtn.addEventListener('click', () => {
    const largeProject = JSON.parse(localStorage.getItem('currentLargeProject') || '{}');
    
    // Set default values
    subProjectNameInput.value = `Sub-Project for ${largeProject.name}`;
    subProjectIdInput.value = Date.now().toString();
    
    addSubProjectModal.show();
  });

  createSubProjectBtn.addEventListener('click', () => {
    const subProjectName = subProjectNameInput.value.trim();
    const subProjectId = subProjectIdInput.value.trim();
    const largeProject = JSON.parse(localStorage.getItem('currentLargeProject') || '{}');

    if (!subProjectName || !subProjectId) {
      alert('Please enter Sub-Project Name and ID');
      return;
    }

    // Redirect to project calculator with large project ID
    window.location.href = `project-calculator.html?largeProjectId=${largeProject.id}&subProjectId=${subProjectId}&subProjectName=${encodeURIComponent(subProjectName)}`;
  });

  // Edit Large Project Buttons
  editLargeProjectBtn.addEventListener('click', () => {
    const largeProject = JSON.parse(localStorage.getItem('currentLargeProject') || '{}');
    
    editLargeProjectNameInput.value = largeProject.name;
    editLargeProjectIdInput.value = largeProject.id;
    editLargeProjectNotesInput.value = largeProject.notes || '';
    
    editLargeProjectModal.show();
  });

  saveLargeProjectBtn.addEventListener('click', () => {
    const largeProject = JSON.parse(localStorage.getItem('currentLargeProject') || '{}');
    
    largeProject.name = editLargeProjectNameInput.value;
    largeProject.id = editLargeProjectIdInput.value;
    largeProject.notes = editLargeProjectNotesInput.value;
    
    localStorage.setItem('currentLargeProject', JSON.stringify(largeProject));
    
    // Attempt to save the project
    if (saveLargeProject(largeProject)) {
      loadLargeProject();
      editLargeProjectModal.hide();
    } else {
      // If project is empty, show a message
      alert('Cannot save an empty project. Please add some details or sub-projects.');
    }
  });

  // Initial load
  const largeProject = loadLargeProject();
  loadSubProjects();

  // Handle page exit for empty projects
  window.addEventListener('beforeunload', (e) => {
    const currentLargeProject = JSON.parse(localStorage.getItem('currentLargeProject') || '{}');
    const savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    
    const hasSubProjects = savedProjects.some(p => p.largeProjectId === currentLargeProject.id);
    const hasNonEmptyName = currentLargeProject.name && currentLargeProject.name.trim() !== 'New Large Project';
    const hasNotes = currentLargeProject.notes && currentLargeProject.notes.trim() !== '';

    if (!hasSubProjects && !hasNonEmptyName && !hasNotes) {
      // Remove the temporary project
      let savedLargeProjects = JSON.parse(localStorage.getItem('smartDesignLargeProjects') || '[]');
      savedLargeProjects = savedLargeProjects.filter(p => p.id !== currentLargeProject.id);
      localStorage.setItem('smartDesignLargeProjects', JSON.stringify(savedLargeProjects));
    }
  });
});