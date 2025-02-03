document.addEventListener('DOMContentLoaded', () => {
  const projectSearch = document.getElementById('projectSearch');
  const projectsGrid = document.getElementById('projectsGrid');
  const largeProjectsGrid = document.getElementById('largeProjectsGrid');
  const noProjectsMessage = document.getElementById('noProjectsMessage');
  const noLargeProjectsMessage = document.getElementById('noLargeProjectsMessage');
  const createLargeProjectBtn = document.getElementById('createLargeProjectBtn');

  function loadSavedProjects(searchTerm = '') {
    const savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    const savedLargeProjects = JSON.parse(localStorage.getItem('smartDesignLargeProjects') || '[]');
    
    // Filter individual projects
    const individualProjects = savedProjects.filter(project => 
      !project.largeProjectId && 
      (!searchTerm || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.id.toString().includes(searchTerm) ||
        new Date(project.createdAt).toLocaleDateString().includes(searchTerm))
    );

    // Filter large projects
    const filteredLargeProjects = savedLargeProjects.filter(project => 
      !searchTerm || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.id.toString().includes(searchTerm) ||
      new Date(project.createdAt).toLocaleDateString().includes(searchTerm)
    );

    // Clear existing grids
    projectsGrid.innerHTML = '';
    largeProjectsGrid.innerHTML = '';

    // Handle Individual Projects
    if (individualProjects.length === 0) {
      noProjectsMessage.style.display = 'block';
    } else {
      noProjectsMessage.style.display = 'none';
      individualProjects.forEach(project => {
        const projectCard = createIndividualProjectCard(project);
        projectsGrid.appendChild(projectCard);
      });
    }

    // Handle Large Projects
    if (filteredLargeProjects.length === 0) {
      noLargeProjectsMessage.style.display = 'block';
    } else {
      noLargeProjectsMessage.style.display = 'none';
      filteredLargeProjects.forEach(largeProject => {
        const largeProjectCard = createLargeProjectCard(largeProject);
        largeProjectsGrid.appendChild(largeProjectCard);
      });
    }
  }

  function createIndividualProjectCard(project) {
    const projectCard = document.createElement('div');
    projectCard.className = 'col-md-4 mb-4';
    projectCard.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${project.name}</h5>
          <p class="card-text">
            <strong>Project ID:</strong> ${project.id}<br>
            <strong>Created:</strong> ${new Date(project.createdAt).toLocaleDateString()}<br>
            <strong>Grand Total:</strong> ${project.finalGrandTotal}
          </p>
          <div class="d-flex justify-content-between">
            <a href="project-calculator.html?id=${project.id}" class="btn btn-sm btn-primary load-project">
              <i class="feather feather-edit"></i> Edit
            </a>
            <button class="btn btn-sm btn-danger delete-project" data-id="${project.id}">
              <i class="feather feather-trash-2"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for delete
    projectCard.querySelector('.delete-project').addEventListener('click', () => deleteProject(project.id));

    return projectCard;
  }

  function createLargeProjectCard(largeProject) {
    const largeProjectCard = document.createElement('div');
    largeProjectCard.className = 'col-md-4 mb-4 large-project-card';
    
    // Get total cost of sub-projects
    const savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    const subProjects = savedProjects.filter(p => p.largeProjectId === largeProject.id);
    const totalProjectCost = subProjects.reduce((sum, project) => sum + parseFloat(project.finalGrandTotal || 0), 0);

    largeProjectCard.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center toggle-sub-projects">
            <h5 class="card-title">${largeProject.name}</h5>
            <i class="feather feather-chevron-down"></i>
          </div>
          <p class="card-text">
            <strong>Project ID:</strong> ${largeProject.id}<br>
            <strong>Created:</strong> ${new Date(largeProject.createdAt).toLocaleDateString()}<br>
            <strong>Total Cost:</strong> ${totalProjectCost.toFixed(2)}
          </p>
          <div class="d-flex justify-content-between mb-2">
            <a href="large-project.html?id=${largeProject.id}" class="btn btn-sm btn-primary">
              <i class="feather feather-edit"></i> View
            </a>
            <button class="btn btn-sm btn-danger delete-large-project" data-id="${largeProject.id}">
              <i class="feather feather-trash-2"></i> Delete
            </button>
          </div>
          <div class="sub-projects">
            ${renderSubProjects(largeProject.id)}
          </div>
        </div>
      </div>
    `;

    // Toggle sub-projects visibility
    const toggleBtn = largeProjectCard.querySelector('.toggle-sub-projects');
    const subProjectsContainer = largeProjectCard.querySelector('.sub-projects');
    const chevronIcon = largeProjectCard.querySelector('.feather-chevron-down');
    
    toggleBtn.addEventListener('click', () => {
      const isVisible = subProjectsContainer.style.display === 'block';
      subProjectsContainer.style.display = isVisible ? 'none' : 'block';
      chevronIcon.classList.toggle('feather-chevron-down');
      chevronIcon.classList.toggle('feather-chevron-up');
    });

    // Add event listeners for delete
    largeProjectCard.querySelector('.delete-large-project').addEventListener('click', () => deleteLargeProject(largeProject.id));

    return largeProjectCard;
  }

  function renderSubProjects(largeProjectId) {
    const savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    const subProjects = savedProjects.filter(p => p.largeProjectId === largeProjectId);

    if (subProjects.length === 0) {
      return '<p class="text-muted text-center">No sub-projects</p>';
    }

    return subProjects.map(project => `
      <div class="card mb-2">
        <div class="card-body py-2">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="card-subtitle mb-1">${project.name}</h6>
              <small class="text-muted">ID: ${project.id} | Cost: ${project.finalGrandTotal}</small>
            </div>
            <div>
              <a href="project-calculator.html?id=${project.id}" class="btn btn-sm btn-outline-primary me-1">
                <i class="feather feather-edit"></i>
              </a>
              <button class="btn btn-sm btn-outline-danger delete-sub-project" data-id="${project.id}">
                <i class="feather feather-trash-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    let savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    savedProjects = savedProjects.filter(p => p.id !== projectId);

    localStorage.setItem('smartDesignProjects', JSON.stringify(savedProjects));
    
    loadSavedProjects();
  }

  function deleteLargeProject(largeProjectId) {
    if (!confirm('Are you sure you want to delete this large project and all its sub-projects?')) return;

    // Remove large project
    let savedLargeProjects = JSON.parse(localStorage.getItem('smartDesignLargeProjects') || '[]');
    savedLargeProjects = savedLargeProjects.filter(p => p.id !== largeProjectId);
    localStorage.setItem('smartDesignLargeProjects', JSON.stringify(savedLargeProjects));

    // Remove associated sub-projects
    let savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    savedProjects = savedProjects.filter(p => p.largeProjectId !== largeProjectId);
    localStorage.setItem('smartDesignProjects', JSON.stringify(savedProjects));
    
    loadSavedProjects();
  }

  // Search functionality
  projectSearch.addEventListener('input', (e) => {
    loadSavedProjects(e.target.value);
  });

  // Create Large Project Button
  createLargeProjectBtn.addEventListener('click', () => {
    const largeProject = {
      id: Date.now().toString(), // Using timestamp as unique ID
      name: 'New Large Project',
      createdAt: new Date().toISOString(),
      notes: ''
    };
    
    // Reset currentLargeProject to ensure a clean slate
    localStorage.setItem('currentLargeProject', JSON.stringify(largeProject));
    
    // Get existing large projects or initialize an empty array
    const savedLargeProjects = JSON.parse(localStorage.getItem('smartDesignLargeProjects') || '[]');
    savedLargeProjects.push(largeProject);
    
    // Save updated large projects
    localStorage.setItem('smartDesignLargeProjects', JSON.stringify(savedLargeProjects));
    
    // Navigate to large project page
    window.location.href = `large-project.html?id=${largeProject.id}`;
  });

  // Initial load of projects
  loadSavedProjects();
});